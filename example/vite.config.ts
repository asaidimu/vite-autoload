import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { createAutoloadPlugin, extract } from "../index.ts";
import { createAutoloadConfig } from "./src/app/config/autolod"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
createAutoloadPlugin(createAutoloadConfig({ extract })),
        react(), tailwindcss(),
    ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@asaidimu/vite-autoload": path.resolve(__dirname, '../../index.ts'),
    },
  },
})
