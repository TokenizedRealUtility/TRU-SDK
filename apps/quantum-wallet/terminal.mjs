#!/usr/bin/env node
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {createCoreClient} from './lib/core.mjs';
import {createController} from './lib/controller.mjs';
import {ensureStore,defaultStateDir} from './lib/store.mjs';

if(!stdin.isTTY){console.error('Run in an interactive terminal');process.exit(1);}
const dir=defaultStateDir();await ensureStore(dir);
const c=createController(createCoreClient(),dir);
const rl=createInterface({input:stdin,output:stdout});
async function ask(label){return (await rl.question(label+': ')).trim();}
const show=o=>console.log(JSON.stringify(o,null,2));
async function enter(){
 console.log('\nTRU QUANTUM — local Core-backed wallet');
 console.log('1 Status   2 Receive   3 List   4 Inspect UTXO   5 Sign fund/send/exit');
 console.log('6 Signed records   7 Decode saved transaction   8 Broadcast saved bytes   9 Recover WOTS saved bytes   0 Quit');
 const s=await ask('Choose');if(s==='0')return false;
 if(s==='1')show(await c.status());
 else if(s==='2'){console.log('Creates a NEW one-payment WOTS key. BACK UP your current .pq01 immediately.');if(await ask('Type CREATE')==='CREATE')show(await c.receive());}
 else if(s==='3')show(await c.list());
 else if(s==='4')show(await c.input({txid:await ask('Confirmed txid'),vout:Number(await ask('vout'))}));
 else if(s==='5'){
  const action=await ask('Action: fund, send or exit');
  const p={action,txid:await ask('Confirmed source txid'),vout:Number(await ask('vout')),fee_atoms:Number(await ask('Fee in atoms (>=10000)'))};
  if(action==='send'||action==='exit')p.source=await ask('Owned source truq1 descriptor');
  p.destination=await ask(action==='exit'?'Ordinary TRU address':'FRESH destination truq1 descriptor');
  if(action==='exit'){p.confirm_exit=await ask('Type EXIT to remove WOTS protection')==='EXIT';}
  show(await c.input(p));
  console.log('WARNING: spends WHOLE selected UTXO minus fee. No change. No automatic broadcast.');
  p.confirm=await ask('Type SIGN to sign and persist locally');show(await c.sign(p));
 }
 else if(s==='6')show(await c.records());
 else if(s==='7')show(await c.decode({id:await ask('Saved record ID')}));
 else if(s==='8'){
  const id=await ask('Saved record ID');show(await c.decode({id}));
  console.log('Inspect the EXACT signed transaction above. Broadcast is NOT a confirmation.');
  show(await c.submit({id,confirm:await ask('Type BROADCAST to transmit')}));
 }
 else if(s==='9')show(await c.recover({source:await ask('Owned source descriptor'),confirm:await ask('Type RECOVER to fetch saved WOTS bytes')}));
 else console.log('Unknown selection');
 return true;
}
try{while(true){try{if(!(await enter()))break;}catch(e){console.error('Operation failed:',e.message);}}}finally{rl.close();}
