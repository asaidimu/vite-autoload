import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  bundle: true,
  sourcemap: true,
  target: "es2020",
  platform: "node",
  external: [ /^node:/,
        "typescript",
        "os", "fs", "path", "chokidar", "fast-glob"],
});
