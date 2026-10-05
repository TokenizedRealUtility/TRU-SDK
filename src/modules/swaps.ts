import type { JsonObject, JsonValue } from "../types.js";
import { RpcModule } from "./base.js";

export class SwapsModule extends RpcModule {
  recordCreate<T = JsonValue>(params: JsonObject = {}): Promise<T> { return this.call<T>("swaprecordcreate", params); }
  recordGet<T = JsonValue>(swapId: string): Promise<T> { return this.call<T>("swaprecordget", { swapId }); }
  recordList<T = JsonValue>(): Promise<T> { return this.call<T>("swaprecordlist"); }
  recordTransition<T = JsonValue>(swapId: string, nextState: string, evidence?: JsonValue): Promise<T> {
    const p: JsonObject = { swapId, nextState };
    if (evidence !== undefined) p.evidence = evidence;
    return this.call<T>("swaprecordtransition", p);
  }
  freshKeys<T = JsonValue>(allocationId: string): Promise<T> { return this.call<T>("swapwalletfreshkeys", { allocationId }); }
  freshSelfProof<T = JsonValue>(allocationId: string, role: string): Promise<T> { return this.call<T>("swapwalletfreshselfproof", { allocationId, role }); }
  roleKeys<T = JsonValue>(): Promise<T> { return this.call<T>("swapwalletrolekeys"); }
}
