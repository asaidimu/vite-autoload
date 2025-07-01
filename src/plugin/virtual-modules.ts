import { PluginContext } from "./types";

/**
 * Resolves a virtual module ID to its internal representation.
 * @param id The module ID to resolve.
 * @param ctx The plugin context.
 * @returns A resolved ID with the null byte prefix, or null.
 */
export function resolveVirtualId(
  id: string,
  ctx: PluginContext,
): string | null {
  const name = id.replace("virtual:", "");
  const found = ctx.nameIndex.lookup(name);

  if (!found) {
    return null;
  }

  return `\0${id}`;
}

/**
 * Loads the content for a given virtual module.
 * @param id The resolved module ID (including the null byte).
 * @param ctx The plugin context.
 * @returns The generated code as a string, or null.
 */
export async function loadVirtualModule(
  id: string,
  ctx: PluginContext,
): Promise<string | null> {
  const name = id.replace("\0virtual:", "");
  const found = ctx.nameIndex.lookup(name);

  if (!found) {
    return null;
  }

  const isProduction = ctx.config.isProduction;
  const generator = ctx.generators.find((g) => g.find(name));
  if (generator) {
    return generator.code({
      production: isProduction,
      name: found.group ? name : undefined,
    }) as string;
  }

  return null;
}
