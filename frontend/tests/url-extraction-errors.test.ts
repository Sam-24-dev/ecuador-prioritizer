import assert from 'node:assert/strict';
import {
  URL_EXTRACTION_PERMANENT_MESSAGE,
  classifyUrlExtractionError,
} from '../src/lib/url-extraction-errors.ts';

assert.deepEqual(classifyUrlExtractionError({ code: 'invalid_url' }), {
  kind: 'invalid',
  message: 'No fue posible extraer esta URL. Edita la dirección o prueba con otro artículo público.',
  canRetry: false,
  canPaste: false,
});

for (const code of [
  'upstream_access_denied', 'article_unavailable', 'upstream_rejected',
  'redirect_limit_exceeded', 'unsupported_media_type', 'response_too_large',
  'extracted_text_too_short', 'extraction_failed', 'unknown_code', undefined,
]) {
  const result = classifyUrlExtractionError({ code });
  assert.equal(result.kind, 'permanent');
  assert.equal(result.message, URL_EXTRACTION_PERMANENT_MESSAGE);
  assert.equal(result.canRetry, false);
  assert.equal(result.canPaste, true);
}

for (const code of ['rate_limited', 'client_timeout', 'upstream_timeout', 'upstream_unavailable', 'service_unavailable']) {
  const result = classifyUrlExtractionError({ code });
  assert.equal(result.kind, 'transient');
  assert.equal(result.canRetry, true);
  assert.equal(result.canPaste, false);
}

console.log('URL extraction error classification checks passed.');
