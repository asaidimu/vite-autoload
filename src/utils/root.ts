// utils/get-root.ts  (or inline it)
import { ResolvedConfig } from 'vite';
import { PluginOptions } from '../types';

export function getRoot(options?: PluginOptions, resolvedConfig?: ResolvedConfig): string {
  return resolvedConfig?.root
    || options?.settings?.rootDir
    || process.cwd();   // fallback
}
