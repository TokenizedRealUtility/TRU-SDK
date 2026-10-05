import type { JsonObject, JsonValue, RpcCallOptions } from "../types.js";
import { RpcTransport } from "../transport.js";

export abstract class RpcModule {
  protected readonly rpc: RpcTransport;
  constructor(rpc: RpcTransport) { this.rpc = rpc; }
  protected call<T = JsonValue>(method: string, params: JsonObject = {}, options?: RpcCallOptions): Promise<T> {
    return this.rpc.call<T>(method, params, options);
  }
}
