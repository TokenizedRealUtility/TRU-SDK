import {readFile, writeFile, rename, chmod, stat} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';

export const walletEnvPath=join(dirname(dirname(fileURLToPath(import.meta.url))),'.env');
export const allowedKeys=new Set([
 'TRU_QUANTUM_UI_MODE','TRU_QUANTUM_UI_HOST','TRU_QUANTUM_UI_PUBLIC_HOST',
 'TRU_QUANTUM_ALLOW_WILDCARD_BIND','TRU_QUANTUM_ALLOWED_CLIENT_IP',
 'TRU_QUANTUM_UI_PORT','TRU_QUANTUM_TLS_CERT','TRU_QUANTUM_TLS_KEY',
 'TRU_RPC_URL','TRU_RPC_TOKEN','TRU_RPC_COOKIE_FILE'
]);

export function parseWalletEnv(source){
 const result={};
 for(const [i,line] of source.replaceAll('\r','').split('\n').entries()){
  const s=line.trim();if(!s||s.startsWith('#'))continue;
  const m=/^(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/.exec(s);
  if(!m)throw Error(`Invalid wallet .env line ${i+1}`);
  const [,key,raw]=m;
  if(!allowedKeys.has(key))throw Error(`Unrecognized wallet config key ${key} (line ${i+1})`);
  if(Object.hasOwn(result,key))throw Error(`Duplicate wallet config key ${key}`);
  let value=raw.trim();
  if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
  if(/\n|\r|\0/.test(value)||value.includes('`')||value.includes('$('))throw Error('Unsafe wallet .env syntax');
  result[key]=value;
 }
 return result;
}

export async function loadWalletEnv(path=walletEnvPath,env=process.env){
 let raw;
 try{raw=await readFile(path,'utf8');}catch(e){if(e.code==='ENOENT')return false;throw e;}
 const parsed=parseWalletEnv(raw);
 // Follow dotenv convention: real process env wins. Never overwrite an operator's export.
 for(const [key,value] of Object.entries(parsed))if(env[key]===undefined)env[key]=value;
 return true;
}

export async function saveWalletEnv(entries,path=walletEnvPath){
 const lines=[
  '# TRU Quantum Wallet generated private settings. Keep this file local; never commit it.',
  '# IP allowlisting and HTTPS are additional defenses; use an OS firewall as well.',
  ...Object.entries(entries).map(([key,value])=>{
   if(!allowedKeys.has(key)||typeof value!=='string'||/[\r\n\0#"'`]/.test(value))throw Error(`Invalid .env ${key}`);
   return `${key}=${value}`;
  }),''
 ];
 await stat(dirname(path)).then(s=>{if(!s.isDirectory())throw Error('Bad wallet config directory');});
 const tmp=path+'.'+randomBytes(6).toString('hex')+'.tmp';
 try{await writeFile(tmp,lines.join('\n'),{mode:0o600,flag:'wx'});await chmod(tmp,0o600);await rename(tmp,path);}finally{const {rm}=await import('node:fs/promises');await rm(tmp,{force:true});}
 return path;
}
