import type { BlockEvent, JsonValue, PollingOptions } from "./types.js";
import { ChainModule } from "./modules/chain.js";

function numericHeight(value: JsonValue): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const key of ["height", "blocks", "blockcount", "count"]) {
      const candidate = value[key];
      if (typeof candidate === "number") return candidate;
      if (typeof candidate === "string" && /^\d+$/.test(candidate)) return Number(candidate);
    }
  }
  throw new TypeError("Could not determine block height from Core response");
}

export class TruEvents {
  constructor(private readonly chain: ChainModule) {}

  async watchBlocks(onBlock: (event: BlockEvent) => void | Promise<void>, options: PollingOptions = {}): Promise<void> {
    const intervalMs = options.intervalMs ?? 2000;
    let lastHeight: number | undefined;
    while (!options.signal?.aborted) {
      try {
        const height = numericHeight(await this.chain.getBlockCount());
        if (lastHeight === undefined) {
          lastHeight = height;
          if (options.emitExistingTip) await onBlock({ height, block: await this.chain.getBlockByHeight(height) });
        } else if (height > lastHeight) {
          for (let h = lastHeight + 1; h <= height; h++) {
            await onBlock({ height: h, block: await this.chain.getBlockByHeight(h) });
          }
          lastHeight = height;
        } else if (height < lastHeight) {
          // Reorg/rewind: reset baseline; callers can compare hashes if they need richer semantics.
          lastHeight = height;
          await onBlock({ height, block: await this.chain.getBlockByHeight(height) });
        }
      } catch {
        // Event polling is intentionally resilient; direct RPC methods still throw normally.
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
}
