import { NameIndex } from "../utils/name-index";
import { ModuleGenerator } from "../generators/generator";

/**
 * Resolves a virtual module ID to its internal representation.
 *
 * @param id - The module ID to resolve.
 * @param nameIndex - The NameIndex utility for looking up names.
 * @returns A resolved ID with the null byte prefix, or null.
 */
export function resolveVirtualId(
  id: string,
  nameIndex: NameIndex,
): string | null {
  const name = id.replace("virtual:", "");
  const found = nameIndex.lookup(name);

  if (!found) {
    return null;
  }

  return `\0${id}`;
}

/**
 * Resolves an alias import (e.g. `@generated/views`) to a virtual module ID.
 *
 * @param id - The import ID to resolve.
 * @param alias - The alias prefix (e.g. "@generated").
 * @returns A resolved ID with the null byte prefix, or null.
 */
export function resolveAliasId(
  id: string,
  alias: string,
): string | null {
  if (!id.startsWith(alias + "/") && id !== alias) {
    return null;
  }

  const name = id.slice(alias.length + 1);
  if (!name) {
    return null;
  }

  return `\0virtual:${name}`;
}

/**
 * Loads the content for a given virtual module.
 *
 * @param id - The resolved module ID (including the null byte).
 * @param nameIndex - The NameIndex utility for looking up names.
 * @param isProduction - Whether the build is for production.
 * @param generators - An array of module generators.
 * @returns The generated code as a string, or null.
 */
export async function loadVirtualModule(
  id: string,
  nameIndex: NameIndex,
  isProduction: boolean,
  generators: ModuleGenerator[],
): Promise<string | null> {
  const name = id.replace("\0virtual:", "");
  const found = nameIndex.lookup(name);

  if (!found) {
    return null;
  }

  const generator = generators.find((g) => g.find(name));
  if (generator) {
    return (await generator.code({
      production: isProduction,
      name: found.group ? name : undefined,
    })) as string;
  }

  return null;
}

/**
 * Loads an alias-resolved virtual module, replacing source paths
 * with chunk filenames using the provided mapping.
 *
 * @param id - The resolved module ID (including the null byte).
 * @param nameIndex - The NameIndex utility for looking up names.
 * @param isProduction - Whether the build is for production.
 * @param generators - An array of module generators.
 * @param sourceToChunk - Mapping from source file paths to chunk filenames.
 * @returns The generated code as a string, or null.
 */
export async function loadAliasModule(
  id: string,
  nameIndex: NameIndex,
  isProduction: boolean,
  generators: ModuleGenerator[],
  sourceToChunk: Map<string, string>,
): Promise<string | null> {
  const name = id.replace("\0virtual:", "");
  const found = nameIndex.lookup(name);

  if (!found) {
    return null;
  }

  const generator = generators.find((g) => g.find(name));
  if (!generator) {
    return null;
  }

  const code = (await generator.code({
    production: isProduction,
    name: found.group ? name : undefined,
  })) as string;

  if (!isProduction || sourceToChunk.size === 0) {
    return code;
  }

  // Replace source paths in the generated data with chunk filenames
  let result = code;
  for (const [sourcePath, chunkPath] of sourceToChunk) {
    // Match the source path as a JSON string value
    const escaped = sourcePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.split(`"${sourcePath}"`).join(`"${chunkPath}"`);
  }

  return result;
}
