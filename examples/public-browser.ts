import { TruClient } from '@tokenizedrealutility/sdk';

const tru = TruClient.public({
  explorerUrl: 'https://tokenizedrealutility.com',
  gateway: 'wallet'
});

const info = await tru.system.getDesktopInfo();
const stats = await tru.explorer?.stats();

console.log({ info, stats });
