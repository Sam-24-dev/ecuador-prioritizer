from collections.abc import Callable
from importlib import import_module

import pytest

Resolver = Callable[[str, int], tuple[str, ...]]


def resolver_for(*addresses: str) -> Resolver:
    def resolve(hostname: str, port: int) -> tuple[str, ...]:
        assert hostname
        assert port in {80, 443}
        return addresses

    return resolve


def test_validates_a_public_https_destination_and_pins_every_resolved_ip() -> None:
    security = import_module("app.services.url_security")

    destination = security.validate_url(
        "https://Noticias.Münich.example/article?id=1",
        resolver=resolver_for("8.8.8.8"),
    )

    assert destination.url == "https://noticias.xn--mnich-kva.example/article?id=1"
    assert destination.hostname == "noticias.xn--mnich-kva.example"
    assert destination.port == 443
    assert destination.resolved_ips == ("8.8.8.8",)
    assert [target.ip for target in destination.connection_targets] == ["8.8.8.8"]
    assert all(target.port == 443 for target in destination.connection_targets)


@pytest.mark.parametrize(
    "url",
    [
        "ftp://example.com/article",
        "https://user:password@example.com/article",
        "https://example.com:8443/article",
        "http://example.com:443/article",
        "https:///article",
        "https://example.com/#fragment",
    ],
)
def test_rejects_non_public_url_shapes_before_resolution(url: str) -> None:
    security = import_module("app.services.url_security")
    called = False

    def resolver(hostname: str, port: int) -> tuple[str, ...]:
        nonlocal called
        called = True
        return ("8.8.8.8",)

    with pytest.raises(security.UrlSecurityError):
        security.validate_url(url, resolver=resolver)

    assert called is False


@pytest.mark.parametrize(
    "address",
    [
        "127.0.0.1",
        "10.0.0.1",
        "169.254.169.254",
        "224.0.0.1",
        "0.0.0.0",
        "240.0.0.1",
        "::1",
        "fc00::1",
        "fe80::1",
        "ff00::1",
        "::",
        "::ffff:127.0.0.1",
    ],
)
def test_rejects_private_and_special_dns_answers(address: str) -> None:
    security = import_module("app.services.url_security")

    with pytest.raises(security.UrlSecurityError):
        security.validate_url(
            "https://example.com/article", resolver=resolver_for(address)
        )


@pytest.mark.parametrize(
    "url",
    [
        "https://169.254.169.254/latest/meta-data/",
        "http://[::1]/",
        "https://metadata.google.internal/computeMetadata/v1/",
        "https://instance-data.ec2.internal/latest/",
        "https://metadata.azure.internal/metadata/instance",
    ],
)
def test_rejects_cloud_metadata_destinations_without_dns(url: str) -> None:
    security = import_module("app.services.url_security")

    with pytest.raises(security.UrlSecurityError):
        security.validate_url(url, resolver=resolver_for("8.8.8.8"))


@pytest.mark.parametrize(
    "url",
    [
        "https://x.com/post/1",
        "https://mobile.twitter.com/post/1",
        "https://facebook.com/post/1",
        "https://www.instagram.com/post/1",
        "https://tiktok.com/post/1",
    ],
)
def test_rejects_unsupported_social_domains(url: str) -> None:
    security = import_module("app.services.url_security")

    with pytest.raises(security.UrlSecurityError):
        security.validate_url(url, resolver=resolver_for("8.8.8.8"))


def test_rejects_a_mixed_dns_answer_to_prevent_rebinding_or_failover_to_private_ip() -> None:
    security = import_module("app.services.url_security")

    with pytest.raises(security.UrlSecurityError):
        security.validate_url(
            "https://example.com/article",
            resolver=resolver_for("8.8.8.8", "127.0.0.1"),
        )


def test_rejects_an_empty_or_invalid_dns_answer() -> None:
    security = import_module("app.services.url_security")

    with pytest.raises(security.UrlSecurityError):
        security.validate_url("https://example.com/article", resolver=resolver_for())
    with pytest.raises(security.UrlSecurityError):
        security.validate_url(
            "https://example.com/article", resolver=resolver_for("not-an-ip")
        )


def test_validates_each_redirect_target_after_resolving_a_relative_location() -> None:
    security = import_module("app.services.url_security")

    destination = security.validate_redirect(
        location="/next",
        current_url="https://example.com/start",
        resolver=resolver_for("8.8.8.8"),
    )

    assert destination.url == "https://example.com/next"
    assert destination.resolved_ips == ("8.8.8.8",)


def test_rejects_a_redirect_to_a_private_destination() -> None:
    security = import_module("app.services.url_security")

    with pytest.raises(security.UrlSecurityError):
        security.validate_redirect(
            location="http://169.254.169.254/latest/meta-data/",
            current_url="https://example.com/start",
            resolver=resolver_for("8.8.8.8"),
        )
