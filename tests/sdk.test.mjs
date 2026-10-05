import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TruClient,
  RpcTransport,
  parseTru,
  formatTru,
  isTruAddress,
  RPC_CATALOG,
  TruNodeBusyError
} from '../dist/index.js';

test('exact TRU amount conversion', () => {
  assert.equal(parseTru('1.00000001'), 100000001n);
  assert.equal(parseTru('0.00000001'), 1n);
  assert.equal(formatTru(4500000000n), '45.00000000');
  assert.throws(() => parseTru('0.000000001'));
  assert.throws(() => parseTru('1e-8'));
});

test('address validation follows current mainnet explorer route shape', () => {
  assert.equal(isTruAddress('TNizzwNY6m2A2pchXVsWMUw6eSNpgKS6aj'), true);
  assert.equal(isTruAddress('not-a-tru-address'), false);
});

test('RPC catalog includes major platform families', () => {
  const methods = new Set(RPC_CATALOG.map(x => x.method));
  for (const method of [
    'getchaininfo','sendtoaddress','issuetoken','previewtokenevolution',
    'createcontracttransaction','createmagiclock','registerminer','createAIToken',
    'htlccreate','swaprecordtransition'
  ]) assert.equal(methods.has(method), true, method);
  assert.ok(RPC_CATALOG.length >= 90);
});

test('RPC transport sends bearer JSON-RPC and returns result', async () => {
  let seen;
  const fakeFetch = async (url, init) => {
    seen = { url, init, body: JSON.parse(init.body) };
    return new Response(JSON.stringify({ jsonrpc:'2.0', id:1, result:{ blocks:29408 } }), {
      status:200, headers:{'Content-Type':'application/json'}
    });
  };
  const rpc = new RpcTransport({ endpoint:'http://127.0.0.1:21832/rpc', token:'abc', fetch:fakeFetch });
  const result = await rpc.call('getchaininfo');
  assert.equal(result.blocks, 29408);
  assert.equal(seen.init.headers.Authorization, 'Bearer abc');
  assert.equal(seen.body.method, 'getchaininfo');
});

test('RPC busy error is classified', async () => {
  const fakeFetch = async () => new Response(JSON.stringify({
    jsonrpc:'2.0', id:1, error:{code:-32000,message:'template preflight busy; retry'}
  }), {status:200,headers:{'Content-Type':'application/json'}});
  const rpc = new RpcTransport({ endpoint:'http://node/rpc', fetch:fakeFetch });
  await assert.rejects(() => rpc.call('getblocktemplate'), TruNodeBusyError);
});

test('TruClient module maps friendly methods to Core RPC', async () => {
  const calls = [];
  const fakeFetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    calls.push(body);
    return new Response(JSON.stringify({jsonrpc:'2.0',id:body.id,result:{ok:true}}),{status:200,headers:{'Content-Type':'application/json'}});
  };
  const tru = new TruClient({ core:{ endpoint:'http://node/rpc', fetch:fakeFetch } });
  await tru.tokens.send('44c89b719abc7ca0','TNizzwNY6m2A2pchXVsWMUw6eSNpgKS6aj',1,'TURsiYNP1PXqnbRNN2ZxG5AhVmJsGYMBwF');
  assert.equal(calls[0].method,'sendtoken');
  assert.equal(calls[0].params.tokenID,'44c89b719abc7ca0');
});
