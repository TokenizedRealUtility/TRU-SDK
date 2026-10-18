#!/usr/bin/env node
import {createCoreClient} from './lib/core.mjs';
import {createQuantumServer} from './lib/server.mjs';
import {defaultStateDir} from './lib/store.mjs';
import {loadWalletEnv} from './lib/config.mjs';

// Explicit existing process environment takes precedence over the saved file.
await loadWalletEnv();
const port=Number(process.env.TRU_QUANTUM_UI_PORT||24833);
const mode=process.env.TRU_QUANTUM_UI_MODE||'local';
const options={
 tru:createCoreClient(),stateDir:defaultStateDir(),port,mode,
 host:process.env.TRU_QUANTUM_UI_HOST,
 publicHost:process.env.TRU_QUANTUM_UI_PUBLIC_HOST,
 allowWildcardBind:process.env.TRU_QUANTUM_ALLOW_WILDCARD_BIND==='YES_I_UNDERSTAND',
 allowedClientIp:process.env.TRU_QUANTUM_ALLOWED_CLIENT_IP,
 tlsCertPath:process.env.TRU_QUANTUM_TLS_CERT,
 tlsKeyPath:process.env.TRU_QUANTUM_TLS_KEY
};
const app=await createQuantumServer(options);
if(mode==='lan'){
 console.log('\nTRU Quantum Wallet — HTTPS private LAN companion');
 console.log(`Bind ${app.bindHost}:${port}; open on ${app.visitHost}:${port}. Approved client: ${options.allowedClientIp}`);
 console.log('TLS certificate SHA-256 fingerprint: '+app.tlsFingerprint256);
 console.log('Open this PRIVATE link on the approved computer:\n'+app.launchUrl);
 console.log('Trust the exact certificate; never bypass certificate warnings.');
 console.log('Keep UFW/router restricted. NEVER port forward this app or Core RPC to the Internet.');
}else{
 console.log('\nTRU Quantum Wallet — local-only authenticated companion');
 console.log('Open this private link on the SAME machine, or through an SSH tunnel:\n'+app.launchUrl);
}
console.log('\nKeep the session link private. Core credentials never go to the browser. Ctrl+C stops only the companion.\n');
