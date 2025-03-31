import type { z } from "zod";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type Environment = "build" | "dev";

export interface FileMatchConfig {
  readonly directory: string;
  readonly match: Array<string> | string;
  readonly ignore?: Array<string> | string;
  readonly prefix?: string;
  readonly data?: Record<string, unknown>;
}

export interface TransformContext<T> {
  readonly views: ReadonlyArray<T>;
  readonly environment?: Environment;
  readonly emitFile?: (fileName: string, source: string) => void;
}

export interface ExtractOptions {
  readonly filePath: string;
  readonly schema: z.ZodType;
  readonly name: string;
}

export type ExtractFunction = (
  options: ExtractOptions,
) => Record<string, unknown>;

export interface TransformConfig<T, R, A> {
  readonly input: FileMatchConfig;
  readonly output?: {
    readonly name: string;
    readonly template: string;
    readonly types?: {
      readonly name: string;
      readonly key: string;
    };
  };
  readonly transform?: (
    item: ResolvedFile,
    context: TransformContext<T> | Record<string, Array<{ module: string }>>,
  ) => R;
  readonly aggregate?: (items: R[]) => A;
  readonly importers?: string[]; // Files that should be connected to these modules
}

export interface RouteData<T = any> {
  readonly route: string;
  readonly path: string;
  readonly module?: string;
  readonly metadata?: T;
}

export interface ResolvedRouteModule {
  readonly path: string;
  readonly uri: string;
  readonly file: string;
}

export interface RoutesConfig {
  readonly views: TransformConfig<ResolvedRouteModule, RouteData, any>;
  readonly pages: TransformConfig<ResolvedRouteModule, RouteData, any>;
}

export interface ModulesConfig {
  readonly [key: string]: TransformConfig<unknown, unknown, unknown>;
}

export interface SitemapConfig {
  readonly output: string;
  readonly baseUrl: string;
  readonly exclude?: ReadonlyArray<string>;
}

export interface ExportOptions {
  readonly types?: string;
  readonly routeLimit?: number;
}

export interface WatchOptions {
  debounceTime?: number;
  stabilityThreshold?: number;
}

export interface ManifestConfig {
  readonly name: string;
  readonly shortName?: string;
  readonly description?: string;
  readonly theme_color?: string;
  readonly background_color?: string;
  readonly display?: "fullscreen" | "standalone" | "minimal-ui" | "browser";
  readonly orientation?: "any" | "natural" | "landscape" | "portrait";
  readonly scope?: string;
  readonly start_url?: string;
  readonly icons?: Array<{
    src: string;
    sizes: string;
    type?: string;
    purpose?: "any" | "maskable" | "monochrome";
  }>;
  readonly screenshots?: Array<{
    src: string;
    sizes: string;
    type?: string;
    platform?: "wide" | "narrow" | "android" | "ios" | "windows";
  }>;
  readonly related_applications?: Array<{
    platform: string;
    url: string;
    id?: string;
  }>;
  readonly prefer_related_applications?: boolean;
  readonly categories?: Array<string>;
  readonly dir?: "auto" | "ltr" | "rtl";
  readonly lang?: string;
  readonly iarc_rating_id?: string;
  readonly output?: string;
}

export interface PluginOptions {
  readonly rootDir?: string;
  readonly export?: ExportOptions;
  readonly watch?: WatchOptions;
  readonly sitemap?: SitemapConfig;
  readonly manifest?: ManifestConfig;
  readonly routes: RoutesConfig;
  readonly modules: ModulesConfig;
  readonly logLevel?: LogLevel;
  readonly extract?: ExtractFunction;
  readonly chunkSize?: number;
}

export interface BuildContext {
  readonly production: boolean;
  readonly environment?: Environment;
  readonly name?: string;
  readonly split?: boolean;
}

export type VirtualModule = `virtual:${string}`;

export interface FileExportMap {
  readonly virtualModule: VirtualModule;
  readonly exportKey: string;
  readonly index: number;
}

export interface RouteGeneratorResult {
  readonly views?: ReadonlyArray<RouteData>;
  readonly pages?: ReadonlyArray<RouteData>;
}

export interface ResolvedFile {
  uri: string;
  path: string;
  file: string;
}
