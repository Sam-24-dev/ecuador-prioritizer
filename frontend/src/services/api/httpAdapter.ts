import type {
  ApiClient,
  BatchAnalysisRequest,
  BatchAnalysisResponse,
  UrlExtractionErrorResponse,
  UrlExtractionRequest,
  UrlExtractionResponse,
} from '@/types/api';
import { createClientTimeoutSignal } from './request-timeout';

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
    let errorCode: string | undefined;
    try {
      const errorBody = await response.json() as Partial<UrlExtractionErrorResponse>;
      errorCode = errorBody.error?.code;
      if (errorBody.error?.message) {
        errorMessage = errorBody.error.message;
      }
    } catch {
      // Ignore a non-JSON error response.
    }
    throw Object.assign(new Error(errorMessage), { code: errorCode });
  }
  return response.json() as Promise<T>;
}

/** Sends URL extraction requests only to the configured backend API. */
export async function extractUrl(
  request: UrlExtractionRequest,
  signal?: AbortSignal,
): Promise<UrlExtractionResponse> {
  const timeout = createClientTimeoutSignal(signal);
  try {
    const response = await fetch(`${BASE_URL}/extractions/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: timeout.signal,
    });
    return handleUrlExtractionResponse<UrlExtractionResponse>(response);
  } catch (error) {
    if (timeout.didTimeout()) {
      throw Object.assign(new Error('Client request timed out'), { code: 'client_timeout' });
    }
    throw error;
  } finally {
    timeout.cleanup();
  }
}

export const httpApiClient: ApiClient = {
  async analyzeBatch(request: BatchAnalysisRequest): Promise<BatchAnalysisResponse> {
    const timeout = createClientTimeoutSignal();
    try {
      const response = await fetch(`${BASE_URL}/analysis/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: timeout.signal,
      });
      return handleResponse<BatchAnalysisResponse>(response);
    } catch (error) {
      if (timeout.didTimeout()) {
        throw Object.assign(new Error('Client request timed out'), { code: 'client_timeout' });
      }
      throw error;
    } finally {
      timeout.cleanup();
    }
  },
};
