import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer as netServer} from 'node:net';
import {createController,descriptorOK} from '../apps/quantum-wallet/lib/controller.mjs';
import {createQuantumServer} from '../apps/quantum-wallet/lib/server.mjs';

// Real PQ01 structure with a placeholder checksum: sufficient for local shape tests;
// Core enforces the actual checksum before signing.
const descriptor='truq1:'+'5120'+'ab'.repeat(32)+'20'+'cd'.repeat(32)+'bb51'+':'+'12'.repeat(8);
function mock(active){
 const calls=[];
 const tru={quantum:{
  consensus:async()=>({active,activation_height:50000,candidate_height:active?50000:48150,core_version:'0.08.5'}),
  list:async()=>[{address:descriptor,state:'unused',has_saved_transaction:false}],
  receive:async()=>({address:descriptor,scriptPubKey:descriptor.split(':')[1]}),
  input:async(p)=>{calls.push(['input',p]);if(!active)throw Error('inactive');return {...p,amount_atoms:100000,scriptPubKey:'76a9'};},
  fund:async(p)=>{calls.push(['fund',p]);return {signed:true,rawHex:'aabbcc',send_atoms:90000};},
  send:async(p)=>{calls.push(['send',p]);return {signed:true,rawHex:'ddffee',send_atoms:90000};},
  exit:async(p)=>{calls.push(['exit',p]);return {signed:true,rawHex:'abcdef',send_atoms:90000};},
  retry:async(source)=>{calls.push(['retry',source]);return {signed:true,rawHex:'ddffee'};},
  submit:async(hex)=>{calls.push(['submit',hex]);return {txid:'ab'.repeat(32)};}
 },raw:{call:async(method,params)=>{calls.push([method,params]);return method==='getinfo'?{blocks:48150}:method==='decoderawtransaction'?{vin:[{}],vout:[{}]}:[];}}};
 return {tru,calls};
}
async function tmp(){return mkdtemp(join(tmpdir(),'tru-quantum-app-'));}
const fund={action:'fund',txid:'a1'.repeat(32),vout:0,fee_atoms:10000,destination:descriptor,confirm:'SIGN'};
async function port(){const s=netServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
test('native descriptor shape is not the old TRU Quantum ID format',()=>{
 assert.equal(descriptorOK(descriptor),true);assert.equal(descriptorOK('TRU123ABCfakeIdentity'),false);
});
test('pre-activation receive/list work; signing and input blocked without gated RPC',async()=>{
 const dir=await tmp();try{const {tru,calls}=mock(false),c=createController(tru,dir);
 assert.equal((await c.receive()).address,descriptor);assert.equal((await c.list()).length,1);
 await assert.rejects(c.sign(fund),/not yet active/);assert.equal(calls.length,0);
 await assert.rejects(c.input(fund),/inactive/);
 assert.equal((await c.records()).length,0);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('fund saves signed bytes, never auto-broadcast; explicit decode + submit same saved bytes',async()=>{
 const dir=await tmp();try{const {tru,calls}=mock(true),c=createController(tru,dir);
 const r=await c.sign(fund);assert.equal(r.state,'signed');assert(!calls.some(([n])=>n==='submit'));
 const file=JSON.parse(await readFile(join(dir,r.id+'.json'),'utf8'));assert.equal(file.rawHex,'aabbcc');
 assert.equal((await c.decode({id:r.id})).transaction.vin.length,1);
 await assert.rejects(c.submit({id:r.id,confirm:'bad'}),/BROADCAST/);
 const s=await c.submit({id:r.id,confirm:'BROADCAST'});assert.equal(s.state,'submitted');
 assert.deepEqual(calls.at(-1),['submit','aabbcc']);
 await assert.rejects(c.submit({id:r.id,confirm:'BROADCAST'}),/already submitted/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('WOTS recovery obtains only Core-saved exact bytes',async()=>{
 const dir=await tmp();try{const {tru,calls}=mock(true),c=createController(tru,dir);
 const r=await c.recover({source:descriptor,confirm:'RECOVER'});
 const saved=JSON.parse(await readFile(join(dir,r.id+'.json'),'utf8'));
 assert.equal(saved.rawHex,'ddffee');assert.deepEqual(calls[0],['retry',descriptor]);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('local web bridge enforces bearer, origin, host; serves UI and routes only whitelisted methods',async()=>{
 const dir=await tmp();const p=await port();const {tru}=mock(false);const app=await createQuantumServer({tru,stateDir:dir,port:p,logger:{error:()=>{}}});
 const origin=`http://127.0.0.1:${p}`;
 const post=(path,auth,originHeader)=>fetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json',...(auth?{'Authorization':`Bearer ${auth}`}:{}) ,...(originHeader?{Origin:originHeader}:{})},body:'{}'});
 try{
  assert.equal((await fetch(origin+'/')).status,200);
  assert.equal((await fetch(origin+'/app.js')).status,200);
  assert.equal((await fetch(origin+'/api/status')).status,401);
  assert.equal((await post('/api/receive',app.sessionKey,'https://evil.example')).status,403);
  assert.equal((await post('/api/receive',app.sessionKey,origin)).status,200);
  assert.equal((await post('/api/privateKeys',app.sessionKey,origin)).status,404);
  assert.equal((await fetch(origin+'/api/status',{headers:{Authorization:`Bearer ${app.sessionKey}`}})).status,200);
 }finally{await new Promise(r=>app.server.close(r));await rm(dir,{recursive:true,force:true});}
});
