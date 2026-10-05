# TRU SDK Security Notes

## Privileged Core RPC

Treat the TRU Core RPC bearer/cookie token as a server secret.

- Keep privileged Core RPC on loopback or a properly secured private network.
- Never embed the bearer token into browser JavaScript.
- Never commit RPC cookies, wallet passwords, seed phrases or private keys.

## Browser applications

Use the Explorer's allowlisted `/api/wallet/rpc` or `/api/mining/rpc` gateways for browser-safe operations. The allowlist is a security boundary; do not work around it by exposing privileged Core RPC publicly.

## Money

Use `parseTru()` / `formatTru()` and integer atoms for application accounting. Do not use JavaScript binary floating-point as the authoritative representation of TRU amounts.

## Transaction retries

Do not blindly retry state-changing RPCs. A network timeout can occur after Core already accepted/broadcast an operation. Inspect the chain/mempool or use an idempotent protocol before repeating a spend, HTLC funding operation, token mutation or marketplace funding action.

## NEROMESH / AXON

The following are secrets/capabilities and should not appear in logs, URLs or repositories:

- `nmc_` customer credentials
- `nmw_` worker bearer credentials
- `nmi_` one-use worker invitations
- `nmp_` worker account credentials
- `axc_` wallet-handoff capabilities
- private keys / seed phrases / wallet passwords

Public worker IDs, public claim keys, public funding outpoints, job IDs and confirmed transaction IDs are not wallet secrets, but applications should still follow the coordinator's privacy policy.
