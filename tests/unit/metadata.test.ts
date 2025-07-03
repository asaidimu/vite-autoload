import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import * as metadataUtils from '../../src/utils/metadata';
import * as astParser from '../../src/utils/ast-parser';

describe('createMetadataExtractor', () => {
  const mockFilePath = '/test/path/to/file.ts';
  const mockSchema = z.object({
    title: z.string(),
    version: z.number().optional(),
    isActive: z.boolean().default(false),
  });

  let parseSpy: vi.SpyInstance;

  beforeEach(() => {
    parseSpy = vi.spyOn(astParser, 'parseTypeScriptFileForExportedMetadata');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should extract and validate metadata successfully', async () => {
    parseSpy.mockResolvedValueOnce({
      title: 'My Title',
      version: 1,
      isActive: true,
    });

    const extractor = metadataUtils.createMetadataExtractor(mockSchema, { exportName: 'metadata' });
    const result = await extractor.extract(mockFilePath);

    expect(result).toEqual({
      title: 'My Title',
      version: 1,
      isActive: true,
    });
    expect(parseSpy).toHaveBeenCalledWith(mockFilePath, 'metadata');
  });

  it('should apply default values from schema if not present in extracted data', async () => {
    parseSpy.mockResolvedValueOnce({
      title: 'Another Title',
      version: 2,
    });

    const extractor = metadataUtils.createMetadataExtractor(mockSchema, { exportName: 'metadata' });
    const result = await extractor.extract(mockFilePath);

    expect(result).toEqual({
      title: 'Another Title',
      version: 2,
      isActive: false, // Default value applied
    });
  });

  it('should throw an error if no metadata is found by ast-parser', async () => {
    parseSpy.mockResolvedValueOnce(undefined);

    const extractor = metadataUtils.createMetadataExtractor(mockSchema, { exportName: 'metadata' });

    await expect(extractor.extract(mockFilePath)).rejects.toThrowError(
      'No metadata found in /test/path/to/file.ts at metadata',
    );
  });

  it('should throw an error if extracted metadata fails schema validation', async () => {
    parseSpy.mockResolvedValueOnce({
      title: 123, // Invalid type
    });

    const extractor = metadataUtils.createMetadataExtractor(mockSchema, { exportName: 'metadata' });
    await expect(extractor.extract(mockFilePath)).rejects.toThrowError(
      `Invalid metadata in /test/path/to/file.ts:
title: Expected string, received number`,
    );
  });

  it('should transform dynamic import strings into functions', async () => {
    const mockImportString = '() => import(\'/some/path\').then(m => m.default)';
    parseSpy.mockResolvedValueOnce({
      title: 'Dynamic Import Test',
      component: mockImportString,
    });

    const schemaWithDynamicImport = z.object({
      title: z.string(),
      component: z.any(), // Use z.any() for dynamic import functions
    });

    const extractor = metadataUtils.createMetadataExtractor(schemaWithDynamicImport, { exportName: 'metadata' });
    const result = await extractor.extract(mockFilePath);

    expect(result?.component).toBeInstanceOf(Function);
    // You can't easily test the result of the dynamic import without actually importing it,
    // but we can check if the function is created correctly.
    const dynamicImportFunc = result?.component as Function;
    expect(dynamicImportFunc.toString()).toContain('/some/path');
    expect(dynamicImportFunc.toString()).toContain('m.default');
  });
});

describe('extract (utility function)', () => {
  const mockFilePath = '/test/path/to/file.ts';
  const mockSchema = z.object({
    name: z.string(),
  });

  let createExtractorSpy: vi.SpyInstance;

  beforeEach(() => {
    createExtractorSpy = vi.spyOn(metadataUtils, 'createMetadataExtractor');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call createMetadataExtractor with correct arguments', async () => {
    const mockExtractor = {
      extract: vi.fn().mockResolvedValue({ name: 'Test' }),
    };
    createExtractorSpy.mockReturnValue(mockExtractor);

    const result = await metadataUtils.extract({ filePath: mockFilePath, schema: mockSchema, name: 'testName' });

    expect(createExtractorSpy).toHaveBeenCalledWith(mockSchema, { exportName: 'testName' });
    expect(mockExtractor.extract).toHaveBeenCalledWith(mockFilePath);
    expect(result).toEqual({ name: 'Test' });
  });

  it('should return null if extractor.extract throws an error', async () => {
    const mockExtractor = {
      extract: vi.fn().mockRejectedValue(new Error('Extraction failed')),
    };
    createExtractorSpy.mockReturnValue(mockExtractor);

    const result = await metadataUtils.extract({ filePath: mockFilePath, schema: mockSchema, name: 'testName' });

    expect(result).toBeNull();
  });
});
