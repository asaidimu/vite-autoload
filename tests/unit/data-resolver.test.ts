import { describe, it, expect, vi } from 'vitest';
import { createDataResolver } from '../../src/utils/data-resolver';
import type { Logger } from '../../src/utils/logger';
import { TransformConfig } from '../../src/types/transform';

describe('createDataResolver', () => {
  const mockLogger: Logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  it('should initialize and get data from a simple data source', async () => {
    const config: TransformConfig[] = [
      {
        name: 'group1',
        input: () => Promise.resolve([{ id: 1, name: 'test' }]),
      },
    ];
    const resolver = createDataResolver({ config, logger: mockLogger });
    await resolver.initialize();
    const data = resolver.getData('group1');
    expect(data).toEqual([{ id: 1, name: 'test' }]);
  });

  it('should handle multiple data sources', async () => {
    const config: TransformConfig[] = [
      {
        name: 'group1',
        input: () => Promise.resolve([{ id: 1, name: 'test1' }]),
      },
      {
        name: 'group2',
        input: () => Promise.resolve([{ id: 2, name: 'test2' }]),
      },
    ];
    const resolver = createDataResolver({ config, logger: mockLogger });
    await resolver.initialize();
    expect(resolver.getData('group1')).toEqual([{ id: 1, name: 'test1' }]);
    expect(resolver.getData('group2')).toEqual([{ id: 2, name: 'test2' }]);
  });

  it('should return all data', async () => {
    const config: TransformConfig[] = [
      {
        name: 'group1',
        input: () => Promise.resolve([{ id: 1, name: 'test1' }]),
      },
      {
        name: 'group2',
        input: () => Promise.resolve([{ id: 2, name: 'test2' }]),
      },
    ];
    const resolver = createDataResolver({ config, logger: mockLogger });
    await resolver.initialize();
    const allData = resolver.getAllData();
    expect(allData).toEqual({
      group1: [{ id: 1, name: 'test1' }],
      group2: [{ id: 2, name: 'test2' }],
    });
  });

  it('should throw an error if a data source fails', async () => {
    const config: TransformConfig[] = [
      {
        name: 'group1',
        input: () => Promise.reject(new Error('Failed to load')),
      },
    ];
    const resolver = createDataResolver({ config, logger: mockLogger });
    await expect(resolver.initialize()).rejects.toThrow('Failed to load');
  });
});
