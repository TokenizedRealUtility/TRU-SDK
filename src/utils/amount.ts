export const TRU_ATOMS_PER_TRU = 100_000_000n;
export const TRU_DECIMALS = 8;

export function parseTru(value: string): bigint {
  if (!/^(0|[1-9]\d*)(\.\d{1,8})?$/.test(value)) {
    throw new TypeError("Invalid TRU amount: use a non-negative base-10 value with at most 8 decimal places");
  }
  const [whole = "0", fraction = ""] = value.split(".");
  const padded = (fraction + "00000000").slice(0, 8);
  return BigInt(whole) * TRU_ATOMS_PER_TRU + BigInt(padded);
}

export function formatTru(atoms: bigint): string {
  if (atoms < 0n) throw new RangeError("TRU atoms cannot be negative");
  const whole = atoms / TRU_ATOMS_PER_TRU;
  const fraction = (atoms % TRU_ATOMS_PER_TRU).toString().padStart(8, "0");
  return `${whole}.${fraction}`;
}

export function formatTruTrimmed(atoms: bigint): string {
  const fixed = formatTru(atoms);
  const trimmed = fixed.replace(/0+$/, "").replace(/\.$/, "");
  return trimmed || "0";
}
