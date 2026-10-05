import type { JsonObject, JsonValue } from "../types.js";
import { RpcModule } from "./base.js";

export class ChainModule extends RpcModule {
  getChainInfo<T = JsonValue>(): Promise<T> { return this.call<T>("getchaininfo"); }
  getBlockCount<T = JsonValue>(): Promise<T> { return this.call<T>("getblockcount"); }
  getBlock<T = JsonValue>(hash: string): Promise<T> { return this.call<T>("getblock", { hash }); }
  getBlockByHeight<T = JsonValue>(height: number): Promise<T> { return this.call<T>("getblockbyheight", { height }); }
  getBlockTemplate<T = JsonValue>(params: JsonObject = {}): Promise<T> { return this.call<T>("getblocktemplate", params); }
  submitBlock<T = JsonValue>(params: { blockHex?: string; browserCandidate?: JsonValue; nonce?: number }): Promise<T> {
    return this.call<T>("submitblock", params as JsonObject);
  }
}
