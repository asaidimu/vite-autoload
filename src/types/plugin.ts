import { ComponentConfig } from "./components";
import type { ManifestConfig } from "./manifest"; // Assuming manifest.ts holds ManifestConfig
import type { SitemapConfig } from "./sitemap"; // Assuming sitemap.ts holds SitemapConfig
import { ExtractFunction } from "./transform";
import type { WatchOptions } from "./watch"; // Assuming watch.ts holds WatchOptions

/**
 * Log levels for controlling verbosity of output.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Represents a virtual module, typically used in build systems.
 * Format: `virtual:<module-id>`.
 */
export type VirtualModule = `virtual:${string}`;

/**
 * Maps a virtual module to an export key and an index, likely for internal bundling.
 */
export interface FileExportMap {
  virtualModule: VirtualModule;
  exportKey: string;
  index: number;
}

/**
 * Defines the comprehensive configuration options for the entire plugin system.
 */
export interface PluginOptions {
  settings: {
    /** An optional root directory for the project. */
    rootDir?: string;
    /** Configuration for exporting generated routes and types. */
    export?: {
      types?: string;
    };
    /** Options for file watching behavior during development. */
    watch?: WatchOptions;
    /** Configuration for generating a sitemap. */
    sitemap?: SitemapConfig;
    /** Configuration for the web app manifest. */
    manifest?: ManifestConfig;
    /** The logging level for the system's output. */
    logLevel?: LogLevel;
    /** An optional function to extract data from files based on a schema. */
    extract?: ExtractFunction;
    /** An optional chunk size for processing or bundling operations. */
    chunkSize?: number;
  };
  /**
   * Configuration for defining and transforming various modules or collections of data.
   * This now uses the new `ModulesConfig` structure with integrated strategy.
   */
  components: Array<ComponentConfig>;
}
