import { defineConfig } from "vite";
import createAutoloadConfig from "./example.config";
import react from "@vitejs/plugin-react";
import { createAutoloadPlugin } from "./src/plugin";
import { extract } from "./src/utils/metadata";

export default defineConfig({
  plugins: [
            react(),
        createAutoloadPlugin(createAutoloadConfig({ extract }))],
});
