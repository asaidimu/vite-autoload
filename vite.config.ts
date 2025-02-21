import { defineConfig } from "vite";
import createAutoloadConfig from "./example.config";
import { createAutoloadPlugin } from "./src/core/plugin";
import { extract } from "./src/utils/metadata";

export default defineConfig({
  plugins: [
    createAutoloadPlugin(createAutoloadConfig({ extract }))
  ],
});

