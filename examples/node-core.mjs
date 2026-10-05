import { readFile } from 'node:fs/promises';
import { TruClient, formatTru } from '../dist/index.js';

const token = (await readFile(`${process.env.HOME}/.tru/rpc-cookie-21832`, 'utf8')).trim();

const tru = new TruClient({
  core: { endpoint: 'http://127.0.0.1:21832/rpc', token },
  explorerUrl: 'https://tokenizedrealutility.com',
  neromesh: 'https://tru.neromesh.space'
});

console.log('compatibility', await tru.system.compatibility('0.07.5'));
console.log('chain', await tru.chain.getChainInfo());

const address = process.env.TRU_ADDRESS;
if (address) {
  const balance = await tru.wallet.getBalance(address);
  console.log('balance response', balance);
}
