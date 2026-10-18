import test from 'node:test';
import assert from 'node:assert/strict';
import {TruClient, RPC_CATALOG} from '../dist/index.js';
const outpoint={txid:'ab'.repeat(32),vout:0};
const funding={...outpoint,fee_atoms:10000,destination:'truq1:fresh-placeholder'};
function setup(active=true, endpoint='http://127.0.0.1:21832/rpc', fail=false){
 const calls=[];
 const tru=TruClient.direct(endpoint,'test-token',{fetch:async(_u,init)=>{
  const b=JSON.parse(init.body);calls.push(b);
  if(fail)throw new Error('lost response');
  return new Response(JSON.stringify({jsonrpc:'2.0',id:b.id,result:b.method==='getconsensus09info'?{active,candidate_height:active?50000:49999,activation_height:50000,core_version:'0.08.5'}:{signed:true,rawHex:'aabb'}}));
 }});return {tru,calls};
}
test('quantum module exists and catalog declares direct-only methods',()=>{
 for(const name of ['quantumwallet','getquantuminput','sendquantumtransaction','getconsensus09info'])assert.deepEqual(RPC_CATALOG.find(x=>x.method===name).gateway,['privileged']);
});
test('before activation receive/list work; input/sign/submit make no gated call',async()=>{
 const {tru,calls}=setup(false);await tru.quantum.receive();await tru.quantum.list();
 for(const run of [()=>tru.quantum.input(outpoint),()=>tru.quantum.fund(funding),()=>tru.quantum.send({...funding,source:'truq1:source'}),()=>tru.quantum.exit({...funding,source:'truq1:source',confirm_exit:true}),()=>tru.quantum.submit('aabb')])await assert.rejects(run,/inactive/);
 assert.equal(calls.filter(x=>x.method==='quantumwallet').length,2);
 assert.equal(calls.some(x=>['getquantuminput','sendquantumtransaction'].includes(x.method)),false);
});
test('sign returns bytes without broadcasting; action cannot be overridden',async()=>{
 const {tru,calls}=setup();await tru.quantum.send({...funding,source:'truq1:source',action:'exit',privateKey:'ignored'});
 assert.deepEqual(calls.at(-1).params,{...funding,source:'truq1:source',action:'send'});
 assert.equal(calls.some(x=>x.method==='sendquantumtransaction'),false);
 await tru.quantum.submit('aabb');assert.equal(calls.at(-1).method,'sendquantumtransaction');
});
test('unsafe integers, negative vout, same descriptor and unconfirmed exit rejected locally',async()=>{
 const {tru,calls}=setup();
 await assert.rejects(()=>tru.quantum.fund({...funding,fee_atoms:Number.MAX_SAFE_INTEGER+1}));
 await assert.rejects(()=>tru.quantum.input({...outpoint,vout:-1}));
 await assert.rejects(()=>tru.quantum.send({...funding,source:funding.destination}));
 await assert.rejects(()=>tru.quantum.exit({...funding,source:'s',confirm_exit:false}));
 assert.equal(calls.length,0);
});
test('public/remote endpoints cannot access Core wallet operations',async()=>{
 for(const endpoint of ['https://example.com/rpc','http://127.0.0.1:21832/api/wallet/rpc']){
  const {tru,calls}=setup(true,endpoint);assert.throws(()=>tru.quantum.receive(),/loopback/);assert.equal(calls.length,0);
 }
});
test('failure is never automatically retried; recovery requests only saved bytes',async()=>{
 const {tru,calls}=setup(true,undefined,true);await assert.rejects(()=>tru.quantum.receive());assert.equal(calls.length,1);
 const good=setup(false);await good.tru.quantum.retry('truq1:source');assert.deepEqual(good.calls[0].params,{source:'truq1:source',action:'retry'});
});
