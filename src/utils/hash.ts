import { createHash } from "crypto";

export function generateMd5Hash(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

/**
 * Serializes a value into a JSON-like string representation, handling various types
 * including objects, arrays, primitives, and circular references.
 *
 * @param value - The value to serialize.
 * @param seen - A WeakMap to track visited objects and detect circular references.
 * @returns A string representation of the serialized value.
 */
function stableSerialize(
  value: any,
  seen: WeakMap<any, any> = new WeakMap(),
): string {
  if (value === undefined) return "undefined";
  if (typeof value === "function" || typeof value === "symbol") return "";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number" || typeof value === "boolean" || value === null)
    return String(value);

  if (Array.isArray(value))
    return `[${value.map((v) => stableSerialize(v, seen)).join(",")}]`;

  if (typeof value === "object") {
    if (seen.has(value)) return `"__circular__"`;
    seen.set(value, true);

    return `{${Object.keys(value)
      .sort()
      .map((key) => `"${key}":${stableSerialize(value[key], seen)}`)
      .join(",")}}`;
  }

  return "";
}

/**
 * Computes the FNV-1a 64-bit hash of the given data.
 *
 * @param data - The data to hash. Can be any type that can be serialized.
 * @returns The FNV-1a 64-bit hash as a hexadecimal string.
 */
export function fnv1a64Hash(data: any): string {
  let hashHigh = 0xcbf29ce4;
  let hashLow = 0x84222325;
  const serialized = stableSerialize(data);

  for (let i = 0; i < serialized.length; i++) {
    hashLow ^= serialized.charCodeAt(i);
    const tempLow = Math.imul(hashLow, 0x100000001b3 & 0xffffffff);
    const tempHigh =
      Math.imul(hashLow, 0x100000001b3 >>> 0) +
      Math.imul(hashHigh, 0x100000001b3 & 0xffffffff);
    hashLow = tempLow >>> 0;
    hashHigh = tempHigh >>> 0;
  }

  return (hashHigh >>> 0).toString(16) + (hashLow >>> 0).toString(16);
}
