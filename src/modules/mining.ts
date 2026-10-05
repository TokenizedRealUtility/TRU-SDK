import type { JsonObject, JsonValue } from "../types.js";
import { RpcModule } from "./base.js";

export class MiningModule extends RpcModule {
  start<T = JsonValue>(minerAddress: string, options: { quiet?: boolean; type?: string } = {}): Promise<T> {
    return this.call<T>("startmining", { minerAddress, ...options });
  }
  register<T = JsonValue>(minerAddress: string): Promise<T> { return this.call<T>("registerminer", { minerAddress }); }
  unregister<T = JsonValue>(minerAddress: string): Promise<T> { return this.call<T>("unregisterminer", { minerAddress }); }
  status<T = JsonValue>(minerAddress: string): Promise<T> { return this.call<T>("getminerstatus", { minerAddress }); }
  all<T = JsonValue>(): Promise<T> { return this.call<T>("getallminers"); }
  reportActivity<T = JsonValue>(minerAddress: string, hashesTried: number, timeTaken: number): Promise<T> {
    return this.call<T>("reportmineractivity", { minerAddress, hashesTried, timeTaken });
  }
  getTemplate<T = JsonValue>(browserMinerAddress?: string, browserExtraNonce?: number): Promise<T> {
    const p: JsonObject = {};
    if (browserMinerAddress) p.browserMinerAddress = browserMinerAddress;
    if (browserExtraNonce !== undefined) p.browserExtraNonce = browserExtraNonce;
    return this.call<T>("getblocktemplate", p);
  }
  submit<T = JsonValue>(params: JsonObject): Promise<T> { return this.call<T>("submitblock", params); }
}
