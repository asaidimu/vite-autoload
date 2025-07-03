import { describe, it, expect, vi } from 'vitest';
import { createFileResolver, resolve } from '../../src/utils/resolver';
import { CacheManager, createCacheManager } from '../../src/utils/cache';
import type { Logger } from '../../src/utils/logger';
import { TransformConfig } from '../../src/types/transform';
import path from 'path';

describe('resolve', () => {
  it('should resolve files based on a glob pattern', () => {
    const config = {
      directory: path.resolve(__dirname, 'fixtures'),
      match: '**/*.ts',
    };
    const files = resolve(config);
    expect(files.length).toBe(2);
    expect(files.map((f) => f.path)).toContain('file1.ts');
    expect(files.map((f) => f.path)).toContain('file2.ts');
  });
});

describe('createFileResolver', () => {
  const mockLogger: Logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  const mockCache: CacheManager = createCacheManager();

  const config: TransformConfig[] = [
    {
      name: 'group1',
      input: {
        directory: path.resolve(__dirname, 'fixtures'),
        match: '**/*.ts',
      },
    },
  ];

  it('should initialize and resolve files', () => {
    const resolver = createFileResolver({ config, cache: mockCache, logger: mockLogger });
    resolver.initialize();
    const entries = resolver.getAllEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].name).toBe('group1');
    expect(entries[0].files.length).toBe(2);
  });

  it('should add a file', () => {
    const resolver = createFileResolver({ config, cache: mockCache, logger: mockLogger });
    resolver.initialize();
    const newFile = path.resolve(__dirname, 'fixtures', 'file3.ts');
    resolver.addFile(newFile);
    const entries = resolver.getAllEntries();
    expect(entries[0].files.length).toBe(3);
    expect(entries[0].files.map((f) => f.file)).toContain(newFile);
  });

  it('should remove a file', () => {
    const resolver = createFileResolver({ config, cache: mockCache, logger: mockLogger });
    resolver.initialize();
    const fileToRemove = path.resolve(__dirname, 'fixtures', 'file1.ts');
    resolver.removeFile(fileToRemove);
    const entries = resolver.getAllEntries();
    expect(entries[0].files.length).toBe(1);
    expect(entries[0].files.map((f) => f.file)).not.toContain(fileToRemove);
  });

  it('should check if a file exists', () => {
    const resolver = createFileResolver({ config, cache: mockCache, logger: mockLogger });
    resolver.initialize();
    const existingFile = path.resolve(__dirname, 'fixtures', 'file1.ts');
    const nonExistingFile = path.resolve(__dirname, 'fixtures', 'non-existent.ts');
    expect(resolver.hasFile(existingFile)).toBe(true);
    expect(resolver.hasFile(nonExistingFile)).toBe(false);
  });
});
