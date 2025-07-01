/**
 * Environment types for build processes.
 */
export type Environment = "build" | "dev";

/**
 * Context provided during a build process.
 */
export interface BuildContext {
  /** Indicates if the build is for a production environment. */
  readonly production: boolean;
  /** The environment of the build (e.g., "build" or "dev"). */
  readonly environment?: Environment;
  /** An optional name for the build context. */
  readonly name?: string;
  /** Indicates if the output should be split (e.g., code splitting). */
  readonly split?: boolean;
}
