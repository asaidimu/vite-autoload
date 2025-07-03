import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCollectionGenerator, createModuleGenerator } from '../../src/generators/generator';
import type { Logger } from '../../src/utils/logger';
import { ComponentConfig } from '../../src/types/components';
import * as cacheManager from '../../src/utils/cache';
import * as fileResolver from '../../src/utils/resolver';
import * as dataResolver from '../../src/utils/data-resolver';
import * as dataProcessor from '../../src/utils/transform';
import * as codeGenerator from '../../src/utils/codegen';
import * as uriTransformer from '../../src/utils/uri';
import { BuildContext, ResolvedFile } from '../../src/types/transform';

describe('createCollectionGenerator', () => {
  const mockLogger: Logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  const mockCacheManager = {
    clear: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
    size: 0,
  };

  const mockFileResolver = {
    initialize: vi.fn(),
    addFile: vi.fn(),
    removeFile: vi.fn(),
    hasFile: vi.fn(),
    getAllEntries: vi.fn(),
    getVersions: vi.fn(() => new Map()),
  };

  const mockDataResolver = {
    initialize: vi.fn(),
    getData: vi.fn(),
    getAllData: vi.fn(),
    getVersion: vi.fn(() => 0),
  };

  const mockDataProcessor = {
    processEntries: vi.fn(),
  };

  const mockCodeGenerator = {
    generateCode: vi.fn(),
  };

  const mockUriTransformer = {
    transform: vi.fn(),
  };

  beforeEach(() => {
    vi.spyOn(cacheManager, 'createCacheManager').mockReturnValue(mockCacheManager);
    vi.spyOn(fileResolver, 'createFileResolver').mockReturnValue(mockFileResolver);
    vi.spyOn(dataResolver, 'createDataResolver').mockReturnValue(mockDataResolver);
    vi.spyOn(dataProcessor, 'createDataProcessor').mockReturnValue(mockDataProcessor);
    vi.spyOn(codeGenerator, 'createCodeGenerator').mockReturnValue(mockCodeGenerator);
    vi.spyOn(uriTransformer, 'createUriTransformer').mockReturnValue(mockUriTransformer);

    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockComponentConfig: ComponentConfig = {
    name: 'testComponent',
    strategy: {},
    groups: [
      {
        name: 'files',
        input: { directory: '/test/files', match: '**/*', prefix: '@files' },
      },
      {
        name: 'data',
        input: () => Promise.resolve([{ id: 1, value: 'testData' }]),
      },
    ],
  };

  const mockBuildContext: BuildContext = {
    isDev: true,
    isBuild: false,
    production: false,
    environment: 'development',
  };

  it('should initialize all sub-components', () => {
    createCollectionGenerator(mockComponentConfig, mockLogger);
    expect(cacheManager.createCacheManager).toHaveBeenCalledWith(mockLogger);
    expect(fileResolver.createFileResolver).toHaveBeenCalled();
    expect(dataResolver.createDataResolver).toHaveBeenCalled();
    expect(dataProcessor.createDataProcessor).toHaveBeenCalled();
    expect(codeGenerator.createCodeGenerator).toHaveBeenCalledWith(mockComponentConfig, mockLogger);
    expect(uriTransformer.createUriTransformer).toHaveBeenCalled();
    expect(mockFileResolver.initialize).toHaveBeenCalled();
    expect(mockDataResolver.initialize).toHaveBeenCalled();
  });

  it('getGroups should return transformed file entries', () => {
    const mockResolvedFile: ResolvedFile = {
      uri: '/test/files/file1.ts',
      path: 'file1.ts',
      file: '/test/files/file1.ts',
    };
    mockFileResolver.getAllEntries.mockReturnValue([
      { name: 'files', files: [mockResolvedFile] },
    ]);
    mockUriTransformer.transform.mockReturnValue('@files/file1.ts');

    const generator = createCollectionGenerator(mockComponentConfig, mockLogger);
    const groups = generator.getGroups(mockBuildContext);

    expect(groups).toEqual([
      { ...mockResolvedFile, uri: '@files/file1.ts' },
    ]);
    expect(mockUriTransformer.transform).toHaveBeenCalledWith({
      uri: '/test/files/file1.ts',
      prefix: '@files',
      production: false,
    });
  });

  it('getData should combine and process data from file and data source resolvers', async () => {
    const mockProcessedFiles = { files: [{ id: 'file1' }] };
    const mockDataSourceData = { data: [{ id: 'data1' }] };

    mockFileResolver.getAllEntries.mockReturnValue([
      { name: 'files', files: [{ uri: 'file1.ts', path: 'file1.ts', file: 'file1.ts' }] },
    ]);
    mockDataResolver.getAllData.mockReturnValue(mockDataSourceData);
    mockDataProcessor.processEntries.mockResolvedValue(mockProcessedFiles);

    const generator = createCollectionGenerator(mockComponentConfig, mockLogger);
    const result = await generator.getData(mockBuildContext);

    expect(result).toEqual({ ...mockProcessedFiles, ...mockDataSourceData });
    expect(mockDataProcessor.processEntries).toHaveBeenCalledWith(
      expect.any(Object),
      mockBuildContext,
    );
  });

  it('getCode should generate code using the code generator', async () => {
    const mockGeneratedCode = 'export const test = {};';
    mockCodeGenerator.generateCode.mockReturnValue(mockGeneratedCode);
    mockFileResolver.getAllEntries.mockReturnValue([]); // Ensure getData doesn't throw
    mockDataResolver.getAllData.mockReturnValue({}); // Ensure getData doesn't throw
    mockDataProcessor.processEntries.mockResolvedValue({}); // Ensure getData doesn't throw

    const generator = createCollectionGenerator(mockComponentConfig, mockLogger);
    const code = await generator.getCode(mockBuildContext);

    expect(code).toBe(mockGeneratedCode);
    expect(mockCodeGenerator.generateCode).toHaveBeenCalledWith(
      expect.any(Object),
      mockBuildContext,
    );
  });

  it('hasFile should delegate to fileResolver.hasFile', () => {
    mockFileResolver.hasFile.mockReturnValue(true);
    const generator = createCollectionGenerator(mockComponentConfig, mockLogger);
    expect(generator.hasFile('/test/path')).toBe(true);
    expect(mockFileResolver.hasFile).toHaveBeenCalledWith('/test/path');
  });

  it('addFile should delegate to fileResolver.addFile', () => {
    const generator = createCollectionGenerator(mockComponentConfig, mockLogger);
    generator.addFile('/test/path');
    expect(mockFileResolver.addFile).toHaveBeenCalledWith('/test/path');
  });

  it('removeFile should delegate to fileResolver.removeFile', () => {
    const generator = createCollectionGenerator(mockComponentConfig, mockLogger);
    generator.removeFile('/test/path');
    expect(mockFileResolver.removeFile).toHaveBeenCalledWith('/test/path');
  });

  it('findGroup should return true if group name exists in config', () => {
    const generator = createCollectionGenerator(mockComponentConfig, mockLogger);
    expect(generator.findGroup('files')).toBe(true);
    expect(generator.findGroup('data')).toBe(true);
  });

  it('findGroup should return true if searchName is the component name', () => {
    const generator = createCollectionGenerator(mockComponentConfig, mockLogger);
    expect(generator.findGroup('testComponent')).toBe(true);
  });

  it('findGroup should return false if group name does not exist', () => {
    const generator = createCollectionGenerator(mockComponentConfig, mockLogger);
    expect(generator.findGroup('nonExistentGroup')).toBe(false);
  });
});

describe('createModuleGenerator', () => {
  const mockLogger: Logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  const mockComponentConfig: ComponentConfig = {
    name: 'testModule',
    strategy: {},
    groups: [],
  };

  it('should correctly wrap createCollectionGenerator', () => {
    const generator = createModuleGenerator(mockComponentConfig, mockLogger);

    expect(generator.name).toBe('testModule');
    expect(generator.config).toEqual(mockComponentConfig.groups);
    expect(typeof generator.modules).toBe('function');
    expect(typeof generator.data).toBe('function');
    expect(typeof generator.code).toBe('function');
    expect(typeof generator.match).toBe('function');
    expect(typeof generator.add).toBe('function');
    expect(typeof generator.remove).toBe('function');
    expect(typeof generator.find).toBe('function');
  });
});
