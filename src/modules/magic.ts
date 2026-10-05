import type { JsonObject, JsonValue } from "../types.js";
import { RpcModule } from "./base.js";

export class MagicLocksModule extends RpcModule {
  prepareSecret<T = JsonValue>(params: JsonObject = {}): Promise<T> { return this.call<T>("preparemagicsecret", params); }
  getSecret<T = JsonValue>(params: JsonObject = {}): Promise<T> { return this.call<T>("getmagicsecret", params); }
  publishSecret<T = JsonValue>(params: JsonObject = {}): Promise<T> { return this.call<T>("publishmagicsecret", params); }
  create<T = JsonValue>(params: { amount: string | number; targetPrefix: string; address?: string; dataType?: string; secretData?: string }): Promise<T> {
    return this.call<T>("createmagiclock", params as JsonObject);
  }
  unlock<T = JsonValue>(txid: string, vout: number, recipient: string): Promise<T> {
    return this.call<T>("unlockmagiclock", { txid, vout, recipient });
  }
  list<T = JsonValue>(address?: string): Promise<T> { return this.call<T>("listmagiclocks", address ? { address } : {}); }
}
