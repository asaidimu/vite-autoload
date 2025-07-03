import { describe, it, expect, vi } from 'vitest';
import { generateSitemap, SitemapEntry } from '../../src/generators/sitemap-generator';
import type { Logger } from '../../src/utils/logger';

describe('generateSitemap', () => {
  const mockLogger: Logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  const baseUrl = 'https://example.com';
  const currentDate = new Date();
  vi.spyOn(global, 'Date').mockImplementation(() => currentDate as any);

  it('should generate a basic sitemap with default values', () => {
    const routes: SitemapEntry[] = [
      { route: '/' },
      { route: '/about' },
    ];
    const expectedSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>${currentDate.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>${currentDate.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

    const sitemap = generateSitemap(routes, baseUrl, [], mockLogger);
    expect(sitemap).toBe(expectedSitemap);
  });

  it('should generate a sitemap with custom changefreq and priority', () => {
    const routes: SitemapEntry[] = [
      { route: '/contact', metadata: { changefreq: 'daily', priority: 0.5 } },
    ];
    const expectedSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/contact</loc>
    <lastmod>${currentDate.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

    const sitemap = generateSitemap(routes, baseUrl, [], mockLogger);
    expect(sitemap).toBe(expectedSitemap);
  });

  it('should exclude routes based on patterns', () => {
    const routes: SitemapEntry[] = [
      { route: '/' },
      { route: '/admin' },
      { route: '/private/page' },
    ];
    const excludePatterns = ['/admin', '/private/'];
    const expectedSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>${currentDate.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

    const sitemap = generateSitemap(routes, baseUrl, excludePatterns, mockLogger);
    expect(sitemap).toBe(expectedSitemap);
  });

  it('should handle an empty routes array', () => {
    const routes: SitemapEntry[] = [];
    const expectedSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

    const sitemap = generateSitemap(routes, baseUrl, [], mockLogger);
    expect(sitemap).toBe(expectedSitemap);
  });

  it('should ensure correct URL construction with baseUrl', () => {
    const routes: SitemapEntry[] = [
      { route: 'path/to/page' },
    ];
    const expectedSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/path/to/page</loc>
    <lastmod>${currentDate.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

    const sitemap = generateSitemap(routes, baseUrl, [], mockLogger);
    expect(sitemap).toBe(expectedSitemap);
  });
});
