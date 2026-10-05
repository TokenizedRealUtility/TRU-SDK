import { NeromeshClient } from '@tru/sdk';

const mesh = new NeromeshClient({
  baseUrl: 'https://tru.neromesh.space',
  customerToken: process.env.NEROMESH_CUSTOMER_TOKEN
});

console.log(await mesh.health());

const offer = await mesh.createOffer({
  job_type: 'text.generate',
  privacy_tier: 'community',
  accept_community_processing: true,
  reward_tru: '0.01000000',
  input: {
    prompt: 'Create three original names for a fictional city.',
    max_output_tokens: 128
  }
});

console.log(offer);
