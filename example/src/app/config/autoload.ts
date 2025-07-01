import { z } from "zod";
// Adjust import paths based on your file structure after splitting types
import type {
  PluginOptions,
  ComponentsConfig,
  TransformConfig,
  ResolvedFile,
  ExtractFunction,
} from "../../../../src/types";
import type { Widget, WidgetData } from "../types/widget";

interface ConfigOptions {
  readonly extract: ExtractFunction;
}

export default function createAutoloadConfig({
  extract,
}: ConfigOptions): PluginOptions {
  // --- Define TransformConfig for Widgets ---
  const widgetTransformConfig: TransformConfig<ResolvedFile, Widget, Widget[]> =
    {
      name: "Widgets", // A specific name for this transformation
      description: "Autoloads widget definitions and metadata.",
      input: {
        directory: "widgets", // Corresponds to your example app's widgets directory
        match: ["*.tsx", "*/index.tsx"], // Match widget files
      },
      output: {
        template: "export const widgets = {{ data }};", // Output as a constant named 'widgets'
        types: {
          name: "WidgetType", // Type name for individual widgets
          property: "name", // Or 'title' or 'path', depending on what identifies a widget
        },
      },
      transform: (item: ResolvedFile) => {
        // Assuming WidgetData is extracted from the file's content (e.g., via exports or comments)
        const widgetData: WidgetData = extract({
          filePath: item.file,
          schema: z.object({
            // Define a schema matching WidgetData
            title: z.string(),
            description: z.string(),
            position: z.object({
              row: z.number(),
              column: z.number(),
              span: z.number().optional(),
            }),
          }),
          name: "widgetData",
        }) as WidgetData; // Cast to WidgetData, assuming extraction is successful

        return {
          ...widgetData,
          path: item.uri, // Include the file path as part of the transformed Widget
        };
      },
      aggregate: (items: Widget[]) => {
        // For a simple autoload, returning the array as is might be sufficient.
        return items;
      },
    };

  // --- Define ComponentsConfig for Widgets ---
  const widgetsComponent: ComponentsConfig = {
    name: "ApplicationWidgets",
    description:
      "Manages the autoloading and registration of application widgets.",
    strategy: {
      type: "unified",
      types: {
        name: "Widgets",
        property: "name",
      },
    },
    groups: [widgetTransformConfig],
  };

  return {
    settings: {
      rootDir: process.cwd(),
      export: {
        // As discussed, collectionName is legacy. You'd define here what gets exported.
        // For now, only the type definitions output path is specified.
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
    components: [
      widgetsComponent, // Only include the widgets component for this new app
    ],
  };
}
