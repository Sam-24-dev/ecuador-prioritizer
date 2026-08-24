import asyncio
import gzip
from collections.abc import Callable
from importlib import import_module

import httpx
import pytest

PUBLIC_IP = "8.8.8.8"
REDIRECT_IP = "1.1.1.1"


def validated_url(url: str = "https://news.example/start", *, address: str = PUBLIC_IP):
    security = import_module("app.services.url_security")
    return security.validate_url(url, resolver=lambda _host, _port: (address,))


class CapturingTransport(httpx.AsyncBaseTransport):
    def __init__(self, handler: Callable[[httpx.Request], httpx.Response]) -> None:
        self.handler = handler
        self.requests: list[httpx.Request] = []

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        return self.handler(request)


class AsyncStreamAssertingTransport(httpx.AsyncBaseTransport):
    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        assert isinstance(request.stream, httpx.AsyncByteStream)
        return httpx.Response(200, headers={"content-type": "text/html"}, content=b"<html>ok</html>")


async def fetch(fetcher, destination):
    return await fetcher.fetch(destination)


def test_fetcher_passes_an_async_stream_to_the_pinned_transport() -> None:
    module = import_module("app.services.http_fetcher")

    result = asyncio.run(
        fetch(
            module.HttpFetcher(transport=AsyncStreamAssertingTransport(), minimum_interval_seconds=0),
            validated_url(),
        )
    )

    assert result.body == b"<html>ok</html>"


def test_fetcher_connects_to_a_validated_numeric_target_with_original_host_for_tls() -> None:
    module = import_module("app.services.http_fetcher")
    transport = CapturingTransport(
        lambda request: httpx.Response(200, headers={"content-type": "text/html"}, content=b"<html>ok</html>")
    )

    result = asyncio.run(
        fetch(
            module.HttpFetcher(transport=transport, minimum_interval_seconds=0),
            validated_url(),
        )
    )

    request = transport.requests[0]
    assert result.body == b"<html>ok</html>"
    assert result.final_url == "https://news.example/start"
    assert request.url.host == PUBLIC_IP
    assert request.url.port is None  # HTTPS default port is equivalent to pinned port 443.
    assert request.headers["host"] == "news.example"
    assert request.extensions["sni_hostname"] == "news.example"
    assert request.headers["user-agent"] == module.USER_AGENT
    assert "cookie" not in request.headers


def test_fetcher_revalidates_a_redirect_before_connecting_to_its_new_numeric_target() -> None:
    module = import_module("app.services.http_fetcher")
    transport = CapturingTransport(
        lambda request: (
            httpx.Response(302, headers={"location": "https://redirect.example/story"})
            if len(transport.requests) == 1
            else httpx.Response(200, headers={"content-type": "application/xhtml+xml"}, content=b"<html/>")
        )
    )

    def resolver(hostname: str, _port: int) -> tuple[str, ...]:
        return (PUBLIC_IP,) if hostname == "news.example" else (REDIRECT_IP,)

    result = asyncio.run(
        fetch(
            module.HttpFetcher(transport=transport, resolver=resolver, minimum_interval_seconds=0),
            validated_url(),
        )
    )

    assert result.final_url == "https://redirect.example/story"
    assert [request.url.host for request in transport.requests] == [PUBLIC_IP, REDIRECT_IP]
    assert [request.headers["host"] for request in transport.requests] == ["news.example", "redirect.example"]


def test_fetcher_rejects_a_private_redirect_before_a_second_connection() -> None:
    module = import_module("app.services.http_fetcher")
    security = import_module("app.services.url_security")
    transport = CapturingTransport(
        lambda _request: httpx.Response(302, headers={"location": "http://127.0.0.1/admin"})
    )

    with pytest.raises(security.UrlSecurityError):
        asyncio.run(
            fetch(
                module.HttpFetcher(
                    transport=transport,
                    resolver=lambda _host, _port: (PUBLIC_IP,),
                    minimum_interval_seconds=0,
                ),
                validated_url(),
            )
        )

    assert len(transport.requests) == 1


def test_fetcher_stops_after_three_redirects() -> None:
    module = import_module("app.services.http_fetcher")
    transport = CapturingTransport(
        lambda _request: httpx.Response(302, headers={"location": "/next"})
    )

    with pytest.raises(module.HttpFetchError, match="redirect"):
        asyncio.run(
            fetch(
                module.HttpFetcher(
                    transport=transport,
                    resolver=lambda _host, _port: (PUBLIC_IP,),
                    minimum_interval_seconds=0,
                ),
                validated_url(),
            )
        )

    assert len(transport.requests) == 4


def test_fetcher_rejects_non_html_mime_types_without_reading_body() -> None:
    module = import_module("app.services.http_fetcher")
    transport = CapturingTransport(
        lambda _request: httpx.Response(200, headers={"content-type": "application/pdf"}, content=b"%PDF")
    )

    with pytest.raises(module.HttpFetchError, match="content type"):
        asyncio.run(
            fetch(
                module.HttpFetcher(transport=transport, minimum_interval_seconds=0),
                validated_url(),
            )
        )


def test_fetcher_maps_non_success_http_statuses_to_a_sanitized_error() -> None:
    module = import_module("app.services.http_fetcher")
    transport = CapturingTransport(
        lambda _request: httpx.Response(502, headers={"content-type": "text/html"}, content=b"upstream detail")
    )

    with pytest.raises(module.HttpFetchError, match="remote server"):
        asyncio.run(
            fetch(
                module.HttpFetcher(transport=transport, minimum_interval_seconds=0),
                validated_url(),
            )
        )


def test_fetcher_rejects_an_announced_body_larger_than_two_megabytes() -> None:
    module = import_module("app.services.http_fetcher")
    transport = CapturingTransport(
        lambda _request: httpx.Response(
            200,
            headers={"content-type": "text/html", "content-length": str(module.MAX_RESPONSE_BYTES + 1)},
            content=b"small body",
        )
    )

    with pytest.raises(module.HttpFetchError, match="too large"):
        asyncio.run(
            fetch(
                module.HttpFetcher(transport=transport, minimum_interval_seconds=0),
                validated_url(),
            )
        )


def test_fetcher_rejects_a_decompressed_body_larger_than_two_megabytes() -> None:
    module = import_module("app.services.http_fetcher")
    compressed = gzip.compress(b"x" * (module.MAX_RESPONSE_BYTES + 1))
    transport = CapturingTransport(
        lambda _request: httpx.Response(
            200,
            headers={"content-type": "text/html", "content-encoding": "gzip"},
            content=compressed,
        )
    )

    with pytest.raises(module.HttpFetchError, match="too large"):
        asyncio.run(
            fetch(
                module.HttpFetcher(transport=transport, minimum_interval_seconds=0),
                validated_url(),
            )
        )


def test_fetcher_maps_http_timeouts_to_a_sanitized_error() -> None:
    module = import_module("app.services.http_fetcher")

    def raise_timeout(_request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("remote detail")

    with pytest.raises(module.HttpFetchError, match="timed out"):
        asyncio.run(
            fetch(
                module.HttpFetcher(transport=CapturingTransport(raise_timeout), minimum_interval_seconds=0),
                validated_url(),
            )
        )


def test_fetcher_limits_in_flight_downloads_to_two() -> None:
    module = import_module("app.services.http_fetcher")
    active = 0
    max_active = 0

    class SlowTransport(httpx.AsyncBaseTransport):
        async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
            nonlocal active, max_active
            active += 1
            max_active = max(max_active, active)
            await asyncio.sleep(0.01)
            active -= 1
            return httpx.Response(200, headers={"content-type": "text/html"}, content=b"ok")

    async def run_three() -> None:
        fetcher = module.HttpFetcher(transport=SlowTransport(), minimum_interval_seconds=0)
        await asyncio.gather(*(fetcher.fetch(validated_url(f"https://news.example/{index}")) for index in range(3)))

    asyncio.run(run_three())

    assert max_active == 2


def test_fetcher_rate_limits_starts_within_one_instance() -> None:
    module = import_module("app.services.http_fetcher")
    started_at: list[float] = []

    class TimestampTransport(httpx.AsyncBaseTransport):
        async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
            started_at.append(asyncio.get_running_loop().time())
            return httpx.Response(200, headers={"content-type": "text/html"}, content=b"ok")

    async def run_two() -> None:
        fetcher = module.HttpFetcher(transport=TimestampTransport(), minimum_interval_seconds=0.05)
        await fetcher.fetch(validated_url("https://news.example/one"))
        await fetcher.fetch(validated_url("https://news.example/two"))

    asyncio.run(run_two())

    assert started_at[1] - started_at[0] >= 0.04


def test_process_wide_fetch_limit_applies_to_fresh_fetchers_across_event_loops() -> None:
    from concurrent.futures import ThreadPoolExecutor

    module = import_module("app.services.http_fetcher")
    active = 0
    max_active = 0
    lock = __import__("threading").Lock()

    class SlowTransport(httpx.AsyncBaseTransport):
        async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
            nonlocal active, max_active
            with lock:
                active += 1
                max_active = max(max_active, active)
            await asyncio.sleep(0.03)
            with lock:
                active -= 1
            return httpx.Response(200, headers={"content-type": "text/html"}, content=b"ok")

    def one(index: int) -> None:
        asyncio.run(module.HttpFetcher(transport=SlowTransport(), minimum_interval_seconds=0).fetch(validated_url(f"https://news.example/{index}")))

    with ThreadPoolExecutor(max_workers=4) as executor:
        list(executor.map(one, range(4)))

    assert max_active == module.MAX_CONCURRENT_FETCHES


def test_cancelled_queued_acquire_cannot_claim_slot_after_its_loop_closes(monkeypatch) -> None:
    module = import_module("app.services.http_fetcher")

    class TrackingSemaphore:
        def __init__(self) -> None:
            self.inner = __import__("threading").BoundedSemaphore(1)
            self.acquire_started = __import__("threading").Event()
            self.acquired = __import__("threading").Event()

        def acquire(self, blocking: bool = True, timeout: float | None = None) -> bool:
            self.acquire_started.set()
            result = self.inner.acquire(blocking, timeout)
            if result:
                self.acquired.set()
            return result

        def release(self) -> None:
            self.inner.release()

    gate = module._ProcessFetchGate()
    semaphore = TrackingSemaphore()
    gate.semaphore = semaphore
    monkeypatch.setattr(module, "_PROCESS_FETCH_GATE", gate)
    assert semaphore.acquire()  # Occupy the only process-wide slot.
    semaphore.acquire_started.clear()
    semaphore.acquired.clear()
    started = __import__("threading").Event()
    state: dict[str, object] = {}

    def run_closed_loop() -> None:
        async def queued_request() -> None:
            task = asyncio.create_task(module.HttpFetcher(minimum_interval_seconds=0).fetch(validated_url()))
            state["loop"] = asyncio.get_running_loop()
            state["task"] = task
            started.set()
            with pytest.raises(asyncio.CancelledError):
                await task

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(queued_request())
        finally:
            loop.close()
            asyncio.set_event_loop(None)

    worker = __import__("threading").Thread(target=run_closed_loop)
    worker.start()
    assert started.wait(1)
    assert semaphore.acquire_started.wait(1)  # A real queued acquisition started.
    state["loop"].call_soon_threadsafe(state["task"].cancel)
    worker.join(1)
    assert not worker.is_alive()  # asyncio.run has now closed that loop.

    semaphore.release()
    assert not semaphore.acquired.wait(0.2), "closed-loop work acquired a released process slot"
    assert semaphore.inner.acquire(blocking=False)
    semaphore.inner.release()
