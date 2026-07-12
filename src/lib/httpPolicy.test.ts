import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { isMutatingMethod, isRetryableReadError, normalizeApiBaseUrl } from "./httpPolicy";

function buildAxiosError(method: string, status?: number, code?: string) {
  return new AxiosError(
    "request failed",
    code,
    {
      url: "/test",
      method,
      headers: {},
    } as never,
    undefined,
    status
      ? {
          data: {},
          status,
          statusText: "Error",
          headers: {},
          config: {} as never,
        }
      : undefined
  );
}

describe("normalizeApiBaseUrl", () => {
  it("removes trailing slashes from configured URLs", () => {
    expect(normalizeApiBaseUrl("https://backend.onrender.com/api/")).toBe("https://backend.onrender.com/api");
  });

  it("falls back to the current host in local development", () => {
    expect(normalizeApiBaseUrl(undefined, "127.0.0.1")).toBe("http://127.0.0.1:8081/api");
  });
});

describe("isMutatingMethod", () => {
  it("marks only write methods as CSRF-sensitive", () => {
    expect(isMutatingMethod("post")).toBe(true);
    expect(isMutatingMethod("PUT")).toBe(true);
    expect(isMutatingMethod("patch")).toBe(true);
    expect(isMutatingMethod("delete")).toBe(true);
    expect(isMutatingMethod("get")).toBe(false);
  });
});

describe("isRetryableReadError", () => {
  it("retries read requests on timeout or transport failures", () => {
    expect(isRetryableReadError(buildAxiosError("get", undefined, "ECONNABORTED"))).toBe(true);
    expect(isRetryableReadError(buildAxiosError("get"))).toBe(true);
  });

  it("retries read requests on server errors only", () => {
    expect(isRetryableReadError(buildAxiosError("get", 503))).toBe(true);
    expect(isRetryableReadError(buildAxiosError("get", 403))).toBe(false);
  });

  it("does not retry mutating requests", () => {
    expect(isRetryableReadError(buildAxiosError("post", undefined, "ECONNABORTED"))).toBe(false);
  });
});
