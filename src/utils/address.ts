import { TruInvalidAddressError } from "../errors.js";

// Current explorer/mainnet address shape used by TRU's public routes.
export const TRU_MAINNET_ADDRESS_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

export function isTruAddress(value: string): boolean {
  return TRU_MAINNET_ADDRESS_RE.test(value);
}

export function assertTruAddress(value: string): string {
  if (!isTruAddress(value)) throw new TruInvalidAddressError(`Invalid TRU mainnet address: ${value}`);
  return value;
}
