import { HttpTransport } from "./transport.js";
import type { HttpClientOptions, JsonObject, JsonValue, TokenProvider } from "./types.js";

export interface NeromeshOptions extends HttpClientOptions {
  customerToken?: TokenProvider;
  workerToken?: TokenProvider;
  workerAccountKey?: TokenProvider;
}

export class NeromeshClient {
  readonly http: HttpTransport;
  readonly customerToken?: TokenProvider;
  readonly workerToken?: TokenProvider;
  readonly workerAccountKey?: TokenProvider;

  constructor(options: NeromeshOptions | string) {
    const normalized: NeromeshOptions = typeof options === "string" ? { baseUrl: options } : options;
    this.http = new HttpTransport(normalized);
    this.customerToken = normalized.customerToken;
    this.workerToken = normalized.workerToken;
    this.workerAccountKey = normalized.workerAccountKey;
  }

  health<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/health"); }
  stats<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/stats"); }

  // Legacy/direct customer job API. Public marketplace deployments may disable writes here.
  submitJob<T = JsonValue>(body: JsonObject, idempotencyKey: string): Promise<T> {
    return this.http.request<T>("POST", "/api/v1/jobs", {
      token: this.customerToken,
      headers: { "Idempotency-Key": idempotencyKey },
      body
    });
  }
  jobs<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/v1/jobs", { token: this.customerToken }); }
  job<T = JsonValue>(id: string): Promise<T> { return this.http.request<T>("GET", `/api/v1/jobs/${encodeURIComponent(id)}`, { token: this.customerToken }); }
  cancelJob<T = JsonValue>(id: string): Promise<T> { return this.http.request<T>("POST", `/api/v1/jobs/${encodeURIComponent(id)}/cancel`, { token: this.customerToken, body: {} }); }

  // AXON Marketplace customer surface.
  createOffer<T = JsonValue>(body: JsonObject): Promise<T> {
    return this.http.request<T>("POST", "/api/v1/market/offers", { token: this.customerToken, body });
  }
  myOffers<T = JsonValue>(): Promise<T> {
    return this.http.request<T>("GET", "/api/v1/market/offers/mine", { token: this.customerToken });
  }
  fundingPlan<T = JsonValue>(jobId: string, refundPubkey: string, refundTime: number): Promise<T> {
    return this.http.request<T>("POST", `/api/v1/market/offers/${encodeURIComponent(jobId)}/funding-plan`, {
      token: this.customerToken,
      body: { refund_pubkey: refundPubkey, refund_time: refundTime }
    });
  }
  registerFunding<T = JsonValue>(jobId: string, body: { compute_txid: string; compute_vout: number; acceptance_txid: string; acceptance_vout: number }): Promise<T> {
    return this.http.request<T>("POST", `/api/v1/market/offers/${encodeURIComponent(jobId)}/funding`, { token: this.customerToken, body });
  }
  createWalletIntent<T = JsonValue>(jobId: string): Promise<T> {
    return this.http.request<T>("POST", `/api/v1/market/offers/${encodeURIComponent(jobId)}/wallet-intent`, { token: this.customerToken, body: {} });
  }
  getWalletIntent<T = JsonValue>(intentId: string, capability: TokenProvider): Promise<T> {
    return this.http.request<T>("GET", `/api/v1/market/wallet-intents/${encodeURIComponent(intentId)}`, { token: capability });
  }
  prepareWalletIntent<T = JsonValue>(intentId: string, capability: TokenProvider, body: JsonObject): Promise<T> {
    return this.http.request<T>("POST", `/api/v1/market/wallet-intents/${encodeURIComponent(intentId)}/prepare`, { token: capability, body });
  }
  submitWalletFunding<T = JsonValue>(intentId: string, capability: TokenProvider, body: JsonObject): Promise<T> {
    return this.http.request<T>("POST", `/api/v1/market/wallet-intents/${encodeURIComponent(intentId)}/funding`, { token: capability, body });
  }

  // Worker API used by standalone workers.
  enrollWorker<T = JsonValue>(invitation: TokenProvider, body: JsonObject): Promise<T> {
    return this.http.request<T>("POST", "/api/v1/worker/enroll", { token: invitation, body });
  }
  workerSelf<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/v1/worker/self", { token: this.workerToken }); }
  workerHeartbeat<T = JsonValue>(paused: boolean, hardware: string): Promise<T> {
    return this.http.request<T>("POST", "/api/v1/worker/heartbeat", { token: this.workerToken, body: { paused, hardware } });
  }
  workerLease<T = JsonValue>(): Promise<T> { return this.http.request<T>("POST", "/api/v1/worker/lease", { token: this.workerToken, body: {} }); }
  workerResult<T = JsonValue>(body: JsonObject): Promise<T> { return this.http.request<T>("POST", "/api/v1/worker/result", { token: this.workerToken, body }); }
  workerFail<T = JsonValue>(body: JsonObject): Promise<T> { return this.http.request<T>("POST", "/api/v1/worker/fail", { token: this.workerToken, body }); }

  // Portal/session API. Use credentials:'include' in NeromeshOptions in browsers.
  customerLogin<T = JsonValue>(customerToken: string): Promise<T> {
    return this.http.request<T>("POST", "/api/v1/portal/customer/login", { body: { customer_token: customerToken } });
  }
  workerLogin<T = JsonValue>(workerKey: string): Promise<T> {
    return this.http.request<T>("POST", "/api/v1/portal/worker/login", { body: { worker_key: workerKey } });
  }
  logout<T = JsonValue>(): Promise<T> { return this.http.request<T>("POST", "/api/v1/portal/logout", { body: {} }); }
  session<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/v1/portal/session"); }
  portalCustomerJobs<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/v1/portal/customer/jobs"); }
  portalCustomerJob<T = JsonValue>(jobId: string): Promise<T> { return this.http.request<T>("GET", `/api/v1/portal/customer/jobs/${encodeURIComponent(jobId)}`); }
  portalCustomerHandoff<T = JsonValue>(jobId: string): Promise<T> { return this.http.request<T>("POST", `/api/v1/portal/customer/jobs/${encodeURIComponent(jobId)}/handoff`, { body: {} }); }
  portalCustomerAccept<T = JsonValue>(jobId: string, body: JsonObject = {}): Promise<T> { return this.http.request<T>("POST", `/api/v1/portal/customer/jobs/${encodeURIComponent(jobId)}/accept`, { body }); }
  portalCustomerReject<T = JsonValue>(jobId: string, body: JsonObject = {}): Promise<T> { return this.http.request<T>("POST", `/api/v1/portal/customer/jobs/${encodeURIComponent(jobId)}/reject`, { body }); }
  portalWorkerOffers<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/v1/portal/worker/offers"); }
  portalWorkerJobs<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/v1/portal/worker/jobs"); }
  portalWorkerJob<T = JsonValue>(jobId: string): Promise<T> { return this.http.request<T>("GET", `/api/v1/portal/worker/jobs/${encodeURIComponent(jobId)}`); }
  portalWorkerAccept<T = JsonValue>(jobId: string, body: JsonObject = {}): Promise<T> { return this.http.request<T>("POST", `/api/v1/portal/worker/jobs/${encodeURIComponent(jobId)}/accept`, { body }); }
  portalWorkerDecline<T = JsonValue>(jobId: string, body: JsonObject = {}): Promise<T> { return this.http.request<T>("POST", `/api/v1/portal/worker/jobs/${encodeURIComponent(jobId)}/decline`, { body }); }
  portalWorkerSettlement<T = JsonValue>(jobId: string): Promise<T> { return this.http.request<T>("GET", `/api/v1/portal/worker/jobs/${encodeURIComponent(jobId)}/settlement`); }
  networkWorkers<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/v1/network/workers"); }
  networkSummary<T = JsonValue>(): Promise<T> { return this.http.request<T>("GET", "/api/v1/network/summary"); }

  raw<T = JsonValue>(method: string, path: string, body?: JsonValue, token?: TokenProvider): Promise<T> {
    return this.http.request<T>(method, path, { ...(body === undefined ? {} : { body }), ...(token ? { token } : {}) });
  }
}
