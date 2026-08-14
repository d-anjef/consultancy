import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { ApiError, type ApiResponse } from '@/types/api.types';
import { siteConfig } from '@/config/site';

/**
 * Central Axios instance for all API calls.
 * - Uses `credentials: include` for session cookies.
 * - Base URL points to Next.js proxy (/api/v1/*) which forwards to backend.
 */
const client: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

/**
 * Unwrap the standard `{ success, data, meta }` envelope.
 * On error, throw ApiError with all context.
 */
async function unwrap<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await client.request<ApiResponse<T>>(config);
    const body = response.data;

    if (!body || typeof body !== 'object' || !('success' in body)) {
      throw new ApiError(
        'INVALID_RESPONSE',
        response.status,
        undefined,
        undefined,
        'Server returned an unexpected response format.',
      );
    }

    if (body.success === false) {
      throw new ApiError(
        body.error.code,
        response.status,
        body.error.details,
        body.error.requestId,
        body.error.message,
      );
    }

    return body.data;
  } catch (err) {
    if (err instanceof ApiError) throw err;

    if (err instanceof AxiosError) {
      const response = err.response;
      const data = response?.data;

      if (data && typeof data === 'object' && 'error' in data) {
        const errorObj = data.error as {
          code?: string;
          message?: string;
          details?: unknown;
          requestId?: string;
        };
        throw new ApiError(
          errorObj.code || 'UNKNOWN',
          response?.status || 500,
          errorObj.details,
          errorObj.requestId,
          errorObj.message || err.message,
        );
      }

      if (err.code === 'ECONNABORTED') {
        throw new ApiError(
          'TIMEOUT',
          408,
          undefined,
          undefined,
          'Request timed out. Please try again.',
        );
      }

      if (!response) {
        throw new ApiError(
          'NETWORK_ERROR',
          0,
          undefined,
          undefined,
          'Cannot connect to server. Please check your connection.',
        );
      }

      throw new ApiError(
        'HTTP_ERROR',
        response.status,
        undefined,
        undefined,
        `Request failed with status ${response.status}`,
      );
    }

    throw new ApiError(
      'UNKNOWN',
      500,
      undefined,
      undefined,
      err instanceof Error ? err.message : 'An unknown error occurred',
    );
  }
}

export const api = {
    
  get: <T>(url: string, params?: Record<string, unknown>) =>
    unwrap<T>({ method: 'GET', url, params }),

  post: <T>(url: string, data?: unknown) =>
    unwrap<T>({ method: 'POST', url, data }),

  put: <T>(url: string, data?: unknown) =>
    unwrap<T>({ method: 'PUT', url, data }),

  patch: <T>(url: string, data?: unknown) =>
    unwrap<T>({ method: 'PATCH', url, data }),

  delete: <T>(url: string) => unwrap<T>({ method: 'DELETE', url }),
};

export { siteConfig };

export {api as apiClient } ;
export default api;