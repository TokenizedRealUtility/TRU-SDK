import type { JsonObject, JsonValue } from "../types.js";
import { RpcModule } from "./base.js";

export interface IssueTokenParams {
  address?: string;
  decimals?: number;
  description?: string;
  image?: string;
  name?: string;
  supply?: string | number;
  symbol?: string;
  tokenID?: string;
  type?: "FT" | "NFT" | "SFT" | "NCFT" | string;
  [key: string]: JsonValue | undefined;
}

export class TokensModule extends RpcModule {
  issue<T = JsonValue>(params: IssueTokenParams): Promise<T> { return this.call<T>("issuetoken", params as JsonObject); }
  issueSigned<T = JsonValue>(signedTxHex: string, metadata?: JsonValue, attachMetadata = true): Promise<T> {
    const p: JsonObject = { signedTxHex, attachMetadata };
    if (metadata !== undefined) p.metadata = metadata;
    return this.call<T>("issuetokensigned", p);
  }
  send<T = JsonValue>(tokenID: string, recipient: string, amount: string | number, senderAddress?: string): Promise<T> {
    const p: JsonObject = { tokenID, recipient, amount };
    if (senderAddress) p.senderAddress = senderAddress;
    return this.call<T>("sendtoken", p);
  }
  sendWeb<T = JsonValue>(tokenID: string, recipient: string, amount: string | number, senderAddress?: string): Promise<T> {
    const p: JsonObject = { tokenID, recipient, amount };
    if (senderAddress) p.senderAddress = senderAddress;
    return this.call<T>("sendtokenweb", p);
  }
  burn<T = JsonValue>(tokenID: string, senderAddress?: string, confirm = false): Promise<T> {
    const p: JsonObject = { tokenID, confirm };
    if (senderAddress) p.senderAddress = senderAddress;
    return this.call<T>("burntoken", p);
  }
  burnInfo<T = JsonValue>(): Promise<T> { return this.call<T>("gettokenburninfo"); }
  getUtxo<T = JsonValue>(params: { tokenID?: string; address?: string; txid?: string; vout?: number }): Promise<T> {
    return this.call<T>("gettokenutxo", params as JsonObject);
  }
  metadata<T = JsonValue>(txid: string): Promise<T> { return this.call<T>("gettokenmetadata", { txid }); }
  verifyMetadata<T = JsonValue>(txid: string): Promise<T> { return this.call<T>("verifytokenmetadata", { txid }); }
  verifyBalance<T = JsonValue>(tokenID: string, address: string): Promise<T> { return this.call<T>("verifytokenbalance", { tokenID, address }); }
  metaDisplay<T = JsonValue>(addresses: string[]): Promise<T> { return this.call<T>("tokenmetadisplay", { addresses } as unknown as JsonObject); }
  debugTransaction<T = JsonValue>(txid: string): Promise<T> { return this.call<T>("debugtokentx", { txid }); }
  createTransaction<T = JsonValue>(params: JsonObject): Promise<T> { return this.call<T>("createtokentransaction", params); }
  createSendTransaction<T = JsonValue>(params: { tokenID: string; senderAddress: string; recipient: string; amount: string | number; fee?: JsonValue; feeUtxo?: JsonValue }): Promise<T> {
    return this.call<T>("createsendtokentransaction", params as JsonObject);
  }
  createBurnTransaction<T = JsonValue>(params: { tokenID: string; senderAddress: string; fee?: JsonValue; feeUtxo?: JsonValue }): Promise<T> {
    return this.call<T>("createburntokentransaction", params as JsonObject);
  }
  verifyEvolution<T = JsonValue>(tokenID: string, requireConfirmed = true): Promise<T> {
    return this.call<T>("verifytokenevolution", { tokenID, require_confirmed: requireConfirmed });
  }
  previewEvolution<T = JsonValue>(params: { tokenID: string; owner?: string; provider?: string; trigger?: string; media_inputs?: JsonValue }): Promise<T> {
    return this.call<T>("previewtokenevolution", params as JsonObject);
  }
  commitEvolutionSigned<T = JsonValue>(params: { tokenID: string; owner: string; publicKey: string; record_json: JsonValue; signature: string; confirmation?: string }): Promise<T> {
    return this.call<T>("committokenevolutionsigned", params as JsonObject);
  }
}
