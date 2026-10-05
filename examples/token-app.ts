import { TruClient } from '@tru/sdk';

// Supply an authenticated server-side Core transport.
declare const tru: TruClient;

const token = await tru.tokens.issue({
  type: 'FT',
  name: 'SDK Example',
  symbol: 'SDK',
  supply: '1000000',
  decimals: 8,
  address: 'YOUR_TRU_ISSUER_ADDRESS'
});

console.log(token);
