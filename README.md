# Custom Script Manager (CSM)

A powerful, modular script manager built with [Turborepo](https://turbo.build/) and [Bun](https://bun.sh/). CSM allows you to manage, build, and execute scripts written in TypeScript, Rust, PowerShell, Batch, and more, all from a unified environment.

## Features

*   **Multi-Language Support**: First-class support for TypeScript, Rust, PowerShell, and Batch scripts.
*   **Unified Environment**: Global `.env` support across all script types.
*   **Automatic Wrappers**: Automatically generates `.cmd` wrappers for seamless execution on Windows.
*   **Submodule Integration**: Easily wrap and build external tools via Git submodules.
*   **Self-Updating**: Built-in `csm update` command to keep your tools fresh.

## Quick Start

1.  **Prerequisites**:
    *   Install [Bun](https://bun.sh).
    *   (Optional) Install [Rust](https://www.rust-lang.org/) if you plan to use Rust scripts.

2.  **Installation**:
    ```bash
    git clone <repository-url> custom-script-manager
    cd custom-script-manager
    bun install
    ```
    *This will install dependencies and build all scripts automatically.*

3.  **Environment Setup**:
    *   **Configuration**: A `.env` file will be automatically created from `.env.example` if it doesn't exist. **Please edit `.env` to configure your environment variables (e.g., KDE Connect device ID).**
    *   **PATH**: Add the `bin` directory to your system PATH to access your commands globally.
        *   *Windows (PowerShell)*: `$env:PATH += ";$PWD\bin"` (Add to your profile for persistence).


## Usage

Once installed, use the `csm` command to manage your scripts:

*   `csm list`: List all available commands.
*   `csm new <name> -t <type>`: Create a new script package.
*   `csm update`: Update the repository and rebuild all scripts.
*   `csm load-env`: Helper to load environment variables (used internally).

### Creating New Scripts

Generate new script packages instantly:

```bash
# Create a TypeScript script (default)
csm new my-script

# Create a Rust tool
csm new fast-tool -t rust

# Create a PowerShell script
csm new automation -t ps1

# Wrap an external repo
csm new external-tool --submodule https://github.com/user/repo
```

## Architecture

*   **`packages/core`**: The heart of CSM. Contains the CLI, build logic, and environment handlers.
*   **`packages/*`**: Your custom script packages. Each package defines its own build process via `build.ts`.
*   **`bin/`**: The output directory. All executables and wrappers are placed here.

## Environment Variables

CSM provides a unified way to handle environment variables.
*   Define variables in the root `.env` file.
*   **TypeScript**: `import { loadEnv } from '@csm/core/src/env'`
*   **PowerShell**: Automatically loaded via the `Invoke-CsmEnv` helper.
*   **Batch**: Automatically loaded via `csm-load-env.bat`.

## License

MIT
