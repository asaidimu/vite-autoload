import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import type { ParseResult } from '@babel/parser';
import type { NodePath } from '@babel/traverse';
import fs from 'fs/promises';
import path from 'path';

interface StaticAnalysisResult {
  imports: string[];
  urls: string[];
  dynamicImports: string[];
}

export class StaticAnalyzer {
  private cache: Map<string, StaticAnalysisResult> = new Map();

  constructor(private readonly root: string) {}

  private async parseFile(filePath: string): Promise<ParseResult<any>> {
    const content = await fs.readFile(filePath, 'utf-8');
    return parse(content, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript',
        'decorators-legacy',
        'classProperties',
        'dynamicImport'
      ]
    });
  }

  private async analyzeFile(filePath: string): Promise<StaticAnalysisResult> {
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath)!;
    }

    const ast = await this.parseFile(filePath);
    const result: StaticAnalysisResult = {
      imports: [],
      urls: [],
      dynamicImports: []
    };

    traverse(ast, {
      ImportDeclaration(path: NodePath) {
        const importPath = path.node.source.value;
        result.imports.push(importPath);
      },

      Import(path: NodePath) {
        const grandparent = path.parentPath?.parentPath;
        if (grandparent?.isCallExpression()) {
          const arg = grandparent.node.arguments[0];
          if (arg.type === 'StringLiteral') {
            result.dynamicImports.push(arg.value);
          }
        }
      },

      StringLiteral(path: NodePath) {
        const value = path.node.value;
        if (value.match(/^(\/|https?:\/\/)/)) {
          result.urls.push(value);
        }
      },

      TemplateLiteral(path: NodePath) {
        const value = path.node.quasis
          .map(quasi => quasi.value.raw)
          .join('*');
        if (value.match(/^(\/|https?:\/\/)/)) {
          result.urls.push(value);
        }
      }
    });

    this.cache.set(filePath, result);
    return result;
  }

  public async analyzeModule(entryPath: string): Promise<string[]> {
    const analyzed = new Set<string>();
    const assets = new Set<string>();
    
    const analyze = async (modulePath: string) => {
      if (analyzed.has(modulePath)) return;
      analyzed.add(modulePath);

      const result = await this.analyzeFile(modulePath);
      
      // Add static imports
      for (const imp of result.imports) {
        const resolved = path.resolve(path.dirname(modulePath), imp);
        assets.add(resolved);
        await analyze(resolved);
      }

      // Add dynamic imports
      for (const imp of result.dynamicImports) {
        const resolved = path.resolve(path.dirname(modulePath), imp);
        assets.add(resolved);
      }

      // Add URLs as potential assets
      assets.add(...result.urls);
    };

    await analyze(entryPath);
    return Array.from(assets);
  }
}
