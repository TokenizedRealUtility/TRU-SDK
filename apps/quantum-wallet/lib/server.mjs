import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { randomBytes, timingSafeEqual, X509Certificate } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { isIP } from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ensureStore } from './store.mjs';
import { createController } from './controller.mjs';

const staticRoot=join(dirname(fileURLToPath(import.meta.url)),'../public');
const routeActions=new Map([
 ['GET /api/status',['status',false]],['GET /api/list',['list',false]],['GET /api/node',['node',false]],['GET /api/records',['records',false]],
 ['POST /api/receive',['receive',true]],['POST /api/utxos',['utxos',false]],['POST /api/input',['input',false]],['POST /api/record',['record',false]],
 ['POST /api/sign',['sign',true]],['POST /api/recover',['recover',true]],['POST /api/decode',['decode',false]],['POST /api/submit',['submit',true]]
]);
const assets=new Map([['/','index.html'],['/index.html','index.html'],['/app.js','app.js'],['/style.css','style.css']]);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const baseHeaders={
 'Cache-Control':'no-store, max-age=0','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',
 'X-Frame-Options':'DENY','Cross-Origin-Resource-Policy':'same-origin',
 'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
};
function reply(res,status,body,secure,type='application/json; charset=utf-8'){
 const headers=secure?{...baseHeaders,'Strict-Transport-Security':'max-age=86400'}:baseHeaders;
 res.writeHead(status,{...headers,'Content-Type':type});res.end(typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body));
}
async function jsonBody(req){
 if(!req.headers['content-type']?.startsWith('application/json'))throw Error('application/json required');
 let buf='';for await(const b of req){buf+=b.toString('utf8');if(buf.length>12000)throw Error('Request too large');}
 const p=JSON.parse(buf||'{}');if(!p||typeof p!=='object'||Array.isArray(p))throw Error('JSON object required');return p;
}
export function isPrivateLanIPv4(ip){
 if(typeof ip!=='string'||isIP(ip)!==4)return false;
 const p=ip.split('.').map(Number);
 return p[0]===10 || (p[0]===172&&p[1]>=16&&p[1]<=31) || (p[0]===192&&p[1]===168);
}
async function loadLanTls({host,tlsCertPath,tlsKeyPath}){
 if(!tlsCertPath||!tlsKeyPath)throw Error('Secure LAN mode requires TRU_QUANTUM_TLS_CERT and TRU_QUANTUM_TLS_KEY');
 const [certInfo,keyInfo,cert,key]=await Promise.all([
  stat(tlsCertPath),stat(tlsKeyPath),readFile(tlsCertPath),readFile(tlsKeyPath)
 ]);
 if(!certInfo.isFile()||!keyInfo.isFile())throw Error('TLS cert and key must be files');
 if((keyInfo.mode&0o077)!==0)throw Error('TLS private key must not be group/world readable: chmod 600 '+tlsKeyPath);
 const x509=new X509Certificate(cert);
 // Require an actual IP subjectAltName. Do not rely on the certificate common name.
 if(x509.checkIP(host,{subject:'never'})!==host || !x509.subjectAltName?.split(',').map(x=>x.trim()).includes(`IP Address:${host}`))
  throw Error('TLS certificate must include subjectAltName IP:'+host);
 const now=Date.now();
 if(now<Date.parse(x509.validFrom)||now>=Date.parse(x509.validTo))throw Error('TLS certificate is not currently valid');
 return {cert,key,fingerprint256:x509.fingerprint256};
}
export async function createQuantumServer({
 tru,stateDir,port=24833,sessionKey=randomBytes(32).toString('hex'),logger=console,
 mode='local',host,publicHost,allowWildcardBind=false,allowedClientIp,tlsCertPath,tlsKeyPath
}={}){
 if(!tru||!stateDir)throw Error('tru and stateDir are required');
 if(!Number.isSafeInteger(port)||port<1024||port>65535)throw Error('Invalid port');
 if(mode!=='local'&&mode!=='lan')throw Error('Mode must be local or lan');
 if(typeof sessionKey!=='string'||!/^[a-f0-9]{64}$/.test(sessionKey))throw Error('Session key must be 32 random bytes in hex');
 const lan=mode==='lan';
 let tls;
 if(lan){
  if(host==='0.0.0.0'){
   if(allowWildcardBind!==true)throw Error('Wildcard bind requires explicit TRU_QUANTUM_ALLOW_WILDCARD_BIND acknowledgement');
   if(!isPrivateLanIPv4(publicHost))throw Error('Wildcard bind requires a private TRU_QUANTUM_UI_PUBLIC_HOST');
  } else if(!isPrivateLanIPv4(host))throw Error('LAN mode requires an exact private IPv4 bind address, or explicitly approved wildcard');
  if(publicHost && !isPrivateLanIPv4(publicHost))throw Error('LAN public host must be a private IPv4 address');
  if(!isPrivateLanIPv4(allowedClientIp))throw Error('LAN mode requires one explicit approved private client IP');
  tls=await loadLanTls({host:publicHost||host,tlsCertPath,tlsKeyPath});
 }else if(host && host!=='127.0.0.1')throw Error('Local mode must bind 127.0.0.1');
 const bindHost=lan?host:'127.0.0.1';
 const visitHost=lan?(publicHost||host):bindHost;
 const origin=`${lan?'https':'http'}://${visitHost}:${port}`;
 await ensureStore(stateDir);
 const controller=createController(tru,stateDir);
 let mutating=false;
 const responder=(req,res)=>{
  // Reject other LAN clients before static files, without trusting proxy headers.
  const remote=req.socket.remoteAddress?.replace(/^::ffff:/,'');
  if(lan && remote!==allowedClientIp)return reply(res,403,{error:'Client IP not authorized'},lan);
  const handler=async()=>{
   try{
    if(req.headers.host!==`${visitHost}:${port}`)return reply(res,403,{error:`Host blocked: use ${visitHost}`},lan);
    if(lan && !req.socket.encrypted)return reply(res,403,{error:'HTTPS required'},lan);
    const url=new URL(req.url,origin);
    if(!assets.has(url.pathname)&&!routeActions.has(`${req.method} ${url.pathname}`))return reply(res,404,{error:'Not found'},lan);
    if(assets.has(url.pathname)&&req.method==='GET'){
     const name=assets.get(url.pathname);const data=await readFile(join(staticRoot,name));
     return reply(res,200,data,lan,types[name.slice(name.lastIndexOf('.'))]);
    }
    if(!routeActions.has(`${req.method} ${url.pathname}`))return reply(res,405,{error:'Method not allowed'},lan);
    const match=/^Bearer ([0-9a-f]{64})$/.exec(req.headers.authorization||'');
    const provided=Buffer.from(match?.[1]||'','utf8'),expected=Buffer.from(sessionKey,'utf8');
    if(provided.length!==expected.length || !timingSafeEqual(provided,expected))return reply(res,401,{error:'Open using the private launch link from the terminal'},lan);
    if(req.method==='POST' && req.headers.origin!==origin)return reply(res,403,{error:'Cross-origin request blocked'},lan);
    const [method,mutation]=routeActions.get(`${req.method} ${url.pathname}`);
    if(mutation && mutating)return reply(res,409,{error:'Another quantum operation is in progress'},lan);
    const input=req.method==='POST'?await jsonBody(req):{};
    if(mutation)mutating=true;
    try{
     const result=await controller[method](input);
     return reply(res,200,{ok:true,result},lan);
    } finally {if(mutation)mutating=false;}
   } catch(e) {logger.error?.('[quantum-wallet]',e.message);return reply(res,400,{error:String(e.message||e)},lan);}
  };
  void handler();
 };
 const server=lan?createHttpsServer({cert:tls.cert,key:tls.key,minVersion:'TLSv1.2'},responder):createHttpServer(responder);
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,bindHost,resolve);});
 return {server,sessionKey,origin,visitHost,launchUrl:`${origin}/#${sessionKey}`,mode,bindHost,tlsFingerprint256:tls?.fingerprint256||null};
}
