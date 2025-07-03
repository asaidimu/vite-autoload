import { z } from "zod";
import { parseTypeScriptFileForExportedMetadata } from "./ast-parser";

/**
 * Interface for a metadata extractor.
 */
interface MetadataExtractor {
  /**
   * Extracts metadata from a given file path.
   * @param filePath - The path to the file from which to extract metadata.
   * @returns The extracted metadata.
   */
  extract: (filePath: string) => any;
}

/**
 * Checks if a value is a dynamic import string.
 *
 * @param value - The value to check.
 * @returns True if the value is a dynamic import string, false otherwise.
 */
function isImportString(value: any): boolean {
  return typeof value === "string" && value.startsWith("() => import(");
}

/**
 * Creates a dynamic import function from an import string.
 *
 * @param importString - The string representing the dynamic import.
 * @returns A function that, when called, dynamically imports the module.
 * @throws Error if the import string format is invalid.
 */
function createDynamicImportFunction(importString: string): () => Promise<any> {
  // Extract the path and property from the import string
  const pathMatch = importString.match(/import\('([^']+)'\)/);
  const propertyMatch = importString.match(
    /\.then\(m => (m\.default|m\.[^)]+)\)/,
  );

  if (!pathMatch || !propertyMatch) {
    throw new Error(`Invalid import string format: ${importString}`);
  }

  const importPath = pathMatch[1];
  const isDefault = propertyMatch[1] === "m.default";

  // Construct the function string explicitly
  const funcString = `() => import('${importPath}').then(m => ${isDefault ? "m.default" : `m.${propertyMatch[1].slice(2)}`})`;

  // Use new Function to create the function from the string
  return new Function(`return ${funcString}`)() as () => Promise<any>;
}

/**
 * Recursively transforms import strings within an object or array to dynamic import functions.
 *
 * @param obj - The object or array to transform.
 * @returns The transformed object or array.
 */
function transformImportStrings(obj: any): any {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformImportStrings);
  }

  const transformed = { ...obj };
  for (const [key, value] of Object.entries(transformed)) {
    if (isImportString(value)) {
      transformed[key] = createDynamicImportFunction(value as string);
    } else if (typeof value === "object") {
      transformed[key] = transformImportStrings(value);
    }
  }

  return transformed;
}

/**
 * Creates a metadata extractor that validates and transforms extracted metadata using a Zod schema.
 *
 * @param schema - The Zod schema to validate the extracted metadata against.
 * @param options - Options for the extractor, including the export name to look for.
 * @returns A MetadataExtractor instance.
 */
export function createMetadataExtractor(
  schema: z.ZodType,
  options: { exportName?: string | "default" } = { exportName: "metadata" },
): MetadataExtractor {
  const transformedSchema = schema.transform((obj) => {
    return transformImportStrings(obj);
  });

  return {
    async extract(filePath: string) {
      const metadata = await parseTypeScriptFileForExportedMetadata(
        filePath,
        options.exportName || "metadata",
      );

      if (!metadata) {
        throw new Error(
          `No metadata found in ${filePath} at ${options.exportName}`,
        );
      }

      // Validate metadata against schema
      const result = transformedSchema.safeParse(metadata);
      if (!result.success) {
        const errors = result.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("\n");
        throw new Error(`Invalid metadata in ${filePath}:\n${errors}`);
      }

      return result.data;
    },
  };
}

type Props = {
  schema: z.ZodType;
  filePath: string;
  name: string;
};

/**
 * Extracts and validates metadata from a TypeScript file.
 *
 * @template T The expected type of the extracted metadata.
 * @param props - The properties for extraction, including file path, schema, and export name.
 * @returns A promise that resolves to the extracted metadata of type T, or null if extraction fails.
 */
export async function extract<T>({
  filePath,
  schema,
  name,
}: Props): Promise<T | null> {
  try {
    const extractor = createMetadataExtractor(schema, { exportName: name });
    const value = await extractor.extract(filePath);
    return value as T | null;
  } catch (error) {
    // console.error(`Unexpected error in extract function for ${filePath}:`, error);
    return null;
  }
}
