# TRU SDK

**TRU SDK v1.0.0** is the first TypeScript/JavaScript developer SDK for **TRU — Tokenized Real Utility**.

It gives application developers one organized API for TRU Core JSON-RPC, the public Explorer API, TRUScripts, native tokens, contracts, Magic Locks, mining telemetry, AI/evolution, HTLC/swap primitives, DID/social functions, and NEROMESH / AXON HTTP services.

> Proposed npm package name: `@tru/sdk`. Confirm that the npm scope is owned before publishing, or rename the package to the scope you control.

## Goals

The SDK is intentionally an **application/developer layer**, not a second consensus implementation.

TRU Core remains authoritative for:

- chain state
- consensus and block validation
- transaction validation
- wallet signing when Core-wallet RPCs are used
- token issuance/transfer rules
- contract execution
- TRUScript rules
- Magic Locks
- mining work construction and block submission
- HTLC/swap wallet operations

The SDK provides:

- typed, discoverable modules
- JSON-RPC transport and Bearer authentication
- browser-safe public gateway support
- consistent error classes
- exact TRU amount helpers using `bigint`
- current-mainnet address validation
- Explorer REST access
- NEROMESH / AXON access
- raw RPC escape hatch for forward compatibility
- a source-derived catalog of the current Core RPC surface
- block polling/events for application development

## Coverage in v1.0.0

The source-derived RPC catalog currently contains **106 TRU Core methods** grouped across:

- chain / blocks
- network / peers
- wallet
- transactions / UTXOs / mempool
- native tokens: FT / NFT / SFT / NCFT
- token metadata / burn / evolution
- TRUScripts
- contracts / hashlocks / timelocks / Voting V1 helpers
- Magic Locks / Magic Secrets
- mining / miner telemetry
- AI providers / AI tokens
- DID / social
- HTLC primitives
- swap records / role keys
- AXON wallet handoff RPCs
- chain data-provider calls

The public Explorer client covers the currently reviewed REST routes for stats, blocks, addresses, transactions, tokens, contracts, miners, miner reports, difficulty/hashrate history, TRUScripts, peers, DID/social, wallet-token views, price and hashrate.

The NEROMESH client covers public health/stats, direct-job compatibility APIs, AXON customer offer/funding/wallet-handoff flows, standalone worker APIs, and the current customer/worker/network portal endpoints.

For any newly added Core RPC that does not yet have a friendly method, use:

```ts
await tru.raw.call("newmethod", { ...params });
```

## Install

From a local checkout:

```bash
npm install
npm run build
npm test
```

After publishing to npm:

```bash
npm install @tru/sdk
```

Requires Node.js 18+ for native `fetch`, or a modern browser/bundler.

## Quick start — local TRU Core

Direct Core RPC is privileged. Read the Core RPC cookie/token on the server side and pass the token to the SDK.

```ts
import { readFile } from "node:fs/promises";
import { TruClient } from "@tru/sdk";

const token = (await readFile(
  `${process.env.HOME}/.tru/rpc-cookie-21832`,
  "utf8"
)).trim();

const tru = new TruClient({
  core: {
    endpoint: "http://127.0.0.1:21832/rpc",
    token
  },
  explorerUrl: "https://tokenizedrealutility.com",
  neromesh: "https://tru.neromesh.space"
});

console.log(await tru.chain.getChainInfo());
```

### Never place a privileged Core token in browser JavaScript

For browser applications, use the public allowlisted gateway instead:

```ts
import { TruClient } from "@tru/sdk";

const tru = TruClient.public({
  explorerUrl: "https://tokenizedrealutility.com",
  gateway: "wallet"
});

const info = await tru.system.getDesktopInfo();
console.log(info);
```

The public gateway intentionally exposes only an allowlisted subset of Core functionality.

## Chain

```ts
const info = await tru.chain.getChainInfo();
const height = await tru.chain.getBlockCount();
const block = await tru.chain.getBlockByHeight(29408);
```

## Wallet

```ts
const address = "T...";

const balance = await tru.wallet.getBalance(address);
const utxos = await tru.wallet.listUnspent(address);
const history = await tru.transactions.getAddressTransactions(address, 100);
```

Privileged local Core wallet:

```ts
const created = await tru.wallet.getNewAddress();

await tru.wallet.sendToAddress(
  "TRecipient...",
  "1.25000000"
);
```

## Exact TRU amounts

Do not use binary floating point for application accounting.

TRU uses:

```text
1 TRU = 100,000,000 atoms
```

Use the SDK helpers:

```ts
import { parseTru, formatTru } from "@tru/sdk";

const atoms = parseTru("45.25000000");
// 4525000000n

console.log(formatTru(atoms));
// 45.25000000
```

Invalid precision is rejected:

```ts
parseTru("0.000000001"); // throws
```

## Tokens

### Issue

```ts
const result = await tru.tokens.issue({
  type: "FT",
  name: "Example Token",
  symbol: "EXT",
  supply: "1000000",
  decimals: 8,
  description: "Built with the TRU SDK",
  address: "TIssuer..."
});
```

TRU token families can be passed through the native Core token RPCs, including:

```text
FT
NFT
SFT
NCFT
```

### Transfer

```ts
await tru.tokens.send(
  "TOKEN_ID",
  "TRecipient...",
  "1",
  "TSender..."
);
```

### Metadata / balance / burn

```ts
await tru.tokens.metadata("TXID");
await tru.tokens.verifyMetadata("TXID");
await tru.tokens.verifyBalance("TOKEN_ID", "TAddress...");
await tru.tokens.burn("TOKEN_ID", "TSender...", true);
```

### Token evolution

```ts
const preview = await tru.tokens.previewEvolution({
  tokenID: "TOKEN_ID",
  owner: "TOwner...",
  trigger: "milestone reached"
});
```

Signed evolution commits remain subject to Core's authoritative signature/authority checks.

## TRUScripts

```ts
await tru.scripts.list("TOwner...");
await tru.scripts.details("TXID");

await tru.scripts.inscribe(
  "TOwner...",
  { message: "Hello TRU" }
);
```

Self-custody clients can use the signed transaction RPC wrappers where available rather than giving the server private keys.

## Contracts

```ts
const contracts = await tru.contracts.list();

const tx = await tru.contracts.createTransaction({
  type: "...",
  name: "...",
  senderAddress: "T...",
  scriptHex: "...",
  amount: "...",
  fee: "...",
  utxo: { /* Core-compatible UTXO */ }
});
```

Hashlock/timelock and Voting V1 helper RPCs are also exposed.

## Magic Locks

```ts
await tru.magic.create({
  amount: "1.00000000",
  targetPrefix: "000000",
  address: "T..."
});

const locks = await tru.magic.list("T...");
```

Magic Secret preparation/read/publish RPCs are exposed separately because publication is an operator-gated privileged action.

## Mining

```ts
await tru.mining.register("TMiner...");

await tru.mining.reportActivity(
  "TMiner...",
  2_450_000_000,
  1.0
);

const status = await tru.mining.status("TMiner...");
```

Canonical work:

```ts
const work = await tru.mining.getTemplate(
  "TMiner...",
  1
);
```

TRU Core remains authoritative for the candidate and final `submitblock` validation.

## AI / evolution

```ts
const providers = await tru.ai.providers();
const state = await tru.ai.tokenState("TOKEN_ID");
```

Privileged operator applications can configure providers, create AI tokens, interact, retrieve responses and train AI tokens through the corresponding Core RPCs.

## DID / social

```ts
const mapping = await tru.identity.getDid("did:tru:example");
```

Both Core-managed and signed DID registration paths are exposed where present.

## HTLC / swaps

Low-level canonical TRU HTLC operations are available under:

```ts
tru.htlc
```

Swap state/role helpers are available under:

```ts
tru.swaps
```

Examples:

```ts
const secret = await tru.htlc.generateSecret();
const records = await tru.swaps.recordList();
```

These are low-level financial primitives. Applications should preserve the Core's safety/idempotency model and should not automatically repeat funding after an ambiguous response.

## Explorer

```ts
const stats = await tru.explorer?.stats();
const miners = await tru.explorer?.miners({ timeout: 2, recent: 50 });
const reports = await tru.explorer?.minerReports();
const tokens = await tru.explorer?.tokens({ limit: 50 });
```

The Explorer client is read-only except for RPC gateways handled by `TruClient.public()`.

## NEROMESH / AXON

```ts
import { NeromeshClient } from "@tru/sdk";

const mesh = new NeromeshClient({
  baseUrl: "https://tru.neromesh.space",
  customerToken: process.env.NEROMESH_CUSTOMER_TOKEN
});

console.log(await mesh.health());
```

Post a marketplace offer:

```ts
const offer = await mesh.createOffer({
  job_type: "text.generate",
  privacy_tier: "community",
  accept_community_processing: true,
  reward_tru: "0.01000000",
  input: {
    prompt: "Write three original names for a science-fiction city.",
    max_output_tokens: 128
  }
});
```

NEROMESH credentials such as customer, worker, installation and wallet-capability tokens are secrets. Do not put them in URLs or commit them to source control.

## Block events

The first SDK provides a polling abstraction so application code does not need to hand-roll block polling:

```ts
const controller = new AbortController();

tru.events.watchBlocks(
  ({ height, block }) => {
    console.log("new block", height, block);
  },
  {
    intervalMs: 2000,
    signal: controller.signal
  }
);
```

The abstraction can later move to WebSocket/SSE notifications without forcing applications to redesign their business logic.

## Error handling

```ts
import {
  TruNodeBusyError,
  TruInsufficientFundsError,
  TruTokenNotFoundError
} from "@tru/sdk";

try {
  await tru.tokens.send("TOKEN", "T...", "1");
} catch (error) {
  if (error instanceof TruNodeBusyError) {
    // retry only when your operation is safe to retry
  }
}
```

SDK error classes include:

```text
TruError
TruRpcError
TruHttpError
TruAuthError
TruNodeBusyError
TruTimeoutError
TruNetworkError
TruInvalidAddressError
TruInsufficientFundsError
TruTokenNotFoundError
TruTransactionRejectedError
TruContractExecutionError
```

The transport **does not automatically retry writes**. This is intentional: blindly retrying a transaction/funding operation can duplicate side effects. Explicit per-call retries are available through the raw transport when an operation is known to be idempotent.

## Raw RPC

The SDK will not block developers from new Core functionality:

```ts
const result = await tru.raw.call(
  "someFutureRpc",
  { value: "example" }
);
```

Inspect the current catalog:

```ts
import { RPC_CATALOG } from "@tru/sdk";

for (const method of RPC_CATALOG) {
  console.log(method.method, method.category, method.gateway);
}
```

## Compatibility check

```ts
console.log(await tru.system.compatibility("0.07.5"));
```

The result reports the SDK version, minimum requested Core version, detected version when Core exposes one, and whether the comparison is known to be compatible.

## Browser security model

Do **not** bundle any of these into a web application:

```text
TRU Core bearer/cookie token
wallet private keys
seed phrases
NEROMESH nmc_ customer credentials unless intentionally entered into a secure flow
NEROMESH worker/private credentials
AXON axc_ capabilities beyond their intended short-lived handoff
```

Browser applications should use:

- the Explorer's allowlisted wallet/mining gateway
- signed/self-custody transaction flows
- secure server backends for privileged operations
- the NEROMESH portal/session model where appropriate

## Project structure

```text
TRU_SDK_v1.0.0/
├── src/
│   ├── client.ts
│   ├── transport.ts
│   ├── errors.ts
│   ├── rpc-catalog.ts
│   ├── explorer.ts
│   ├── neromesh.ts
│   ├── events.ts
│   ├── modules/
│   │   ├── chain.ts
│   │   ├── wallet.ts
│   │   ├── transactions.ts
│   │   ├── tokens.ts
│   │   ├── truscripts.ts
│   │   ├── contracts.ts
│   │   ├── magic.ts
│   │   ├── mining.ts
│   │   ├── ai.ts
│   │   ├── identity.ts
│   │   ├── htlc.ts
│   │   ├── swaps.ts
│   │   ├── system.ts
│   │   └── raw.ts
│   └── utils/
│       ├── amount.ts
│       └── address.ts
├── examples/
├── tests/
├── API.md
├── SECURITY.md
├── CHANGELOG.md
├── package.json
└── tsconfig.json
```

## Build and test

```bash
npm install
npm run typecheck
npm test
```

The v1.0.0 package has no runtime npm dependencies. It uses standards-based `fetch` and JSON.

## Version

```text
TRU SDK v1.0.0
```

Initial public developer SDK for TRU Core, Explorer, and NEROMESH / AXON integration.
