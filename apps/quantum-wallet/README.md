# TRU Quantum Wallet — PQ01 / WOTS+ (v0.3)

**A Core-backed terminal and web wallet for native post-quantum TRU transactions.** The application uses the TRU SDK to communicate with the wallet owner's own authenticated TRU Core 0.08.5 node. Core generates receive descriptors, holds private signing material and enforces consensus rules. The SDK/browser does **not** contain an independent WOTS+ private-key implementation.

> **Current status:** Pre-activation descriptor creation, listing and status inspection are available. TRU mainnet PQ01 activation is configured for **block 50,000**; funding, spending, input inspection and broadcasting are gated by Core's activation state. The v0.3 automated suite passed **22 tests**, but **live post-activation fund → send → exit, confirmation, restart and reorg behavior has not been validated**. Use test-sized amounts only after those checks are completed.

> **Existing web-wallet compatibility:** This project **does not modify** `wallet.html`, `wallet.js`, TRU transfers, native FT/NFT/SFT/NCFT features, TRUScripts, contracts or Core consensus. The older explorer **Quantum ID** is not a spendable `truq1:` WOTS+ address. Do not send quantum funds to an older Quantum ID label.

## Contents

- [Prerequisites](#prerequisites)
- [Installation and first launch](#installation-and-first-launch)
- [All npm commands](#all-npm-commands)
- [Configure Local or Private LAN access](#configure-local-or-private-lan-access)
- [Trust the LAN HTTPS certificate](#trust-the-lan-https-certificate)
- [Configuration reference](#configuration-reference)
- [Wallet terminal and Core RPC commands](#wallet-terminal-and-core-rpc-commands)
- [Pre-activation workflow](#pre-activation-workflow)
- [Post-activation transaction walkthrough](#post-activation-transaction-walkthrough)
- [Wallet backups and safety](#wallet-backups-and-safety)
- [Public explorer portal](#public-explorer-portal)
- [Troubleshooting](#troubleshooting)
- [Validation and release limitations](#validation-and-release-limitations)

## Prerequisites

- **Node.js 18+** and npm.
- An installed, running **TRU Core 0.08.5** with a **local loopback JSON-RPC** service, normally `http://127.0.0.1:21832/rpc`.
- Core RPC authentication (a local RPC cookie or bearer token); Core must be unlocked and explicitly allow wallet RPC operations for receive/sign actions.
- For optional LAN HTTPS mode, **OpenSSL**, a private IPv4 address on the wallet computer, and a firewall allowing only approved clients.
- Browser computer(s) must trust the exact generated self-signed TLS certificate. **Never bypass certificate warnings.**

TRU Core's P2P port `21833` is different from its privileged RPC port `21832`. Do not expose Core RPC to the LAN or Internet.

Core must have its wallet-send authorization enabled **in the running Core process** (`TRU_RPC_WALLET_SEND_ENABLE=1`, subject to any configured maximum), not merely in the shell that launches this app. Follow your Core release's configuration and restart procedures when changing that setting. Keep Core RPC bound to `127.0.0.1`.

## Installation and first launch

Clone the official TRU-SDK repository:

```bash
git clone https://github.com/TokenizedRealUtility/TRU-SDK.git
cd TRU-SDK
node --version
npm ci
npm test
npm run quantum:wallet
```

**First start:** `quantum:wallet` launches an interactive setup wizard if no `apps/quantum-wallet/.env` exists and no mode has already been set in the process environment. Choose **1 (Local)** or **2 (Private LAN HTTPS)**.

**Later starts:** Just run:

```bash
npm run quantum:wallet
```

The saved configuration lives at `apps/quantum-wallet/.env`; it is excluded from Git. `npm run quantum:setup` reopens the wizard to change it. The wizard will ask before replacing existing settings. The app prints a **fresh private launch URL** on each start; do not post it publicly.

**Already installed v0.2?** Do **not** roll back. Apply the v0.3 incremental patch, run `npm test`, then `npm run quantum:setup`. Matching existing `lan.crt` and `lan.key` files can be reused.

## All npm commands

Run these in the **SDK repository root**:

| Command | What it does | When to use |
|---|---|---|
| `npm ci` | Installs exact locked dependencies | Initial setup / clean install |
| `npm run build` | Compiles TypeScript to `dist/` | After changing SDK TypeScript |
| `npm run typecheck` | Type-checks without emitting files | Development / CI |
| `npm test` | Builds SDK and executes automated tests | After installation and changes |
| `npm run quantum:wallet` | Launches setup on first run, then starts web wallet | **Recommended normal launch** |
| `npm run quantum:setup` | Configures/reconfigures local vs LAN mode, address, clients and TLS | First setup or network changes |
| `npm run quantum:web` | Starts web server with existing `.env`; **does not** run setup wizard | Existing/manual configuration |
| `npm run quantum:terminal` | Starts interactive terminal wallet menu | Terminal users |

**Direct entrypoints:** `node apps/quantum-wallet/web.mjs`, `node apps/quantum-wallet/terminal.mjs`, `node apps/quantum-wallet/wallet.mjs help`.

`quantum:web` does not auto-create certificates or prompt for missing LAN values; use `quantum:wallet` or `quantum:setup` first.

## Configure Local or Private LAN access

### Mode 1 — Local (default)

The wallet listens only at `127.0.0.1:24833` and prints a link like:

```text
http://127.0.0.1:24833/#<PRIVATE_SESSION_KEY>
```

Open it on the same machine. For a remote computer, you can use an authenticated SSH loopback tunnel **without** exposing the HTTP listener to your LAN:

```bash
# On your personal computer; replace the Linux username and LAN IP:
ssh -N -L 24833:127.0.0.1:24833 USER@192.168.1.209
```

Open the private `http://127.0.0.1:24833/#...` launch link in your local browser while the tunnel remains active.

### Mode 2 — Private LAN HTTPS (Mac/browser to Linux wallet)

Run:

```bash
npm run quantum:setup
```

Select **2** and enter your actual server private IPv4, an optional port, and the **exact private IPv4 of the allowed client**. Example only:

- Wallet Linux host: `192.168.1.209`
- Approved Mac: `192.168.1.82`
- Port: `24833`

The wizard finds eligible network interfaces, creates or reuses a TLS certificate for the **server address**, saves the settings to `apps/quantum-wallet/.env`, and prints a certificate fingerprint. It does **not** install firewall rules or change your router.

On a default-deny UFW host, allow the client explicitly (use your real IPs):

```bash
sudo ufw allow from 192.168.1.82 to 192.168.1.209 port 24833 proto tcp
sudo ufw status numbered
```

Then run:

```bash
npm run quantum:wallet
```

Open the private HTTPS link printed by the wallet, for example:

```text
https://192.168.1.209:24833/#<PRIVATE_SESSION_KEY>
```

A successful UFW rule **does not itself** change what IP the application listens on. Secure LAN mode must be enabled via the wizard or `.env`.

### Advanced: bind to `0.0.0.0`

This is opt-in for advanced private-network operators. **`0.0.0.0` is a bind target, never the address to type into a browser.** It listens on every IPv4 interface and requires an accurately configured firewall.

```dotenv
TRU_QUANTUM_UI_MODE=lan
TRU_QUANTUM_UI_HOST=0.0.0.0
TRU_QUANTUM_UI_PUBLIC_HOST=192.168.1.209
TRU_QUANTUM_ALLOWED_CLIENT_IP=192.168.1.82
TRU_QUANTUM_ALLOW_WILDCARD_BIND=YES_I_UNDERSTAND
TRU_QUANTUM_UI_PORT=24833
TRU_QUANTUM_TLS_CERT=/home/USER/.tru-quantum-ui/tls/lan-192-168-1-209.crt
TRU_QUANTUM_TLS_KEY=/home/USER/.tru-quantum-ui/tls/lan-192-168-1-209.key
```

The setup wizard also offers `0.0.0.0` but requires typing `WILDCARD` to acknowledge the additional risk. HTTPS, a certificate valid for the **private browser host**, exact client-IP checks, Host/Origin enforcement and the private session bearer remain mandatory. **Do not forward port 24833 to the Internet or publish it via a public reverse proxy.** Prefer an exact private bind address whenever possible.

## Trust the LAN HTTPS certificate

The wallet uses a self-signed leaf certificate with an IP subjectAltName. A user on the approved browser computer must verify and trust that specific certificate before opening the HTTPS page.

1. Read the SHA-256 fingerprint printed by the wallet/server during setup.
2. Transfer **only the `.crt` file** to the client over an authenticated channel (for example, `scp`); **never transfer `.key`, `.pq01`, the RPC cookie, or a private wallet file**.
3. Independently verify the certificate fingerprint before importing it.
4. On macOS, import it into **Keychain Access**, explicitly trust it for SSL, and reopen the browser as needed. Never bypass a certificate warning.

Example from your Mac, using the actual certificate path printed by the wizard:

```bash
scp USER@192.168.1.209:/home/USER/.tru-quantum-ui/tls/lan.crt \
  "$HOME/Downloads/tru-quantum-lan.crt"

openssl x509 -in "$HOME/Downloads/tru-quantum-lan.crt" \
  -noout -fingerprint -sha256

curl --cacert "$HOME/Downloads/tru-quantum-lan.crt" \
  -fsS https://192.168.1.209:24833/ -o /dev/null
```

**Note:** The filename may be `lan.crt` (reused from v0.2) or `lan-192-168-1-209.crt` (v0.3 generated); copy the path the wizard actually prints. A new or expired certificate must be reverified and retrusted. Never copy the server's private `.key` to the Mac.

## Configuration reference

Saved configuration path: **`apps/quantum-wallet/.env`**. For a manual setup:

```bash
cp apps/quantum-wallet/quantum-wallet.env.example apps/quantum-wallet/.env
chmod 600 apps/quantum-wallet/.env
# edit apps/quantum-wallet/.env with your chosen editor
npm run quantum:web
```

Example Local mode:

```dotenv
TRU_QUANTUM_UI_MODE=local
TRU_QUANTUM_UI_PORT=24833
```

Example secure LAN mode (replace these sample IPs, username and paths):

```dotenv
TRU_QUANTUM_UI_MODE=lan
TRU_QUANTUM_UI_HOST=192.168.1.209
TRU_QUANTUM_UI_PUBLIC_HOST=192.168.1.209
TRU_QUANTUM_ALLOWED_CLIENT_IP=192.168.1.82
TRU_QUANTUM_UI_PORT=24833
TRU_QUANTUM_TLS_CERT=/home/USER/.tru-quantum-ui/tls/lan.crt
TRU_QUANTUM_TLS_KEY=/home/USER/.tru-quantum-ui/tls/lan.key

# Optional Core RPC — MUST remain on loopback
# TRU_RPC_URL=http://127.0.0.1:21832/rpc
# TRU_RPC_COOKIE_FILE=/home/USER/.tru/rpc-cookie-21832
```

| Variable | Purpose | Default / requirement |
|---|---|---|
| `TRU_QUANTUM_UI_MODE` | `local` or `lan` | `local` |
| `TRU_QUANTUM_UI_PORT` | Browser companion TCP port | `24833` |
| `TRU_QUANTUM_UI_HOST` | Listen/bind IPv4 | Local: `127.0.0.1`; LAN: exact private IP or advanced `0.0.0.0` |
| `TRU_QUANTUM_UI_PUBLIC_HOST` | Real private IP used in browser URL and certificate verification | Required for wildcard LAN bind; recommended for exact bind |
| `TRU_QUANTUM_ALLOWED_CLIENT_IP` | One approved exact private browser client IP | Required for LAN mode |
| `TRU_QUANTUM_ALLOW_WILDCARD_BIND` | Explicit `0.0.0.0` opt-in | `YES_I_UNDERSTAND` |
| `TRU_QUANTUM_TLS_CERT` | Trusted HTTPS certificate path on server | Required for LAN |
| `TRU_QUANTUM_TLS_KEY` | Restricted server HTTPS private key | Required for LAN; owner-only permissions |
| `TRU_RPC_URL` | Core direct authenticated RPC endpoint | `http://127.0.0.1:21832/rpc` |
| `TRU_RPC_COOKIE_FILE` | Optional local Core RPC cookie path | `~/.tru/rpc-cookie-21832` on Unix, when port 21832 |
| `TRU_RPC_TOKEN` | Alternative Core RPC token | Secret; prefer cookie; never put in public JS |

Existing shell/process environment variables take priority over the saved `.env`. If you used `export TRU_QUANTUM_UI_MODE=lan` during earlier testing, **open a new terminal** to avoid unintended overrides. The root SDK `.env` file is not loaded by this app; use `apps/quantum-wallet/.env`. The wizard writes this file with mode `0600`, and the project `.gitignore` excludes it.

The direct low-level terminal CLI (`wallet.mjs`) and current interactive terminal (`terminal.mjs`) do **not automatically load this browser `.env`**; they use default Core loopback RPC/cookie or real process-environment overrides. This distinction is relevant if you change RPC port or token location.

## Wallet terminal and Core RPC commands

### Interactive terminal menu

```bash
npm run quantum:terminal
# equivalent:
node apps/quantum-wallet/terminal.mjs
```

Menu actions: **1 Status**, **2 Receive**, **3 List**, **4 Inspect UTXO**, **5 Sign fund/send/exit**, **6 Signed records**, **7 Decode saved transaction**, **8 Broadcast saved bytes**, **9 Recover WOTS saved bytes**, **0 Quit**. It keeps a local private journal under `~/.tru-quantum-ui`.

### Low-level CLI: every action

| Command | Action |
|---|---|
| `node apps/quantum-wallet/wallet.mjs help` | Show CLI usage and confirmations |
| `node apps/quantum-wallet/wallet.mjs status` | Query activation/consensus info |
| `node apps/quantum-wallet/wallet.mjs receive` | Generate a **new**, one-payment `truq1` descriptor |
| `node apps/quantum-wallet/wallet.mjs list` | List Core-owned quantum descriptor states |
| `node apps/quantum-wallet/wallet.mjs input input.json` | Inspect an input (`txid`, `vout`); activation-gated |
| `node apps/quantum-wallet/wallet.mjs fund fund.json signed-fund.json` | Sign plain TRU → PQ01 funding and save bytes; no broadcast |
| `node apps/quantum-wallet/wallet.mjs send send.json signed-send.json` | Sign PQ01 → fresh PQ01 and save bytes |
| `node apps/quantum-wallet/wallet.mjs exit exit.json signed-exit.json` | Sign PQ01 → ordinary TRU and save bytes |
| `node apps/quantum-wallet/wallet.mjs retry retry.json recovered.json` | Recover Core's **exact previously saved** WOTS-signed transaction |
| `node apps/quantum-wallet/wallet.mjs submit signed-fund.json` | Decode and explicitly broadcast saved signed bytes (interactive `SEND`) |

For each signing operation, supply the JSON input file and a **new output filename**: the CLI deliberately refuses to overwrite an existing signed result. Signing requires typing `SIGN`; submission separately requires typing `SEND`. The `retry` command retrieves saved WOTS bytes and must never recompute a different signature.

### Check Core directly

From the directory containing your installed `tru-cli`:

```bash
./tru-cli raw getinfo '{}'
./tru-cli raw getpeerinfo '{}'
./tru-cli raw getconsensus09info '{}'
./tru-cli raw quantumwallet '{"action":"receive"}'
./tru-cli raw quantumwallet '{"action":"list"}'
```

Quantum Core RPC mapping:

| SDK action | Native Core RPC |
|---|---|
| `status` / `consensus()` | `getconsensus09info` |
| `receive`, `list`, `fund`, `send`, `exit`, `retry` | `quantumwallet`, with corresponding `action` |
| `input` | `getquantuminput` |
| `submit` | `sendquantumtransaction` |

**Be careful:** `quantumwallet` funding/sending/exiting and transaction submission are **not available before activation**. Do not use the low-level `raw` escape hatch to bypass wallet safety checks.

## Pre-activation workflow

Safe commands before block 50,000:

```bash
node apps/quantum-wallet/wallet.mjs status
node apps/quantum-wallet/wallet.mjs receive
node apps/quantum-wallet/wallet.mjs list

# or use the interactive menu or web wallet:
npm run quantum:terminal
npm run quantum:wallet
```

- `receive` creates a real Core-owned `truq1:...` descriptor, not the older explorer Quantum ID.
- Each descriptor is intended for **one incoming payment**. Generating a new descriptor changes the encrypted Core `.pq01` file: **back up the current sidecar with the Core wallet**.
- `list` reports descriptor signing states, **not** UTXO balances or spendable confirmations.
- `fund`, `send`, `exit`, input inspection, and broadcast remain Core activation-gated. Installing a new SDK or Core binary alone does not activate these rules.
- Activation status refers to the **next candidate block**: Core may report `active: true` at tip height **49,999**, when candidate height is **50,000**. Always inspect the actual response.

## Post-activation transaction walkthrough

> **Not live-mainnet-validated yet.** These are the intended Core/SDK API workflows. Begin with a small, confirmed, plain-TRU UTXO only after network activation and tests succeed. These workflows operate on **plain TRU**, not FT/NFT/SFT/NCFT, TRUScripts or contracts.

**1. Verify activation and identify a confirmed plain-TRU UTXO** owned by your local Core wallet. For example, list UTXOs using the existing Core CLI method appropriate to your wallet address, then record a `txid` and `vout`. Token/control outputs, immature coinbase outputs and conflicting or unconfirmed outputs should not be used.

**2. Create a fresh quantum destination:**

```bash
node apps/quantum-wallet/wallet.mjs receive
```

**3. Inspect the source UTXO.** Save `input.json`:

```json
{
  "txid": "<64_HEX_CONFIRMED_TXID>",
  "vout": 0
}
```

```bash
node apps/quantum-wallet/wallet.mjs input input.json
```

**4. Fund a fresh WOTS+ descriptor.** Save `fund.json`:

```json
{
  "txid": "<64_HEX_CONFIRMED_PLAIN_TRU_TXID>",
  "vout": 0,
  "fee_atoms": 10000,
  "destination": "<FRESH_TRUQ1_DESCRIPTOR>"
}
```

```bash
node apps/quantum-wallet/wallet.mjs fund fund.json signed-fund.json
# Inspect the saved signed transaction before submitting:
node apps/quantum-wallet/wallet.mjs submit signed-fund.json
```

The CLI shows a transaction preview and asks for `SIGN`, saves the signed result **without broadcasting**, then `submit` decodes it and asks for `SEND`. A successful broadcast returns a txid, **not** proof of confirmation. Check its inclusion and wait for confirmation before spending the resulting output.

**5. Send quantum → quantum.** Obtain a **fresh** recipient descriptor and save `send.json`:

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

**6. Exit quantum → ordinary TRU.** Use a confirmed, owned PQ01 source and save `exit.json`:

```json
{
  "txid": "<CONFIRMED_QUANTUM_OUTPUT_TXID>",
  "vout": 0,
  "fee_atoms": 10000,
  "source": "<OWNED_FUNDED_TRUQ1_DESCRIPTOR>",
  "destination": "<ORDINARY_TRU_ADDRESS>",
  "confirm_exit": true
}
```

```bash
node apps/quantum-wallet/wallet.mjs exit exit.json signed-exit.json
node apps/quantum-wallet/wallet.mjs submit signed-exit.json
```

The **entire selected UTXO minus fee** goes to the selected destination: there is **no separate `amount` argument and no change output** in this version. `fee_atoms` is an integer, and `10000` is the minimum wallet floor—not a guarantee that the chain's relay policy will accept a large WOTS+ transaction. Core wallet sending caps may apply. An exit sends value back to an ordinary address and therefore removes WOTS protection from the resulting output.

**7. Recover the exact signed WOTS+ bytes after an uncertain response.** Save `retry.json`:

```json
{
  "source": "<OWNED_SOURCE_TRUQ1_DESCRIPTOR>"
}
```

```bash
node apps/quantum-wallet/wallet.mjs retry retry.json recovered.json
# Only after independently verifying the recovered saved bytes:
node apps/quantum-wallet/wallet.mjs submit recovered.json
```

If a WOTS signing call times out, **do not sign a replacement with the same one-time key**. Inspect Core's state and use `retry` only to retrieve its saved bytes. Initial ECDSA → PQ01 funding has a different uncertain-result handling path; investigate the original UTXO/mempool first rather than assuming `retry` applies.

## Wallet backups and safety

**Keep distinct things distinct:**

| Item | Location | Why it matters |
|---|---|---|
| Encrypted ordinary Core wallet and seed | Core wallet directory (for example, `tru.dat.enc`, `wallet_seed.dat.enc`, `tru.dat.public`) | Standard wallet custody and public addresses |
| **Encrypted quantum companion `tru.dat.pq01`** | **Alongside the actual running Core wallet**, not necessarily in this SDK directory | One-time WOTS descriptor/signing state; must remain durable and current |
| Local UI signing journal | `~/.tru-quantum-ui/` | Signed bytes, attempted operations, uncertainty tracking; **not** the WOTS private keys |
| `apps/quantum-wallet/.env` | Local app checkout; Git-ignored | LAN, TLS, optional RPC authentication settings |
| TLS certificate/private key | `~/.tru-quantum-ui/tls/` | Browser HTTPS; never expose `.key` |

- Back up the Core wallet **and the latest `.pq01` together** after descriptor creation and signing-state updates. Store backups securely off the host.
- **Do not restore an older `.pq01` and resume signing.** Reusing a one-time WOTS key can compromise custody. Never keep two active clones of the same signer state.
- Do not share the session launch URL, RPC cookie/token, TLS private key, encrypted wallet or quantum sidecar on GitHub, Telegram or a public server.
- The companion never sends Core credentials or WOTS signing keys to the browser. The browser controls operations through a locally authenticated server and must not become an Internet-accessible remote signing API.
- In v0.3 LAN mode, HTTPS and client IP/Host/Origin/session checks are defense in depth; **you must also configure the host firewall**.
- A new session key is created at startup. **Restart the web process if the URL was leaked.**
- Changing or losing the computer's TLS certificate may require a client trust update; changing an IP generally requires rerunning setup.

## Public explorer portal

The optional static `quantum-wallet.html` portal (plus `quantum-wallet-public.js` and `quantum-wallet-public.css`) may be deployed **separately** from the private wallet on your explorer site. It only explains PQ01 and validates a pasted Core-generated descriptor locally; it **does not sign or hold user keys**.

Keep the original hosted `wallet.html`, `wallet.js`, tokens, marketplace functions and explorer APIs unchanged. Every user who wants real quantum custody needs their **own** trusted Core-backed wallet companion.

## Troubleshooting

| Symptom | Cause / next step |
|---|---|
| `EADDRINUSE` | Another wallet process owns port 24833. Stop it before relaunching. |
| `403 Client IP not authorized` | Check actual browser client's private LAN IP; rerun `npm run quantum:setup`; check firewall. |
| `403 Host blocked` or `Origin blocked` | Use exact HTTPS launch URL with your real server IP and port, **not** `0.0.0.0` or `localhost` in LAN mode. |
| `401` from API | Launch URL missing/expired private session fragment; copy fresh URL printed by current process. |
| TLS/certificate error | Check subjectAltName IP, dates, trusted certificate fingerprint and private key mode; **never click through warnings**. |
| Cannot reach browser page | Confirm wallet is running; UFW default-deny has allow from actual client IP; chosen host is assigned locally; LAN mode active. |
| `getaddrinfo` / no suitable private IP | Ensure the server has a real private IPv4 interface; choose Local mode or SSH tunnel instead. |
| Core connection/authentication fails | Check local Core RPC on `127.0.0.1:21832`, Core process wallet permission, unlocked wallet, RPC cookie/path; never expose Core RPC to LAN. |
| `fund`, `send`, `exit` blocked | Expected before candidate height 50,000 and if Core wallet permissions are missing. Check `status`. |
| `.env` changes seem ignored | Existing exported process env overrides `.env`. Open a fresh terminal before relaunching. |
| Terminal wallet ignores `.env` RPC value | Current `wallet.mjs` and `terminal.mjs` use process env / default cookie directly, not the browser config loader. |
| WOTS operation returned uncertain error | Never re-sign same source; inspect saved records and Core state; use exact-byte `retry` where supported. |

### Change configuration or stop the wallet

```bash
npm run quantum:setup       # edit Local vs LAN settings
npm run quantum:wallet      # launch saved configuration
# Ctrl+C in the server terminal stops the companion, not TRU Core.
```

### Legacy patch installations — reverting v0.3

If you installed v0.3 as an incremental patch on top of v0.2:

```bash
cd ~/projects/TRU_QUANTUM_CONFIG_WIZARD_PATCH_v0.3
python3 apply_patch.py --target "$HOME/projects/TRU-SDK-QPOC" --revert
```

This returns source files to v0.2 without erasing `.env`, TLS material, local journal or Core signing state. Do not remove Core's `.pq01` file during rollback.

## Validation and release limitations

The v0.3 development test log reported **22 passed / 0 failed** for SDK and wallet behavior including configuration parsing, automatic/reused TLS certificates, LAN client restrictions, strict Host/Origin/session checks, mock Core activation gating, save-without-broadcast and recovery paths. **These tests use simulated Core responses for quantum signing; they are not a demonstration of confirmed live quantum mainnet transactions.**

This release is a **self-hosted Core companion**, not a public remote signer, not an independently seed-recoverable JavaScript quantum wallet, and not a quantum-token implementation. The current Core PQ01 workflow covers **plain TRU outputs**; FT/NFT/SFT/NCFT remain on their existing token paths. Before production use: verify activation at 50,000, run small-value on-chain fund/send/exit tests, inspect actual fees/confirmations, restart/recovery behavior and reorg safety.

---

**TRU — Tokenized Real Utility** · https://tokenizedrealutility.com/ · [TRU SDK repository](https://github.com/TokenizedRealUtility/TRU-SDK)
