const REQUEST_ID_HEADER = 'X-Request-ID';
const MAX_REFERENCE_ID_LENGTH = 128;
const SAFE_REFERENCE_ID_PATTERN = /^[A-Za-z0-9._:-]+$/u;

export function getSupportReferenceId(response: Response): string | undefined {
  const value = response.headers.get(REQUEST_ID_HEADER)?.trim();
  if (!value || value.length > MAX_REFERENCE_ID_LENGTH || !SAFE_REFERENCE_ID_PATTERN.test(value)) return undefined;
  return value;
}

export function getSupportReferenceIdFromError(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('supportReferenceId' in error)) return undefined;
  const value = (error as { supportReferenceId?: unknown }).supportReferenceId;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= MAX_REFERENCE_ID_LENGTH && SAFE_REFERENCE_ID_PATTERN.test(trimmed)
    ? trimmed
    : undefined;
}
