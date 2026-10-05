import type { JsonValue } from "../types.js";
import { RpcModule } from "./base.js";
export class NetworkModule extends RpcModule {
  getPeers<T = JsonValue>(): Promise<T> { return this.call<T>("getpeerinfo"); }
}
