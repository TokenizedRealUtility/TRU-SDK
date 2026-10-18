import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,stat,rm} from 'node:fs/promises';
import {tmpdir,networkInterfaces} from 'node:os';
import {join} from 'node:path';
import https from 'node:https';
import {createServer as netServer} from 'node:net';
import {createQuantumServer,isPrivateLanIPv4} from '../apps/quantum-wallet/lib/server.mjs';
import {parseWalletEnv,saveWalletEnv,loadWalletEnv} from '../apps/quantum-wallet/lib/config.mjs';
import {ensureLanCertificate} from '../apps/quantum-wallet/setup.mjs';

function lanIp(){for(const addresses of Object.values(networkInterfaces()))for(const a of addresses||[])if(a.family==='IPv4'&&!a.internal&&isPrivateLanIPv4(a.address))return a.address;}
async function getPort(){const s=netServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const port=s.address().port;await new Promise(r=>s.close(r));return port;}
const mockTru={quantum:{consensus:async()=>({active:false}),list:async()=>[],receive:async()=>({address:'descriptor'})},raw:{call:async()=>({})}};

test('wallet .env accepts allowlisted variables, never evaluates shell commands',async()=>{
 assert.deepEqual(parseWalletEnv('# comment\nTRU_QUANTUM_UI_MODE=lan\nTRU_QUANTUM_UI_HOST=0.0.0.0\n'),{TRU_QUANTUM_UI_MODE:'lan',TRU_QUANTUM_UI_HOST:'0.0.0.0'});
 assert.throws(()=>parseWalletEnv('MALICIOUS=1'),/Unrecognized/);
 assert.throws(()=>parseWalletEnv('TRU_QUANTUM_UI_MODE=x\nTRU_QUANTUM_UI_MODE=y'),/Duplicate/);
 assert.throws(()=>parseWalletEnv('TRU_QUANTUM_UI_HOST=$(whoami)'),/Unsafe/);
 const dir=await mkdtemp(join(tmpdir(),'tru-config-v03-'));
 try{
  const file=join(dir,'.env');
  await saveWalletEnv({TRU_QUANTUM_UI_MODE:'lan',TRU_QUANTUM_UI_HOST:'0.0.0.0',TRU_QUANTUM_ALLOW_WILDCARD_BIND:'YES_I_UNDERSTAND'},file);
  assert.equal((await stat(file)).mode&0o077,0);
  const env={TRU_QUANTUM_UI_MODE:'local'};
  assert.equal(await loadWalletEnv(file,env),true);
  assert.equal(env.TRU_QUANTUM_UI_MODE,'local');
  assert.equal(env.TRU_QUANTUM_UI_HOST,'0.0.0.0');
  assert.equal(await loadWalletEnv(join(dir,'none'),{}),false);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('setup auto-generates IP-specific certificate once and preserves existing TLS identity',async(t)=>{
 const ip=lanIp();if(!ip){t.skip('Private IPv4 interface unavailable');return;}
 const dir=await mkdtemp(join(tmpdir(),'tru-tls-v03-'));
 try{
  const a=await ensureLanCertificate(ip,{home:dir});
  assert.equal(a.reused,false);
  assert.equal((await stat(a.key)).mode&0o077,0);
  const b=await ensureLanCertificate(ip,{home:dir});
  assert.deepEqual({...b,reused:false},a);
  assert.equal(b.reused,true);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('wildcard HTTPS requires explicit opt-in, authenticates by real LAN Host/IP/bearer',async(t)=>{
 const ip=lanIp();if(!ip){t.skip('Private IPv4 interface unavailable');return;}
 const dir=await mkdtemp(join(tmpdir(),'tru-wild-v03-'));
 let app;
 try{
  const {cert,key}=await ensureLanCertificate(ip,{home:dir});
  const port=await getPort();
  const opts={tru:mockTru,stateDir:dir,port,mode:'lan',host:'0.0.0.0',publicHost:ip,allowedClientIp:ip,tlsCertPath:cert,tlsKeyPath:key,logger:{error:()=>{}}};
  await assert.rejects(createQuantumServer(opts),/Wildcard bind requires explicit/);
  await assert.rejects(createQuantumServer({...opts,publicHost:'8.8.8.8',allowWildcardBind:true}),/private/);
  app=await createQuantumServer({...opts,allowWildcardBind:true});
  assert.equal(app.bindHost,'0.0.0.0');
  assert.equal(app.origin,`https://${ip}:${port}`);
  const ca=await readFile(cert);
  const request=(host,auth)=>new Promise((resolve,reject)=>{
   const req=https.get({hostname:ip,port,servername:ip,ca,headers:{Host:host,...(auth?{Authorization:`Bearer ${auth}`}:{})}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);
  });
  assert.equal(await request(`${ip}:${port}`),200);
  assert.equal(await request(`0.0.0.0:${port}`),403);
  assert.equal(await request(`${ip}:${port}`,app.sessionKey),200);
 }finally{if(app)await new Promise(r=>app.server.close(r));await rm(dir,{recursive:true,force:true});}
});
