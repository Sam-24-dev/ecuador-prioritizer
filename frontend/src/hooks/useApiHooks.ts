import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { extractUrl } from '@/services/api/httpAdapter';
import type { BatchAnalysisRequest, UrlExtractionRequest } from '@/types/api';

type ExtractUrlMutationVariables = {
  request: UrlExtractionRequest;
  signal?: AbortSignal;
};

export function useAnalyzeBatch() {
  return useMutation({
    mutationFn: (request: BatchAnalysisRequest) => apiClient.analyzeBatch(request),
  });
}

export function useExtractUrl() {
  return useMutation({
    mutationFn: ({ request, signal }: ExtractUrlMutationVariables) => extractUrl(request, signal),
  });
}
