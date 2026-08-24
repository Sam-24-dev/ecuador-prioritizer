"""Network-safe URL validation for the deferred URL extraction fetcher."""

from __future__ import annotations

import ipaddress
import socket
from collections.abc import Callable, Iterable
from dataclasses import dataclass
from urllib.parse import SplitResult, urljoin, urlsplit, urlunsplit

Resolver = Callable[[str, int], Iterable[str]]

_ALLOWED_PORTS = {"http": 80, "https": 443}
_SOCIAL_DOMAINS = frozenset(
    {"x.com", "twitter.com", "facebook.com", "fb.com", "instagram.com", "tiktok.com"}
)
_METADATA_DOMAINS = frozenset(
    {
        "metadata.google.internal",
        "metadata.goog",
        "instance-data.ec2.internal",
        "metadata.azure.internal",
    }
)


class UrlSecurityError(ValueError):
    """Sanitized validation failure for hostile URL input."""

    def __init__(self) -> None:
        super().__init__("The URL is not allowed.")


@dataclass(frozen=True)
class ConnectionTarget:
    """A numeric destination that a future fetcher must connect to directly."""

    ip: str
    port: int


@dataclass(frozen=True)
class ValidatedUrl:
    """Validated request metadata, including the DNS answers pinned for connection."""

    url: str
    hostname: str
    port: int
    resolved_ips: tuple[str, ...]

    @property
    def connection_targets(self) -> tuple[ConnectionTarget, ...]:
        """Return numeric-only connection targets; never reconnect by hostname."""
        return tuple(ConnectionTarget(ip=ip, port=self.port) for ip in self.resolved_ips)


def validate_url(url: str, *, resolver: Resolver | None = None) -> ValidatedUrl:
    """Validate a public HTTP(S) URL and pin every approved DNS answer.

    The caller must use ``connection_targets`` for the eventual socket connection;
    resolving ``hostname`` again would reintroduce a DNS-rebinding window.
    """
    parsed = _parse_public_url(url)
    hostname = _normalize_hostname(parsed.hostname)
    scheme = parsed.scheme.lower()
    port = _validated_port(parsed, scheme)

    if _is_blocked_hostname(hostname):
        raise UrlSecurityError()

    resolved_ips: tuple[str, ...]
    literal_ip = _parse_ip(hostname)
    if literal_ip is not None:
        _require_public_ip(literal_ip)
        resolved_ips = (str(literal_ip),)
    else:
        resolve = resolver or _resolve_hostname
        resolved_ips = _validated_dns_answers(resolve, hostname, port)

    return ValidatedUrl(
        url=_normalized_url(parsed, scheme, hostname, port),
        hostname=hostname,
        port=port,
        resolved_ips=resolved_ips,
    )


def validate_redirect(
    *, location: str, current_url: str, resolver: Resolver | None = None
) -> ValidatedUrl:
    """Resolve and validate one redirect target before a future follow-up request."""
    if not location:
        raise UrlSecurityError()
    return validate_url(urljoin(current_url, location), resolver=resolver)


def _parse_public_url(url: str) -> SplitResult:
    try:
        parsed = urlsplit(url)
    except ValueError as error:
        raise UrlSecurityError() from error

    scheme = parsed.scheme.lower()
    if (
        scheme not in _ALLOWED_PORTS
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.fragment
    ):
        raise UrlSecurityError()
    return parsed


def _normalize_hostname(hostname: str | None) -> str:
    if not hostname:
        raise UrlSecurityError()
    try:
        normalized = hostname.rstrip(".").encode("idna").decode("ascii").lower()
    except UnicodeError as error:
        raise UrlSecurityError() from error
    if not normalized:
        raise UrlSecurityError()
    return normalized


def _validated_port(parsed: SplitResult, scheme: str) -> int:
    try:
        port = parsed.port
    except ValueError as error:
        raise UrlSecurityError() from error

    allowed_port = _ALLOWED_PORTS[scheme]
    if port is not None and port != allowed_port:
        raise UrlSecurityError()
    return allowed_port


def _normalized_url(parsed: SplitResult, scheme: str, hostname: str, port: int) -> str:
    host = f"[{hostname}]" if ":" in hostname else hostname
    if parsed.port is not None:
        host = f"{host}:{port}"
    return urlunsplit((scheme, host, parsed.path, parsed.query, ""))


def _is_blocked_hostname(hostname: str) -> bool:
    return any(
        hostname == domain or hostname.endswith(f".{domain}")
        for domain in _SOCIAL_DOMAINS | _METADATA_DOMAINS
    )


def _parse_ip(hostname: str) -> ipaddress.IPv4Address | ipaddress.IPv6Address | None:
    try:
        return ipaddress.ip_address(hostname)
    except ValueError:
        return None


def _resolve_hostname(hostname: str, port: int) -> tuple[str, ...]:
    try:
        records = socket.getaddrinfo(
            hostname, port, family=socket.AF_UNSPEC, type=socket.SOCK_STREAM
        )
    except OSError as error:
        raise UrlSecurityError() from error

    return tuple(str(record[4][0]) for record in records)


def _validated_dns_answers(
    resolver: Resolver, hostname: str, port: int
) -> tuple[str, ...]:
    try:
        answers = tuple(resolver(hostname, port))
    except (OSError, ValueError) as error:
        raise UrlSecurityError() from error

    if not answers:
        raise UrlSecurityError()

    validated: list[str] = []
    for answer in answers:
        try:
            address = ipaddress.ip_address(answer)
        except ValueError as error:
            raise UrlSecurityError() from error
        _require_public_ip(address)
        rendered = str(address)
        if rendered not in validated:
            validated.append(rendered)

    return tuple(validated)


def _require_public_ip(address: ipaddress.IPv4Address | ipaddress.IPv6Address) -> None:
    mapped = getattr(address, "ipv4_mapped", None)
    if mapped is not None:
        _require_public_ip(mapped)
        return

    if (
        not address.is_global
        or address.is_loopback
        or address.is_private
        or address.is_link_local
        or address.is_multicast
        or address.is_reserved
        or address.is_unspecified
        or getattr(address, "is_site_local", False)
    ):
        raise UrlSecurityError()
