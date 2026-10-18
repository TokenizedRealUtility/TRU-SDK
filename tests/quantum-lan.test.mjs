import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,chmod,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir,networkInterfaces} from 'node:os';
import {join} from 'node:path';
import https from 'node:https';
import http from 'node:http';
import {createServer as netServer} from 'node:net';
import {createQuantumServer,isPrivateLanIPv4} from '../apps/quantum-wallet/lib/server.mjs';

function ipv4(){for(const addrs of Object.values(networkInterfaces()))for(const x of addrs||[])
 if(x.family==='IPv4'&&!x.internal&&isPrivateLanIPv4(x.address))return x.address;return null;}
async function port(){const s=netServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
const mockTru={quantum:{consensus:async()=>({active:false,activation_height:50000,candidate_height:48149}),list:async()=>[],receive:async()=>({address:'test descriptor'})},raw:{call:async()=>({blocks:48148})}};
const makeOpts=(dir,p,ip,cert,key)=>({tru:mockTru,stateDir:dir,port:p,mode:'lan',host:ip,allowedClientIp:ip,tlsCertPath:cert,tlsKeyPath:key,logger:{error:()=>{}}});
async function request(port,ip,cert,method='GET',path='/',extra={}){
 return new Promise((resolve,reject)=>{
  const req=https.request({hostname:ip,port,path,method,servername:ip,ca:cert,rejectUnauthorized:true,headers:{...(extra.headers||{}),Host:extra.host||`${ip}:${port}`}},res=>{
   let body='';res.on('data',d=>body+=d);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));
  });req.on('error',reject);if(method==='POST')req.end(extra.body||'{}');else req.end();
 });
}
test('LAN config rejects public/wildcard binds and requires TLS + explicit approved client',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'tru-q-lan-'));try{
  const p=await port();
  await assert.rejects(createQuantumServer({tru:mockTru,stateDir:dir,port:p,mode:'lan',host:'0.0.0.0',allowedClientIp:'192.168.1.82'}),/Wildcard bind requires explicit/);
  await assert.rejects(createQuantumServer({tru:mockTru,stateDir:dir,port:p,mode:'lan',host:'8.8.8.8',allowedClientIp:'192.168.1.82'}),/private IPv4/);
  await assert.rejects(createQuantumServer({tru:mockTru,stateDir:dir,port:p,mode:'lan',host:'192.168.1.209',allowedClientIp:'192.168.1.82'}),/TLS_CERT/);
  await assert.rejects(createQuantumServer({tru:mockTru,stateDir:dir,port:p,mode:'lan',host:'192.168.1.209',allowedClientIp:'0.0.0.0',tlsCertPath:'foo',tlsKeyPath:'bar'}),/approved private client/);
  await assert.rejects(createQuantumServer({tru:mockTru,stateDir:dir,port:p,mode:'local',host:'0.0.0.0'}),/127.0.0.1/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('secure LAN HTTPS enforces certificate, bearer, Host, Origin, and existing API',async(t)=>{
 const ip=ipv4();if(!ip){t.skip('No private IPv4 interface in this test host');return;}
 try{execFileSync('openssl',['version'],{stdio:'ignore'});}catch{t.skip('OpenSSL not installed');return;}
 const dir=await mkdtemp(join(tmpdir(),'tru-q-lan-'));const cert=join(dir,'cert.pem'),key=join(dir,'key.pem');
 let app;
 try{
  execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','2','-keyout',key,'-out',cert,'-subj','/CN=TRU Quantum LAN test','-addext',`subjectAltName=IP:${ip}`,'-addext','basicConstraints=critical,CA:FALSE'],{stdio:'ignore'});
  await chmod(key,0o600);
  const p=await port(),o=makeOpts(dir,p,ip,cert,key);
  const invalidKey=join(dir,'invalid-cert-key.pem');await readFile(key).then(async b=>{const {writeFile}=await import('node:fs/promises');await writeFile(invalidKey,b,{mode:0o644});});
  await assert.rejects(createQuantumServer({...o,tlsKeyPath:invalidKey}),/chmod 600/);
  await assert.rejects(createQuantumServer({...o,host:ip==='10.0.0.1'?'10.0.0.2':'10.0.0.1'}),/subjectAltName/);
  app=await createQuantumServer(o);assert.equal(app.origin,`https://${ip}:${p}`);assert.match(app.launchUrl,/#[0-9a-f]{64}$/);
  assert.match(app.tlsFingerprint256,/^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/);
  const certB=await readFile(cert);
  assert.equal((await request(p,ip,certB)).status,200);
  assert.equal((await request(p,ip,certB,'GET','/',{host:'attacker.example'})).status,403);
  assert.equal((await request(p,ip,certB,'GET','/api/status')).status,401);
  assert.equal((await request(p,ip,certB,'GET','/api/status',{headers:{Authorization:`Bearer ${app.sessionKey}`}})).status,200);
  assert.equal((await request(p,ip,certB,'POST','/api/receive',{headers:{Authorization:`Bearer ${app.sessionKey}`,'Content-Type':'application/json',Origin:'https://attacker.example'}})).status,403);
  assert.equal((await request(p,ip,certB,'POST','/api/receive',{headers:{Authorization:`Bearer ${app.sessionKey}`,'Content-Type':'application/json',Origin:app.origin}})).status,200);
  assert.equal((await request(p,ip,certB,'GET','/api/privateKeys',{headers:{Authorization:`Bearer ${app.sessionKey}`}})).status,404);
  // No plain HTTP listener at the TLS endpoint.
  const plain=await new Promise(resolve=>{const r=http.get(`http://${ip}:${p}/`,res=>{res.resume();resolve('success');});r.on('error',()=>resolve('rejected'));});
  assert.equal(plain,'rejected');
 }finally{if(app)await new Promise(r=>app.server.close(r));await rm(dir,{recursive:true,force:true});}
});
