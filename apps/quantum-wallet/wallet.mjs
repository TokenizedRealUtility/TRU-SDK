#!/usr/bin/env node
import { readFile, open } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { TruClient } from '../../dist/index.js';

const [action = 'help', inputFile, outputFile, ...extra] = process.argv.slice(2);
const help = `TRU Quantum Wallet — local Core-backed terminal application

node apps/quantum-wallet/wallet.mjs status
node apps/quantum-wallet/wallet.mjs receive
node apps/quantum-wallet/wallet.mjs list
node apps/quantum-wallet/wallet.mjs input input.json
node apps/quantum-wallet/wallet.mjs fund fund.json signed-fund.json
node apps/quantum-wallet/wallet.mjs send send.json signed-send.json
node apps/quantum-wallet/wallet.mjs exit exit.json signed-exit.json
node apps/quantum-wallet/wallet.mjs retry retry.json recovered.json
node apps/quantum-wallet/wallet.mjs submit signed-send.json

Signing and submission are separate. SIGN/SEND require an interactive terminal.
Core keeps keys and encrypted .pq01 state. One payment per descriptor.
See QUANTUM-WALLET.md for activation, backup and parameter requirements.`;
async function confirm(word) {
  if (!process.stdin.isTTY) throw new Error('Interactive terminal required for this action');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try { if ((await rl.question(`Type ${word} to continue: `)).trim() !== word) throw new Error('Cancelled'); }
  finally { rl.close(); }
}
function show(v) { console.log(JSON.stringify(v, null, 2)); }
async function main() {
  if (['help','--help','-h'].includes(action)) { console.log(help); return; }
  if (!['status','receive','list','input','fund','send','exit','retry','submit'].includes(action)) throw new Error(help);
  const needsInput = !['status','receive','list'].includes(action);
  const saves = ['fund','send','exit','retry'].includes(action);
  if (extra.length || (needsInput && !inputFile) || (!needsInput && inputFile) || (saves !== Boolean(outputFile))) throw new Error(help);
  const endpoint = process.env.TRU_RPC_URL || 'http://127.0.0.1:21832/rpc';
  const u = new URL(endpoint);
  if (!['http:','https:'].includes(u.protocol) || !['localhost','127.0.0.1','[::1]'].includes(u.hostname) || u.pathname !== '/rpc' || u.username || u.password || u.search || u.hash)
    throw new Error('Use a direct loopback /rpc URL');
  const port = u.port || (u.protocol === 'https:' ? '443' : '80');
  const cookie = process.env.TRU_RPC_COOKIE_FILE || (process.platform === 'win32'
    ? join(process.env.LOCALAPPDATA || '.', 'TRU', `rpc-cookie-${port}`)
    : join(homedir(), '.tru', `rpc-cookie-${port}`));
  const tru = TruClient.direct(endpoint, async () => (process.env.TRU_RPC_TOKEN || await readFile(cookie,'utf8')).trim(), {timeoutMs:30000});
  const p = needsInput ? JSON.parse(await readFile(inputFile,'utf8')) : {};
  if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('Input file must contain a JSON object');
  if (action === 'status') { show(await tru.quantum.consensus()); return; }
  if (action === 'receive') {
    console.log('Creates a fresh descriptor. ONE payment only. Back up the Core wallet and current .pq01 sidecar.');
    show(await tru.quantum.receive()); return;
  }
  if (action === 'list') { show(await tru.quantum.list()); return; }
  if (action === 'input') { show(await tru.quantum.input(p)); return; }
  if (action === 'submit') {
    if (typeof p.rawHex !== 'string' || p.signed !== true) throw new Error('Expected a saved signed result with rawHex and signed=true');
    console.log('Review the EXACT signed transaction before broadcasting:');
    show(await tru.raw.call('decoderawtransaction',{txHex:p.rawHex}));
    await confirm('SEND'); show(await tru.quantum.submit(p.rawHex)); return;
  }
  if (action !== 'retry') {
    const state = await tru.quantum.consensus();
    if (state.active !== true) throw new Error(`PQ01 inactive; activation height ${state.activation_height}`);
    const input = await tru.quantum.input(p);
    if (!Number.isSafeInteger(input.amount_atoms) || !Number.isSafeInteger(p.fee_atoms) || p.fee_atoms < 10000 || input.amount_atoms-p.fee_atoms < 546)
      throw new Error('Cannot safely display amounts, or fee/output is invalid');
    show({action,source:p.source,destination:p.destination,txid:p.txid,vout:p.vout,input_atoms:input.amount_atoms,fee_atoms:p.fee_atoms,send_atoms:input.amount_atoms-p.fee_atoms});
    console.log('The WHOLE selected output minus fee will move. No change. Signing does not broadcast.');
    if (action === 'exit') console.log('EXIT sends to an ordinary address and removes WOTS protection from that output.');
    await confirm('SIGN');
  }
  // Reserve a NEW result file before signing. Refuse to overwrite prior signed bytes.
  const file = await open(outputFile,'wx',0o600);
  try {
    const result = action === 'retry' ? await tru.quantum.retry(p.source) : await tru.quantum[action](p);
    await file.writeFile(JSON.stringify(result,null,2)+'\n'); await file.sync();
    console.log(`Saved signed result to ${outputFile}. Nothing was broadcast.`);
  } finally { await file.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode=1; });
