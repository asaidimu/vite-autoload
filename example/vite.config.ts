import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { createAutoloadPlugin, extract } from "@asaidimu/vite-autoload";
import { createAutoloadConfig } from "./src/app/config/autolod";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    createAutoloadPlugin(createAutoloadConfig({ extract })),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
