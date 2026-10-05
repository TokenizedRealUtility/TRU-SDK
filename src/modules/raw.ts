import type { JsonObject, JsonValue, RpcCallOptions } from "../types.js";
import { RpcTransport } from "../transport.js";

export class RawRpcModule {
  constructor(private readonly rpc: RpcTransport) {}
  call<T = JsonValue>(method: string, params: JsonObject = {}, options?: RpcCallOptions): Promise<T> {
    return this.rpc.call<T>(method, params, options);
  }
}
