import type { ApiClient } from '@/types/api';
import { httpApiClient } from './httpAdapter';

/** The production client uses the configured HTTP API only. */
export const apiClient: ApiClient = httpApiClient;
