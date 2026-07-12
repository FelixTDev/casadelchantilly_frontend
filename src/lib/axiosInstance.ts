import axios, { AxiosHeaders } from "axios";
import { toFriendlyAxiosError } from "./apiError";
import type { InternalAxiosRequestConfig } from "axios";
import { isMutatingMethod, isRetryableReadError, normalizeApiBaseUrl } from "./httpPolicy";

const currentHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
const baseURL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL, currentHost);
const csrfUrl = `${baseURL}/auth/csrf`;
let csrfRequest: Promise<string | null> | null = null;
let csrfToken: string | null = null;

const axiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  withCredentials: true,
});

async function ensureCsrfToken(forceRefresh = false) {
  if (!forceRefresh && csrfToken) {
    return csrfToken;
  }

  csrfRequest ??= axios
    .get<{ mensaje?: string }>(csrfUrl, {
      withCredentials: true,
      timeout: 30000,
    })
    .then((response) => {
      csrfToken = response.data?.mensaje?.trim() || null;
      return csrfToken;
    })
    .finally(() => {
      csrfRequest = null;
    });

  return csrfRequest;
}

axiosInstance.interceptors.request.use(async (config) => {
  if (isMutatingMethod(config.method)) {
    const token = await ensureCsrfToken();
    if (token) {
      config.headers = AxiosHeaders.from(config.headers);
      config.headers.set("X-XSRF-TOKEN", token);
      config.headers.set("X-CSRF-TOKEN", token);
    }
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const friendlyError = toFriendlyAxiosError(error);
    const skipAuthRedirect = Boolean((error.config as InternalAxiosRequestConfig & { skipAuthRedirect?: boolean } | undefined)?.skipAuthRedirect);
    const requestConfig = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (axios.isAxiosError(error) && requestConfig && error.response?.status === 403 && isMutatingMethod(requestConfig.method) && !requestConfig._retried) {
      requestConfig._retried = true;
      const token = await ensureCsrfToken(true);
      if (token) {
        requestConfig.headers = AxiosHeaders.from(requestConfig.headers);
        requestConfig.headers.set("X-XSRF-TOKEN", token);
        requestConfig.headers.set("X-CSRF-TOKEN", token);
      }
      return axiosInstance.request(requestConfig);
    }

    if (axios.isAxiosError(error) && requestConfig && isRetryableReadError(error) && !requestConfig._retried) {
      requestConfig._retried = true;
      return axiosInstance.request(requestConfig);
    }

    if (error.response?.status === 401 && !skipAuthRedirect) {
      csrfToken = null;
      sessionStorage.removeItem("chantilly_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(friendlyError);
  }
);

export default axiosInstance;
