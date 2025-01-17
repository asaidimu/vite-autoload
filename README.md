# @asaidimu/vite-autoload

A powerful Vite plugin that provides enhanced automatic route and module loading capabilities for your Vite applications.

## Features

- 🚀 Automatic route generation from your file structure
- 📦 Module-based architecture support
- 🗺️ Automatic sitemap generation
- 🔄 Type-safe configuration with Zod schemas
- ⚡ Fast and efficient file watching
- 🛠️ Highly configurable and extensible

## Installation

```bash
npm install @asaidimu/vite-autoload
# or
yarn add @asaidimu/vite-autoload
# or
pnpm add @asaidimu/vite-autoload
# or
bun add @asaidimu/vite-autoload
```

## Usage

Create a configuration file for the plugin (e.g., `vite-autoload.config.ts`):

```typescript
import { createAutoloadConfig } from '@asaidimu/vite-autoload';

export default createAutoloadConfig({
  extract: ({ filePath, schema, name }) => {
    // Your metadata extraction logic here
    return {};
  }
});
```

### Configuration Options

The plugin accepts the following configuration options:

#### Root Configuration
- `rootDir`: The root directory of your project (defaults to `process.cwd()`)

#### Export Configuration
- `export.types`: Path to generate TypeScript declaration file (e.g., 'src/app/config/autogen.d.ts')

#### Sitemap Configuration
- `sitemap.output`: Output path for the generated sitemap (e.g., 'sitemap.xml')
- `sitemap.baseUrl`: Base URL for your site (e.g., 'https://example.com')
- `sitemap.exclude`: Array of patterns to exclude from sitemap (e.g., ['/admin/*'])

#### Routes Configuration
Supports two types of routes:

1. **Views**: Module-based views
   ```typescript
   views: {
     input: {
       directory: 'src/interface/modules',
       match: ['*/*/index.tsx'],
       ignore: ['components/*']
     },
     output: {
       name: 'views',
       template: 'export const views = {{ data }};'
     }
   }
   ```

2. **Pages**: Standalone pages
   ```typescript
   pages: {
     input: {
       directory: 'src/interface/pages',
       match: ['*.tsx', '*/index.tsx']
     },
     output: {
       name: 'pages',
       template: 'export const pages = {{ data }};'
     }
   }
   ```

#### Modules Configuration
```typescript
modules: {
  input: {
    directory: 'src/interface/modules',
    match: ['*/module.ts'],
    prefix: '/'
  },
  output: {
    name: 'modules',
    template: ''
  }
}
```

## Performance Optimization

### Memory Usage Guidelines

To optimize memory usage when using this plugin, consider the following:

1. **Limit Watch Directories**
   ```typescript
   // Only watch necessary directories
   routes: {
     input: {
       directory: 'src/routes',
       // Avoid watching unnecessary files
       ignore: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**']
     }
   }
   ```

2. **Route Processing**
   - The plugin processes routes in chunks to prevent memory spikes
   - Default chunk size is 100 routes
   - Adjust the chunk size based on your needs:
     ```typescript
     export default {
       plugins: [
         autoload({
           // Smaller chunk size for memory-constrained environments
           chunkSize: 50
         })
       ]
     }
     ```

3. **File Watching**
   - Uses efficient file watching with debouncing
   - Avoids polling by default
   - Ignores common temporary files and dotfiles
   - Configurable watch settings:
     ```typescript
     export default {
       plugins: [
         autoload({
           watch: {
             // Increase debounce time for less frequent updates
             debounceTime: 2000,
             // Wait for write operations to finish
             stabilityThreshold: 500
           }
         })
       ]
     }
     ```

4. **Type Generation**
   - Types are generated with a limit of 1000 routes by default
   - Adjust the limit based on your needs:
     ```typescript
     export default {
       plugins: [
         autoload({
           export: {
             types: 'src/types/routes.d.ts',
             // Adjust route limit for type generation
             routeLimit: 500
           }
         })
       ]
     }
     ```

## Development

```bash
# Install dependencies
bun install

# Build the project
bun run build

# Clean build artifacts
bun run clean
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT 
