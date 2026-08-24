"""Controlled HTTP download for pre-validated public article URLs."""
from __future__ import annotations

import asyncio
import threading
import time
from dataclasses import dataclass

import httpx

from app.services.url_security import Resolver, ValidatedUrl, validate_redirect

MAX_REDIRECTS = 3
CONNECT_TIMEOUT_SECONDS = 5.0
READ_TIMEOUT_SECONDS = 10.0
TOTAL_TIMEOUT_SECONDS = 15.0
MAX_RESPONSE_BYTES = 2 * 1024 * 1024
MAX_CONCURRENT_FETCHES = 2
USER_AGENT = "EcuadorPrioritizerURLImporter/1.0 (+https://github.com/Sam-24-dev/ecuador-prioritizer)"
_ALLOWED_CONTENT_TYPES = frozenset({"text/html", "application/xhtml+xml"})


class HttpFetchError(ValueError):
    """Sanitized failure from the controlled HTML downloader."""


@dataclass(frozen=True)
class FetchedDocument:
    final_url: str
    content_type: str
    body: bytes


class _ProcessFetchGate:
    """Thread-safe process-wide limits; safe across FastAPI worker event loops."""

    def __init__(self) -> None:
        self.semaphore = threading.BoundedSemaphore(MAX_CONCURRENT_FETCHES)
        self.rate_lock = threading.Lock()
        self.next_request_at = 0.0


_PROCESS_FETCH_GATE = _ProcessFetchGate()


class _PinnedTransport(httpx.AsyncBaseTransport):
    def __init__(self, transport: httpx.AsyncBaseTransport, destination: ValidatedUrl) -> None:
        self._transport = transport
        self._destination = destination

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        target = self._destination.connection_targets[0]
        headers = request.headers.copy()
        headers["host"] = _host_header(self._destination.hostname)
        pinned_request = httpx.Request(
            method=request.method,
            url=request.url.copy_with(host=target.ip, port=target.port),
            headers=headers, stream=request.stream,
            extensions={**request.extensions, "sni_hostname": self._destination.hostname},
        )
        return await self._transport.handle_async_request(pinned_request)

    async def aclose(self) -> None:
        await self._transport.aclose()


class HttpFetcher:
    """Download one validated HTML document with process-wide bounded resources."""

    def __init__(self, *, resolver: Resolver | None = None, transport: httpx.AsyncBaseTransport | None = None, minimum_interval_seconds: float = 1.0) -> None:
        if minimum_interval_seconds < 0:
            raise ValueError("minimum_interval_seconds must be non-negative")
        self._resolver = resolver
        self._transport = transport
        self._minimum_interval_seconds = minimum_interval_seconds

    async def fetch(self, destination: ValidatedUrl) -> FetchedDocument:
        acquired = False
        try:
            async with asyncio.timeout(TOTAL_TIMEOUT_SECONDS):
                await _acquire_process_slot()
                acquired = True
                return await self._fetch_with_redirects(destination)
        except TimeoutError as error:
            raise HttpFetchError("The request timed out.") from error
        except httpx.TimeoutException as error:
            raise HttpFetchError("The request timed out.") from error
        except httpx.HTTPError as error:
            raise HttpFetchError("The document could not be downloaded.") from error
        finally:
            if acquired:
                _PROCESS_FETCH_GATE.semaphore.release()

    async def _fetch_with_redirects(self, destination: ValidatedUrl) -> FetchedDocument:
        redirects = 0
        current = destination
        while True:
            await self._wait_for_rate_limit()
            transport = _PinnedTransport(self._base_transport(), current)
            timeout = httpx.Timeout(connect=CONNECT_TIMEOUT_SECONDS, read=READ_TIMEOUT_SECONDS, write=CONNECT_TIMEOUT_SECONDS, pool=CONNECT_TIMEOUT_SECONDS)
            async with httpx.AsyncClient(transport=transport, timeout=timeout, follow_redirects=False, headers={"user-agent": USER_AGENT}, trust_env=False) as client:
                request = client.build_request("GET", current.url)
                response = await client.send(request, stream=True)
                try:
                    if response.is_redirect:
                        if redirects >= MAX_REDIRECTS:
                            raise HttpFetchError("Too many redirects.")
                        current = validate_redirect(location=response.headers.get("location", ""), current_url=current.url, resolver=self._resolver)
                        redirects += 1
                        continue
                    if response.status_code == 429:
                        raise HttpFetchError("The remote server rate limited the request.")
                    if not 200 <= response.status_code < 300:
                        raise HttpFetchError("The remote server returned an error.")
                    content_type = _content_type(response)
                    _require_allowed_content_type(content_type)
                    _require_announced_size_within_limit(response)
                    return FetchedDocument(final_url=current.url, content_type=content_type, body=await _read_limited_body(response))
                finally:
                    await response.aclose()

    def _base_transport(self) -> httpx.AsyncBaseTransport:
        return self._transport or httpx.AsyncHTTPTransport(retries=0, limits=httpx.Limits(max_connections=MAX_CONCURRENT_FETCHES, max_keepalive_connections=0))

    async def _wait_for_rate_limit(self) -> None:
        with _PROCESS_FETCH_GATE.rate_lock:
            now = time.monotonic()
            starts_at = max(now, _PROCESS_FETCH_GATE.next_request_at)
            _PROCESS_FETCH_GATE.next_request_at = starts_at + self._minimum_interval_seconds
        if starts_at > now:
            await asyncio.sleep(starts_at - now)


async def _acquire_process_slot() -> None:
    """Poll the process-wide slot without creating a cancellable blocked worker."""
    while not _PROCESS_FETCH_GATE.semaphore.acquire(blocking=False):
        await asyncio.sleep(0.01)


def _host_header(hostname: str) -> str:
    return f"[{hostname}]" if ":" in hostname else hostname


def _content_type(response: httpx.Response) -> str:
    return response.headers.get("content-type", "").split(";", 1)[0].strip().lower()


def _require_allowed_content_type(content_type: str) -> None:
    if content_type not in _ALLOWED_CONTENT_TYPES:
        raise HttpFetchError("The response content type is not allowed.")


def _require_announced_size_within_limit(response: httpx.Response) -> None:
    try:
        content_length = int(response.headers.get("content-length", "0"))
    except ValueError:
        return
    if content_length > MAX_RESPONSE_BYTES:
        raise HttpFetchError("The response is too large.")


async def _read_limited_body(response: httpx.Response) -> bytes:
    chunks: list[bytes] = []
    received = 0
    async for chunk in response.aiter_bytes():
        received += len(chunk)
        if received > MAX_RESPONSE_BYTES:
            raise HttpFetchError("The response is too large.")
        chunks.append(chunk)
    return b"".join(chunks)
