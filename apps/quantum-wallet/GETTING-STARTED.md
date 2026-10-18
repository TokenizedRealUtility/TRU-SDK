# TRU Quantum Wallet — GitHub quick start (v0.3)

Local Core-backed **WOTS+ PQ01** wallet companion. This is not the older SHA-256 "Quantum ID" label in the explorer web wallet. It does not modify TRU token operations, `wallet.html`, `wallet.js`, Core consensus, or the original wallet.

## Get started

Requirements: Node.js 18+; a **local, authenticated** TRU Core 0.08.5 RPC endpoint at `127.0.0.1:21832` (unless intentionally configured otherwise *on loopback*); unlocked/authorized Core wallet for receive/signing; for LAN mode, OpenSSL and a private IPv4 interface. Never make Core RPC public.

```bash
npm ci
npm test
npm run quantum:wallet
```

**The first launch starts a setup wizard**. Choose either:

- **1 — Local:** default; HTTP at `127.0.0.1:24833`; use on the same machine or via an SSH localhost tunnel.
- **2 — Private LAN HTTPS:** asks for a real private server IP (example `192.168.1.209`) and an exact approved client IP (example `192.168.1.82`). It generates or reuses an IP-bound server certificate, then saves all settings to `apps/quantum-wallet/.env`. The approved computer opens an `https://SERVER_IP:24833/#...` private session URL.

**Subsequent launches** only need `npm run quantum:wallet`. You can also explicitly run `npm run quantum:setup` to reconfigure, `npm run quantum:web` to launch without wizard, or `npm run quantum:terminal` for the terminal menu. All `.env` keys may be edited by hand (stop the application before editing); see `quantum-wallet.env.example`. The config file is git-ignored.

The wizard does *not* request sudo or alter system firewall rules. Operators must allow TCP 24833 only from approved clients; keep inbound default-deny and never expose it through router port forwarding, UPnP, cloud public firewall or public reverse proxy. Set the private-LAN server address from the actual interface—not the client's IP.

## Optional advanced `0.0.0.0` bind

**An explicit opt-in, not the default.** `0.0.0.0` means listen on **all** IPv4 interfaces and does not work as a browser destination. The following example accepts only one private IPv4 client at the application layer. The machine's host firewall *must also restrict access*.

```dotenv
TRU_QUANTUM_UI_MODE=lan
TRU_QUANTUM_UI_PORT=24833
TRU_QUANTUM_UI_HOST=0.0.0.0
TRU_QUANTUM_UI_PUBLIC_HOST=192.168.1.209
TRU_QUANTUM_ALLOW_WILDCARD_BIND=YES_I_UNDERSTAND
TRU_QUANTUM_ALLOWED_CLIENT_IP=192.168.1.82
TRU_QUANTUM_TLS_CERT=/home/USER/.tru-quantum-ui/tls/lan-192-168-1-209.crt
TRU_QUANTUM_TLS_KEY=/home/USER/.tru-quantum-ui/tls/lan-192-168-1-209.key
```

Prefer `TRU_QUANTUM_UI_HOST=192.168.1.209` instead; it does not need `TRU_QUANTUM_ALLOW_WILDCARD_BIND`. For either mode, the certificate must have an IP subjectAltName for `TRU_QUANTUM_UI_PUBLIC_HOST`. The server validates the actual TCP peer IP, HTTP Host, POST Origin, authenticated bearer, certificate and TLS private-key permissions; it ignores spoofable `X-Forwarded-For` headers. A firewall is **additional protection** and cannot replace HTTPS.

A wildcard bound app can be exposed accidentally by other network interfaces. Never use this wallet as a public internet wallet or reverse-proxy signing API. Host IPs such as `0.0.0.0`, public IPv4 addresses, and names will not be accepted as the HTTPS *browser* host.

## Trust HTTPS on the client once

The setup wizard prints the TLS certificate location and SHA-256 fingerprint. From the approved client, transfer **only** the `.crt` file (never `.key`, Core credentials, or `.pq01`) over an authenticated method. Independently verify its fingerprint against the value printed on the server, and install/trust that exact **leaf** certificate for SSL in the client's trust store. On macOS use Keychain Access; on Linux use your platform's certificate-store mechanism. Browser TLS warnings must not be bypassed.

Test on the client:

```bash
curl --cacert /path/to/verified-certificate.crt -I https://192.168.1.209:24833/
```

The session link, generated on **every start**, contains a private random secret after `#`. Do not post that URL on GitHub/Telegram; stop/restart the wallet if leaked. Access is limited to one approved exact client IP in this release. If your LAN IP changes, rerun setup. Certificates may need reissuing and retrusting after changes or expiry.

## The `.env` file and process environment

The automatically generated settings live in `apps/quantum-wallet/.env` (permissions `0600`). Existing process environment variables take precedence over values in that file, so start a new shell if you previously used `export TRU_QUANTUM_UI_...` while testing v0.2. Files in other directories, including root SDK `.env`, are **not** automatically loaded into the companion. You may set `TRU_RPC_URL`, `TRU_RPC_TOKEN` or `TRU_RPC_COOKIE_FILE` in the app `.env`, but prefer Core's local RPC cookie; never commit tokens.

## Security and quantum-wallet state

The **web companion is a controller**, not a browser-based WOTS private-key store. Native `truq1:...` receive descriptors and the encrypted `.pq01` signing sidecar live in the user's own Core wallet. Do not clone/restore stale `.pq01` signing state; back it up with the Core wallet and keep one-time WOTS descriptors for one payment only. Signing and broadcasting are deliberately two separate actions. Funding/spending/broadcasting remain Core-gated until block 50,000; pre-activation status/receive/list remain available. The system has mock Core coverage, **not production validation of mainnet WOTS transactions**.

## Common errors

- `EADDRINUSE`: stop the previous wallet listener.
- `403 Client IP not authorized`: check client's actual LAN IP and edit `.env` / run setup; check firewall.
- `403 Host blocked / Origin blocked`: use the exact HTTPS launch URL with the **server IP** not `0.0.0.0`.
- `401`: use the current process's private session URL including fragment.
- TLS error: verify SAN, fingerprint, date, browser trust store; **do not bypass** certificate validation.
- Pre-activation `fund` blocked: expected until the candidate block reaches the 50,000 activation point.
- Unable to connect Core: verify `TRU_RPC_URL` is local loopback and Core's authenticated RPC is running; never open 21832 to the LAN.

Existing v0.2 users: **do not roll back**. Apply the v0.3 incremental patch, then run `npm run quantum:setup` to save your existing LAN IP, approved Mac IP and TLS information. The wizard will reuse your matching v0.2 `lan.crt` and `lan.key` without overwriting them. Existing terminal wallet functions remain intact.
