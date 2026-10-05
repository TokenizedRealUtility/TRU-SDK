import type { JsonObject, JsonValue } from "../types.js";
import { RpcModule } from "./base.js";

export class AiModule extends RpcModule {
  configureProvider<T = JsonValue>(params: { provider: string; endpoint?: string; model?: string; api_key?: string; address?: string; config?: JsonValue }): Promise<T> {
    return this.call<T>("configureAIProvider", params as JsonObject);
  }
  providers<T = JsonValue>(): Promise<T> { return this.call<T>("getAIProviders"); }
  testProvider<T = JsonValue>(provider: string): Promise<T> { return this.call<T>("testAIProvider", { provider }); }
  createToken<T = JsonValue>(params: JsonObject): Promise<T> { return this.call<T>("createAIToken", params); }
  interact<T = JsonValue>(tokenID: string, address: string, message: string): Promise<T> {
    return this.call<T>("interactWithAIToken", { tokenID, address, message });
  }
  response<T = JsonValue>(requestID: string): Promise<T> { return this.call<T>("getAIResponse", { requestID }); }
  tokenState<T = JsonValue>(tokenID: string): Promise<T> { return this.call<T>("getAITokenState", { tokenID }); }
  train<T = JsonValue>(tokenID: string, address: string, training_data: JsonValue): Promise<T> {
    return this.call<T>("trainAIToken", { tokenID, address, training_data });
  }
}
