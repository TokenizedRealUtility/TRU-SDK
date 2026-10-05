import type { JsonObject, JsonValue } from "../types.js";
import { RpcModule } from "./base.js";

export class HtlcModule extends RpcModule {
  generateSecret<T = JsonValue>(): Promise<T> { return this.call<T>("htlcgeneratesecret"); }
  prepareFunding<T = JsonValue>(params: { amountAtoms: string | number; claimPubkey: string; refundPubkey: string; refundTime: number; secretHash160: string; operationId: string }): Promise<T> {
    return this.call<T>("htlcpreparefunding", params as JsonObject);
  }
  preparedStatus<T = JsonValue>(operationId: string): Promise<T> { return this.call<T>("htlcpreparedstatus", { operationId }); }
  preparedRelease<T = JsonValue>(operationId: string, preparedTxid: string): Promise<T> { return this.call<T>("htlcpreparedrelease", { operationId, preparedTxid }); }
  broadcastPrepared<T = JsonValue>(operationId: string, preparedTxid: string, dryRun = false): Promise<T> {
    return this.call<T>("htlcbroadcastprepared", { operationId, preparedTxid, dryRun });
  }
  create<T = JsonValue>(params: { amountAtoms: string | number; claimPubkey: string; refundPubkey: string; refundTime: number; secretHash160: string }): Promise<T> {
    return this.call<T>("htlccreate", params as JsonObject);
  }
  claim<T = JsonValue>(params: { allocationId?: string; fundingTxid: string; preimageHex: string; recipient: string; vout: number }): Promise<T> {
    return this.call<T>("htlcclaim", params as JsonObject);
  }
  refund<T = JsonValue>(params: { allocationId?: string; fundingTxid: string; recipient: string; vout: number }): Promise<T> {
    return this.call<T>("htlcrefund", params as JsonObject);
  }
  testExitMempoolAccept<T = JsonValue>(params: { expectedTxid?: string; fundingTxid: string; fundingVout: number; txHex: string }): Promise<T> {
    return this.call<T>("swaptestexitmempoolaccept", params as JsonObject);
  }
}
