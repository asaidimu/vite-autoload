import { z } from "zod";
// Adjust import paths based on your file structure after splitting types
import type {
  PluginOptions,
  ComponentConfig,
  TransformConfig,
  ResolvedFile,
  ExtractFunction,
} from "./src/types";

interface ConfigOptions {
  readonly extract: ExtractFunction;
}

export default function createAutoloadConfig({
  extract,
}: ConfigOptions): PluginOptions {
  // Define the TransformConfig for 'views'
  const viewsTransformConfig: TransformConfig<ResolvedFile, any, any> = {
    name: "views", // Corresponds to the old output.name
    description: "Transforms UI view files into routable data.",
    input: {
      directory: "ui",
      match: ["*.ts"],
    },
    output: {},
    transform: (item: ResolvedFile) => {
      const route = item.path
        .replace(/.*modules/, "")
        .replace(/\\/g, "/")
        .replace(/\.tsx?$/, "")
        .replace(/index.?$/, "");

      return {
        route:
          route.length === 1 ? route : route.replace(new RegExp("/?$"), ""),
        path: item.uri,
        module: route.split("/")[0],
        metadata: extract({
          filePath: item.file,
          schema: z.unknown(),
          name: "metadata",
        }),
      };
    },
  };

  // Define the ComponentsConfig for 'routes'
  const routes: ComponentConfig = {
    name: "routes", // A logical name for this high-level component
    description:
      "Defines the routing structure and data for application views and pages.",
    strategy: {
      // Assuming a 'unified' strategy for routes to allow combined sitemap/type generation if needed
      type: "split",
      sitemap: {
        property: "route", // Assuming the aggregated data will have a 'route' property for sitemap entries
      },
      types: {
        name: "AppRouteData", // Name for the generated type
        property: "route", // Property to use for type generation
      },
    },
    groups: [
      viewsTransformConfig,
      { ...viewsTransformConfig, name: "pages" }, // duplicate views
    ],
  };

  return {
    settings: {
      rootDir: process.cwd(),
      export: {
        types: "src/app/config/autogen.d.ts",
      },
      sitemap: {
        output: "sitemap.xml",
        baseUrl: "https://example.com",
        exclude: ["/admin/*", "/private/*"],
      },
      manifest: {
        name: "My PWA App",
        shortName: "PWA App",
        description: "A Progressive Web Application",
        theme_color: "#4a90e2",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        output: "manifest.webmanifest",
      },
      logLevel: "info",
      extract: extract,
    },
    components: [routes],
  };
}
