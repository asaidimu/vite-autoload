/**
 * Interface for adapting Vite's plugin context methods.
 */
export interface ViteAdapter {
  /**
   * Emits a file to the build output.
   * @param asset - The asset to emit.
   */
  emitFile: (asset: any) => void;
  /**
   * Adds a file to be watched by Vite.
   * @param id - The ID of the file to watch.
   */
  addWatchFile: (id: string) => void;
}

/**
 * Creates a Vite adapter to abstract away direct access to the Vite plugin context.
 *
 * @param context - The Vite plugin context (`this` in a Vite plugin hook).
 * @returns A ViteAdapter instance.
 */
export function createViteAdapter(context: any): ViteAdapter {
  return {
    emitFile: (asset: any) => context.emitFile(asset),
    addWatchFile: (id: string) => context.addWatchFile(id),
  };
}
