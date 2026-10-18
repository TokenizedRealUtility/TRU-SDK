import { mkdir, open, readdir, readFile, rename, stat } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';

export const defaultStateDir=()=>resolve(process.env.TRU_QUANTUM_STATE_DIR || join(homedir(),'.tru-quantum-ui'));
export async function ensureStore(dir) {
  await mkdir(dir,{recursive:true,mode:0o700});
  const s=await stat(dir);
  if(!s.isDirectory() || (s.mode & 0o077)!==0)throw Error('State directory must be private (chmod 700): '+dir);
}
export function validId(s){return typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(s) && s.length<=64;}
async function syncDir(path){
  if(process.platform==='win32')return;
  const fd=await open(dirname(path),'r');try{await fd.sync();}finally{await fd.close();}
}
export async function saveRecord(dir,record,{newOnly=false}={}) {
  if(!validId(record.id))throw Error('Invalid record ID');
  const path=join(dir,record.id+'.json');
  if(newOnly){const f=await open(path,'wx',0o600);try{await f.writeFile(JSON.stringify(record,null,2)+'\n');await f.sync();}finally{await f.close();}await syncDir(path);return record;}
  const tmp=path+'.'+randomUUID()+'.tmp';
  const f=await open(tmp,'wx',0o600);try{await f.writeFile(JSON.stringify(record,null,2)+'\n');await f.sync();}finally{await f.close();}
  await rename(tmp,path);await syncDir(path);return record;
}
export async function loadRecord(dir,id){
  if(!validId(id))throw Error('Invalid record ID');
  const j=JSON.parse(await readFile(join(dir,id+'.json'),'utf8'));
  if(j.id!==id)throw Error('Saved record corrupted');return j;
}
export async function allRecords(dir){
  const out=[];
  for(const entry of (await readdir(dir)).filter(s=>s.endsWith('.json')).slice(-500)){
    const id=entry.slice(0,-5);if(!validId(id))continue;
    try{const r=await loadRecord(dir,id);out.push({id:r.id,action:r.action,state:r.state,created:r.created,updated:r.updated,source:r.params?.source||null,txid:r.params?.txid||null,vout:r.params?.vout??null});}catch{}
  }
  return out.sort((a,b)=>b.created.localeCompare(a.created));
}
