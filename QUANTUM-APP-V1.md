# TRU Quantum Wallet UI — Core-backed terminal + local web + public portal

This **additive** UI module targets **TRU-Core 0.08.5** and extends the existing SDK source tree without editing old SDK APIs, Core consensus, `wallet.html`, `wallet.js`, or token code. It has NOT undergone a live post-activation fund/send/exit/reorg integration test.

## What the two web experiences are

1. **The local browser app (`web.mjs`)** runs on the wallet owner's computer only. It connects through the already-tested SDK adapter to the **same owner's** locally running, unlocked TRU Core 0.08.5. Core alone holds and signs with WOTS+ keys. The companion UI can receive/list before activation; after activation it can inspect a confirmed input, sign fund/send/exit, decode saved bytes, explicitly broadcast, and recover the **exact saved** WOTS bytes. It keeps a private local journal under `~/.tru-quantum-ui` and uses bearer+same-origin protections.
2. **The public explorer portal (`quantum-wallet.html`)** is an optional static addition to your existing website. It does not access the user's Core or sign transactions. It locally validates native `truq1` descriptor script layout and SHA-256 checksum. A separate locally-installed Core companion is needed for real self-custody signing.

**Your existing web `Quantum ID` (`TRU...`-prefixed SHA-256 derivation of a standard address) is NOT a real PQ01 spendable address.** Leave it as an ID; do not fund it as PQ01. Real Core-generated descriptors start with `truq1:` and contain a 69-byte locking script plus 8-byte SHA-256 checksum. This module does not convert the existing web wallet's ordinary ECDSA keys into WOTS+ custody, nor implement WOTS+ for tokens.

## Installation on bt878 / TRU-SDK-QPOC

```bash
# After applying the add-on ZIP (see README_PATCH.md):
cd ~/projects/TRU-SDK-QPOC
npm ci
npm test

# Existing terminal CLI, unchanged:
node apps/quantum-wallet/wallet.mjs status
node apps/quantum-wallet/wallet.mjs receive
node apps/quantum-wallet/wallet.mjs list

# NEW guided terminal menu:
node apps/quantum-wallet/terminal.mjs

# NEW private browser app, on the SAME machine as Core:
node apps/quantum-wallet/web.mjs
```

`web.mjs` prints a PRIVATE launch URL such as `http://127.0.0.1:24833/#<random secret>`. Open it in a browser **on the same machine**. The URL fragment is used to establish a session and is then removed from the address bar. If the SDK runs over SSH remotely, `localhost` in your laptop browser is **not** your remote Core; use an SSH local-forward to the private companion port, with care to keep the session link secret. Never proxy or publish the companion to the internet. This application requires Node.js >=18.

To configure non-default loopback Core RPC:

```bash
export TRU_RPC_URL=http://127.0.0.1:21832/rpc
# optionally choose one of:
export TRU_RPC_COOKIE_FILE="$HOME/.tru/rpc-cookie-21832"
# OR export TRU_RPC_TOKEN from an appropriately protected shell (not a website)
export TRU_QUANTUM_UI_PORT=24833
export TRU_QUANTUM_STATE_DIR="$HOME/.tru-quantum-ui"
```

To make receive/list/sign work, Core must be running and unlocked and **Core's own running process** must have `TRU_RPC_WALLET_SEND_ENABLE=1`. Merely setting this env variable in the shell launching the UI will not turn on Core wallet operations. Keep RPC bound to `127.0.0.1`, configure authentication, and don't expose the RPC cookie or sidecar. Send limits configured in Core can reject large inputs even when a browser UI tries them.

## Current workflows

### Before block 50,000 activation

- Local web or terminal: status, node info, create one-time PQ01 descriptor, list Core-owned descriptors, check private local records. **Back up the updated encrypted `.pq01` immediately after each receive.**
- Public explorer static add-on: view deployment information and validate a pasted genuine descriptor locally (with SHA-256 checksum).
- Signing, funding, sending, exits and broadcasting stay blocked until Core reports `active:true` for the next candidate block. Do not pre-fund inactive PQ01 scripts.

### After activation

1. Generate a **fresh** Core-owned `truq1` destination or obtain a fresh destination from another owner. Use only once for one funding payment.
2. Find a confirmed, unspent plain TRU UTXO belonging to Core wallet (`listunspent` for ordinary wallet address), verify its outpoint with `getquantuminput`. Token/control inputs, immature coinbase outputs and mempool-spent outputs are rejected by Core.
3. Choose `fund` (ordinary P2PKH → PQ01), `send` (owned WOTS PQ01 → a fresh PQ01), or `exit` (owned WOTS PQ01 → ordinary address). Enter outpoint, fee in integer atoms and destination. **The entire selected UTXO minus fee moves; no amount argument, no change output.**
4. Verify the preview; type `SIGN`. The bridge writes a private journal intent before signing and persists signed bytes returned by Core. Signing alone never sends to the network. WOTS keys cannot be safely re-used for different transactions.
5. In Saved Transactions, decode the **exact signed bytes** and independently verify destination/output and fee; type `BROADCAST` to submit. A returned txid does NOT prove confirmation.
6. Wait for confirmations, check chain state and transaction inclusion. Start with a small-value test and a fresh backed-up signer.

If the signer times out or errors, the result is marked **uncertain**. DO NOT sign a new WOTS transaction with the same source. Use the Recover UI (`quantumwallet action=retry`), which reads only Core's exact previously saved WOTS-signed transaction. Ordinary fund signatures do not use this same WOTS recovery mechanism; inspect the outpoint, mempool, and history manually before considering a second funding attempt.

## Backups and safety

- Wallet: encrypted primary wallet and seed plus **latest `.pq01` sidecar** and WOTS reservation/signing state. Do not overwrite newer signing state with an old backup. Never use multiple live clones of the same WOTS signer state.
- Companion journal: `~/.tru-quantum-ui/*.json`, mode 0600 within private mode 0700 directory. These contain transaction hex and metadata, NOT WOTS secrets. Journal entries marked pending/uncertain require manual attention.
- Bridge binds **only `127.0.0.1`** and rejects mismatched Host, Origin and missing session bearer. Sessions are newly generated on start. No permissive CORS, no localStorage of private keys, no remote signing API, no third-party scripts.
- Session bearer in a local browser is not a replacement for machine security; any malware or hostile OS user with the token/host access is dangerous.
- Avoid running this web server under a public reverse proxy, Docker `-p 0.0.0.0`, Tailscale Funnel or a public HTTPS gateway.
- Activation at block 50,000 does not by itself prove end-to-end WOTS wallet safety under reorg, mempool stress, mixed-version peers, wallet restart and hardware backup restore. Finish small-value integration tests before production use.

## Notes for web integration

The add-on installs only `quantum-wallet.html`, `quantum-wallet-public.js`, and `quantum-wallet-public.css` into your site's web root. Browse `/quantum-wallet.html`. Your original `/wallet.html`, `/wallet.js`, `/index.html`, token code, marketplace code and API routes are not edited. If you later add a navigation link, point it to `/quantum-wallet.html` separately (back up your site's own theme file before adding any links).

## Scope of validation

Automated tests cover controller activation gating, explicit sign/submit separation, durable signed result, exact saved-byte recovery, wrong phrase rejection, and local HTTP token/origin checks using simulated Core replies. Tests DO NOT spend funds or demonstrate actual chain activation; a live Core plus wallet is required for that.
