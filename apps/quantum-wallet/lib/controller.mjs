import {randomUUID} from 'node:crypto';
import {allRecords,loadRecord,saveRecord,ensureStore} from './store.mjs';

const txidOK=s=>typeof s==='string'&&/^[0-9a-f]{64}$/i.test(s);
export const descriptorOK=s=>typeof s==='string'&&/^truq1:[0-9a-f]{138}:[0-9a-f]{16}$/.test(s)&& s.slice(6,10)==='5120' && s.slice(74,76)==='20' && s.slice(140,144)==='bb51';
const outpoint=p=>{
 if(!p||!txidOK(p.txid)||!Number.isSafeInteger(p.vout)||p.vout<0||p.vout>0xffffffff)throw Error('Valid 64-hex txid and uint32 vout required');
 return {txid:p.txid.toLowerCase(),vout:p.vout};
};
const money=p=>{if(!Number.isSafeInteger(p.fee_atoms)||p.fee_atoms<10000)throw Error('fee_atoms must be a safe integer >= 10000');return p.fee_atoms;};
export function createController(tru,dir){
 const guard=async()=>{const s=await tru.quantum.consensus();if(s.active!==true)throw Error(`PQ01 not yet active: next candidate ${s.candidate_height}, activation ${s.activation_height}`);return s;};
 return {
  status:()=>tru.quantum.consensus(),
  list:()=>tru.quantum.list(),
  receive:()=>tru.quantum.receive(),
  node:()=>tru.raw.call('getinfo',{}),
  utxos:async({address})=>{
   if(typeof address!=='string'||!/^[A-Za-z0-9]{26,50}$/.test(address))throw Error('Enter a standard TRU address');
   return tru.raw.call('listunspent',{address});
  },
  input:async p=>tru.quantum.input(outpoint(p)),
  records:()=>allRecords(dir),
  record:async({id})=>{const r=await loadRecord(dir,id);return {...r,rawHex:undefined};},
  async sign(p){
   const a=p?.action;
   if(!['fund','send','exit'].includes(a)||p.confirm!=='SIGN')throw Error('Choose fund/send/exit and explicitly type SIGN');
   const q={...outpoint(p),fee_atoms:money(p),destination:p.destination};
   if(a==='fund'||a==='send'){
    if(!descriptorOK(q.destination))throw Error('Destination must be a genuine fresh truq1 descriptor');
   }else if(typeof q.destination!=='string'||!/^[1-9A-HJ-NP-Za-km-z]{26,50}$/.test(q.destination))throw Error('Enter an ordinary mainnet destination for exit');
   if(a!=='fund'){
    if(!descriptorOK(p.source))throw Error('Source must be an owned truq1 descriptor');
    if(p.source===p.destination)throw Error('Cannot reuse the source descriptor');
    q.source=p.source;
   }
   if(a==='exit'){if(p.confirm_exit!==true)throw Error('Exit confirmation required');q.confirm_exit=true;}
   await guard();
   const input=await tru.quantum.input(q);
   if(!Number.isSafeInteger(input.amount_atoms)||input.amount_atoms-q.fee_atoms<546)throw Error('Invalid amount or fee; Core verifies policy too');
   // Durable intent record BEFORE asking Core to sign. On an uncertain result, investigate the Core sidecar before retrying.
   const r={id:randomUUID(),action:a,state:'pending',created:new Date().toISOString(),updated:new Date().toISOString(),params:q,input_atoms:input.amount_atoms};
   await saveRecord(dir,r,{newOnly:true});
   try{
    const result=await tru.quantum[a](q);
    if(result?.signed!==true||typeof result.rawHex!=='string'||!/^(?:[a-fA-F0-9]{2})+$/.test(result.rawHex))throw Error('Core did not return validated signed bytes');
    r.rawHex=result.rawHex;r.result={...result,rawHex:undefined};r.state='signed';
    r.updated=new Date().toISOString();await saveRecord(dir,r);
    return {id:r.id,state:r.state,input_atoms:r.input_atoms,send_atoms:result.send_atoms,fee_atoms:q.fee_atoms};
   }catch(e){r.state='uncertain';r.error=String(e.message||e);r.updated=new Date().toISOString();await saveRecord(dir,r);throw Error(`Signing outcome uncertain; record ${r.id}. Do not sign again. ${r.error}`);}
  },
  async recover({source,confirm}){
   if(confirm!=='RECOVER'||!descriptorOK(source))throw Error('Type RECOVER and supply an owned truq1 source');
   // Core returns EXACT previously signed WOTS bytes; does not create a new signature.
   const result=await tru.quantum.retry(source);
   if(result?.signed!==true||typeof result.rawHex!=='string'||!(/^(?:[0-9a-fA-F]{2})+$/.test(result.rawHex)))throw Error('Core did not return saved signed bytes');
   const r={id:randomUUID(),action:'retry',state:'signed',created:new Date().toISOString(),updated:new Date().toISOString(),params:{source},rawHex:result.rawHex,result:{signed:true}};
   await saveRecord(dir,r,{newOnly:true});return {id:r.id,state:r.state};
  },
  async decode({id}){
   const r=await loadRecord(dir,id);if(!r.rawHex||!['signed','submitted','submit_unknown','submitting'].includes(r.state))throw Error('No signed bytes to inspect');
   return {id:r.id,action:r.action,state:r.state,transaction:await tru.raw.call('decoderawtransaction',{txHex:r.rawHex})};
  },
  async submit({id,confirm}){
   if(confirm!=='BROADCAST')throw Error('Type BROADCAST to submit exactly the saved transaction');
   const r=await loadRecord(dir,id);
   if(!r.rawHex||!['signed','submit_unknown'].includes(r.state))throw Error('Saved signed bytes unavailable or already submitted');
   await guard();
   r.state='submitting';r.updated=new Date().toISOString();await saveRecord(dir,r);
   try{
    const result=await tru.quantum.submit(r.rawHex);
    r.state='submitted';r.submission=result;r.updated=new Date().toISOString();await saveRecord(dir,r);
    return {id:r.id,state:r.state,result};
   }catch(e){r.state='submit_unknown';r.error=String(e.message||e);r.updated=new Date().toISOString();await saveRecord(dir,r);throw Error('Submission status uncertain. Inspect the network before manually rebroadcasting the SAME bytes. '+r.error);}
  }
 };
}
