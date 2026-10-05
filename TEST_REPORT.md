# TRU SDK v1.0.0 — Verification Report

Date: 2026-10-04

## Source basis

The SDK surface was derived from the reviewed current TRU Core RPC dispatcher/reference and the current NEROMESH / AXON API documentation available in the project materials.

The Core reference enumerates authenticated privileged JSON-RPC, the public wallet/mining allowlists, current Explorer routes, and the method/parameter-key observations used to construct the SDK's catalog.

The SDK intentionally keeps a raw RPC escape hatch because complex payloads can evolve faster than friendly wrappers.

## Static/build verification

### TypeScript

```text
npm run build
PASS
```

Compiler settings include strict TypeScript checking and ES2022 output with generated declaration files.

### Automated tests

```text
npm test
PASS — 6/6 tests
```

Covered:

- exact TRU decimal/atom conversion
- precision rejection beyond 8 decimals
- current TRU mainnet address-shape helper
- major RPC families present in the 106-method catalog
- authenticated Bearer JSON-RPC request construction
- Core busy/retry RPC error classification
- friendly module-to-RPC mapping

### npm package dry run

```text
npm pack --dry-run
PASS
```

The package contains compiled ESM JavaScript and `.d.ts` TypeScript declarations and has no runtime npm dependencies.

## Security design checks

- Privileged Core bearer tokens are caller-supplied; no credential is embedded in the package.
- Public browser access is represented separately through the Explorer allowlisted wallet/mining gateway.
- Money helpers use `bigint` with the canonical 8-decimal/100,000,000-atoms denomination.
- High-level state-changing calls do not automatically retry.
- Raw RPC remains available for forward compatibility.
- NEROMESH capabilities/credentials are passed as Bearer tokens and are not placed in URLs by SDK helpers.

## Important limitations

This verification does not replace live integration testing against every TRU Core RPC method. The current source reference describes parameter keys on a best-effort basis, and several advanced RPCs accept complex payloads whose exact validation remains authoritative in Core.

Before publishing as a stable npm package, run an integration suite against a synchronized TRU Core 0.07.5 node and a test/regtest wallet for state-changing operations.

NEROMESH / AXON evolves independently from Core; the `raw()` HTTP helper exists so clients can reach newer endpoints without waiting for an SDK release, but friendly wrappers should be revalidated whenever NEROMESH API versions change.
