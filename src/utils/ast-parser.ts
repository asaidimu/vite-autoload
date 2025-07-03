import ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import { createCacheManager } from "./cache";

/**
 * Represents an imported module found during AST parsing.
 */
interface ImportedModule {
  /** The name of the imported module or symbol. */
  name: string;
  /** The path from which the module is imported. */
  path: string;
  /** Indicates if the import is a default import. */
  isDefault?: boolean;
}

/**
 * Finds all import declarations in a TypeScript source file.
 *
 * @param sourceFile - The TypeScript source file to parse.
 * @returns A Map where keys are the imported symbol names and values are `ImportedModule` objects.
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
 * Creates a dynamic import string for an imported module.
 *
 * @param importInfo - Information about the imported module.
 * @param sourceDir - The directory of the source file containing the import.
 * @returns A string representing a dynamic import expression.
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
  sourceFile: ts.SourceFile,
  imports: Map<string, ImportedModule>,
  sourceDir: string,
): Record<string, any> {
  const obj: Record<string, any> = {};

  for (const property of node.properties) {
    if (ts.isPropertyAssignment(property)) {
      const propertyName = property.name.getText().replace(/['"]/g, "");

      obj[propertyName] = evaluateExpression(
        property.initializer,
        sourceFile,
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
  sourceFile: ts.SourceFile,
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
      evaluateExpression(element, sourceFile, imports, sourceDir),
    );
  }
  if (ts.isObjectLiteralExpression(node)) {
    return extractObjectLiteralValue(node, sourceFile, imports, sourceDir);
  }
  if (ts.isIdentifier(node)) {
    // Check if it's an imported value
    const importInfo = imports.get(node.text);
    if (importInfo) {
      return createDynamicImport(importInfo, sourceDir);
    }
    // If it's a local variable, try to resolve its value
    const varDeclaration = sourceFile.statements.find(
      (stmt) =>
        ts.isVariableStatement(stmt) &&
        stmt.declarationList.declarations.some(
          (decl) => ts.isIdentifier(decl.name) && decl.name.text === node.text,
        ),
    ) as ts.VariableStatement | undefined;

    if (varDeclaration) {
      const declaration = varDeclaration.declarationList.declarations.find(
        (decl) => ts.isIdentifier(decl.name) && decl.name.text === node.text,
      );

      if (declaration && declaration.initializer) {
        return evaluateExpression(
          declaration.initializer,
          sourceFile,
          imports,
          sourceDir,
        );
      }
    }

    return node.text; // Fallback to identifier text if value cannot be resolved
  }
  // Handle template literals
  if (ts.isTemplateExpression(node)) {
    let result = node.head.text;
    node.templateSpans.forEach((span) => {
      const spanValue = evaluateExpression(
        span.expression,
        sourceFile,
        imports,
        sourceDir,
      );
      result += `${spanValue}${span.literal.text}`;
    });

    return result;
  }
  // Handle type assertions
  if (ts.isAsExpression(node)) {
    return evaluateExpression(node.expression, sourceFile, imports, sourceDir);
  }
  // Handle function calls (like IIFE) - currently not supported for evaluation
  if (ts.isCallExpression(node)) {
    return undefined;
  }
  // Handle BinaryExpression (e.g., 'a' + 'b')
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = evaluateExpression(node.left, sourceFile, imports, sourceDir);
    const right = evaluateExpression(
      node.right,
      sourceFile,
      imports,
      sourceDir,
    );
    if (typeof left === "string" && typeof right === "string") {
      return left + right;
    }
  }
  // Return undefined for unsupported types

  return undefined;
}

function evaluateExpression(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  imports: Map<string, ImportedModule>,
  sourceDir: string,
): any {
  return extractValue(node, sourceFile, imports, sourceDir);
}

export async function parseTypeScriptFileForExportedMetadata(
  filePath: string,
  exportName: string,
): Promise<Record<string, any> | undefined> {
  const astCache = createCacheManager<Record<string, any> | undefined>();
  const cacheKey = `${filePath}::${exportName}`;
  if (astCache.has(cacheKey)) {
    return astCache.get(cacheKey);
  }

  try {
    const fileContent = await fs.promises.readFile(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(
      filePath,
      fileContent,
      ts.ScriptTarget.Latest,
      true,
    );

    const imports = findImportDeclarations(sourceFile);
    const sourceDir = path.dirname(filePath);
    let metadata: Record<string, any> | undefined;

    if (exportName === "default") {
      // Use the new extraction method for default exports
      for (const node of sourceFile.statements) {
        // Handle export assignment (export default ...)
        if (ts.isExportAssignment(node)) {
          const exportedValue = evaluateExpression(
            node.expression,
            sourceFile,
            imports,
            sourceDir,
          );
          if (exportedValue) {
            metadata = exportedValue;
            break;
          }
        }
      }
    } else {
      // Existing logic for named exports
      for (const node of sourceFile.statements) {
        if (
          ts.isVariableStatement(node) &&
          node.declarationList.declarations.some(
            (d) => ts.isIdentifier(d.name) && d.name.text === exportName,
          )
        ) {
          const declaration = node.declarationList.declarations[0];
          if (
            declaration.initializer // Removed ts.isObjectLiteralExpression check
          ) {
            metadata = evaluateExpression(
              declaration.initializer,
              sourceFile,
              imports,
              sourceDir,
            );
            break;
          }
        }
      }
    }
    astCache.set(cacheKey, metadata);
    return metadata;
  } catch (error) {
    // console.warn(`Error parsing ${filePath}:`, error);
    astCache.set(cacheKey, undefined); // Cache undefined for errors to prevent re-parsing
    return undefined;
  }
}
