import type { JsonObject, JsonValue } from "../types.js";
import { RpcModule } from "./base.js";

export class WalletModule extends RpcModule {
  getNewAddress<T = JsonValue>(): Promise<T> { return this.call<T>("getnewaddress"); }
  listAddresses<T = JsonValue>(): Promise<T> { return this.call<T>("listaddresses"); }
  getBalance<T = JsonValue>(address?: string): Promise<T> { return this.call<T>("getbalance", address ? { address } : {}); }
  listUnspent<T = JsonValue>(address?: string): Promise<T> { return this.call<T>("listunspent", address ? { address } : {}); }
  listUnspentWeb<T = JsonValue>(address: string): Promise<T> { return this.call<T>("listunspentWeb", { address }); }
  sendToAddress<T = JsonValue>(address: string, amount: string | number, extra: JsonObject = {}): Promise<T> {
    return this.call<T>("sendtoaddress", { address, amount, ...extra });
  }
  axonWalletInspect<T = JsonValue>(uri: string): Promise<T> { return this.call<T>("axonwalletinspect", { uri }); }
  axonWalletFund<T = JsonValue>(params: { uri: string; confirm?: string; expected_intent_sha256?: string; expected_job_id?: string }): Promise<T> {
    return this.call<T>("axonwalletfund", params as JsonObject);
  }
}
