import { useAuthStore } from '@/stores/auth';

const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  throw new Error('VITE_API_URL is not set. Check apps/admin/.env');
}

export type ApiResponse<T> = {
  success: true;
  message: string | null;
  data: T;
  meta: unknown | null;
};

export type ApiErrorDetails = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
  [key: string]: unknown;
};

export type ApiErrorBody = {
  success: false;
  code: string;
  message: string;
  details: ApiErrorDetails;
};

function asErrorBody(value: unknown): ApiErrorBody | null {
  if (!value || typeof value !== 'object') return null;
  if ((value as { success?: unknown }).success !== false) return null;
  return value as ApiErrorBody;
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }

  get code(): string | null {
    const body = asErrorBody(this.body);
    return body?.code ?? null;
  }

  get fieldErrors(): Record<string, string[] | undefined> | null {
    const body = asErrorBody(this.body);
    return body?.details?.fieldErrors ?? null;
  }

  get formErrors(): string[] | null {
    const body = asErrorBody(this.body);
    return body?.details?.formErrors ?? null;
  }

  detail<T = unknown>(key: string): T | null {
    const body = asErrorBody(this.body);
    if (!body?.details) return null;
    const value = (body.details as Record<string, unknown>)[key];
    return (value as T) ?? null;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().token;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  // The envelope's `success: false` is the source of truth for failures.
  // Fall back to HTTP status when the body isn't a valid envelope (e.g. a
  // proxy returns a 502 with no JSON body).
  const isEnvelopeFailure =
    body &&
    typeof body === 'object' &&
    (body as { success?: unknown }).success === false;

  if (!res.ok || isEnvelopeFailure) {
    if (res.status === 401) {
      useAuthStore.getState().logout();
    }
    const message =
      (body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : null) ?? res.statusText;
    throw new ApiError(res.status, message, body);
  }

  return body as ApiResponse<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data ?? {}) }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data ?? {}) }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data ?? {}) }),
  delete: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'DELETE', body: JSON.stringify(data ?? {}) }),
};

/**
 * Collect all error messages for a given field, including nested keys
 * (e.g. for fieldName="serviceTypeIds", picks up "serviceTypeIds" and
 * "serviceTypeIds.0", "serviceTypeIds.1", ...).
 */
export function collectFieldErrors(
  fieldErrors: Record<string, string[] | undefined> | null | undefined,
  fieldName: string
): string[] {
  if (!fieldErrors) return [];
  const out: string[] = [];
  for (const [key, msgs] of Object.entries(fieldErrors)) {
    if (!msgs?.length) continue;
    if (key === fieldName || key.startsWith(`${fieldName}.`)) {
      out.push(...msgs);
    }
  }
  return out;
}

/**
 * Pick the right message for a top-level error banner.
 * - if the API returned per-field errors, return null (errors are inline)
 * - else if the API returned form-level errors, return them joined
 * - else fall back to the top-level message
 */
export function generalApiErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (!(error instanceof ApiError)) return 'Unexpected error. Please try again.';
  const fieldErrors = error.fieldErrors;
  if (fieldErrors && Object.keys(fieldErrors).length > 0) return null;
  const formErrors = error.formErrors;
  if (formErrors && formErrors.length > 0) return formErrors.join(' ');
  return error.message;
}
