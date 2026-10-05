# Contributing

1. Keep Core authoritative; do not duplicate consensus or transaction-validation rules in the SDK.
2. Add friendly wrappers only for RPCs/endpoints verified against current source/API documentation.
3. Preserve `raw.call()` / `NeromeshClient.raw()` forward compatibility.
4. Never add credentials, wallet files, seed phrases, private keys or live capability tokens to tests/examples.
5. Monetary helpers must use integer atoms / exact decimal parsing.
6. Add or update tests for transport, parameter mapping and error behavior.
7. Run `npm run typecheck && npm test && npm pack --dry-run` before submitting changes.
