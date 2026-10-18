const key=location.hash.slice(1)||sessionStorage.getItem('tru-quantum-session');
if(location.hash){sessionStorage.setItem('tru-quantum-session',key);history.replaceState(null,'',location.pathname);}
const $=s=>document.querySelector(s);
let lastInspection=null;
const show=(obj)=>JSON.stringify(obj,null,2);
function alertMessage(message,good=false){const el=$('#alert');el.textContent=String(message);el.classList.remove('hidden');el.classList.toggle('ok',good);}
async function api(path,body){
 if(!key){throw Error('Missing local session key. Open the private URL printed by web.mjs in your terminal.');}
 const opts={headers:{Authorization:`Bearer ${key}`}};
 if(body!==undefined){opts.method='POST';opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body);}
 const res=await fetch('/api/'+path,opts);let j;try{j=await res.json();}catch{throw Error('Local service did not return JSON');}
 if(!res.ok||!j.ok)throw Error(j.error||'Local wallet request failed');return j.result;
}
async function attempt(f,success){try{const r=await f();if(success)alertMessage(success,true);return r;}catch(e){alertMessage(e.message);throw e;}}
function tab(name){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('hidden',x.id!==name));document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('selected',x.dataset.tab===name));
 if(name==='activity')records();if(name==='receive')descriptors();}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.tab)));
document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.getElementById(b.dataset.copy).value);alertMessage('Copied to clipboard. Check destination before sending funds.',true);}catch(e){alertMessage('Copy failed: '+e.message);}}));
async function confirmDialog(title,text,word){
 return new Promise(resolve=>{
  const modal=$('#modal');$('#modal-title').textContent=title;$('#modal-text').textContent=text;$('#phrase').value='';modal.classList.remove('hidden');$('#phrase').focus();
  const cleanup=()=>{modal.classList.add('hidden');$('#modal-cancel').removeEventListener('click',cancel);$('#modal-ok').removeEventListener('click',ok);};
  const cancel=()=>{cleanup();resolve(false);};const ok=()=>{const yes=$('#phrase').value.trim()===word;cleanup();if(!yes)alertMessage(`Confirmation requires exactly ${word}`);resolve(yes);};
  $('#modal-cancel').addEventListener('click',cancel);$('#modal-ok').addEventListener('click',ok);
 });
}
function fmtAtoms(x){if(!Number.isSafeInteger(x))return String(x)+' atoms';return `${(x/1e8).toFixed(8)} TRU (${x.toLocaleString()} atoms)`;}
async function refresh(){
 try{
  const [s,node]=await Promise.all([api('status'),api('node')]);
  $('#height').textContent=Number(s.candidate_height).toLocaleString();$('#activation').textContent=Number(s.activation_height).toLocaleString();
  $('#network').textContent=s.active?'● PQ01 ACTIVE':'◷ AWAITING BLOCK '+s.activation_height;
  $('#gate-title').textContent=s.active?'Quantum transactions enabled':'Receive ready • spending activation pending';
  $('#gate-text').textContent=s.active?'Core reports native PQ01 consensus active for the next candidate block. Small-value testing, confirmation checks and fresh one-time keys are still required.':`Consensus activates for candidate block ${s.activation_height}. The next candidate is ${s.candidate_height}. You can create and list receive descriptors now; fund/send/exit and broadcast remain gated.`;
  $('#node-info').textContent=show({core_version:s.core_version,blocks:node.blocks,connections:node.connections,bestblockhash:node.bestblockhash,chain_audit:node.chain_audit?.state||'not_run'});
  $('#sign').disabled=!s.active;
 }catch(e){alertMessage('Core status unavailable: '+e.message);$('#network').textContent='● OFFLINE';}
 await descriptors();
}
async function descriptors(){try{const a=await api('list');$('#count').textContent=a.length;const root=$('#descriptor-list');root.replaceChildren();if(!a.length){root.textContent='No quantum descriptors yet.';return;}
 a.forEach(d=>{const item=document.createElement('div');item.className='item';const title=document.createElement('b');title.textContent=(d.state||'unused')+(d.has_saved_transaction?' · saved signed transaction':'');const addr=document.createElement('p');addr.textContent=d.address;const btn=document.createElement('button');btn.textContent='Copy descriptor';btn.onclick=()=>navigator.clipboard.writeText(d.address).then(()=>alertMessage('Descriptor copied',true)).catch(e=>alertMessage(e.message));item.append(title,addr,btn);root.append(item);});}catch(e){$('#count').textContent='—';$('#descriptor-list').textContent='Unavailable: '+e.message;}}
$('#refresh').onclick=refresh;
$('#receive-button').onclick=async()=>{if(!await confirmDialog('Create new WOTS+ key','A new one-use descriptor changes your Core .pq01 state. Back up the newest sidecar after creating it. Never restore an older copy.','CREATE'))return;
 try{const r=await attempt(()=>api('receive',{}),'New Core-owned quantum receive descriptor created. Back up .pq01 now.');$('#receive-address').value=r.address;$('#receive-result').classList.remove('hidden');await descriptors();}catch{}};
let txAction='fund';document.querySelectorAll('input[name=tx-action]').forEach(r=>r.onchange=()=>{
 txAction=document.querySelector('input[name=tx-action]:checked').value;lastInspection=null;$('#inspect-result').textContent='Inspect the confirmed source input before signing.';
 $('#source-block').classList.toggle('hidden',txAction==='fund');$('#destination-label').firstChild.textContent=txAction==='exit'?'ORDINARY TRU DESTINATION':'FRESH DESTINATION TRUQ1 DESCRIPTOR';$('#destination').placeholder=txAction==='exit'?'T… or other valid native address':'truq1:...';
});
function input(){return {txid:$('#txid').value.trim(),vout:Number($('#vout').value),fee_atoms:Number($('#fee').value),source:$('#source').value.trim(),destination:$('#destination').value.trim()};}
$('#inspect').onclick=async()=>{try{const p=input();const res=await attempt(()=>api('input',{txid:p.txid,vout:p.vout}),'Input confirmed and available per Core');lastInspection={txid:p.txid,vout:p.vout,amount_atoms:res.amount_atoms};$('#inspect-result').textContent=show({...res,estimated_send_atoms:res.amount_atoms-p.fee_atoms});}catch{lastInspection=null;}};
$('#sign').onclick=async()=>{
 const p=input();if(!lastInspection||lastInspection.txid!==p.txid||lastInspection.vout!==p.vout){alertMessage('Inspect this exact UTXO before signing');return;}
 const sent=lastInspection.amount_atoms-p.fee_atoms;
 if(!Number.isSafeInteger(sent)||sent<546){alertMessage('Invalid output after fee');return;}
 const text=`Action ${txAction.toUpperCase()}. Spend the WHOLE UTXO: ${fmtAtoms(lastInspection.amount_atoms)}. Network fee: ${fmtAtoms(p.fee_atoms)}. Recipient receives: ${fmtAtoms(sent)}. Destination: ${p.destination}. No change. ${txAction==='exit'?'This REMOVES WOTS protection.':''} Signing DOES NOT broadcast.`;
 if(!await confirmDialog('Sign and save exact transaction',text,'SIGN'))return;
 try{const r=await attempt(()=>api('sign',{...p,action:txAction,confirm:'SIGN',confirm_exit:txAction==='exit'}),'Signed result saved locally; nothing broadcast.');$('#inspect-result').textContent=show(r);tab('activity');}catch{}
};
$('#lookup').onclick=async()=>{try{const a=await attempt(()=>api('utxos',{address:$('#lookup-address').value.trim()}));const root=$('#utxos');root.replaceChildren();if(!a.length){root.textContent='No spendable UTXOs reported for that standard address';return;}
 a.forEach(u=>{const item=document.createElement('div');item.className='item';const b=document.createElement('b');b.textContent=fmtAtoms(u.amount_atoms);const p=document.createElement('p');p.textContent=`${u.txid}:${u.vout} · ${u.confirmations} confirmations · ${u.scriptPubKey}`;const btn=document.createElement('button');btn.textContent='Use this outpoint';btn.onclick=()=>{$('#txid').value=u.txid;$('#vout').value=u.vout;lastInspection=null;tab('transfer');$('#inspect-result').textContent='Check this candidate with Inspect confirmed input before signing.';};item.append(b,p,btn);root.append(item);});
 }catch{}};
async function records(){try{const a=await api('records');const root=$('#record-list');root.replaceChildren();if(!a.length){root.textContent='No signed transactions saved yet.';return;}
 a.forEach(r=>{const box=document.createElement('div');box.className='item';const b=document.createElement('b');b.textContent=`${r.action.toUpperCase()} · ${r.state.toUpperCase()}`;const p=document.createElement('p');p.textContent=`${r.created}  |  ${r.id}\n${r.txid||r.source||''}`;box.append(b,p);
 const dec=document.createElement('button');dec.textContent='Decode / review';dec.onclick=async()=>{try{const t=await attempt(()=>api('decode',{id:r.id}));const pre=document.createElement('pre');pre.className='output';pre.textContent=show(t);box.append(pre);}catch{}};
 if(['signed','submitted','submit_unknown','submitting'].includes(r.state))box.append(dec);
 if(['signed','submit_unknown'].includes(r.state)){const sub=document.createElement('button');sub.textContent='Review + broadcast';sub.onclick=async()=>{
 try{const t=await attempt(()=>api('decode',{id:r.id}));if(!await confirmDialog('BROADCAST saved bytes',`Verify this decoded transaction before proceeding: ${show(t.transaction).slice(0,2500)}. The network may accept/reject it; acceptance is NOT confirmation.`, 'BROADCAST'))return;
 const sent=await attempt(()=>api('submit',{id:r.id,confirm:'BROADCAST'}),'Transaction submitted; check chain confirmation.');alertMessage('Broadcast result: '+show(sent),true);await records();}catch{}};box.append(sub);}
 root.append(box);});
 }catch(e){alertMessage(e.message);}}
$('#reload-records').onclick=records;
$('#recover').onclick=async()=>{const source=$('#recover-source').value.trim();if(!await confirmDialog('Recover committed WOTS bytes','This retrieves the exact transaction from the Core one-time signing state. Never sign a different payload with the same key.','RECOVER'))return;
 try{await attempt(()=>api('recover',{source,confirm:'RECOVER'}),'Exact signed bytes recovered and saved locally');await records();}catch{}};
if(!key)alertMessage('Missing companion authentication: open the launch URL displayed in the local terminal.');else refresh();
