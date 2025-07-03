import type { z } from "zod";
import type { Environment } from "./build";

/**
 * Defines configuration for matching files within a directory.
 */
export interface FileMatchConfig {
  /** The base directory to start matching files from. */
  directory: string;
  /** A glob pattern or array of patterns to match files. */
  match: Array<string> | string;
  /** An optional glob pattern or array of patterns to ignore files. */
  ignore?: Array<string> | string;
  /** An optional prefix to add to file paths. */
  prefix?: string;
  /** Optional arbitrary data associated with this file match configuration. */
  data?: Record<string, unknown>;
}

/**
 * Represents a file that has been resolved by the system.
 */
export interface ResolvedFile {
  /** The uniform resource identifier for the file. */
  uri: string;
  /** The resolved path to the file. */
  path: string;
  /** The base file name. */
  file: string;
}

/**
 * Context provided during a data transformation process.
 * @template T The type of data views available in the context.
 */
export interface TransformContext {
  /** data from previous transformations */
  data?: { [key: string]: unknown };
  /** The current environment (e.g., "build" or "dev"). */
  environment?: Environment;
  /** An optional function to emit a new file during the transformation process. */
  emitFile?: (fileName: string, source: string) => void;
}

/**
 * Options for extracting data from a file using a Zod schema.
 */
export interface ExtractOptions {
  /** The file path from which to extract data. */
  filePath: string;
  /** The Zod schema to use for validation and parsing the extracted data. */
  schema: z.ZodType;
  /** A name for the extraction process or the extracted data. */
  name: string;
}

/**
 * A function type for extracting data based on provided options.
 */
export type ExtractFunction = (
  options: ExtractOptions,
) => Promise<Record<string, unknown> | null>;

export type DataSource<Data> = () => Promise<Data> | Data;
/**
 * Defines a complete data transformation pipeline from input files to transformed and aggregated output.
 * @template Data The type of data returned by a data source.
 * @template TransformedOutput The type of data after the transformation step.
 * @template AggregatedOutput The type of data after the aggregation step.
 */
export interface TransformConfig<Data, TransformedOutput, AggregatedOutput> {
  /** The name of the transformed result */
  name: string;
  /** An optional description for the transformation pipeline. */
  description?: string;
  /** Optional arbitrary metadata associated with this transformation pipeline. */
  metadata?: Record<string, unknown>;
  /** Configuration for matching input files, or data */
  input: FileMatchConfig | DataSource<Data>;
  /** Optional configuration for the output of the transformed/aggregated data. */
  output?: {
    /** The template string for generating the output file. */
    template?: string;
    /** Optional type definition configuration for the output. */
    types?: {
      /** The name of the generated type. */
      name: string;
      /** The property to use for the type. */
      property: string;
    };
  };
  /**
   * An optional function to transform each individual item.
   * The context provides general transformation data, and additional metadata can be passed.
   */
  transform?: (
    item: ResolvedFile | Data,
    context: TransformContext,
    metadata?: Record<string, Record<string, unknown>>,
  ) => TransformedOutput | Promise<TransformedOutput>;
  /**
   * An optional function to aggregate all transformed items.
   * Additional metadata can be passed to the aggregation function.
   */
  aggregate?: (
    items: Array<TransformedOutput | Promise<TransformedOutput>>,
    metadata?: Record<string, Record<string, unknown>>,
  ) => AggregatedOutput | Promise<AggregatedOutput>;
}
