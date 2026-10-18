#!/usr/bin/env node
import {stat} from 'node:fs/promises';
import {walletEnvPath} from './lib/config.mjs';
import {runSetup} from './setup.mjs';
try{
 let configured=false;
 try{await stat(walletEnvPath);configured=true;}catch(e){if(e.code!=='ENOENT')throw e;}
 if(!configured && !process.env.TRU_QUANTUM_UI_MODE){
  console.log('No quantum wallet configuration found. Starting first-time setup.');
  await runSetup();
 }
 await import('./web.mjs');
}catch(e){console.error('QUANTUM WALLET ERROR:',e.message);process.exitCode=1;}
