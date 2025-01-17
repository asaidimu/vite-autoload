import glob from "fast-glob";
import path from "path";
import type { FileMatchConfig, ResolvedFile } from "../core/types";

export function resolve(config: FileMatchConfig): Array<ResolvedFile> {
  const ignore = config.ignore
    ? Array.isArray(config.ignore)
      ? config.ignore
      : [config.ignore]
    : (config.ignore as undefined);

  const files = glob.sync(config.match, {
    cwd: config.directory,
    ignore,
    absolute: true,
    onlyFiles: true,
  });

  const result = files.map((file) => {
    const relativePath = path.relative(config.directory, file);
    return {
      path: relativePath,
      uri: `/${path.join(config.directory, relativePath)}`,
      file,
    };
  });

  return result
}
