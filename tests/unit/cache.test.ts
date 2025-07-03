import { describe, it, expect, vi } from 'vitest';
import { createCacheManager } from '../../src/utils/cache';
import type { Logger } from '../../src/utils/logger';
import { ResolvedFile } from '../../src/types';

describe('createCacheManager', () => {
  const mockLogger: Logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  const mockFile: ResolvedFile = {
    id: '1',
    path: '/path/to/file',
    name: 'file',
    extension: 'ts',
    metadata: {},
  };

  it('should set and get a cache entry', () => {
    const cache = createCacheManager(mockLogger);
    cache.set('key', mockFile);
    expect(cache.get('key')).toEqual(mockFile);
    expect(mockLogger.debug).toHaveBeenCalledWith('Cache entry added: key');
  });

  it('should return undefined for a non-existent key', () => {
    const cache = createCacheManager(mockLogger);
    expect(cache.get('non-existent')).toBeUndefined();
  });

  it('should check if a key exists', () => {
    const cache = createCacheManager(mockLogger);
    cache.set('key', mockFile);
    expect(cache.has('key')).toBe(true);
    expect(cache.has('non-existent')).toBe(false);
  });

  it('should delete a cache entry', () => {
    const cache = createCacheManager(mockLogger);
    cache.set('key', mockFile);
    expect(cache.delete('key')).toBe(true);
    expect(cache.get('key')).toBeUndefined();
    expect(mockLogger.debug).toHaveBeenCalledWith('Cache entry removed: key');
  });

  it('should clear the cache', () => {
    const cache = createCacheManager(mockLogger);
    cache.set('key1', mockFile);
    cache.set('key2', mockFile);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(mockLogger.debug).toHaveBeenCalledWith('Cache cleared');
  });

  it('should return all values', () => {
    const cache = createCacheManager();
    cache.set('key1', mockFile);
    cache.set('key2', mockFile);
    const values = Array.from(cache.values());
    expect(values).toEqual([mockFile, mockFile]);
  });

  it('should return all entries', () => {
    const cache = createCacheManager();
    cache.set('key1', mockFile);
    cache.set('key2', mockFile);
    const entries = Array.from(cache.entries());
    expect(entries).toEqual([['key1', mockFile], ['key2', mockFile]]);
  });
});
