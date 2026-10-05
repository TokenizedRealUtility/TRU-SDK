export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type TokenProvider = string | (() => string | Promise<string>);
export type FetchLike = typeof fetch;

export interface RpcTransportOptions {
  endpoint: string;
  token?: TokenProvider;
  timeoutMs?: number;
  fetch?: FetchLike;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

export interface RpcCallOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export interface HttpClientOptions {
  baseUrl: string;
  token?: TokenProvider;
  timeoutMs?: number;
  fetch?: FetchLike;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

export interface RpcErrorShape {
  code: number;
  message: string;
  data?: JsonValue;
}

export interface RpcEnvelope<T> {
  jsonrpc?: string;
  id?: number | string | null;
  result?: T;
  error?: RpcErrorShape;
}

export interface CompatibilityResult {
  sdkVersion: string;
  minimumCoreVersion: string;
  detectedCoreVersion?: string;
  compatible: boolean | "unknown";
  source: "getinfo" | "getdesktopinfo" | "unavailable";
  details?: JsonValue;
}

export type GatewayKind = "privileged" | "wallet" | "mining";

export interface RpcMethodDescriptor {
  method: string;
  category: string;
  gateway: GatewayKind[];
  params: readonly string[];
}

export interface BlockEvent {
  height: number;
  block: JsonValue;
}

export interface PollingOptions {
  intervalMs?: number;
  emitExistingTip?: boolean;
  signal?: AbortSignal;
}
