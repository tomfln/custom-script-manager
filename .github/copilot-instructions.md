# AI Guide for Custom Script Manager (CSM)

This document provides instructions for AI assistants (GitHub Copilot, Claude, etc.) on how to work with this repository.

## Project Overview

This is a monorepo for managing custom scripts and tools.
- **`packages/`**: Contains individual script packages. **New commands go here.**
- **`packages/core/`**: The core framework (CLI, build tools). **Do not modify unless explicitly requested.**
- **`bin/`**: Output directory for compiled executables and wrappers. **Do not manually edit files here.**

## Creating a New Command

The preferred way to create a new command is using the CLI.

### 1. Using the CLI (Recommended)

Run the following command in the terminal:

```bash
csm new <package-name> -t <type>
```

Supported types (`-t`):
- `ts` (TypeScript) - *Default*
- `rust` (Rust)
- `ps1` (PowerShell)
- `bat` (Batch)

Example:
```bash
csm new my-tool -t ts
```

### 2. Manual Creation (If CLI is unavailable)

If you must create a package manually, follow this structure in `packages/<package-name>/`:

#### Common Files
- **`package.json`**:
  ```json
  {
    "name": "<package-name>",
    "version": "1.0.0",
    "scripts": {
      "build": "bun build.ts"
    }
  }
  ```
- **`build.ts`**: Defines how the package is built.

#### TypeScript Package (`ts`)
- `index.ts`: The entry point.
- `build.ts`:
  ```typescript
  import { buildTs } from '@csm/core'
  await buildTs('index.ts', '<command-name>')
  ```

#### Rust Package (`rust`)
- `src/Cargo.toml`: Standard Cargo manifest.
- `src/src/main.rs`: Rust entry point.
- `build.ts`:
  ```typescript
  import { buildRust } from '@csm/core'
  await buildRust('src', '<command-name>')
  ```

#### PowerShell Package (`ps1`)
- `<command-name>.ps1`: The script.
- `build.ts`:
  ```typescript
  import { buildPs1 } from '@csm/core'
  await buildPs1('<command-name>.ps1')
  ```

## Development Rules

1.  **Scope**: Only modify files within `packages/<your-package>/`.
2.  **Core**: Do not touch `packages/core` unless you are fixing the build system itself.
3.  **Build**: Always verify your changes by running `bun build.ts` inside your package directory.
4.  **Dependencies**:
    -   For **TypeScript**: `bun add <package>` in your package folder.
    -   For **Rust**: Edit `src/Cargo.toml`.
5.  **Environment Variables**:
    -   Add variables to `.env` in the root.
    -   **TS**: `import { loadEnv } from '@csm/core/src/env'; const env = loadEnv();`
    -   **Rust**: Use `std::env::var`.
    -   **PowerShell/Batch**: Variables from `.env` are automatically available in the session if run via `csm`.

## Troubleshooting

-   If `csm` command is not found, ensure `bin/` is in the system PATH.
-   If imports from `@csm/core` fail, check `tsconfig.json` paths (handled automatically by Turbo/Bun usually).
