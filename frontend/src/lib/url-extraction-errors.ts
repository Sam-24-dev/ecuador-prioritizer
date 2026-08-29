export const URL_EXTRACTION_PERMANENT_MESSAGE = 'No pudimos extraer el contenido de este enlace. Prueba con otro enlace del medio o pega el texto de la noticia.';
const INVALID_URL_MESSAGE = 'No fue posible extraer esta URL. Edita la dirección o prueba con otro artículo público.';
const TRANSIENT_MESSAGE = 'No fue posible extraer esta URL. Intenta de nuevo más tarde.';

export type UrlExtractionErrorPresentation = {
  kind: 'invalid' | 'permanent' | 'transient';
  message: string;
  canRetry: boolean;
  canPaste: boolean;
};

const TRANSIENT_CODES = new Set([
  'rate_limited',
  'client_timeout',
  'upstream_timeout',
  'upstream_unavailable',
  'service_unavailable',
]);

export function classifyUrlExtractionError(error: unknown): UrlExtractionErrorPresentation {
  const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
    ? error.code
    : undefined;
  if (code === 'invalid_url') {
    return { kind: 'invalid', message: INVALID_URL_MESSAGE, canRetry: false, canPaste: false };
  }
  if (code && TRANSIENT_CODES.has(code)) {
    return { kind: 'transient', message: TRANSIENT_MESSAGE, canRetry: true, canPaste: false };
  }
  return { kind: 'permanent', message: URL_EXTRACTION_PERMANENT_MESSAGE, canRetry: false, canPaste: true };
}
