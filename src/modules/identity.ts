import type { JsonValue } from "../types.js";
import { RpcModule } from "./base.js";

export class IdentityModule extends RpcModule {
  createDid<T = JsonValue>(did: string, address: string): Promise<T> { return this.call<T>("createDID", { did, address }); }
  getDid<T = JsonValue>(did: string): Promise<T> { return this.call<T>("getDIDMapping", { did }); }
  registerDidSigned<T = JsonValue>(did: string, address: string, publicKey: string, signature: string): Promise<T> {
    return this.call<T>("registerDIDSigned", { did, address, publicKey, signature });
  }
  createSocialPost<T = JsonValue>(fromDID: string, message: string, privateKey: string, tags?: string[]): Promise<T> {
    const p: Record<string, JsonValue> = { fromDID, message, privateKey };
    if (tags) p.tags = tags;
    return this.call<T>("createsocialpost", p);
  }
}
