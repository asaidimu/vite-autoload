import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createAutoloadPlugin } from "../index";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    createAutoloadPlugin({
      settings: {
        rootDir: __dirname,
        logLevel: "debug",
      },
      components: [
        {
          name: "widgets",
          strategy: {
            type: "unified",
          },
          groups: [
            {
              name: "widget",
              input: {
                directory: "src/widgets",
                match: "**/*.tsx",
              },
            },
          ],
        },
        {
          name: "routes",
          strategy: {
            type: "unified",
            sitemap: {
              property: "route",
            },
            types: {
              name: "AppRoutes",
              property: "route",
            },
          },
          groups: [
            {
              name: "pages",
              input: {
                directory: "src/app/pages",
                match: "**/*.tsx",
                prefix: "/",
              },
              transform(item) {
                return {
                  route: item.uri,
                  path: item.path,
                };
              },
            },
          ],
        },
      ],
    }),
  ],
});
