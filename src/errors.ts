import type { JsonValue, RpcErrorShape } from "./types.js";

export class TruError extends Error {
  readonly code?: number | string;
  readonly data?: JsonValue;
  readonly status?: number;
  readonly causeValue?: unknown;

  constructor(message: string, options: { code?: number | string; data?: JsonValue; status?: number; cause?: unknown } = {}) {
    super(message);
    this.name = new.target.name;
    if (options.code !== undefined) this.code = options.code;
    if (options.data !== undefined) this.data = options.data;
    if (options.status !== undefined) this.status = options.status;
    if (options.cause !== undefined) this.causeValue = options.cause;
  }
}

export class TruRpcError extends TruError {}
export class TruHttpError extends TruError {}
export class TruAuthError extends TruError {}
export class TruNodeBusyError extends TruError {}
export class TruTimeoutError extends TruError {}
export class TruNetworkError extends TruError {}
export class TruInvalidAddressError extends TruError {}
export class TruInsufficientFundsError extends TruError {}
export class TruTokenNotFoundError extends TruError {}
export class TruTransactionRejectedError extends TruError {}
export class TruContractExecutionError extends TruError {}

export function classifyRpcError(error: RpcErrorShape): TruError {
  const m = error.message.toLowerCase();
  const common = { code: error.code, data: error.data };

  if (m.includes("busy") || m.includes("retry") || m.includes("rate limit")) {
    return new TruNodeBusyError(error.message, common);
  }
  if (m.includes("insufficient") || m.includes("not enough") || m.includes("balance")) {
    return new TruInsufficientFundsError(error.message, common);
  }
  if (m.includes("invalid address") || m.includes("address invalid")) {
    return new TruInvalidAddressError(error.message, common);
  }
  if (m.includes("token") && (m.includes("not found") || m.includes("metadata not found"))) {
    return new TruTokenNotFoundError(error.message, common);
  }
  if (m.includes("contract") && (m.includes("failed") || m.includes("execution"))) {
    return new TruContractExecutionError(error.message, common);
  }
  if (m.includes("reject") || m.includes("invalid transaction") || m.includes("mempool")) {
    return new TruTransactionRejectedError(error.message, common);
  }
  return new TruRpcError(error.message, common);
}

export function classifyHttpError(status: number, message: string): TruError {
  if (status === 401 || status === 403) return new TruAuthError(message, { status });
  if (status === 429 || status === 503) return new TruNodeBusyError(message, { status });
  return new TruHttpError(message, { status });
}
