import type { CompatibilityResult, JsonObject, JsonValue } from "../types.js";
import { RpcModule } from "./base.js";

const SDK_VERSION = "1.0.0";

function extractVersion(value: JsonValue): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const obj = value as JsonObject;
  for (const key of ["version", "coreVersion", "core_version", "build", "release"]) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function tuple(version: string): [number, number, number] | undefined {
  const m = version.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return undefined;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function gte(a: string, b: string): boolean | "unknown" {
  const av = tuple(a), bv = tuple(b);
  if (!av || !bv) return "unknown";
  for (let i = 0; i < 3; i++) {
    if (av[i]! > bv[i]!) return true;
    if (av[i]! < bv[i]!) return false;
  }
  return true;
}

export class SystemModule extends RpcModule {
  getInfo<T = JsonValue>(): Promise<T> { return this.call<T>("getinfo"); }
  getDesktopInfo<T = JsonValue>(authToken?: string): Promise<T> {
    return this.call<T>("getdesktopinfo", authToken ? { authToken } : {});
  }
  getChainSupply<T = JsonValue>(): Promise<T> { return this.call<T>("getchainsupply"); }
  getChainHealth<T = JsonValue>(): Promise<T> { return this.call<T>("getchainhealth"); }
  getChainMetadata<T = JsonValue>(): Promise<T> { return this.call<T>("getchainmetadata"); }

  async compatibility(minimumCoreVersion = "0.07.5"): Promise<CompatibilityResult> {
    let source: CompatibilityResult["source"] = "unavailable";
    let details: JsonValue | undefined;
    try {
      details = await this.getInfo();
      source = "getinfo";
    } catch {
      try {
        details = await this.getDesktopInfo();
        source = "getdesktopinfo";
      } catch {
        return { sdkVersion: SDK_VERSION, minimumCoreVersion, compatible: "unknown", source };
      }
    }
    const detectedCoreVersion = details === undefined ? undefined : extractVersion(details);
    const compatible = detectedCoreVersion ? gte(detectedCoreVersion, minimumCoreVersion) : "unknown";
    const result: CompatibilityResult = { sdkVersion: SDK_VERSION, minimumCoreVersion, compatible, source, details };
    if (detectedCoreVersion) result.detectedCoreVersion = detectedCoreVersion;
    return result;
  }
}
