import { describe, it, expect, vi } from 'vitest';
import { createDataProcessor } from '../../src/utils/transform';
import type { Logger } from '../../src/utils/logger';
import { TransformConfig, ResolvedFile } from '../../src/types/transform';
import { BuildContext } from '../../src/types/build';

describe('createDataProcessor', () => {
  const mockLogger: Logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  const mockContext: BuildContext = {
    isDev: true,
    isBuild: false,
    production: false,
    environment: 'development',
  };

  const mockFile: ResolvedFile = {
    id: '1',
    path: '/path/to/file.ts',
    name: 'file',
    extension: 'ts',
    uri: '/path/to/file.ts',
    file: '/path/to/file.ts',
    metadata: {},
  };

  it('should process entries with a simple transform', async () => {
    const config: TransformConfig[] = [
      {
        name: 'group1',
        transform: (item) => ({ ...item, transformed: true }),
      },
    ];
    const processor = createDataProcessor({ config, logger: mockLogger });
    const entries = { group1: [mockFile] };
    const result = await processor.processEntries(entries, mockContext);
    expect(result.group1[0].transformed).toBe(true);
  });

  it('should handle aggregation', async () => {
    const config: TransformConfig[] = [
      {
        name: 'group1',
        aggregate: (items) => items.map((item) => ({ ...item, aggregated: true })),
      },
    ];
    const processor = createDataProcessor({ config, logger: mockLogger });
    const entries = { group1: [mockFile] };
    const result = await processor.processEntries(entries, mockContext);
    expect(result.group1[0].aggregated).toBe(true);
  });

  it('should apply URI transformation', async () => {
    const config: TransformConfig[] = [
      {
        name: 'group1',
        input: {
          directory: '/path/to',
          match: '**/*.ts',
          prefix: '@',
        },
      },
    ];
    const processor = createDataProcessor({ config, logger: mockLogger });
    const entries = { group1: [mockFile] };
    const result = await processor.processEntries(entries, mockContext);
    expect(result.group1[0].uri).toBe('@/path/to/file.ts');
  });
});
