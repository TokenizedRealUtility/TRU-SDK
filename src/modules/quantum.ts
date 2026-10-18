import type { JsonObject, JsonValue } from '../types.js';
import { RpcTransport } from '../transport.js';

export interface QuantumOutpoint { txid: string; vout: number }
export interface QuantumFunding extends QuantumOutpoint { fee_atoms: number; destination: string }
export interface QuantumSpend extends QuantumFunding { source: string }
export interface QuantumExit extends QuantumSpend { confirm_exit: true }
export interface QuantumConsensusInfo {
  activation_height: number | null;
  candidate_height: number;
  active: boolean;
  core_version: string;
  [key: string]: JsonValue;
}

/** Core-backed wallet adapter, NOT a JavaScript WOTS implementation.
 * Core owns keys, reservations, signing and authoritative validation.
 * Mutations are never automatically retried or automatically broadcast.
 */
export class QuantumModule {
  constructor(private readonly rpc: RpcTransport) {}

  consensus(): Promise<QuantumConsensusInfo> {
    return this.rpc.call<QuantumConsensusInfo>('getconsensus09info', {}, { retries: 0 });
  }

  private local(): void {
    if (typeof window !== 'undefined') throw new Error('Quantum Core wallet requires a local Node.js process; never expose Core credentials to a browser');
    const u = new URL(this.rpc.endpoint);
    if (!['http:', 'https:'].includes(u.protocol) ||
        !['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname) ||
        u.pathname !== '/rpc' || u.username || u.password || u.search || u.hash) {
      throw new Error('Quantum wallet requires a direct loopback /rpc endpoint');
    }
  }

  private async active(): Promise<void> {
    this.local();
    const state = await this.consensus();
    if (state.active !== true) throw new Error(`PQ01 inactive: candidate ${state.candidate_height}, activation ${state.activation_height}`);
  }

  private outpoint(p: QuantumOutpoint): void {
    if (!/^[0-9a-fA-F]{64}$/.test(p.txid) || !Number.isSafeInteger(p.vout) || p.vout < 0 || p.vout > 0xffffffff)
      throw new Error('Expected a 64-hex txid and uint32 vout');
  }

  private funding(p: QuantumFunding): void {
    this.outpoint(p);
    if (!Number.isSafeInteger(p.fee_atoms) || p.fee_atoms < 10000) throw new Error('fee_atoms must be a safe integer >= 10000; Core also checks policy fees');
    if (typeof p.destination !== 'string' || !p.destination) throw new Error('destination required');
  }

  private wallet<T = JsonValue>(action: string, params: JsonObject = {}): Promise<T> {
    this.local();
    return this.rpc.call<T>('quantumwallet', { ...params, action }, { retries: 0 });
  }

  receive<T = JsonValue>(): Promise<T> { return this.wallet<T>('receive'); }
  list<T = JsonValue>(): Promise<T> { return this.wallet<T>('list'); }
  retry<T = JsonValue>(source: string): Promise<T> {
    if (!source) throw new Error('source required');
    return this.wallet<T>('retry', { source });
  }
  async input<T = JsonValue>(p: QuantumOutpoint): Promise<T> {
    this.outpoint(p); await this.active();
    return this.rpc.call<T>('getquantuminput', { txid: p.txid, vout: p.vout }, { retries: 0 });
  }
  async fund<T = JsonValue>(p: QuantumFunding): Promise<T> {
    this.funding(p); await this.active();
    return this.wallet<T>('fund', { txid: p.txid, vout: p.vout, fee_atoms: p.fee_atoms, destination: p.destination });
  }
  async send<T = JsonValue>(p: QuantumSpend): Promise<T> {
    this.funding(p);
    if (!p.source || p.source === p.destination) throw new Error('A source and a different fresh destination are required');
    await this.active();
    return this.wallet<T>('send', { txid: p.txid, vout: p.vout, fee_atoms: p.fee_atoms, destination: p.destination, source: p.source });
  }
  async exit<T = JsonValue>(p: QuantumExit): Promise<T> {
    this.funding(p);
    if (!p.source || p.confirm_exit !== true) throw new Error('source and confirm_exit=true required; exit removes WOTS protection from the output');
    await this.active();
    return this.wallet<T>('exit', { txid: p.txid, vout: p.vout, fee_atoms: p.fee_atoms, destination: p.destination, source: p.source, confirm_exit: true });
  }
  async submit<T = JsonValue>(txHex: string): Promise<T> {
    if (!/^(?:[0-9a-fA-F]{2})+$/.test(txHex)) throw new Error('Expected signed transaction hex');
    await this.active();
    return this.rpc.call<T>('sendquantumtransaction', { txHex }, { retries: 0 });
  }
}
