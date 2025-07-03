import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseTypeScriptFileForExportedMetadata } from '../../src/utils/ast-parser';

describe('parseTypeScriptFileForExportedMetadata', () => {
  const mockFilePath = '/test/path/to/file.ts';
  const mockSourceDir = '/test/path/to';

  beforeEach(() => {
    vi.spyOn(fs.promises, 'readFile').mockResolvedValue('');
    vi.spyOn(path, 'dirname').mockReturnValue(mockSourceDir);
    vi.spyOn(process, 'cwd').mockReturnValue('/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return undefined if no metadata is found', async () => {
    vi.spyOn(fs.promises, 'readFile').mockResolvedValueOnce(
      `export const someOtherVar = 1;`,
    );
    const result = await parseTypeScriptFileForExportedMetadata(
      mockFilePath,
      'metadata',
    );
    expect(result).toBeUndefined();
  });

  it('should extract named export metadata', async () => {
    vi.spyOn(fs.promises, 'readFile').mockResolvedValueOnce(
      `export const metadata = { title: 'Test Title', description: 'Test Description' };`,
    );
    const result = await parseTypeScriptFileForExportedMetadata(
      mockFilePath,
      'metadata',
    );
    expect(result).toEqual({
      title: 'Test Title',
      description: 'Test Description',
    });
  });

  it('should extract default export metadata', async () => {
    vi.spyOn(fs.promises, 'readFile').mockResolvedValueOnce(
      `export default { title: 'Default Title' };`,
    );
    const result = await parseTypeScriptFileForExportedMetadata(
      mockFilePath,
      'default',
    );
    expect(result).toEqual({
      title: 'Default Title',
    });
  });

  it('should handle nested objects and arrays', async () => {
    vi.spyOn(fs.promises, 'readFile').mockResolvedValueOnce(
      `export const metadata = {
        data: {
          items: [1, 2, { key: 'value' }]
        }
      };`,
    );
    const result = await parseTypeScriptFileForExportedMetadata(
      mockFilePath,
      'metadata',
    );
    expect(result).toEqual({
      data: {
        items: [1, 2, { key: 'value' }],
      },
    });
  });

  it('should handle boolean and numeric literals', async () => {
    vi.spyOn(fs.promises, 'readFile').mockResolvedValueOnce(
      `export const metadata = { isActive: true, count: 123 };`,
    );
    const result = await parseTypeScriptFileForExportedMetadata(
      mockFilePath,
      'metadata',
    );
    expect(result).toEqual({
      isActive: true,
      count: 123,
    });
  });

  it('should handle imported values as dynamic imports', async () => {
    vi.spyOn(fs.promises, 'readFile').mockResolvedValueOnce(
      `import { someComponent } from './components/someComponent';
       export const metadata = { component: someComponent };`,
    );
    const result = await parseTypeScriptFileForExportedMetadata(
      mockFilePath,
      'metadata',
    );
    expect(result?.component).toMatch(/^\(\) => import\('.*\/components\/someComponent'\)\.then\(m => m\.someComponent\)$/);
  });

  it('should handle default imported values as dynamic imports', async () => {
    vi.spyOn(fs.promises, 'readFile').mockResolvedValueOnce(
      `import someDefaultComponent from './components/defaultComponent';
       export const metadata = { component: someDefaultComponent };`,
    );
    const result = await parseTypeScriptFileForExportedMetadata(
      mockFilePath,
      'metadata',
    );
    expect(result?.component).toMatch(/^\(\) => import\('.*\/components\/defaultComponent'\)\.then\(m => m\.default\)$/);
  });

  it('should handle template literals', async () => {
    vi.spyOn(fs.promises, 'readFile').mockResolvedValueOnce(
      "const name = 'World';\n       export const metadata = { greeting: 'Hello ' + name + '!' };", // Use string concatenation
    );
    const result = await parseTypeScriptFileForExportedMetadata(
      mockFilePath,
      'metadata',
    );
    expect(result).toEqual({
      greeting: 'Hello World!',
    });
  });

  it('should handle variable references for metadata', async () => {
    vi.spyOn(fs.promises, 'readFile').mockResolvedValueOnce(
      `const myValue = 'abc';
       export const metadata = { key: myValue };`,
    );
    const result = await parseTypeScriptFileForExportedMetadata(
      mockFilePath,
      'metadata',
    );
    expect(result).toEqual({ key: 'abc' });
  });

  it('should handle type assertions for metadata', async () => {
    vi.spyOn(fs.promises, 'readFile').mockResolvedValueOnce(
      `export const metadata = { value: 'test' as string };`,
    );
    const result = await parseTypeScriptFileForExportedMetadata(
      mockFilePath,
      'metadata',
    );
    expect(result).toEqual({ value: 'test' });
  });
});
