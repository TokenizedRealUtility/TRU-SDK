# TRU SDK API Reference

Version: **1.0.0**

This reference describes the first TypeScript/JavaScript SDK surface. The RPC catalog is source-derived from the reviewed TRU Core 0.07.5 dispatcher. Parameter names are best-effort observations from handlers; methods with complex or evolving payloads also remain accessible through `tru.raw.call()`.

## Top-level client

`TruClient` exposes:

- `system` — Core info, desktop-safe info, chain data-provider snapshots, compatibility
- `chain` — blocks, height, template, submission
- `network` — peer info
- `wallet` — addresses, balance, UTXOs, send, AXON wallet handoff
- `transactions` — raw transactions, mempool, transaction/UTXO history
- `tokens` — issuance, transfer, burn, metadata, evolution
- `scripts` — TRUScript inscriptions and transfers
- `contracts` — contract creation/list/redeem/Voting helpers
- `magic` — Magic Locks and Magic Secrets
- `mining` — templates, submission, miner registration and telemetry
- `ai` — AI providers and AI token RPCs
- `identity` — DID/social RPCs
- `htlc` — HTLC funding/claim/refund primitives
- `swaps` — swap records and wallet role-key helpers
- `raw` — arbitrary JSON-RPC access
- `events` — block polling abstraction
- `explorer` — optional Explorer REST client
- `neromesh` — optional NEROMESH/AXON client

## Core connection modes

### Privileged direct Core

```ts
const tru = new TruClient({
  core: { endpoint: "http://127.0.0.1:21832/rpc", token: "..." }
});
```

### Public wallet/mining gateway

```ts
const tru = TruClient.public({
  explorerUrl: "https://tokenizedrealutility.com",
  gateway: "wallet"
});
```

The public gateway is allowlisted and does not expose every privileged RPC.

## Exact amount helpers

```ts
parseTru("1.00000001")  // 100000001n
formatTru(100000001n)   // "1.00000001"
```

## RPC catalog (106 methods)

| Method | Category | Gateways | Observed parameter keys |
|---|---|---|---|
| `getpeerinfo` | network | privileged, wallet | — |
| `sendtoken` | tokens | privileged | `amount`, `recipient`, `senderAddress`, `tokenID` |
| `burntoken` | tokens | privileged | `confirm`, `senderAddress`, `tokenID` |
| `gettokenburninfo` | tokens | privileged | — |
| `getnewaddress` | wallet | privileged | — |
| `reportmineractivity` | mining | privileged, wallet, mining | `hashesTried`, `minerAddress`, `timeTaken` |
| `getblocktemplate` | mining | privileged, wallet, mining | `browserExtraNonce`, `browserMinerAddress` |
| `submitblock` | mining | privileged, wallet, mining | `blockHex`, `browserCandidate`, `nonce` |
| `getblockbyheight` | chain | privileged | `height` |
| `getblock` | chain | privileged | `hash` |
| `getchaininfo` | chain | privileged, wallet, mining | — |
| `sendrawtransactionWeb` | transactions | privileged, wallet | `txHex` |
| `sendrawtransaction` | transactions | privileged, wallet | `txHex` |
| `sendtoaddress` | wallet | privileged | `address`, `amount`, `browserCandidate`, `browserMinerAddress`, `dry_run`, `minerAddress` |
| `axonwalletinspect` | wallet/axon | privileged | `uri` |
| `axonwalletfund` | wallet/axon | privileged | `confirm`, `expected_intent_sha256`, `expected_job_id`, `uri` |
| `preparemagicsecret` | magic | privileged, wallet | — |
| `getmagicsecret` | magic | privileged, wallet | — |
| `publishmagicsecret` | magic | privileged | — |
| `startmining` | mining | privileged | `minerAddress`, `quiet`, `type` |
| `getmempooltransactions` | transactions | privileged, wallet, mining | — |
| `getrawmempool` | transactions | privileged, wallet, mining | `verbose` |
| `listunspentWeb` | wallet | privileged, wallet | `address` |
| `listunspent` | wallet | privileged | `address` |
| `createrawtransaction` | transactions | privileged, wallet | `inputs`, `outputs` |
| `signrawtransactionwithkeyWeb` | transactions | privileged | `privKeys`, `txHex` |
| `signrawtransactionwithkey` | transactions | privileged | `privKeys`, `txHex` |
| `gettokenutxo` | tokens | privileged, wallet | `address`, `tokenID`, `txid`, `vout` |
| `gettokenmetadata` | tokens | privileged, wallet | `txid` |
| `verifytokenevolution` | tokens | privileged, wallet | `require_confirmed`, `tokenID` |
| `previewtokenevolution` | tokens | privileged, wallet | `media_inputs`, `owner`, `provider`, `tokenID`, `trigger` |
| `committokenevolutionsigned` | tokens | privileged, wallet | `confirmation`, `owner`, `publicKey`, `record_json`, `signature`, `tokenID` |
| `inscribeTRUScript` | truscripts | privileged | `data`, `owner` |
| `inscribeTRUScriptSigned` | truscripts | privileged, wallet | `inscriptionData`, `owner`, `requireBoundOpReturn`, `signedTxHex` |
| `createsocialpost` | identity | privileged | `fromDID`, `message`, `privateKey`, `tags` |
| `getDIDMapping` | identity | privileged, wallet | `did` |
| `registerDIDSigned` | identity | privileged, wallet | `address`, `did`, `publicKey`, `signature` |
| `createDID` | identity | privileged | `address`, `did` |
| `tokenmetadisplay` | tokens | privileged, wallet | `addresses` |
| `createTransferTRUScriptTransaction` | truscripts | privileged, wallet | `fee`, `feeUtxo`, `inscriptionTxid`, `recipient`, `senderAddress` |
| `transferTRUScript` | truscripts | privileged | `inscriptionTxid`, `recipient` |
| `getblockcount` | chain | privileged, wallet, mining | — |
| `gettransaction` | transactions | privileged, wallet | `txid` |
| `decoderawtransaction` | transactions | privileged, wallet, mining | `txHex` |
| `swaptestexitmempoolaccept` | htlc/swap | privileged | `expectedTxid`, `fundingTxid`, `fundingVout`, `txHex` |
| `listtransactions` | transactions | privileged, wallet | `address`, `count` |
| `issuetoken` | tokens | privileged | `address`, `decimals`, `description`, `image`, `name`, `supply`, `symbol`, `tokenID`, `type` |
| `registerminer` | mining | privileged | `minerAddress` |
| `unregisterminer` | mining | privileged | `minerAddress` |
| `getminerstatus` | mining | privileged | `minerAddress` |
| `getallminers` | mining | privileged, wallet | — |
| `issuetokensigned` | tokens | privileged, wallet | `attachMetadata`, `metadata`, `signedTxHex` |
| `verifytokenmetadata` | tokens | privileged, wallet | `txid` |
| `createcontracttransaction` | contracts | privileged, wallet | `amount`, `fee`, `metadata`, `name`, `scriptHex`, `senderAddress`, `type`, `utxo` |
| `redeemhashlock` | contracts | privileged | `address`, `contractAddress`, `preimage` |
| `redeemtimelock` | contracts | privileged | `address`, `contractAddress` |
| `getcontracts` | contracts | privileged, wallet | — |
| `getrawtransaction` | transactions | privileged | `txid`, `verbose` |
| `gettxout` | transactions | privileged, wallet | `includeMempool`, `n`, `txid` |
| `getcontractoutpoint07b` | contracts | privileged | `txid`, `vout` |
| `getvotingv1snapshot07b` | contracts | privileged | — |
| `preparevotingv1create07b` | contracts | privileged | — |
| `preparevotingv1ballot07b` | contracts | privileged | — |
| `getTRUScripts` | truscripts | privileged, wallet | `ownerAddress` |
| `getTRUScriptDetails` | truscripts | privileged, wallet | `txid` |
| `sendtokenweb` | tokens | privileged | `amount`, `recipient`, `senderAddress`, `tokenID` |
| `getaddresstransactions` | transactions | privileged, wallet | `address`, `count` |
| `createsendtokentransaction` | tokens | privileged, wallet | `amount`, `fee`, `feeUtxo`, `recipient`, `senderAddress`, `tokenID` |
| `createburntokentransaction` | tokens | privileged, wallet | `fee`, `feeUtxo`, `senderAddress`, `tokenID` |
| `debugtokentx` | tokens | privileged | `txid` |
| `createtokentransaction` | tokens | privileged | `decimals`, `description`, `fee`, `imageUrl`, `metadata`, `metadataBeforeSigning`, `name`, `senderAddress`, `symbol`, `tokenID`, `totalSupply`, `type`, `utxo` |
| `listmempooltransactions` | transactions | privileged, wallet | — |
| `verifytokenbalance` | tokens | privileged | `address`, `tokenID` |
| `createmagiclock` | magic | privileged | `address`, `amount`, `dataType`, `secretData`, `targetPrefix` |
| `unlockmagiclock` | magic | privileged | `recipient`, `txid`, `vout` |
| `listmagiclocks` | magic | privileged, wallet | `address` |
| `listaddresses` | wallet | privileged | — |
| `getbalance` | wallet | privileged | `address` |
| `getchainsupply` | data-provider | privileged | — |
| `getchainhealth` | data-provider | privileged | — |
| `getchainmetadata` | data-provider | privileged | — |
| `getinfo` | system | privileged | — |
| `getdesktopinfo` | system | privileged, wallet | `authToken` |
| `configureAIProvider` | ai | privileged | `address`, `api_key`, `config`, `endpoint`, `model`, `provider` |
| `getAIProviders` | ai | privileged, wallet | — |
| `testAIProvider` | ai | privileged, wallet | `provider` |
| `createAIToken` | ai/tokens | privileged | `address`, `ai_provider`, `decimals`, `description`, `image`, `learning_rate`, `name`, `neural_network`, `quantity`, `supply`, `symbol`, `tokenID`, `type` |
| `interactWithAIToken` | ai/tokens | privileged | `address`, `message`, `tokenID` |
| `getAIResponse` | ai | privileged | `requestID` |
| `getAITokenState` | ai/tokens | privileged, wallet | `tokenID` |
| `trainAIToken` | ai/tokens | privileged | `address`, `tokenID`, `training_data` |
| `htlcgeneratesecret` | htlc | privileged | — |
| `htlcpreparefunding` | htlc | privileged | `amountAtoms`, `claimPubkey`, `operationId`, `refundPubkey`, `refundTime`, `secretHash160` |
| `htlcpreparedstatus` | htlc | privileged | `operationId` |
| `htlcpreparedrelease` | htlc | privileged | `operationId`, `preparedTxid` |
| `htlcbroadcastprepared` | htlc | privileged | `dryRun`, `operationId`, `preparedTxid` |
| `htlccreate` | htlc | privileged | `amountAtoms`, `claimPubkey`, `refundPubkey`, `refundTime`, `secretHash160` |
| `htlcclaim` | htlc | privileged | `allocationId`, `fundingTxid`, `preimageHex`, `recipient`, `vout` |
| `htlcrefund` | htlc | privileged | `allocationId`, `fundingTxid`, `recipient`, `vout` |
| `swaprecordcreate` | swap | privileged | — |
| `swaprecordget` | swap | privileged | `swapId` |
| `swaprecordlist` | swap | privileged | — |
| `swaprecordtransition` | swap | privileged | `evidence`, `nextState`, `swapId` |
| `swapwalletfreshkeys` | swap | privileged | `allocationId` |
| `swapwalletfreshselfproof` | swap | privileged | `allocationId`, `role` |
| `swapwalletrolekeys` | swap | privileged | — |

## Explorer REST client

Friendly methods cover the reviewed endpoints for stats, blocks, addresses, transactions, tokens, contracts, miners/miner reports, hashrate/difficulty history, TRUScripts, uptime, peers, DID/social, wallet token holdings/history, TRU price and chain hashrate.

## NEROMESH / AXON client

The SDK includes helpers for:

- public `/api/health` and `/api/stats`
- compatibility/direct customer jobs
- AXON offer creation, customer offer listing, funding-plan and funding registration
- wallet-intent handoff/capability operations
- standalone worker enrollment/self/heartbeat/lease/result/fail
- portal customer/worker login/session/actions
- public network worker/summary views

Because NEROMESH is evolving independently of Core, `mesh.raw(method, path, ...)` is also available for forward-compatible endpoints.

## Error classes

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

## Retry policy

The high-level SDK does not automatically retry state-changing methods. The raw transport accepts explicit retry options when the application knows the call is safe/idempotent:

```ts
await tru.raw.call("getchaininfo", {}, { retries: 3, retryDelayMs: 200 });
```
