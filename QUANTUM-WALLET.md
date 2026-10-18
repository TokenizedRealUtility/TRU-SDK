# TRU SDK Quantum Wallet — Core 0.08.5 adapter

This package extends the supplied SDK 1.0.0 with `tru.quantum` and a local Node.js terminal wallet application. It does not change Core consensus or implement WOTS+ in JavaScript. It has not been published to npm; use this source package locally.

## What can be built now?

The original SDK already supports arbitrary authenticated RPC through `tru.raw.call()`. It contains no WOTS+ signer, quantum descriptor storage or dedicated quantum module. This extension adds the dedicated API and a working terminal front end to the existing Core wallet.

| Application | Support |
| --- | --- |
| Personal application connected to your own local 0.08.5 Core | Included |
| Status, fresh receive descriptor, descriptor list | Available before activation if Core wallet access is enabled |
| Quantum funding, sending, exit and submission | Core activation gate must be active |
| Independent browser/mobile wallet holding its own WOTS keys | Not included; requires a compatible local signer, durable one-time key state and secure transaction verification |
| Public hosted app signing from every visitor's own wallet | Not provided by a server's Core-wallet RPC; connecting everyone to one server wallet would use that server's keys |

The reported mainnet activation is **50,000**, inclusive. `active` is evaluated at `candidate_height`, the next block: a tip of 49,999 can report active for candidate 50,000. Always query the node; do not infer current height from an old screenshot or version string. Developing/testing this SDK does not require a new activation height.

## TESTED On LOCAL CORE

Extract the archive into a new directory, then enter `TRU-SDK-main`:

```bash
npm ci
npm test
node apps/quantum-wallet/wallet.mjs help
node apps/quantum-wallet/wallet.mjs status
```

Node.js 18+ is required by the supplied SDK. The package includes the TypeScript source and compiled `dist`; `npm test` rebuilds and runs tests. Existing SDK version metadata stays 1.0.0; this is a local extension, not an assertion of a published SDK release.

Run as the same OS user as Core. Authentication automatically uses `TRU_RPC_TOKEN`, or the Core cookie selected by `TRU_RPC_COOKIE_FILE`, or the default:

- Linux/macOS: `$HOME/.tru/rpc-cookie-21832`.
- Windows: `%LOCALAPPDATA%\TRU\rpc-cookie-21832`.

Default URL: `http://127.0.0.1:21832/rpc`. Set `TRU_RPC_URL` for a different local RPC port. Core's P2P port is not its RPC port. The app refuses remote/public gateway URLs. Never put the privileged RPC bearer token in a web page.

For receive/list/fund/send/exit/retry, the **running Core process** must have `TRU_RPC_WALLET_SEND_ENABLE=1` and unlocked wallet private access. Setting that variable only in the app terminal does not change an already-running Core. Your demonstrated CLI receive/list success indicates those requirements were met on that process; no restart is needed solely for this app.

## First receive descriptor

```bash
node apps/quantum-wallet/wallet.mjs receive
node apps/quantum-wallet/wallet.mjs list
```

`receive` creates a fresh descriptor and initializes the encrypted sidecar if needed. `list` reads descriptor signing state; `unused` is NOT an unspent-balance report and does not prove the descriptor has never received a payment. Core may reject list before the first receive because no sidecar exists.

**ONE payment per descriptor.** Back up the Core wallet and its current `.pq01` sidecar together. An ordinary seed backup alone is insufficient. The path is relative to the Core wallet location, not this application's working directory. Never clone live signer state or restore stale state and resume signing. Generating another signature with a used one-time key is not an acceptable retry strategy.

## Funding after activation

Choose a confirmed ordinary P2PKH output owned by the Core wallet, using existing `tru-cli listunspent ADDRESS`. Avoid token/control outputs. Save `fund.json` with real values:

```json
{
  "txid": "<64_HEX_ORDINARY_FUNDING_TXID>",
  "vout": 0,
  "fee_atoms": 10000,
  "destination": "<FRESH_TRUQ1_DESCRIPTOR>"
}
```

```bash
node apps/quantum-wallet/wallet.mjs input fund.json
node apps/quantum-wallet/wallet.mjs fund fund.json signed-fund.json
```

Review the input, fee and destination, then type `SIGN`. The application saves the result without broadcasting. It refuses to overwrite an existing result file. `fee_atoms` is a whole integer; 10000 is the minimum wallet floor, not a guarantee that every transaction meets current relay fee policy.

The **whole selected input minus fee** goes to the destination. No amount argument or change output is supported. Core's default RPC wallet cap is 1 TRU and the quantum path compares the selected input against that cap. Use a suitably small ordinary input for your first test.

To broadcast the exact saved bytes:

```bash
node apps/quantum-wallet/wallet.mjs submit signed-fund.json
```

Review the decoded transaction and type `SEND`. A returned txid is not confirmation. Track the transaction with `tru-cli gettransaction TXID`; wait for confirmation before using its output. Initial funding uses the ordinary source's ECDSA signature; the new output requires WOTS+ for its subsequent spend.

## WOTS+ send

Obtain a fresh destination descriptor from the recipient. Save `send.json`:

```json
{
  "txid": "<CONFIRMED_QUANTUM_FUNDING_TXID>",
  "vout": 0,
  "fee_atoms": 10000,
  "source": "<OWNED_FUNDED_TRUQ1_DESCRIPTOR>",
  "destination": "<FRESH_RECIPIENT_TRUQ1_DESCRIPTOR>"
}
```

```bash
node apps/quantum-wallet/wallet.mjs send send.json signed-send.json
node apps/quantum-wallet/wallet.mjs submit signed-send.json
```

Signing and submission each require their own interactive confirmation. Core checks the source matches the confirmed unspent output and owns its key state. WOTS transactions are larger than ordinary ECDSA transactions; Core may require a higher fee. The SDK never implements a replacement-by-fee loop or silently changes/resigns a WOTS transaction.

## Exit to an ordinary address

Use the same fields as send, but set `destination` to an ordinary TRU address and add `"confirm_exit": true`. Save as `exit.json`:

```bash
node apps/quantum-wallet/wallet.mjs exit exit.json signed-exit.json
node apps/quantum-wallet/wallet.mjs submit signed-exit.json
```

The input is authorized with WOTS+. The ordinary destination output no longer has WOTS protection. These paths support plain TRU only; legacy TRU, token, TRUScript and contract sends remain separate.

## Recover saved WOTS bytes after a timeout

A signing timeout does not prove signing failed. Check Core's descriptor state and transaction status. Save `retry.json` containing `{"source":"<OWNED_SOURCE_DESCRIPTOR>"}`:

```bash
node apps/quantum-wallet/wallet.mjs retry retry.json recovered.json
```

This retrieves Core's saved transaction for that source; it does not create a new signature. Inspect before submitting. A reserved descriptor without saved bytes needs investigation; do not clear reservations or reuse its key. Core's ordinary-to-quantum `fund` action does not use this WOTS saved-signature recovery path: after an uncertain funding result, inspect its input, mempool and history before attempting another transaction.

## SDK use

```js
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { TruClient } from './dist/index.js';

const tru = TruClient.direct('http://127.0.0.1:21832/rpc', async () =>
  (await readFile(join(homedir(), '.tru/rpc-cookie-21832'), 'utf8')).trim()
);
console.log(await tru.quantum.consensus());
console.log(await tru.quantum.list());
// Explicit creation: await tru.quantum.receive();
```

| Method | Input | Core method |
| --- | --- | --- |
| `consensus()` | none | `getconsensus09info` |
| `receive()` | none | `quantumwallet`, action receive |
| `list()` | none | `quantumwallet`, action list |
| `input(p)` | txid, vout | `getquantuminput` |
| `fund(p)` | txid, vout, fee_atoms, destination | `quantumwallet`, action fund |
| `send(p)` | funding fields plus source | `quantumwallet`, action send |
| `exit(p)` | send fields plus confirm_exit:true | `quantumwallet`, action exit |
| `retry(source)` | source descriptor | `quantumwallet`, action retry |
| `submit(txHex)` | signed hex string | `sendquantumtransaction` |

Signing results contain `rawHex`; submission RPC accepts `txHex`. No automatic signing retries, automatic broadcast or automatic receive polling. Do not use `raw.call` retries to circumvent these rules. JavaScript integer inputs must be safe integers; larger amount support would need a lossless JSON transport change.

## Validation and limits

- TypeScript compile succeeds.
- All 12 SDK tests pass (six existing tests and six new quantum tests).
- Tests verify request mapping, preactivation gates, separate sign/submit, invalid numbers, source reuse rejection, remote endpoint rejection, no automatic retries and saved-byte recovery requests.
- Application syntax/help checks pass.
- These are adapter/mock tests. No live mainnet funds were spent, and no new activated-chain/reorg wallet integration test was performed here.
- This is a terminal application, not a new graphical desktop wallet or independent browser signer.
- Your existing consensus/reorg tests remain separate evidence; they do not automatically validate this new client application's full live workflow.

The app is suitable for local review and controlled testing. Establish a successful small-value post-activation fund/send/exit/restart workflow before representing this client as fully mainnet-tested.
