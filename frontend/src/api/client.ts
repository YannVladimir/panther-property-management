const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1';
const REFRESH_TOKEN_STORAGE_KEY = 'panther_refresh_token';

export interface ApiErrorBody {
  timestamp?: string;
  status: number;
  error?: string;
  message: string;
  path?: string;
  fieldErrors?: { field: string; message: string }[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null, fallbackMessage: string) {
    super(body?.message ?? fallbackMessage);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function setStoredRefreshToken(token: string | null) {
  if (token) localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

/** Registered once by AuthProvider — called when a refresh attempt itself fails. */
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Skip the Authorization header entirely — public endpoints (login, refresh, anonymous booking). */
  anonymous?: boolean;
  /** Internal — prevents infinite retry loops when the retried request itself 401s again. */
  isRetry?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(BASE_URL.replace(/\/$/, '') + path, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        setAccessToken(data.accessToken);
        setStoredRefreshToken(data.refreshToken);
        return data.accessToken as string;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!options.anonymous && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && !options.anonymous && !options.isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiRequest<T>(path, { ...options, isRetry: true });
    }
    setAccessToken(null);
    setStoredRefreshToken(null);
    onSessionExpired?.();
    throw new ApiError(401, null, 'Your session has expired. Please log in again.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(response.status, payload, `Request failed with status ${response.status}`);
  }

  return payload as T;
}

export interface UploadedFile {
  url: string;
  originalFilename: string;
  contentType: string;
  sizeLabel: string;
}

/** Multipart upload — separate from apiRequest since it must send FormData, not JSON. */
export async function apiUpload(file: File, folder: string): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const doUpload = async (isRetry = false): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const response = await fetch(buildUrl('/files'), { method: 'POST', headers, body: formData });
    if (response.status === 401 && !isRetry) {
      const newToken = await refreshAccessToken();
      if (newToken) return doUpload(true);
      setAccessToken(null);
      setStoredRefreshToken(null);
      onSessionExpired?.();
      throw new ApiError(401, null, 'Your session has expired. Please log in again.');
    }
    return response;
  };

  const response = await doUpload();
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, payload, `Upload failed with status ${response.status}`);
  }
  return payload as UploadedFile;
}

/**
 * File URLs come back from the backend as relative paths (e.g. `/files/client-documents/...`),
 * since `panther.file-storage.public-url-prefix` has no host in it (see WebConfig on the backend).
 * Rendering one directly as an <img>/<iframe>/<a> src resolves it against the *frontend's* own
 * origin, not the backend's — which 404s. Resolve against the backend's real origin instead.
 */
export function resolveFileUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(BASE_URL).origin + (url.startsWith('/') ? url : `/${url}`);
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query'], anonymous?: boolean) =>
    apiRequest<T>(path, { method: 'GET', query, anonymous }),
  post: <T>(path: string, body?: unknown, anonymous?: boolean) =>
    apiRequest<T>(path, { method: 'POST', body, anonymous }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
