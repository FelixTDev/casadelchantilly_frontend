import type { AxiosError } from "axios";

export function normalizeApiBaseUrl(rawBaseUrl: string | undefined, currentHost = "localhost") {
  const trimmed = rawBaseUrl?.trim();
  if (trimmed) {
    return trimmed.replace(/\/+$/, "");
  }
  return `http://${currentHost || "localhost"}:8081/api`;
}

export function isMutatingMethod(method: string | undefined) {
  const normalized = (method ?? "get").toLowerCase();
  return ["post", "put", "patch", "delete"].includes(normalized);
}

export function isRetryableReadError(error: AxiosError) {
  const method = (error.config?.method ?? "get").toLowerCase();
  if (!["get", "head", "options"].includes(method)) {
    return false;
  }

  if (error.code === "ECONNABORTED") {
    return true;
  }

  if (!error.response) {
    return true;
  }

  return error.response.status >= 500;
}
