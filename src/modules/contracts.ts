import type { JsonObject, JsonValue } from "../types.js";
import { RpcModule } from "./base.js";

export class ContractsModule extends RpcModule {
  createTransaction<T = JsonValue>(params: JsonObject): Promise<T> { return this.call<T>("createcontracttransaction", params); }
  list<T = JsonValue>(): Promise<T> { return this.call<T>("getcontracts"); }
  redeemHashLock<T = JsonValue>(contractAddress: string, address: string, preimage: string): Promise<T> {
    return this.call<T>("redeemhashlock", { contractAddress, address, preimage });
  }
  redeemTimeLock<T = JsonValue>(contractAddress: string, address: string): Promise<T> {
    return this.call<T>("redeemtimelock", { contractAddress, address });
  }
  getOutpoint07b<T = JsonValue>(txid: string, vout: number): Promise<T> { return this.call<T>("getcontractoutpoint07b", { txid, vout }); }
  getVotingSnapshot07b<T = JsonValue>(params: JsonObject = {}): Promise<T> { return this.call<T>("getvotingv1snapshot07b", params); }
  prepareVotingCreate07b<T = JsonValue>(params: JsonObject = {}): Promise<T> { return this.call<T>("preparevotingv1create07b", params); }
  prepareVotingBallot07b<T = JsonValue>(params: JsonObject = {}): Promise<T> { return this.call<T>("preparevotingv1ballot07b", params); }
}
