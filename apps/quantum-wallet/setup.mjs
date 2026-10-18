#!/usr/bin/env node
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {homedir,networkInterfaces} from 'node:os';
import {join} from 'node:path';
import {readFile, stat, mkdir, chmod} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {X509Certificate} from 'node:crypto';
import {isPrivateLanIPv4} from './lib/server.mjs';
import {walletEnvPath,saveWalletEnv} from './lib/config.mjs';

export function lanInterfaces(){
 return [...new Set(Object.values(networkInterfaces()).flatMap(addresses=>(addresses||[])
  .filter(a=>a.family==='IPv4'&&isPrivateLanIPv4(a.address)).map(a=>a.address)))];
}
function matchingCert(bytes,ip){
 try{const x=new X509Certificate(bytes);return x.checkIP(ip,{subject:'never'})===ip&&Date.now()<Date.parse(x.validTo)&&Date.now()>=Date.parse(x.validFrom);}catch{return false;}
}
export async function ensureLanCertificate(ip,{home=homedir(),run=execFileSync}={}){
 if(!isPrivateLanIPv4(ip))throw Error('Certificate requires a private IPv4 address');
 const dir=join(home,'.tru-quantum-ui','tls');await mkdir(dir,{recursive:true,mode:0o700});
 await chmod(dir,0o700);
 const pairs=[['lan.crt','lan.key'],[`lan-${ip.replaceAll('.','-')}.crt`,`lan-${ip.replaceAll('.','-')}.key`]];
 for(const [c,k] of pairs){
  const cert=join(dir,c),key=join(dir,k);
  let cb,ks;
  try{[cb,ks]=await Promise.all([readFile(cert),stat(key)]);}catch(e){if(e.code==='ENOENT')continue;throw e;}
  if(matchingCert(cb,ip)&&ks.isFile()&&(ks.mode&0o077)===0)return {cert,key,reused:true};
 }
 const [c,k]=pairs[1],cert=join(dir,c),key=join(dir,k);
 try{await stat(cert);throw Error(`A TLS certificate already exists at ${cert}; move it aside after verification before renewing`);}catch(e){if(e.code!=='ENOENT')throw e;}
 try{await stat(key);throw Error(`A TLS key already exists at ${key}; move it aside after verification before renewing`);}catch(e){if(e.code!=='ENOENT')throw e;}
 run('openssl',['req','-x509','-newkey','rsa:3072','-sha256','-nodes','-days','365',
  '-keyout',key,'-out',cert,'-subj','/CN=TRU Quantum Wallet LAN',
  '-addext',`subjectAltName=IP:${ip}`,
  '-addext','basicConstraints=critical,CA:FALSE',
  '-addext','keyUsage=critical,digitalSignature,keyEncipherment',
  '-addext','extendedKeyUsage=serverAuth'],{stdio:'ignore'});
 await chmod(key,0o600);await chmod(cert,0o600);
 if(!matchingCert(await readFile(cert),ip))throw Error('Generated TLS certificate verification failed');
 return {cert,key,reused:false};
}

export async function runSetup({input=stdin,output=stdout}={}){
 if(!input.isTTY)throw Error('Interactive terminal required for the setup wizard. See quantum-wallet.env.example for manual configuration.');
 const rl=createInterface({input,output});
 const ask=async(label,def='')=>(await rl.question(`${label}${def?` [${def}]`:''}: `)).trim()||def;
 try{
  output.write('\nTRU Quantum Wallet — First-time setup\nLocal is the safest default. No router port forwarding or public signing service.\n');
  const chosen=(await ask('Access mode: 1=local, 2=private LAN HTTPS','1')).toLowerCase();
  if(!['1','2','local','lan'].includes(chosen))throw Error('Choose local (1) or private LAN (2)');
  const lan=chosen==='2'||chosen==='lan';
  const port=await ask('Wallet web port','24833');
  if(!/^\d+$/.test(port)||Number(port)<1024||Number(port)>65535)throw Error('Port must be 1024..65535');
  const config={TRU_QUANTUM_UI_MODE:lan?'lan':'local',TRU_QUANTUM_UI_PORT:port};
  if(lan){
   const ips=lanInterfaces();
   if(!ips.length)throw Error('No private IPv4 network interface detected');
   const publicHost=await ask('Which private IPv4 address will browser users open?',ips[0]);
   if(!isPrivateLanIPv4(publicHost)||!ips.includes(publicHost))throw Error('That private IPv4 must be assigned to this machine');
   const bind=await ask('Bind IP: exact address or 0.0.0.0 (advanced)',publicHost);
   if(bind!==publicHost&&bind!=='0.0.0.0')throw Error('Bind must be the selected private IPv4 or 0.0.0.0');
   const clientIp=await ask('Approved client private IPv4 (e.g. your Mac)');
   if(!isPrivateLanIPv4(clientIp))throw Error('Approved client must be an exact private IPv4 address');
   if(bind==='0.0.0.0'){
    output.write('WARNING: 0.0.0.0 listens on every IPv4 interface. This must NEVER be exposed through port forwarding or a public firewall.\n');
    const confirm=await ask('Type WILDCARD to explicitly approve this wider bind');
    if(confirm!=='WILDCARD')throw Error('Wildcard binding not acknowledged');
    config.TRU_QUANTUM_ALLOW_WILDCARD_BIND='YES_I_UNDERSTAND';
   }
   const tls=await ensureLanCertificate(publicHost);
   config.TRU_QUANTUM_UI_HOST=bind;
   config.TRU_QUANTUM_UI_PUBLIC_HOST=publicHost;
   config.TRU_QUANTUM_ALLOWED_CLIENT_IP=clientIp;
   config.TRU_QUANTUM_TLS_CERT=tls.cert;
   config.TRU_QUANTUM_TLS_KEY=tls.key;
   const cert=new X509Certificate(await readFile(tls.cert));
   output.write(`HTTPS certificate ${tls.reused?'reused':'created'}: ${tls.cert}\n`);
   output.write(`Fingerprint SHA-256: ${cert.fingerprint256}\n`);
   output.write('Transfer and trust only the certificate (.crt) on the browser computer; never copy the .key.\n');
   output.write(`Configure host firewall to allow TCP ${port} ONLY from ${clientIp}; no public/router forwarding.\n`);
   output.write(`UFW example: sudo ufw allow from ${clientIp} to ${publicHost} port ${port} proto tcp\n`);
  }
  try{await stat(walletEnvPath);const confirm=await ask('A wallet .env exists. Type REPLACE to overwrite settings');if(confirm!=='REPLACE')throw Error('Existing settings left untouched');}
  catch(e){if(e.code!=='ENOENT')throw e;}
  await saveWalletEnv(config);
  output.write(`\nSaved private configuration: ${walletEnvPath}\nRun: npm run quantum:wallet\n`);
  return config;
 }finally{rl.close();}
}
if(process.argv[1] && import.meta.url===new URL(`file://${process.argv[1]}`).href){
 runSetup().catch(e=>{console.error('SETUP ERROR:',e.message);process.exitCode=1;});
}
