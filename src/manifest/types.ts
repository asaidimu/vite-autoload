import { z } from 'zod';

export const AssetSchema = z.object({
  checksum: z.string(),
  size: z.number(),
  type: z.string(),
  compression: z.string(),
  dependencies: z.array(z.string()),
  version: z.string()
});

export const RouteAssetsSchema = z.object({
  critical: z.array(z.string()),
  lazy: z.array(z.string()),
  prefetch: z.array(z.string())
});

export const RouteHintsSchema = z.object({
  viewport: z.string(),
  timing: z.number()
});

export const CachingPolicySchema = z.object({
  strategy: z.enum(['cache-first', 'network-first', 'stale-while-revalidate']),
  duration: z.number(),
  validation: z.enum(['checksum', 'time-based', 'none'])
});

export const PrefetchPolicySchema = z.object({
  strategy: z.enum(['idle', 'eager', 'on-demand']),
  concurrency: z.number(),
  timeout: z.number()
});

export const ManifestSchema = z.object({
  version: z.string(),
  buildId: z.string(),
  timestamp: z.string(),
  routes: z.record(z.object({
    assets: RouteAssetsSchema,
    hints: RouteHintsSchema
  })),
  assets: z.record(AssetSchema),
  policies: z.object({
    caching: CachingPolicySchema,
    prefetch: PrefetchPolicySchema
  })
});

export type Asset = z.infer<typeof AssetSchema>;
export type RouteAssets = z.infer<typeof RouteAssetsSchema>;
export type RouteHints = z.infer<typeof RouteHintsSchema>;
export type CachingPolicy = z.infer<typeof CachingPolicySchema>;
export type PrefetchPolicy = z.infer<typeof PrefetchPolicySchema>;
export type Manifest = z.infer<typeof ManifestSchema>;

export const ManifestConfigSchema = z.object({
  output: z.string().optional(),
  format: z.enum(['json', 'yaml']).optional(),
  compression: z.boolean().optional(),
  validation: z.boolean().optional(),
  caching: CachingPolicySchema.optional(),
  prefetch: PrefetchPolicySchema.optional()
});
