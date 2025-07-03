import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateTypes } from '../../src/generators/types-generator';
import type { Logger } from '../../src/utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('generateTypes', () => {
  const mockLogger: Logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  const mockOutputPath = '/mock/output/types.d.ts';
  let mkdirSpy: vi.SpyInstance;
  let writeFileSpy: vi.SpyInstance;
  let readFileSpy: vi.SpyInstance;

  beforeEach(() => {
    mkdirSpy = vi.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    readFileSpy = vi.spyOn(fs, 'readFile').mockResolvedValue('');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate a basic type definition', async () => {
    const types = {
      MyType: ['value1', 'value2'],
    };
    const expectedContent = "export type MyType = 'value1' | 'value2';";

    await generateTypes(mockOutputPath, types, mockLogger);

    expect(mkdirSpy).toHaveBeenCalledWith(path.dirname(mockOutputPath), { recursive: true });
    expect(writeFileSpy).toHaveBeenCalledWith(mockOutputPath, expectedContent, 'utf-8');
    expect(mockLogger.debug).toHaveBeenCalledWith(`Generating types to: ${mockOutputPath}`);
    expect(mockLogger.debug).toHaveBeenCalledWith(`Generated type for MyType: 'value1' | 'value2'`);
  });

  it('should generate multiple type definitions', async () => {
    const types = {
      TypeA: ['a', 'b'],
      TypeB: ['x', 'y', 'z'],
    };
    const expectedContent = "export type TypeA = 'a' | 'b';\n\nexport type TypeB = 'x' | 'y' | 'z';";

    await generateTypes(mockOutputPath, types, mockLogger);

    expect(writeFileSpy).toHaveBeenCalledWith(mockOutputPath, expectedContent, 'utf-8');
  });

  it('should handle empty type values', async () => {
    const types = {
      EmptyType: [],
    };
    const expectedContent = "export type EmptyType = ;";

    await generateTypes(mockOutputPath, types, mockLogger);

    expect(writeFileSpy).toHaveBeenCalledWith(mockOutputPath, expectedContent, 'utf-8');
  });

  it('should throw an error if writeFile fails', async () => {
    mkdirSpy.mockResolvedValue(undefined); // Ensure directory creation succeeds
    writeFileSpy.mockRejectedValueOnce(new Error("ENOENT: no such file or directory, open '/mock/output/types.d.ts'"));

    const types = {
      MyType: ['value1'],
    };

    await expect(generateTypes(mockOutputPath, types, mockLogger)).rejects.toThrow("ENOENT: no such file or directory, open '/mock/output/types.d.ts'");
  });

  it('should throw an error if mkdir fails', async () => {
    mkdirSpy.mockRejectedValueOnce(new Error('Directory creation failed'));

    const types = {
      MyType: ['value1'],
    };

    await expect(generateTypes(mockOutputPath, types, mockLogger)).rejects.toThrow('Directory creation failed');
  });
});
