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
