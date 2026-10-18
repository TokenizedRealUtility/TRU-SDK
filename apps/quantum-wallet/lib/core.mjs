import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { TruClient } from '../../../dist/index.js';

export function createCoreClient() {
  const endpoint=process.env.TRU_RPC_URL || 'http://127.0.0.1:21832/rpc';
  const u=new URL(endpoint);
  if(!['http:','https:'].includes(u.protocol) || !['127.0.0.1','localhost','[::1]'].includes(u.hostname) || u.pathname!=='/rpc' || u.username || u.password || u.search || u.hash)
    throw Error('TRU_RPC_URL must be a direct local loopback /rpc endpoint');
  const port=u.port || (u.protocol==='https:'?'443':'80');
  const cookie=process.env.TRU_RPC_COOKIE_FILE || (process.platform==='win32' ? join(process.env.LOCALAPPDATA || '.', 'TRU',`rpc-cookie-${port}`):join(homedir(),'.tru',`rpc-cookie-${port}`));
  return TruClient.direct(endpoint,async()=>(process.env.TRU_RPC_TOKEN || await readFile(cookie,'utf8')).trim(),{timeoutMs:30000});
}
