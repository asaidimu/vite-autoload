import crypto from "crypto";

/**
 * Generates an MD5 hash for the given input string.
 *
 * @param input - The string to hash.
 * @returns The MD5 hash as a hexadecimal string.
 */
export function generateMd5Hash(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}
