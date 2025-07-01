import ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";

interface ImportedModule {
  name: string;
  path: string;
  isDefault?: boolean;
}

interface MetadataExtractor {
  extract: (filePath: string) => any;
}

/**
 * Finds all import declarations in a source file
 */
function findImportDeclarations(
  sourceFile: ts.SourceFile,
): Map<string, ImportedModule> {
  const imports = new Map<string, ImportedModule>();

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node)) {
      const importPath = (node.moduleSpecifier as ts.StringLiteral).text;
      const importClause = node.importClause;

      if (importClause?.name) {
        // Default import
        imports.set(importClause.name.text, {
          name: importClause.name.text,
          path: importPath,
          isDefault: true,
        });
      }

      if (
        importClause?.namedBindings &&
        ts.isNamedImports(importClause.namedBindings)
      ) {
        // Named imports
        importClause.namedBindings.elements.forEach((element) => {
          imports.set(element.name.text, {
            name: element.propertyName?.text || element.name.text,
            path: importPath,
          });
        });
      }
    }
  });

  return imports;
}

/**
 * Creates a dynamic import string for an imported module
 */
function createDynamicImport(
  importInfo: ImportedModule,
  sourceDir: string,
): string {
  const resolvedPath = importInfo.path.startsWith(".")
    ? path
        .relative(process.cwd(), path.resolve(sourceDir, importInfo.path))
        .replace(/\\/g, "/")
        .replace(/^src\//, "@/")
    : importInfo.path;

  return `() => import('${resolvedPath}').then(m => ${importInfo.isDefault ? "m.default" : `m.${importInfo.name}`})`;
}

/**
 * Extracts values from an object literal expression
 */
function extractObjectLiteralValue(
  node: ts.ObjectLiteralExpression,
  imports: Map<string, ImportedModule>,
  sourceDir: string,
): Record<string, any> {
  const obj: Record<string, any> = {};

  for (const property of node.properties) {
    if (ts.isPropertyAssignment(property)) {
      const propertyName = property.name.getText().replace(/['"]/g, "");

      if (ts.isIdentifier(property.initializer)) {
        // Handle imported values
        const importInfo = imports.get(property.initializer.text);
        if (importInfo) {
          obj[propertyName] = createDynamicImport(importInfo, sourceDir);
          continue;
        }
      }

      obj[propertyName] = extractValue(
        property.initializer,
        imports,
        sourceDir,
      );
    }
  }

  return obj;
}

/**
 * Extracts value from a TypeScript AST node
 */
function extractValue(
  node: ts.Node,
  imports: Map<string, ImportedModule>,
  sourceDir: string,
): any {
  if (ts.isStringLiteral(node)) {
    return node.text;
  }
  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }
  if (
    ts.isToken(node) &&
    (node.kind === ts.SyntaxKind.TrueKeyword ||
      node.kind === ts.SyntaxKind.FalseKeyword)
  ) {
    return node.kind === ts.SyntaxKind.TrueKeyword;
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) =>
      extractValue(element, imports, sourceDir),
    );
  }
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.reduce(
      (obj, prop) => {
        if (ts.isPropertyAssignment(prop)) {
          const key = prop.name.getText().replace(/['"]/g, "");
          obj[key] = extractValue(prop.initializer, imports, sourceDir);
        }
        return obj;
      },
      {} as Record<string, any>,
    );
  }
  if (ts.isIdentifier(node)) {
    // Check if it's an imported value
    const importInfo = imports.get(node.text);
    if (importInfo) {
      return createDynamicImport(importInfo, sourceDir);
    }
    return node.text;
  }
  // Handle template literals
  if (ts.isTemplateExpression(node)) {
    let result = node.head.text;
    node.templateSpans.forEach((span) => {
      const spanValue = extractValue(span.expression, imports, sourceDir);
      result += `${spanValue}${span.literal.text}`;
    });
    return result;
  }
  // Return undefined for unsupported types
  return undefined;
}

/**
 * Checks if a value is a dynamic import string
 */
function isImportString(value: any): boolean {
  return typeof value === "string" && value.startsWith("() => import(");
}

/**
 * Creates a dynamic import function from an import string
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

  return () =>
    import(importPath).then((m) =>
      isDefault ? m.default : m[propertyMatch[1].slice(2)],
    );
}

/**
 * Recursively transforms import strings to dynamic import functions
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

function extractDefaultExportMetadata(
  sourceFile: ts.SourceFile,
  imports: Map<string, ImportedModule>,
  sourceDir: string,
): Record<string, any> | undefined {
  // Helper function to recursively evaluate expressions
  function evaluateExpression(node: ts.Node): any {
    // Handle simple literal expressions
    if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
      return node.text;
    }

    // Handle boolean literals
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;

    // Handle object literal expressions
    if (ts.isObjectLiteralExpression(node)) {
      return extractObjectLiteralValue(node, imports, sourceDir);
    }

    // Handle identifiers (references to variables)
    if (ts.isIdentifier(node)) {
      // Find the variable declaration
      const varDeclaration = sourceFile.statements.find(
        (stmt) =>
          ts.isVariableStatement(stmt) &&
          stmt.declarationList.declarations.some(
            (decl) =>
              ts.isIdentifier(decl.name) && decl.name.text === node.text,
          ),
      ) as ts.VariableStatement | undefined;

      if (varDeclaration) {
        const declaration = varDeclaration.declarationList.declarations.find(
          (decl) => ts.isIdentifier(decl.name) && decl.name.text === node.text,
        );

        if (declaration && declaration.initializer) {
          return evaluateExpression(declaration.initializer);
        }
      }

      // Check if it's an imported value
      const importInfo = imports.get(node.text);
      if (importInfo) {
        return createDynamicImport(importInfo, sourceDir);
      }
    }

    // Handle type assertions
    if (ts.isAsExpression(node)) {
      return evaluateExpression(node.expression);
    }

    // Handle function calls (like IIFE)
    if (ts.isCallExpression(node)) {
      // For immediately invoked function expressions
      if (
        ts.isArrowFunction(node.expression) ||
        ts.isFunctionExpression(node.expression)
      ) {
        // Find the last return statement or expression
        const returnValue = node.expression.body;
        if (ts.isBlock(returnValue)) {
          const lastStatement =
            returnValue.statements[returnValue.statements.length - 1];
          if (ts.isReturnStatement(lastStatement) && lastStatement.expression) {
            return evaluateExpression(lastStatement.expression);
          }
        } else {
          return evaluateExpression(returnValue);
        }
      }

      // Handle other function calls that might return an object
      if (ts.isIdentifier(node.expression)) {
        // You might want to add more sophisticated resolution for function calls
        const importInfo = imports.get(node.expression.text);
        if (importInfo) {
          return createDynamicImport(importInfo, sourceDir);
        }
      }
    }

    // Handle conditional expressions
    if (ts.isConditionalExpression(node)) {
      // This is a simplistic approach and might need more sophisticated evaluation
      return evaluateExpression(node.whenTrue);
    }

    // Fallback for unhandled cases
    return undefined;
  }

  // Iterate through statements to find default export
  for (const node of sourceFile.statements) {
    // Handle export assignment (export default ...)
    if (ts.isExportAssignment(node)) {
      const exportedValue = evaluateExpression(node.expression);
      if (exportedValue) {
        return exportedValue;
      }
    }
  }

  return undefined;
}

// Modify the existing extract method to use this new function
export function createMetadataExtractor(
  schema: z.ZodType,
  options: { exportName?: string | "default" } = { exportName: "metadata" },
): MetadataExtractor {
  const transformedSchema = schema.transform((obj) => {
    return transformImportStrings(obj);
  });

  return {
    extract(filePath: string) {
      try {
        const sourceFile = ts.createSourceFile(
          filePath,
          fs.readFileSync(filePath, "utf-8"),
          ts.ScriptTarget.Latest,
          true,
        );

        const imports = findImportDeclarations(sourceFile);
        const sourceDir = path.dirname(filePath);
        let metadata: Record<string, any> | undefined;

        if (options.exportName === "default") {
          // Use the new extraction method for default exports
          metadata = extractDefaultExportMetadata(
            sourceFile,
            imports,
            sourceDir,
          );
        } else {
          // Existing logic for named exports
          for (const node of sourceFile.statements) {
            if (
              ts.isVariableStatement(node) &&
              node.declarationList.declarations.some(
                (d) =>
                  ts.isIdentifier(d.name) && d.name.text === options.exportName,
              )
            ) {
              const declaration = node.declarationList.declarations[0];
              if (
                declaration.initializer &&
                ts.isObjectLiteralExpression(declaration.initializer)
              ) {
                metadata = extractObjectLiteralValue(
                  declaration.initializer,
                  imports,
                  sourceDir,
                );
                break;
              }
            }
          }
        }

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
      } catch (error) {
        // console.warn(`Error processing ${filePath}:`);
        return null;
      }
    },
  };
}

type Props = {
  schema: z.ZodType;
  filePath: string;
  name: string;
};

export function extract<T>({ filePath, schema, name }: Props) {
  const extractor = createMetadataExtractor(schema, { exportName: name });
  const value = extractor.extract(filePath);
  return value as T;
}
