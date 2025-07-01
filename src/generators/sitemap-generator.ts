export interface SitemapEntry<T = any> {
  readonly route: string;
  readonly metadata?: T;
}

interface SitemapUrl {
  readonly loc: string;
  readonly lastmod: string;
  readonly changefreq:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  readonly priority: number;
}

export function generateSitemap(
  routes: ReadonlyArray<SitemapEntry>,
  baseUrl: string,
  exclude: ReadonlyArray<string> = [],
): string {
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

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
}
