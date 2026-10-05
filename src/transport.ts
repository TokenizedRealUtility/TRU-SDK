import { classifyHttpError, classifyRpcError, TruNetworkError, TruTimeoutError } from "./errors.js";
import type { HttpClientOptions, JsonObject, JsonValue, RpcCallOptions, RpcEnvelope, RpcTransportOptions, TokenProvider } from "./types.js";

async function resolveToken(token?: TokenProvider): Promise<string | undefined> {
  if (!token) return undefined;
  const value = typeof token === "function" ? await token() : token;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(fetcher: typeof fetch, url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetcher(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new TruTimeoutError(`Request timed out after ${timeoutMs} ms`, { cause: error });
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new TruTimeoutError(`Request timed out after ${timeoutMs} ms`, { cause: error });
    }
    throw new TruNetworkError(error instanceof Error ? error.message : "Network request failed", { cause: error });
  } finally {
    clearTimeout(timer);
  }
}

export class RpcTransport {
  readonly endpoint: string;
  readonly timeoutMs: number;
  private readonly token?: TokenProvider;
  private readonly fetcher: typeof fetch;
  private readonly headers: Record<string, string>;
  private readonly credentials?: RequestCredentials;
  private nextId = 1;

  constructor(options: RpcTransportOptions) {
    this.endpoint = options.endpoint;
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.token = options.token;
    this.fetcher = options.fetch ?? globalThis.fetch;
    this.headers = options.headers ?? {};
    this.credentials = options.credentials;
    if (!this.fetcher) throw new Error("No fetch implementation available");
  }

  async call<T = JsonValue>(method: string, params: JsonObject = {}, options: RpcCallOptions = {}): Promise<T> {
    const retries = options.retries ?? 0;
    const retryDelayMs = options.retryDelayMs ?? 200;
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const token = await resolveToken(this.token);
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...this.headers
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetchWithTimeout(this.fetcher, this.endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({ jsonrpc: "2.0", id: this.nextId++, method, params }),
          ...(this.credentials ? { credentials: this.credentials } : {})
        }, options.timeoutMs ?? this.timeoutMs);

        const text = await response.text();
        if (!response.ok) {
          throw classifyHttpError(response.status, text || `HTTP ${response.status}`);
        }

        let envelope: RpcEnvelope<T>;
        try {
          envelope = JSON.parse(text) as RpcEnvelope<T>;
        } catch (error) {
          throw new TruNetworkError("TRU RPC returned invalid JSON", { cause: error });
        }

        if (envelope.error) throw classifyRpcError(envelope.error);
        if (!("result" in envelope)) throw new TruNetworkError("TRU RPC response did not contain result or error");
        return envelope.result as T;
      } catch (error) {
        lastError = error;
        if (attempt >= retries) throw error;
        await sleep(retryDelayMs * (attempt + 1));
      }
    }
    throw lastError;
  }
}

export class HttpTransport {
  readonly baseUrl: string;
  readonly timeoutMs: number;
  private readonly token?: TokenProvider;
  private readonly fetcher: typeof fetch;
  private readonly headers: Record<string, string>;
  private readonly credentials?: RequestCredentials;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.token = options.token;
    this.fetcher = options.fetch ?? globalThis.fetch;
    this.headers = options.headers ?? {};
    this.credentials = options.credentials;
    if (!this.fetcher) throw new Error("No fetch implementation available");
  }

  async request<T = JsonValue>(method: string, path: string, options: {
    body?: JsonValue;
    headers?: Record<string, string>;
    query?: Record<string, string | number | boolean | undefined>;
    timeoutMs?: number;
    token?: TokenProvider;
  } = {}): Promise<T> {
    const url = new URL(this.baseUrl + path);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const token = await resolveToken(options.token ?? this.token);
    const headers: Record<string, string> = { "Accept": "application/json", ...this.headers, ...(options.headers ?? {}) };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetchWithTimeout(this.fetcher, url.toString(), {
      method,
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      ...(this.credentials ? { credentials: this.credentials } : {})
    }, options.timeoutMs ?? this.timeoutMs);

    const text = await response.text();
    if (!response.ok) throw classifyHttpError(response.status, text || `HTTP ${response.status}`);
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch (error) {
      throw new TruNetworkError("HTTP endpoint returned invalid JSON", { cause: error });
    }
  }
}
