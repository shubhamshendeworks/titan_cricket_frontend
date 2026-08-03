/**
 * Axios HTTP client with auth interceptors.
 *
 * Access token lives in Zustand + localStorage.
 * On any 401 (except from the refresh endpoint itself): silently refresh
 * via the HttpOnly refresh cookie. On refresh failure: clear auth + /login.
 */

import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiResponse } from "@/types";
import { useAuthStore } from "@/store/authStore";

const _envApiUrl = import.meta.env.VITE_API_BASE_URL;
if (!_envApiUrl) {
  throw new Error(
    "[Cricket Platform] VITE_API_BASE_URL is not set.\n" +
    "  • Development: add it to frontend/.env.local\n" +
    "  • Production:  add it to Vercel → Settings → Environment Variables\n" +
    "  Accepted forms:\n" +
    "    https://titan-cricket-backend.onrender.com\n" +
    "    https://titan-cricket-backend.onrender.com/api/v1"
  );
}
// Normalise: strip trailing slash, then guarantee exactly one /api/v1 suffix.
// Handles both https://host and https://host/api/v1 set in Vercel env vars.
const _apiBase = _envApiUrl.replace(/\/+$/, "");
const BASE_URL: string = _apiBase.endsWith("/api/v1")
  ? _apiBase
  : `${_apiBase}/api/v1`;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Request: inject access token ────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token: string | null = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err: unknown) => Promise.reject(err)
);

// ─── Response: silent token refresh on any 401 ────────────────────────────────

let _refreshing: Promise<string> | null = null;

// Auth endpoints that should never trigger a refresh loop
const AUTH_ENDPOINTS = ["/auth/refresh", "/auth/login", "/auth/logout"];

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((path) => url.includes(path));
}

apiClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (err: AxiosError<ApiResponse>) => {
    const original = err.config as InternalAxiosRequestConfig & { _retried?: boolean };
    const status = err.response?.status;

    // Only handle 401s, skip auth endpoints and already-retried requests
    if (
      status === 401 &&
      !original._retried &&
      !isAuthEndpoint(original.url)
    ) {
      original._retried = true;

      try {
        // Deduplicate concurrent refresh calls
        if (!_refreshing) {
          _refreshing = apiClient
            .post<{ data: { access_token: string } }>("/auth/refresh")
            .then((r) => r.data.data.access_token)
            .finally(() => { _refreshing = null; });
        }
        const newToken = await _refreshing;
        useAuthStore.getState().setAccessToken(newToken);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        // Refresh failed — clear auth and send to login
        _refreshing = null;
        useAuthStore.getState().clearAuth();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(err);
  }
);

export function extractData<T>(response: AxiosResponse<ApiResponse<T>>): T {
  if (!response.data.success || response.data.data === undefined) {
    throw new Error(response.data.message ?? "API returned no data");
  }
  return response.data.data;
}

export default apiClient;
