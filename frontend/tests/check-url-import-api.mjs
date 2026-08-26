import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const frontendDir = path.resolve(import.meta.dirname, '..');
const readSource = (...parts) => readFileSync(path.join(frontendDir, ...parts), 'utf8');

const types = readSource('src', 'types', 'api.ts');
assert.match(types, /export interface UrlExtractionRequest\s*\{\s*url:\s*string;/s);
assert.match(types, /export interface UrlExtractionResponse\s*\{[\s\S]*?original_url:\s*string;[\s\S]*?final_url:\s*string;[\s\S]*?domain:\s*string;[\s\S]*?title:\s*string\s*\|\s*null;[\s\S]*?author:\s*string\s*\|\s*null;[\s\S]*?published_at:\s*string\s*\|\s*null;[\s\S]*?text:\s*string;[\s\S]*?original_length:\s*number;[\s\S]*?truncated:\s*boolean;[\s\S]*?warnings:\s*string\[\];/s);
assert.match(types, /export interface UrlExtractionError\s*\{\s*code:\s*string;\s*message:\s*string;/s);
assert.match(types, /export interface UrlExtractionErrorResponse\s*\{\s*error:\s*UrlExtractionError;/s);

const adapter = readSource('src', 'services', 'api', 'httpAdapter.ts');
assert.match(adapter, /export async function extractUrl\(\s*request:\s*UrlExtractionRequest,\s*signal\?:\s*AbortSignal/s);
assert.match(adapter, /fetch\(`\$\{BASE_URL\}\/extractions\/url`,\s*\{[\s\S]*?method:\s*'POST',[\s\S]*?body:\s*JSON\.stringify\(request\),[\s\S]*?signal,/s);
assert.match(adapter, /errorBody\.error\.message/);
assert.match(adapter, /errorCode\s*=\s*errorBody\.error\?\.code/);
assert.match(adapter, /Object\.assign\(new Error\(errorMessage\),\s*\{\s*code:\s*errorCode\s*\}\)/);
assert.doesNotMatch(adapter, /fetch\(request\.url/);

const hooks = readSource('src', 'hooks', 'useApiHooks.ts');
assert.match(hooks, /export function useExtractUrl\(\)/);

assert.match(hooks, /type ExtractUrlMutationVariables\s*=\s*\{\s*request:\s*UrlExtractionRequest;\s*signal\?:\s*AbortSignal;\s*\}/s);
assert.match(hooks, /mutationFn:\s*\(\{\s*request,\s*signal\s*\}:\s*ExtractUrlMutationVariables\)\s*=>\s*extractUrl\(request,\s*signal\)/);
console.log('URL extraction API contract check passed.');
