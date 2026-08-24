import type {
  ApiClient,
  BatchAnalysisRequest,
  BatchAnalysisResponse,
  UrlExtractionErrorResponse,
  UrlExtractionRequest,
  UrlExtractionResponse,
} from '@/types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (Array.isArray(errorBody.detail)) {
        errorMessage = errorBody.detail.map((detail: { msg?: string }) => detail.msg || 'Error de validaci?n').join('. ');
      } else if (typeof errorBody.detail === 'string') {
        errorMessage = errorBody.detail;
      } else if (errorBody.message) {
        errorMessage = errorBody.message;
      }
    } catch {
      // Ignore a non-JSON error response.
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

async function handleUrlExtractionResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorBody = await response.json() as Partial<UrlExtractionErrorResponse>;
      if (errorBody.error?.message) {
        errorMessage = errorBody.error.message;
      }
    } catch {
      // Ignore a non-JSON error response.
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

/** Sends URL extraction requests only to the configured backend API. */
export async function extractUrl(
  request: UrlExtractionRequest,
  signal?: AbortSignal,
): Promise<UrlExtractionResponse> {
  const response = await fetch(`${BASE_URL}/extractions/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });
  return handleUrlExtractionResponse<UrlExtractionResponse>(response);
}

export const httpApiClient: ApiClient = {
  async analyzeBatch(request: BatchAnalysisRequest): Promise<BatchAnalysisResponse> {
    const response = await fetch(`${BASE_URL}/analysis/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse<BatchAnalysisResponse>(response);
  },
};
