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
