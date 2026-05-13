const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  throw new Error('VITE_API_URL is not set. Check apps/customer/.env');
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
    return asErrorBody(this.body)?.code ?? null;
  }

  get fieldErrors(): Record<string, string[] | undefined> | null {
    return asErrorBody(this.body)?.details?.fieldErrors ?? null;
  }

  get formErrors(): string[] | null {
    return asErrorBody(this.body)?.details?.formErrors ?? null;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
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

  const isEnvelopeFailure =
    body &&
    typeof body === 'object' &&
    (body as { success?: unknown }).success === false;

  if (!res.ok || isEnvelopeFailure) {
    const message =
      (body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : null) ?? res.statusText;
    throw new ApiError(res.status, message, body);
  }

  return body as ApiResponse<T>;
}

async function requestRaw<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
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

  if (!res.ok) {
    const message =
      (body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : null) ?? res.statusText;
    throw new ApiError(res.status, message, body);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  getRaw: <T>(path: string) => requestRaw<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data ?? {}) }),
};

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

export function generalApiErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (!(error instanceof ApiError)) return 'Unexpected error. Please try again.';
  const fieldErrors = error.fieldErrors;
  if (fieldErrors && Object.keys(fieldErrors).length > 0) return null;
  const formErrors = error.formErrors;
  if (formErrors && formErrors.length > 0) return formErrors.join(' ');
  return error.message;
}
