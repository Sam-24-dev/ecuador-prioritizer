export type PreliminaryClass = 'Falso' | 'Verdadero';

/** One item prepared locally before a single batch request is submitted. */
export interface BatchAnalysisItemRequest {
  client_id?: string;
  text: string;
  source?: string;
}

export interface BatchAnalysisRequest {
  items: BatchAnalysisItemRequest[];
}

/** Session-neutral batch result. It deliberately has no persisted analysis or case ID. */
export interface BatchAnalysisResult {
  client_id: string | null;
  preliminary_class: PreliminaryClass;
  p_true: number;
  score_false: number;
  source: string | null;
  text_snippet: string;
}

export interface BatchAnalysisResponse {
  items: BatchAnalysisResult[];
  total: number;
}

export interface ApiClient {
  analyzeBatch(request: BatchAnalysisRequest): Promise<BatchAnalysisResponse>;
}

export interface UrlExtractionRequest {
  url: string;
}

/** Article preview returned by POST /api/v1/extractions/url. */
export interface UrlExtractionResponse {
  original_url: string;
  final_url: string;
  domain: string;
  title: string | null;
  author: string | null;
  published_at: string | null;
  text: string;
  original_length: number;
  truncated: boolean;
  warnings: string[];
}

export interface UrlExtractionError {
  code: string;
  message: string;
}

export interface UrlExtractionErrorResponse {
  error: UrlExtractionError;
}
