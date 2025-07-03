import path from "path";
import { createCacheManager } from "./cache";
import { generateMd5Hash } from "./crypto";

export interface UriTransformContext {
  /** The original URI string. */
  readonly uri: string;
  /** An optional prefix to add to the URI. */
  readonly prefix?: string;
  /** Indicates if the transformation is for a production build. */
  readonly production?: boolean;
}

/**
 * Transforms a URI.
 * @param context The URI transform context.
 * @returns The transformed URI.
 */
function transformUri(context: UriTransformContext): string {
  let prefix = context.prefix || "/";
  if (prefix.length > 0 && !prefix.endsWith("/")) {
    prefix += "/";
  }
  return `${prefix}${
    context.production ? generateMd5Hash(context.uri) + ".js" : context.uri
  }`.replace(/\/\//g, "/");
}

export function createUriTransformer(): {
  transform: (context: UriTransformContext) => string;
} {
  const uriTransformCache = createCacheManager<string>();
  return {
    transform(context: UriTransformContext): string {
      const cacheKey = `${context.uri}-${context.prefix}-${context.production}`;
      if (uriTransformCache.has(cacheKey)) {
        return uriTransformCache.get(cacheKey)!;
      }

      const transformedUri = transformUri(context);
      uriTransformCache.set(cacheKey, transformedUri);
      return transformedUri;
    },
  };
}
