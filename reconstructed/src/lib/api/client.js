const API_BASE = (import.meta.env.VITE_JRVX_API_BASE ?? "").replace(/\/$/, "");
const WRITES_ENABLED = import.meta.env.VITE_JRVX_ENABLE_WRITES === "true";

export class ApiError extends Error {
  constructor(message, { status = 0, code = null, details = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function apiUrl(path) {
  if (!path.startsWith("/")) throw new Error("API path must start with /");
  return API_BASE ? `${API_BASE}${path}` : path;
}

export async function request(path, options = {}) {
  const method = (options.method ?? "GET").toUpperCase();
  const isWrite = !["GET", "HEAD", "OPTIONS"].includes(method);

  if (isWrite && !WRITES_ENABLED) {
    throw new ApiError(
      "Production writes are disabled in the reconstructed client.",
      { code: "JRVX_WRITES_DISABLED" },
    );
  }

  let response;
  try {
    response = await fetch(apiUrl(path), {
      credentials: "include",
      cache: "no-store",
      ...options,
      method,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw new ApiError("Нет соединения. Проверьте интернет и повторите попытку.", {
      code: "NETWORK_ERROR",
      details: error,
    });
  }

  let payload = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ??
      (typeof payload?.error === "string" ? payload.error : null) ??
      `JRVX API error ${response.status}`;

    throw new ApiError(message, {
      status: response.status,
      code: payload?.error?.code ?? (response.status === 401 ? "AUTH_REQUIRED" : null),
      details: payload,
    });
  }

  return payload;
}

export function writesEnabled() {
  return WRITES_ENABLED;
}
