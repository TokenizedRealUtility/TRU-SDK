import type { JsonObject, JsonValue } from "../types.js";
import { RpcModule } from "./base.js";

export class TransactionsModule extends RpcModule {
  getMempoolTransactions<T = JsonValue>(): Promise<T> { return this.call<T>("getmempooltransactions"); }
  getRawMempool<T = JsonValue>(verbose = false): Promise<T> { return this.call<T>("getrawmempool", { verbose }); }
  listMempoolTransactions<T = JsonValue>(): Promise<T> { return this.call<T>("listmempooltransactions"); }
  createRawTransaction<T = JsonValue>(inputs: JsonValue[], outputs: JsonValue): Promise<T> {
    return this.call<T>("createrawtransaction", { inputs, outputs } as JsonObject);
  }
  signRawTransactionWithKey<T = JsonValue>(txHex: string, privKeys: string[]): Promise<T> {
    return this.call<T>("signrawtransactionwithkey", { txHex, privKeys } as unknown as JsonObject);
  }
  signRawTransactionWithKeyWeb<T = JsonValue>(txHex: string, privKeys: string[]): Promise<T> {
    return this.call<T>("signrawtransactionwithkeyWeb", { txHex, privKeys } as unknown as JsonObject);
  }
  sendRawTransaction<T = JsonValue>(txHex: string): Promise<T> { return this.call<T>("sendrawtransaction", { txHex }); }
  sendRawTransactionWeb<T = JsonValue>(txHex: string): Promise<T> { return this.call<T>("sendrawtransactionWeb", { txHex }); }
  decodeRawTransaction<T = JsonValue>(txHex: string): Promise<T> { return this.call<T>("decoderawtransaction", { txHex }); }
  getTransaction<T = JsonValue>(txid: string): Promise<T> { return this.call<T>("gettransaction", { txid }); }
  getRawTransaction<T = JsonValue>(txid: string, verbose = true): Promise<T> { return this.call<T>("getrawtransaction", { txid, verbose }); }
  getTxOut<T = JsonValue>(txid: string, n: number, includeMempool = true): Promise<T> {
    return this.call<T>("gettxout", { txid, n, includeMempool });
  }
  listTransactions<T = JsonValue>(params: { address?: string; count?: number } = {}): Promise<T> {
    return this.call<T>("listtransactions", params as JsonObject);
  }
  getAddressTransactions<T = JsonValue>(address: string, count = 100): Promise<T> {
    return this.call<T>("getaddresstransactions", { address, count });
  }
}
