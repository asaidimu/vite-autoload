/**
 * Defines the configuration for generating a sitemap.
 */
export interface SitemapConfig {
  /** The output file path for the generated sitemap. */
  readonly output: string;
  /** The base URL for the sitemap entries. */
  readonly baseUrl: string;
  /** An optional array of routes to exclude from the sitemap. */
  readonly exclude?: ReadonlyArray<string>;
}
