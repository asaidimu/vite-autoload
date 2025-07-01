/**
 * Defines options for file watching behavior.
 */
export interface WatchOptions {
  /** The time in milliseconds to debounce watch events. */
  debounceTime?: number;
  /** The time in milliseconds to wait for file system stability before emitting changes. */
  stabilityThreshold?: number;
}
