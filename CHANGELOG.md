# [6.1.0](https://github.com/asaidimu/vite-autoload/compare/v6.0.0...v6.1.0) (2025-07-02)


### Features

* **example:** add comprehensive React UI starter template ([09ca5bf](https://github.com/asaidimu/vite-autoload/commit/09ca5bf3962779aec8d1082382dabfb55cb3a2d1))

# [6.0.0](https://github.com/asaidimu/vite-autoload/compare/v5.0.0...v6.0.0) (2025-07-02)


* feat(core)!: introduce programmatic data sources ([8b60eca](https://github.com/asaidimu/vite-autoload/commit/8b60eca51a922a85d1af71762f019f43e7d9f06f))


### BREAKING CHANGES

* This version updates the required peer dependency to Vite v7.0.0. Users must upgrade their Vite installation to v7.0.0 or higher to use this version of the plugin.

# [5.0.0](https://github.com/asaidimu/vite-autoload/compare/v4.0.0...v5.0.0) (2025-07-02)


* refactor(core)!: migrate to async operations for improved performance ([0eb84e6](https://github.com/asaidimu/vite-autoload/commit/0eb84e6d3b26b960aded28e1316798abbf2cb924))


### BREAKING CHANGES

* The 'extract' utility function, and the 'transform' and 'aggregate' functions within TransformConfig (used in autoload.config.ts), now return Promises. Any custom implementations of these functions that perform asynchronous operations must now return a Promise, and calls to 'extract' in 'transform' functions should be prefixed with 'await'. This change was made to prevent synchronous I/O blocking the event loop, thereby improving overall plugin performance and responsiveness. Ensure your autoload.config.ts or any custom generator implementations are updated to handle the new asynchronous signatures.

# [4.0.0](https://github.com/asaidimu/vite-autoload/compare/v3.1.0...v4.0.0) (2025-07-01)


* feat(plugin)!: overhaul plugin configuration with unified component model ([539eadc](https://github.com/asaidimu/vite-autoload/commit/539eadca4838cf0dbca957a254f93950b6fbe90c))


### BREAKING CHANGES

* The `routes` and `modules` properties at the root level of `PluginOptions` have been removed.
Plugin configuration now requires a `settings` object for global options and a `components` array to define module groups.
Refer to `example.config.ts` and `README.md` for updated configuration structure and migration guidance.

# [3.1.0](https://github.com/asaidimu/vite-autoload/compare/v3.0.1...v3.1.0) (2025-06-28)


### Features

* **config:** introduce StrategyConfig interface ([5e65819](https://github.com/asaidimu/vite-autoload/commit/5e65819054633dca1f6b3673f3ac4dfe5406b5ff))

## [3.0.1](https://github.com/asaidimu/vite-autoload/compare/v3.0.0...v3.0.1) (2025-06-28)


### Bug Fixes

* **hmr:** ensure full module graph invalidation ([a540ee8](https://github.com/asaidimu/vite-autoload/commit/a540ee88b14ac75c4f819f8681a610e50ec0a888))

# [3.0.0](https://github.com/asaidimu/vite-autoload/compare/v2.1.2...v3.0.0) (2025-06-28)


* refactor(plugin)!: streamline module and route generator management ([27aaafb](https://github.com/asaidimu/vite-autoload/commit/27aaafbe904319a7e540af17ebae473ab83a4e82))
* refactor(plugin)!: unexpose internal generator functions ([b1699c5](https://github.com/asaidimu/vite-autoload/commit/b1699c5e6b3bf6fa66f8addce14e1c730b8a46fb))


### Bug Fixes

* fix build errors ([9d09afe](https://github.com/asaidimu/vite-autoload/commit/9d09afef9291fe08bde4de846b2d6df8821b5020))


### BREAKING CHANGES

* The createModuleGenerator and createRouteGenerator functions are no longer directly importable from @asaidimu/vite-autoload. Any code directly importing these functions will break.
Users should interact with the plugin solely through the createAutoloadPlugin function.
* The `generator` property within `routes` and individual `modules` configuration objects in `PluginOptions` has been removed. Any custom generator functions previously supplied via this property will no longer be supported. Users must remove this property from their `autoload.config.ts` or similar configuration files, as the plugin now exclusively utilizes its built-in, unified module generation logic.

## [2.1.2](https://github.com/asaidimu/vite-autoload/compare/v2.1.1...v2.1.2) (2025-06-28)


### Bug Fixes

* **plugin:** optimize internal processing and config handling ([abe54b4](https://github.com/asaidimu/vite-autoload/commit/abe54b4dedb8fd174f9659d72d440844ecd4ad2e))

## [2.1.1](https://github.com/asaidimu/vite-autoload/compare/v2.1.0...v2.1.1) (2025-06-28)


### Bug Fixes

* **revert:** Revert to stable version v2.0.0 source ([c81cc17](https://github.com/asaidimu/vite-autoload/commit/c81cc177ef61bbf656659177a1f91089ba674930))

### Features

* **generators:** Introduce pluggable system for virtual module generation ([5eff1d4](https://github.com/asaidimu/vite-autoload/commit/5eff1d4be7b201a188a5f531ab1107ae2d28e687))

# [2.0.0](https://github.com/asaidimu/vite-autoload/compare/v1.1.0...v2.0.0) (2025-06-28)


* refactor(core)!: streamline plugin by removing experimental asset manifest ([ecfa791](https://github.com/asaidimu/vite-autoload/commit/ecfa791b463bb25b5c68b021fe5a0bcdae765711))


### BREAKING CHANGES

* The experimental Asset Manifest System, including its configuration options (e.g., app.manifest, caching, prefetch) and associated service worker logic, has been entirely removed. This feature was previously marked as Work in Progress and is no longer part of the plugin's scope. Users relying on this experimental functionality will need to remove related configurations and code.

# [1.1.0](https://github.com/asaidimu/vite-autoload/compare/v1.0.6...v1.1.0) (2025-03-31)


### Bug Fixes

* fix types after refactor ([733863a](https://github.com/asaidimu/vite-autoload/commit/733863ad6bcc44bf16c6fe457aab651fa095680b))


### Features

* add ability to aggregate modules ([2f64e3d](https://github.com/asaidimu/vite-autoload/commit/2f64e3d721a865bba23235556998b9877210e890))

## [1.0.6](https://github.com/asaidimu/vite-autoload/compare/v1.0.5...v1.0.6) (2025-03-18)


### Bug Fixes

* refactor ([76dc617](https://github.com/asaidimu/vite-autoload/commit/76dc617da141defaf86d72ebf81d4dab316eed4a))

## [1.0.5](https://github.com/asaidimu/vite-autoload/compare/v1.0.4...v1.0.5) (2025-02-21)


### Bug Fixes

* fix build ([a52bf5a](https://github.com/asaidimu/vite-autoload/commit/a52bf5a81924cb1c7ec2dfc0a684062c895023bc))

## [1.0.4](https://github.com/asaidimu/vite-autoload/compare/v1.0.3...v1.0.4) (2025-02-21)


### Bug Fixes

* more hmr ([e9ab83b](https://github.com/asaidimu/vite-autoload/commit/e9ab83b3dcb0300de09bd3a94594b34d3f009e60))

## [1.0.3](https://github.com/asaidimu/vite-autoload/compare/v1.0.2...v1.0.3) (2025-01-18)


### Bug Fixes

* add left out feature ([e1bee3f](https://github.com/asaidimu/vite-autoload/commit/e1bee3f6e739c56218fe7d8aac7de934e3e1f3ce))

## [1.0.2](https://github.com/asaidimu/vite-autoload/compare/v1.0.1...v1.0.2) (2025-01-18)


### Bug Fixes

* add tentative manifest generation ([b6d3547](https://github.com/asaidimu/vite-autoload/commit/b6d3547b2ac79ba88331ce9297b976ffe2f0064d))
* remove incomplete package ([be282a0](https://github.com/asaidimu/vite-autoload/commit/be282a070f5940f718ffd26d16e8197f3f87defb))

## [1.0.1](https://github.com/asaidimu/vite-autoload/compare/v1.0.0...v1.0.1) (2025-01-18)


### Bug Fixes

* fixed a minor bug in path generation ([9476bd0](https://github.com/asaidimu/vite-autoload/commit/9476bd0bc3e8ad25d19852942e0a1b3f7ef6831b))

# 1.0.0 (2025-01-17)


### Bug Fixes

* remove undefined/unused references ([553b769](https://github.com/asaidimu/vite-autoload/commit/553b76922393812a55453889cdb9af2ea3f21fb3))


### Features

* inital release ([4316cfc](https://github.com/asaidimu/vite-autoload/commit/4316cfc98439d06b661feccef7c657ec08cec9b6))
