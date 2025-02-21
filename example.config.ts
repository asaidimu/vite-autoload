import { z } from "zod";
import type { ExtractFunction, PluginOptions } from "./src/core/types";

interface ConfigOptions {
  readonly extract: ExtractFunction;
}

export default function createAutoloadConfig({
  extract,
}: ConfigOptions): PluginOptions {
  return {
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
    routes: {
      views: {
        importers: ["./ui/main.ts"],
        input: {
          directory: "ui",
          match: ["*.ts"],
        },
        output: {
          name: "views",
          template: "export const views = {{ data }};",
        },
        transform: (view) => {
          const route = view.path
            .replace(/.*modules/, "")
            .replace(/\\/g, "/")
            .replace(/\.tsx?$/, "")
            .replace(/index.?$/, "");
          return {
            route:
              route.length === 1 ? route : route.replace(new RegExp("/?$"), ""),
            path: view.uri,
            module: route.split("/")[0],
            metadata: extract({
              filePath: view.file,
              schema: z.unknown(),
              name: "metadata",
            }),
          };
        },
      },
      pages: {
        input: {
          directory: "src/interface/pages",
          match: ["*.tsx", "*/index.tsx"],
        },
        output: {
          name: "pages",
          template: "export const pages = {{ data }};",
        },
        transform: (page) => {
          const route = page.path
            .replace(/.*pages/, "")
            .replace(/\\/g, "/")
            .replace(/\.tsx?$/, "")
            .replace(/index.?$/, "");

          return {
            route: route || "/",
            path: page.uri,
            metadata: extract({
              filePath: page.file,
              schema: z.unknown(),
              name: "metadata",
            }),
          };
        },
      },
    },
    modules: {},
    logLevel: "info",
  };
}
