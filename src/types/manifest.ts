/**
 * Defines the configuration for a Web App Manifest.
 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest
 */
export interface ManifestConfig {
  /** The name of the web application. */
  readonly name: string;
  /** A short version of the application's name. */
  readonly shortName?: string;
  /** A general description of the web application. */
  readonly description?: string;
  /** The default theme color for the application. */
  readonly theme_color?: string;
  /** The background color for the application. */
  readonly background_color?: string;
  /** The preferred display mode for the application. */
  readonly display?: "fullscreen" | "standalone" | "minimal-ui" | "browser";
  /** The default orientation for the application. */
  readonly orientation?: "any" | "natural" | "landscape" | "portrait";
  /** The navigation scope of the web application's context. */
  readonly scope?: string;
  /** The URL that the user will be directed to when launching the web application. */
  readonly start_url?: string;
  /** An array of icon objects for the application. */
  readonly icons?: Array<{
    /** The source URL of the icon. */
    src: string;
    /** The sizes of the icon (e.g., "192x192 512x512"). */
    sizes: string;
    /** The MIME type of the icon. */
    type?: string;
    /** The purpose of the icon (e.g., "any", "maskable", "monochrome"). */
    purpose?: "any" | "maskable" | "monochrome";
  }>;
  /** An array of screenshot objects for the application. */
  readonly screenshots?: Array<{
    /** The source URL of the screenshot. */
    src: string;
    /** The sizes of the screenshot (e.g., "1280x800"). */
    sizes: string;
    /** The MIME type of the screenshot. */
    type?: string;
    /** The platform the screenshot is intended for. */
    platform?: "wide" | "narrow" | "android" | "ios" | "windows";
  }>;
  /** An array of related application objects. */
  readonly related_applications?: Array<{
    /** The platform of the related application. */
    platform: string;
    /** The URL of the related application. */
    url: string;
    /** The ID of the related application. */
    id?: string;
  }>;
  /** Indicates whether the user agent should prefer related applications over the web application. */
  readonly prefer_related_applications?: boolean;
  /** An array of categories that the application belongs to. */
  readonly categories?: Array<string>;
  /** The base direction of the manifest's text. */
  readonly dir?: "auto" | "ltr" | "rtl";
  /** The primary language for the manifest's text. */
  readonly lang?: string;
  /** The IARC rating ID for the application. */
  readonly iarc_rating_id?: string;
  /** An optional output path for the manifest file. */
  readonly output?: string;
}
