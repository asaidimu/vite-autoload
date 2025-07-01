import { generateMd5Hash } from "../utils/crypto";

export interface UriTransformContext {
  readonly uri: string;
  readonly prefix?: string;
  readonly production?: boolean;
}

export interface UriTransformStrategy {
  readonly transform: (context: UriTransformContext) => string;
}

export class ProductionUriStrategy implements UriTransformStrategy {
  transform(context: UriTransformContext): string {
    const prefix = context.prefix || "/";
    return `${prefix}${generateMd5Hash(context.uri)}.js`;
  }
}

export class DevelopmentUriStrategy implements UriTransformStrategy {
  transform(context: UriTransformContext): string {
    const prefix = context.prefix || "/";
    return `${prefix}${context.uri}`;
  }
}

export function createUriTransformer(): {
  transform: (context: UriTransformContext) => string;
} {
  const productionStrategy = new ProductionUriStrategy();
  const developmentStrategy = new DevelopmentUriStrategy();

  return {
    transform(context: UriTransformContext): string {
      const strategy = context.production
        ? productionStrategy
        : developmentStrategy;

      return strategy.transform(context);
    },
  };
}
