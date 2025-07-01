import type { TransformConfig } from "./transform"; // Import TransformConfig

/**
 * Defines a high-level component configuration within the application (e.g., "routes", "ui-components").
 * It encapsulates an overall strategy and an array of specific transformation groups that belong to this component.
 */
export type ComponentConfig = {
  /** The name of this component category (e.g., "routes", "blogPosts"). */
  name: string;
  /** An optional description for this component category. */
  description?: string;
  /** Optional arbitrary metadata associated with this component category. */
  metadata?: Record<string, unknown>;
  /** Defines the strategy for how the groups within this component are handled and their outputs generated. */
  strategy: {
    /** Sitemap generation output settings for this component's groups. */
    sitemap?: {
      /** The property to use from the aggregated data for sitemap entries (e.g., "route" or "url"). */
      property: string;
    };
    /** Type generation output settings for this component's groups. */
    types?: {
      /** The name of the generated TypeScript type for this component. */
      name: string;
      /** The property to extract from the aggregated data for type generation. */
      property: string;
    };
  };
  /**
   * An array of individual transformation configurations (groups) that belong to this component category.
   * Each `TransformConfig` defines how specific input data is transformed and aggregated within this component.
   * For example, within a "routes" component, you might have "view-routes" and "api-routes" as separate groups.
   */
  groups: Array<TransformConfig<any, any, any>>;
};
