import { HttpTransport } from "./transport.js";
import type { HttpClientOptions, JsonValue } from "./types.js";

export class ExplorerClient {
  readonly http: HttpTransport;
  constructor(options: HttpClientOptions | string) {
    this.http = new HttpTransport(typeof options === "string" ? { baseUrl: options } : options);
  }

  stats<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/stats"); }
  blocks<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/blocks"); }
  block<T = JsonValue>(hash: string): Promise<T> { return this.http.request<T>("GET", `/block/${encodeURIComponent(hash)}`); }
  addresses<T = JsonValue>(query: { limit?: number; search?: string; sort?: string; start?: number } = {}): Promise<T> {
    return this.http.request<T>("GET", "/api/addresses", { query });
  }
  address<T = JsonValue>(address: string): Promise<T> { return this.http.request<T>("GET", `/api/address/${encodeURIComponent(address)}`); }
  transactions<T = JsonValue>(query: { address?: string; limit?: number; start?: number } = {}): Promise<T> {
    return this.http.request<T>("GET", "/api/transactions", { query });
  }
  transaction<T = JsonValue>(txid: string): Promise<T> { return this.http.request<T>("GET", `/api/transaction/${encodeURIComponent(txid)}`); }
  tokenBurn<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/token-burn"); }
  tokens<T = JsonValue>(query: { address?: string; limit?: number; start?: number } = {}): Promise<T> { return this.http.request<T>("GET", "/api/tokens", { query }); }
  contracts<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/contracts"); }
  contractTransactions<T = JsonValue>(address: string): Promise<T> { return this.http.request<T>("GET", `/api/contracts/${encodeURIComponent(address)}/txs`); }
  minerReports<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/miner-reports"); }
  miners<T = JsonValue>(query: { timeout?: number; recent?: number } = {}): Promise<T> { return this.http.request<T>("GET", "/api/miners", { query }); }
  hashrateHistory<T = JsonValue>(blocks?: number): Promise<T> { return this.http.request<T>("GET", "/api/hashrate_history", { query: { blocks } }); }
  difficultyHistory<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/difficulty_history"); }
  truScripts<T = JsonValue>(query: { limit?: number; page?: number } = {}): Promise<T> { return this.http.request<T>("GET", "/api/truscripts", { query }); }
  truScript<T = JsonValue>(id: string): Promise<T> { return this.http.request<T>("GET", `/api/truscripts/${encodeURIComponent(id)}`); }
  uptime<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/uptime"); }
  peers<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/peers"); }
  peer<T = JsonValue>(ip: string, port: number, session?: string): Promise<T> { return this.http.request<T>("GET", `/api/peer/${encodeURIComponent(ip)}/${port}`, { query: { session } }); }
  did<T = JsonValue>(did: string): Promise<T> { return this.http.request<T>("GET", `/api/did/${encodeURIComponent(did)}`); }
  didPostCount<T = JsonValue>(did: string): Promise<T> { return this.http.request<T>("GET", `/api/did/${encodeURIComponent(did)}/posts/count`); }
  feed<T = JsonValue>(did: string): Promise<T> { return this.http.request<T>("GET", `/api/feed/${encodeURIComponent(did)}`); }
  walletTokens<T = JsonValue>(address: string): Promise<T> { return this.http.request<T>("GET", `/api/wallet/tokens/${encodeURIComponent(address)}`); }
  walletTokenTransactions<T = JsonValue>(address: string): Promise<T> { return this.http.request<T>("GET", `/api/wallet/token-transactions/${encodeURIComponent(address)}`); }
  price<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/price/tru"); }
  hashrate<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/hashrate"); }
}
