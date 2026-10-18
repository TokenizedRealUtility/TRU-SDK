# TRU Quantum Wallet v0.2 — HTTPS Secure LAN Mode

**Target installation:** `bt878` (`192.168.1.209`) accessed **directly** from a Mac (`192.168.1.82`) on the same trusted LAN. This is a narrowly scoped add-on for TRU-SDK-QPOC quantum-wallet v0.1. Existing `wallet.html`, `wallet.js`, ordinary TRU and token code are not modified. Original localhost mode remains the default.

**Important:** This is a signing-capable wallet companion. HTTPS protects the in-flight bearer credential; the firewall, approved-client check and private session are additional controls. They are not a replacement for protecting bt878, the Mac, and the Core wallet. **Do not router-forward or publicly expose port 24833 or Core RPC port 21832.** The application refuses to bind to `0.0.0.0` or a public IPv4.

## 1. Confirm network IPs and existing firewall rule

On the Mac:

```bash
ipconfig getifaddr en0
```

If it is not `192.168.1.82`, determine the correct interface and substitute the actual IP everywhere below. On bt878, check:

```bash
ip -4 addr show
sudo ufw status numbered
```

The following rule may already exist from your earlier setup. **Do not add duplicates:**

```bash
sudo ufw allow from 192.168.1.82 to 192.168.1.209 port 24833 proto tcp
```

Default deny incoming must remain active, with no broader allow rule for port 24833. This protects **incoming clients**, while the HTTPS server itself additionally checks the Mac's actual TCP peer IP (ignoring forwarded client-IP headers).

## 2. Create dedicated HTTPS certificate on bt878

Do this from your `TRU-SDK-QPOC` working directory on bt878:

```bash
bash apps/quantum-wallet/setup_lan_cert.sh 192.168.1.209
```

This generates **a 365-day, self-signed, non-CA TLS server certificate** with `subjectAltName=IP:192.168.1.209`. The certificate/key are saved outside the SDK tree:

```text
~/.tru-quantum-ui/tls/lan.crt   (public server certificate)
~/.tru-quantum-ui/tls/lan.key   (PRIVATE SERVER TLS KEY — mode 0600)
```

The generation script refuses to overwrite an existing TLS identity. It prints the SHA-256 certificate fingerprint. **This key is not the Core `.pq01` wallet sidecar.** The Core WOTS sidecar remains in the protected Core wallet storage and must be separately backed up.

## 3. Obtain and trust the exact certificate on your Mac

From a Mac terminal:

```bash
scp bt878@192.168.1.209:/home/bt878/.tru-quantum-ui/tls/lan.crt \
  "$HOME/Downloads/tru-quantum-bt878.crt"

openssl x509 -in "$HOME/Downloads/tru-quantum-bt878.crt" \
  -noout -fingerprint -sha256 -ext subjectAltName
```

**Compare the SHA-256 fingerprint shown on the Mac to the one displayed directly on bt878** before trusting it. Confirm that `IP Address:192.168.1.209` appears. Transfer **only** `lan.crt` to your Mac, NEVER `lan.key` or TRU wallet files.

To trust this self-signed **leaf server certificate** for HTTPS on macOS, open **Keychain Access** (or Certificates in newer macOS), import `tru-quantum-bt878.crt` into your own login keychain, open its trust settings, and explicitly trust that exact certificate for SSL. The macOS UI wording varies. Avoid installing a broadly trusted CA; this certificate has `CA:FALSE`. Restart the browser if necessary.

Do not click through browser TLS warnings and **do not use `curl -k` or `NODE_TLS_REJECT_UNAUTHORIZED=0`** as workarounds. If trust fails, fix the certificate trust configuration before using a signing wallet. When the certificate expires or the LAN IP changes, generate/trust a new certificate after safely archiving the old pair.

## 4. Start HTTPS LAN mode on bt878

Stop any existing local `node apps/quantum-wallet/web.mjs` process with Ctrl+C, then:

```bash
cd "$HOME/projects/TRU-SDK-QPOC"

export TRU_QUANTUM_UI_MODE=lan
export TRU_QUANTUM_UI_HOST=192.168.1.209
export TRU_QUANTUM_ALLOWED_CLIENT_IP=192.168.1.82
export TRU_QUANTUM_UI_PORT=24833
export TRU_QUANTUM_TLS_CERT="$HOME/.tru-quantum-ui/tls/lan.crt"
export TRU_QUANTUM_TLS_KEY="$HOME/.tru-quantum-ui/tls/lan.key"

node apps/quantum-wallet/web.mjs
```

The terminal prints a **NEW private launch link**:

```text
https://192.168.1.209:24833/#<NEW_RANDOM_SESSION_SECRET>
```

On your Mac, open the **entire HTTPS launch URL, including the current `#` fragment**, in Safari or Chrome. The fragment is removed from the address bar by the app after session setup. An old URL from a previous run will not authorize the new process. Keep the URL secret; if exposed, restart the app to rotate its session.

**Do not put the full URL (with the `#` secret) in Telegram, GitHub, screenshots, or a shared browser session.**

Core RPC remains only on bt878's `127.0.0.1:21832`. The app never sends Core RPC bearer/cookie credentials to the Mac. Core must be running and appropriately authorized/unlocked for its wallet methods. Funding, WOTS signing, and broadcasting remain gated by Core's consensus activation at block 50,000.

### Test the secure connection from your Mac

This test validates TLS using the exact transferred certificate, even before Keychain trust is configured:

```bash
curl --cacert "$HOME/Downloads/tru-quantum-bt878.crt" \
  -sS -o /dev/null -w 'HTTPS status: %{http_code}\n' \
  https://192.168.1.209:24833/
```

Expected `HTTPS status: 200` when the server runs and the Mac's IP matches the allowlist. API endpoints require the separate session bearer. A plain `http://` URL will not work. To check the listener on bt878:

```bash
sudo ss -ltnp | grep 24833
```

Expected a listener on `192.168.1.209:24833` (not `0.0.0.0:24833`). Trying the URL from another LAN client should be denied; other hosts may still reach the TCP handshake before the app returns HTTP 403 if firewall policy changes.

## 5. Troubleshooting

- **403 Client IP not authorized:** Your Mac's IP changed, or another machine attempted access. Recheck `ipconfig getifaddr en0`, UFW, and `TRU_QUANTUM_ALLOWED_CLIENT_IP`; restart the process after changing environment variables.
- **403 Host blocked / Origin blocked:** Use precisely `https://192.168.1.209:24833` and a fresh private launch link. Not `localhost`, a hostname alias, or `http://`.
- **TLS certificate error:** Check IP subjectAltName, fingerprint and Keychain trust. Never bypass the warning.
- **EADDRINUSE:** The old companion is still running; stop it before relaunching.
- **401 Missing/invalid session:** Use the URL printed by the current process, including its fragment. Restarting rotates secrets.
- **Core status offline:** Check the loopback TRU Core RPC server and the Core RPC token/cookie. Do **not** open Core RPC to the LAN.
- **Receive/list allowed but fund blocked:** Before activation this is expected; Core `getconsensus09info` controls the feature gate.
- **Node HTTPS test from bt878 is 403:** By design the app authorizes *only* the Mac IP. Test the route from the Mac.

## 6. Return to localhost mode / remove access

Stop the LAN process and run without the LAN environment variables:

```bash
unset TRU_QUANTUM_UI_MODE TRU_QUANTUM_UI_HOST TRU_QUANTUM_ALLOWED_CLIENT_IP
unset TRU_QUANTUM_TLS_CERT TRU_QUANTUM_TLS_KEY
node apps/quantum-wallet/web.mjs
```

Local mode uses `http://127.0.0.1:24833` with the original Host/Origin/bearer protections. To close the additional LAN firewall allowance:

```bash
sudo ufw delete allow from 192.168.1.82 to 192.168.1.209 port 24833 proto tcp
```

The v0.2 ZIP includes an installer with `--revert` to restore both original JavaScript files and remove only the v0.2 additions. Reverting **does not** delete the wallet state, signing journal, TLS identity, or Core wallet sidecar. To remove any trust of this test certificate later, delete that exact imported certificate from macOS Keychain.

## 7. Scope of testing

Unit/integration tests exercise HTTPS with a matching IP certificate, successful authenticated Core mock requests, wrong bearer, wrong Host/Origin, missing TLS configuration, unsafe bind requests and insecure TLS key permissions. They **do not** perform mainnet WOTS fund/send/exit or establish that Core/reorg handling is safe at the activation boundary. Test with small amounts after activation and maintain current backups of encrypted primary wallet + `.pq01` state.
