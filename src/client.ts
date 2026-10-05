import type { FetchLike, RpcTransportOptions, TokenProvider } from "./types.js";
import { RpcTransport } from "./transport.js";
import { SystemModule } from "./modules/system.js";
import { ChainModule } from "./modules/chain.js";
import { NetworkModule } from "./modules/network.js";
import { WalletModule } from "./modules/wallet.js";
import { TransactionsModule } from "./modules/transactions.js";
import { TokensModule } from "./modules/tokens.js";
import { TruScriptsModule } from "./modules/truscripts.js";
import { ContractsModule } from "./modules/contracts.js";
import { MagicLocksModule } from "./modules/magic.js";
import { MiningModule } from "./modules/mining.js";
import { AiModule } from "./modules/ai.js";
import { IdentityModule } from "./modules/identity.js";
import { HtlcModule } from "./modules/htlc.js";
import { SwapsModule } from "./modules/swaps.js";
import { RawRpcModule } from "./modules/raw.js";
import { ExplorerClient } from "./explorer.js";
import { NeromeshClient, type NeromeshOptions } from "./neromesh.js";
import { TruEvents } from "./events.js";

export interface TruClientOptions {
  core: RpcTransportOptions;
  explorerUrl?: string;
  neromesh?: NeromeshOptions | string;
}

export interface PublicTruClientOptions {
  explorerUrl: string;
  gateway?: "wallet" | "mining";
  timeoutMs?: number;
  fetch?: FetchLike;
}

export class TruClient {
  readonly rpc: RpcTransport;
  readonly system: SystemModule;
  readonly chain: ChainModule;
  readonly network: NetworkModule;
  readonly wallet: WalletModule;
  readonly transactions: TransactionsModule;
  readonly tokens: TokensModule;
  readonly scripts: TruScriptsModule;
  readonly contracts: ContractsModule;
  readonly magic: MagicLocksModule;
  readonly mining: MiningModule;
  readonly ai: AiModule;
  readonly identity: IdentityModule;
  readonly htlc: HtlcModule;
  readonly swaps: SwapsModule;
  readonly raw: RawRpcModule;
  readonly events: TruEvents;
  readonly explorer?: ExplorerClient;
  readonly neromesh?: NeromeshClient;

  constructor(options: TruClientOptions) {
    this.rpc = new RpcTransport(options.core);
    this.system = new SystemModule(this.rpc);
    this.chain = new ChainModule(this.rpc);
    this.network = new NetworkModule(this.rpc);
    this.wallet = new WalletModule(this.rpc);
    this.transactions = new TransactionsModule(this.rpc);
    this.tokens = new TokensModule(this.rpc);
    this.scripts = new TruScriptsModule(this.rpc);
    this.contracts = new ContractsModule(this.rpc);
    this.magic = new MagicLocksModule(this.rpc);
    this.mining = new MiningModule(this.rpc);
    this.ai = new AiModule(this.rpc);
    this.identity = new IdentityModule(this.rpc);
    this.htlc = new HtlcModule(this.rpc);
    this.swaps = new SwapsModule(this.rpc);
    this.raw = new RawRpcModule(this.rpc);
    this.events = new TruEvents(this.chain);
    if (options.explorerUrl) this.explorer = new ExplorerClient(options.explorerUrl);
    if (options.neromesh) this.neromesh = new NeromeshClient(options.neromesh);
  }

  static direct(endpoint: string, token: TokenProvider, extras: Omit<TruClientOptions, "core"> & { timeoutMs?: number; fetch?: FetchLike } = {}): TruClient {
    return new TruClient({
      core: { endpoint, token, ...(extras.timeoutMs !== undefined ? { timeoutMs: extras.timeoutMs } : {}), ...(extras.fetch ? { fetch: extras.fetch } : {}) },
      ...(extras.explorerUrl ? { explorerUrl: extras.explorerUrl } : {}),
      ...(extras.neromesh ? { neromesh: extras.neromesh } : {})
    });
  }

  static public(options: PublicTruClientOptions): TruClient {
    const base = options.explorerUrl.replace(/\/$/, "");
    const gateway = options.gateway ?? "wallet";
    return new TruClient({
      core: {
        endpoint: `${base}/api/${gateway}/rpc`,
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
        ...(options.fetch ? { fetch: options.fetch } : {})
      },
      explorerUrl: base
    });
  }
}
