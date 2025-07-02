# React UI Starter Template

[![npm version](https://img.shields.io/badge/version-0.0.0-blue.svg)](https://www.npmjs.com/package/example)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/asaidimu/uistart/actions)

A modern, opinionated React starter template designed for rapid UI development, leveraging the power of Vite, TypeScript, Tailwind CSS, and Shadcn UI.

---

### 📚 Table of Contents

*   [Overview & Features](#overview--features)
*   [Installation & Setup](#installation--setup)
    *   [Prerequisites](#prerequisites)
    *   [Getting Started](#getting-started)
*   [Usage Documentation](#usage-documentation)
    *   [Development Server](#development-server)
    *   [Building for Production](#building-for-production)
    *   [Code Linting](#code-linting)
    *   [Adding Shadcn UI Components](#adding-shadcn-ui-components)
    *   [Path Aliases](#path-aliases)
*   [Project Architecture](#project-architecture)
    *   [Key Technologies](#key-technologies)
    *   [Folder Structure (Conceptual)](#folder-structure-conceptual)
    *   [Extension Points](#extension-points)
*   [Development & Contributing](#development--contributing)
    *   [Local Development Setup](#local-development-setup)
    *   [Available Scripts](#available-scripts)
    *   [Testing](#testing)
    *   [Contributing Guidelines](#contributing-guidelines)
    *   [Issue Reporting](#issue-reporting)
*   [Additional Information](#additional-information)
    *   [Troubleshooting](#troubleshooting)
    *   [FAQ](#faq)
    *   [Changelog & Roadmap](#changelog--roadmap)
    *   [License](#license)
    *   [Acknowledgments](#acknowledgments)

---

## 🚀 Overview & Features

This template provides a robust and highly configurable starting point for building modern web applications with React. It integrates a curated set of cutting-edge technologies to enhance developer experience, ensure type safety, and streamline UI development. Designed for performance and maintainability, it offers a seamless workflow from development to production.

The project is pre-configured with a development server, build pipeline, and comprehensive linting rules, allowing you to focus on writing application logic rather than wrestling with configurations. It's an ideal choice for projects prioritizing a clean, modular codebase and a beautiful, accessible user interface.

### ✨ Key Features

*   **⚡ Blazing Fast Development** with [Vite 7.x](https://vitejs.dev/), offering instant server start and hot module replacement (HMR).
*   **💪 Type-Safe Code** with [TypeScript 5.x](https://www.typescriptlang.org/), ensuring robust and maintainable code.
*   **🎨 Utility-First Styling** using [Tailwind CSS 4.x](https://tailwindcss.com/) (Oxide engine), providing highly customizable and efficient styling.
*   **🧩 Beautiful & Accessible UI Components** powered by [Shadcn UI](https://ui.shadcn.com/) (built on [Radix UI](https://www.radix-ui.com/primitives) and Tailwind CSS), offering a "new-york" style theme with CSS variables.
*   **🖼️ Integrated Icon Library** with [Lucide React](https://lucide.dev/icons/), providing a vast collection of customizable icons.
*   **🧹 Strict Linting** with [ESLint 9.x](https://eslint.org/) (configured for React, TypeScript, and Hooks) to maintain code quality and consistency.
*   **📂 Clear Module Resolution** with pre-configured path aliases (`@/`) for cleaner and more organized imports.
*   **✨ Dynamic Animations** supported by `tw-animate-css` for easily adding CSS animations with Tailwind.
*   **📦 Optimized Production Builds** ensuring high performance and small bundle sizes.

---

## ⚙️ Installation & Setup

Follow these steps to get your development environment up and running.

### Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Node.js**: LTS version (e.g., 20.x or higher). You can download it from [nodejs.org](https://nodejs.org/).
*   **Bun**: Recommended package manager for this project. Install Bun from [bun.sh](https://bun.sh/docs/installation).

### Getting Started

1.  **Clone the repository:**
    You can use `git clone` or `degit` for a fresh copy without the git history.

    Using `degit` (recommended for templates):
    ```bash
    bunx degit asaidimu/uistart my-react-app
    cd my-react-app
    ```
    Or using `git clone`:
    ```bash
    git clone https://github.com/asaidimu/uistart.git my-react-app
    cd my-react-app
    ```

2.  **Install dependencies:**
    This project uses `bun` as its package manager.
    ```bash
    bun install
    ```

3.  **Verify Installation:**
    Start the development server to ensure everything is set up correctly.
    ```bash
    bun run dev
    ```
    Your application should now be running on `http://localhost:5173` (or another port if 5173 is in use).

---

## 📖 Usage Documentation

This section covers the essential commands and common workflows for developing with this template.

### Development Server

To start the local development server with hot module replacement:

```bash
bun run dev
```
This will open your application in your browser, typically at `http://localhost:5173`. Any changes you save will instantly reflect in the browser without a manual refresh.

**Note**: The `vite.config.ts` currently sets a `base: "/uistart/"` for deployment to a sub-path. If you intend to deploy to the root of your domain, remember to change this back to `base: "/"`.

### Building for Production

To build the optimized production-ready bundle of your application:

```bash
bun run build
```
This command first executes `tsc -b` to compile your TypeScript code, then uses Vite to bundle your assets, and finally outputs them to the `dist` directory. The build is highly optimized for performance and includes minification, tree-shaking, and code splitting.

### Code Linting

To check your codebase for linting errors and enforce coding standards:

```bash
bun run lint
```
This project uses ESLint 9.x with configurations for TypeScript, React, and React Hooks to ensure code quality and consistency across the project.

### Adding Shadcn UI Components

Shadcn UI components are not installed as traditional NPM packages but are added directly into your project's `src/components/ui` directory, allowing for easy customization.

To add a new Shadcn UI component (e.g., `button`):

```bash
bunx shadcn-ui@latest add button
```
This command will prompt you to configure the component (e.g., choose where to add it, if you want types, etc.). Ensure your `components.json` is correctly configured (which it is by default in this template) to use the correct paths and style settings.

Refer to the [Shadcn UI documentation](https://ui.shadcn.com/docs/components/button) for a list of available components and their usage.

### Path Aliases

This template is configured with a path alias `@/` for the `src` directory, allowing for cleaner and more absolute imports.

Instead of:
```typescript
import { Button } from '../../components/ui/button';
// or assuming root 'src' from project root
import { Button } from './src/components/ui/button';
```

You can use the alias:
```typescript
import { Button } from '@/components/ui/button';
```
This alias is configured in `tsconfig.json`, `tsconfig.app.json`, and `vite.config.ts`. Additionally, `components.json` leverages these aliases for Shadcn UI component generation (e.g., `"components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui"`).

---

## 🏗️ Project Architecture

This template is structured to promote modularity, scalability, and maintainability.

### Key Technologies

*   **Frontend Framework**: [React 19.1.0](https://react.dev/) - A powerful library for building user interfaces.
*   **Build Tool**: [Vite 7.0.0](https://vitejs.dev/) - A next-generation frontend tooling that provides an extremely fast development experience.
*   **Language**: [TypeScript 5.8.3](https://www.typescriptlang.org/) - A superset of JavaScript that adds static type definitions.
*   **Styling**: [Tailwind CSS 4.1.11](https://tailwindcss.com/) - A utility-first CSS framework for rapidly building custom designs, utilizing the Oxide engine.
*   **UI Components**: [Shadcn UI](https://ui.shadcn.com/) - A collection of re-usable components that you can copy and paste into your apps, built with Radix UI and Tailwind CSS.
*   **Base Components**: [Radix UI Primitives](https://www.radix-ui.com/primitives) - High-quality, accessible UI components for building design systems.
*   **Icons**: [Lucide React 0.525.0](https://lucide.dev/icons/) - A growing collection of open-source icons.
*   **Package Manager**: [Bun](https://bun.sh/) - An incredibly fast JavaScript runtime and package manager.

### Folder Structure (Conceptual)

The project follows a logical separation of concerns:

```
.
├── public/                 # Static assets (e.g., vite.svg)
├── src/                    # All application source code
│   ├── app/                # Main application entry point (e.g., app.tsx, index.html references src/app/app.tsx)
│   ├── assets/             # Static assets like images, global CSS (app.css as configured in components.json)
│   ├── components/         # Reusable React components
│   │   └── ui/             # Shadcn UI components (copied here via bunx shadcn-ui add)
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utility functions, helpers (e.g., utils.ts for tailwind-merge/clsx)
├── .eslintrc.js            # ESLint configuration for code quality
├── bun.lockb               # Bun's lockfile for deterministic dependencies
├── components.json         # Shadcn UI configuration file
├── package.json            # Project dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.app.json       # TypeScript configuration for the application
├── tsconfig.json           # Root TypeScript configuration, referencing app and node configs
├── tsconfig.node.json      # TypeScript configuration for Node.js environment files (e.g., vite.config.ts)
├── vite.config.ts          # Vite build configuration
└── ...
```

### Extension Points

*   **Shadcn UI Customization**: Modify component styles directly within `src/components/ui` as they are part of your codebase, or update your `tailwind.config.ts` for theme changes. The `components.json` also allows global style changes like `new-york` theme or `baseColor`.
*   **Tailwind CSS Configuration**: Extend Tailwind's default theme, add custom utilities, or configure plugins in `tailwind.config.ts`.
*   **Vite Configuration**: Adjust build processes, add new Vite plugins, or modify development server settings in `vite.config.ts`. The `base` option for deployment paths is a common point of adjustment.
*   **ESLint Configuration**: Modify or extend linting rules in `.eslintrc.js` to enforce specific coding styles or best practices.

---

## 👩‍💻 Development & Contributing

We welcome contributions to this starter template! Follow these guidelines to contribute effectively.

### Local Development Setup

1.  Ensure you have Node.js and Bun installed (see [Prerequisites](#prerequisites)).
2.  Clone the repository:
    ```bash
    git clone https://github.com/asaidimu/uistart.git
    cd uistart
    ```
3.  Install dependencies using Bun:
    ```bash
    bun install
    ```
4.  Start the development server:
    ```bash
    bun run dev
    ```

### Available Scripts

These scripts are defined in `package.json` and are run using `bun run <script-name>`.

*   `bun run ci`: Installs dependencies using `bun install --frozen-lockfile`, typically used in CI/CD environments to ensure exact dependency versions.
*   `bun run dev`: Starts the development server with Vite, enabling hot module replacement for a fast development experience.
*   `bun run build`: Builds the application for production to the `dist` folder. This command also runs `tsc -b` for TypeScript compilation before building the assets.
*   `bun run lint`: Runs ESLint to check for code quality and style violations across your codebase.
*   `bun run preview`: Serves the production build locally for testing purposes, allowing you to verify the optimized output before deployment.

### Testing

Currently, no dedicated testing framework is pre-configured in this template. For comprehensive testing, consider integrating popular solutions like:

*   **[Vitest](https://vitest.dev/)**: A fast unit test framework powered by Vite, ideal for component and utility testing.
*   **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)**: For testing React components in a way that resembles how users interact with them, focusing on user behavior rather than implementation details.
*   **[Playwright](https://playwright.dev/) / [Cypress](https://www.cypress.io/)**: For robust end-to-end testing of your application's full user flows.

### Contributing Guidelines

Contributions are what make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`) - Please follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for clear and consistent commit messages.
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

Please ensure your code adheres to the existing linting rules (`bun run lint`) and passes any local tests before submitting a pull request.

### Issue Reporting

If you encounter any bugs, have feature requests, or suggestions for improvements, please open an issue on the [GitHub Issues page](https://github.com/asaidimu/uistart/issues). Provide as much detail as possible, including steps to reproduce, expected behavior, and screenshots where applicable.

---

## ℹ️ Additional Information

### Troubleshooting

*   **"command not found: bun"**: Ensure Bun is correctly installed and its executable directory is added to your system's PATH environment variable.
*   **Dependency Issues**: If you face issues with dependencies (e.g., corrupted cache or mismatched versions), try clearing Bun's cache and reinstalling:
    ```bash
    bun install --force
    # Or, if you use npm-check-updates for version upgrades:
    # bunx npm-check-updates -u && bun install
    ```
*   **Tailwind CSS Not Applying Styles**:
    *   Double-check your `tailwind.config.ts` for correct `content` paths that cover all your source files.
    *   Ensure `src/assets/app.css` (or your main CSS file) includes the `@tailwind` directives (`@tailwind base;`, `@tailwind components;`, `@tailwind utilities;`).
    *   Verify that `tailwind.config.ts` is correctly imported and passed to the `@tailwindcss/vite` plugin in `vite.config.ts`.
*   **TypeScript Errors in IDE/Editor**: Ensure your IDE or editor (e.g., VS Code) is using the project's locally installed TypeScript version and that all dependencies are installed. Restarting the TypeScript server in your editor often resolves temporary issues.

### FAQ

*   **How do I update Shadcn UI components?**
    You can manually update individual components by running `bunx shadcn-ui@latest add <component-name>` again. This will prompt you to overwrite existing files, effectively updating them.
*   **Can I change the theme or colors of Shadcn UI components?**
    Yes, Shadcn UI integrates tightly with Tailwind CSS custom properties. You can modify the base colors and other theme aspects by adjusting values in your `tailwind.config.ts` and `src/assets/app.css` (specifically the `--<color>-<shade>` CSS variables).
*   **Is React Server Components (RSC) supported in this template?**
    No, this template is configured for client-side rendering. The `components.json` explicitly sets `"rsc": false`, indicating that it's set up for traditional React client applications.

### Changelog & Roadmap

*   **Changelog**: Refer to the [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes (to be created).
*   **Roadmap**:
    *   Integrate a testing framework (e.g., Vitest + React Testing Library) with example tests.
    *   Add examples of common UI patterns and components demonstrating best practices.
    *   Expand comprehensive documentation for each integrated technology within the context of this template.
    *   Explore adding state management solutions (e.g., Zustand, Jotai) as optional integrations.

### License

This project is licensed under the MIT License. See the [LICENSE.md](LICENSE.md) file for full details.

Copyright © 2025 Saidimu

### Acknowledgments

*   [Vite](https://vitejs.dev/)
*   [React](https://react.dev/)
*   [TypeScript](https://www.typescriptlang.org/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [Shadcn UI](https://ui.shadcn.com/)
*   [Radix UI](https://www.radix-ui.com/primitives)
*   [Lucide Icons](https://lucide.dev/icons/)
*   [Bun](https://bun.sh/)
*   [ESLint](https://eslint.org/)
*   [tw-animate-css](https://github.com/asaidimu/tw-animate-css)
