import { TruClient } from '@tru/sdk';

declare const tru: TruClient;

const stop = new AbortController();

await tru.events.watchBlocks(({ height, block }) => {
  console.log('TRU block', height, block);
}, { intervalMs: 2000, signal: stop.signal });
