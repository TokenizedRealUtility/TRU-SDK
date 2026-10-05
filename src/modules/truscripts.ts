import type { JsonObject, JsonValue } from "../types.js";
import { RpcModule } from "./base.js";

export class TruScriptsModule extends RpcModule {
  inscribe<T = JsonValue>(owner: string, data: JsonValue): Promise<T> { return this.call<T>("inscribeTRUScript", { owner, data }); }
  inscribeSigned<T = JsonValue>(params: { owner: string; signedTxHex: string; inscriptionData: JsonValue; requireBoundOpReturn?: boolean }): Promise<T> {
    return this.call<T>("inscribeTRUScriptSigned", params as JsonObject);
  }
  list<T = JsonValue>(ownerAddress?: string): Promise<T> { return this.call<T>("getTRUScripts", ownerAddress ? { ownerAddress } : {}); }
  details<T = JsonValue>(txid: string): Promise<T> { return this.call<T>("getTRUScriptDetails", { txid }); }
  transfer<T = JsonValue>(inscriptionTxid: string, recipient: string): Promise<T> { return this.call<T>("transferTRUScript", { inscriptionTxid, recipient }); }
  createTransferTransaction<T = JsonValue>(params: { inscriptionTxid: string; recipient: string; senderAddress: string; fee?: JsonValue; feeUtxo?: JsonValue }): Promise<T> {
    return this.call<T>("createTransferTRUScriptTransaction", params as JsonObject);
  }
}
