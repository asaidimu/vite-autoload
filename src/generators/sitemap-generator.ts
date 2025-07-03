/**
 * Represents an entry in the sitemap.
 * @template T - The type of metadata associated with the sitemap entry.
 */
export interface SitemapEntry<T = any> {
  /** The route of the sitemap entry. */
  readonly route: string;
  /** Optional metadata associated with the sitemap entry. */
  readonly metadata?: T;
}

/**
 * Represents a URL entry in the sitemap XML.
 */
interface SitemapUrl {
  /** The location (URL) of the page. */
  readonly loc: string;
  /** The date of last modification of the file. */
  readonly lastmod: string;
  /** How frequently the page is likely to change. */
  readonly changefreq:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  /** The priority of this URL relative to other URLs on your site. */
  readonly priority: number;
}

import { Logger } from "../utils/logger";
import { createCacheManager } from "../utils/cache";

/**
 * Generates a sitemap XML string.
 *
 * @param routes - An array of sitemap entries.
 * @param baseUrl - The base URL for the sitemap entries.
 * @param exclude - An optional array of glob patterns to exclude routes.
 * @param logger - Optional logger instance.
 * @returns The generated sitemap XML string.
 */
export function generateSitemap(
  routes: ReadonlyArray<SitemapEntry>,
  baseUrl: string,
  exclude: ReadonlyArray<string> = [],
  logger?: Logger,
): string {
  const sitemapCache = createCacheManager<string>(logger);
  const cacheKey = `${JSON.stringify(routes)}-${baseUrl}-${JSON.stringify(exclude)}`;
  if (sitemapCache.has(cacheKey)) {
    logger?.debug("Returning cached sitemap.");
    return sitemapCache.get(cacheKey)!;
  }

  const date = new Date().toISOString();

  const urls = routes
    .filter((route) => !exclude.some((pattern) => route.route.match(pattern)))
    .map((route) => {
      const url: SitemapUrl = {
        loc: new URL(route.route, baseUrl).toString(),
        lastmod: date,
        changefreq:
          (route.metadata?.changefreq as SitemapUrl["changefreq"]) || "weekly",
        priority:
          typeof route.metadata?.priority === "number"
            ? route.metadata.priority
            : 0.8,
      };

      return `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority.toFixed(1)}</priority>
  </url>`;
    })
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
  sitemapCache.set(cacheKey, sitemap);
  return sitemap;
}
