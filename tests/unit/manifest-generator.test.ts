import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateManifest } from '../../src/generators/manifest-generator';
import { ManifestConfig } from '../../src/types/manifest';
import type { Logger } from '../../src/utils/logger';
import path from 'path';
import fs from 'fs';

describe('generateManifest', () => {
  const mockLogger: Logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  const mockOutDir = '/mock/output/dir';
  let writeFileSpy: vi.SpyInstance;
  let readFileSpy: vi.SpyInstance;

  beforeEach(() => {
    writeFileSpy = vi.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
    readFileSpy = vi.spyOn(fs.promises, 'readFile').mockResolvedValue('');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate a manifest with default values and write to the correct path', async () => {
    const config: ManifestConfig = {
      name: 'Test App',
      shortName: 'TA',
      description: 'A test application',
      theme_color: '#ffffff',
      background_color: '#000000',
    };

    const expectedManifestContent = JSON.stringify({
      name: 'Test App',
      short_name: 'TA',
      description: 'A test application',
      theme_color: '#ffffff',
      background_color: '#000000',
      display: 'standalone',
      orientation: undefined,
      scope: '/',
      start_url: '/',
      icons: [],
      screenshots: undefined,
      related_applications: undefined,
      prefer_related_applications: undefined,
      categories: undefined,
      dir: undefined,
      lang: undefined,
      iarc_rating_id: undefined,
    }, null, 2);

    const outputPath = await generateManifest(config, mockOutDir, mockLogger);

    expect(writeFileSpy).toHaveBeenCalledWith(
      path.join(mockOutDir, 'manifest.webmanifest'),
      expectedManifestContent,
    );
    expect(outputPath).toBe(path.join(mockOutDir, 'manifest.webmanifest'));
    expect(mockLogger.debug).toHaveBeenCalledWith('Generating web manifest...');
  });

  it('should generate a manifest with custom output path and all properties', async () => {
    const config: ManifestConfig = {
      name: 'Full App',
      shortName: 'FA',
      description: 'A full test application',
      theme_color: '#123456',
      background_color: '#654321',
      output: 'custom-manifest.json',
      display: 'fullscreen',
      orientation: 'portrait',
      scope: '/app/',
      start_url: '/app/index.html',
      icons: [{ src: 'icon.png', sizes: '192x192', type: 'image/png' }],
      screenshots: [{ src: 'screenshot.png', sizes: '1280x768', type: 'image/png' }],
      related_applications: [{ platform: 'web', url: 'https://example.com' }],
      prefer_related_applications: true,
      categories: ['utilities', 'productivity'],
      dir: 'ltr',
      lang: 'en-US',
      iarc_rating_id: '12345',
    };

    const expectedManifestContent = JSON.stringify({
      name: 'Full App',
      short_name: 'FA',
      description: 'A full test application',
      theme_color: '#123456',
      background_color: '#654321',
      display: 'fullscreen',
      orientation: 'portrait',
      scope: '/app/',
      start_url: '/app/index.html',
      icons: [{ src: 'icon.png', sizes: '192x192', type: 'image/png' }],
      screenshots: [{ src: 'screenshot.png', sizes: '1280x768', type: 'image/png' }],
      related_applications: [{ platform: 'web', url: 'https://example.com' }],
      prefer_related_applications: true,
      categories: ['utilities', 'productivity'],
      dir: 'ltr',
      lang: 'en-US',
      iarc_rating_id: '12345',
    }, null, 2);

    const outputPath = await generateManifest(config, mockOutDir, mockLogger);

    expect(writeFileSpy).toHaveBeenCalledWith(
      path.join(mockOutDir, 'custom-manifest.json'),
      expectedManifestContent,
    );
    expect(outputPath).toBe(path.join(mockOutDir, 'custom-manifest.json'));
  });

  it('should throw an error if writeFile fails', async () => {
    writeFileSpy.mockRejectedValueOnce(new Error("ENOENT: no such file or directory, open '/mock/output/dir/manifest.webmanifest'"));

    const config: ManifestConfig = {
      name: 'Error App',
      shortName: 'EA',
      description: 'An app that fails',
      theme_color: '#fff',
      background_color: '#000',
    };

    await expect(generateManifest(config, mockOutDir, mockLogger)).rejects.toThrow("ENOENT: no such file or directory, open '/mock/output/dir/manifest.webmanifest'");
  });
});
