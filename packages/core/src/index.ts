import { mkdir, copyFile, writeFile, exists, readdir } from 'fs/promises'
import { join, basename, extname, resolve } from 'path'
import { $ } from 'bun'

/**
 * Ensures the bin directory exists.
 * @returns The absolute path to the bin directory.
 */
export async function ensureBin(): Promise<string> {
  const binDir = resolve(process.cwd(), '..', '..', 'bin')
  if (!(await exists(binDir))) {
    await mkdir(binDir, { recursive: true })
  }
  return binDir
}

/**
 * Builds a wrapper for a Batch script.
 * @param scriptName - The name of the batch script file (e.g., 'myscript.bat').
 */
export async function buildBat(scriptName: string) {
  const binDir = await ensureBin()
  const name = basename(scriptName, '.bat')
  const cmdPath = join(binDir, `${name}.cmd`)

  console.log(`Creating launcher for ${scriptName} as ${name}...`)

  const pkgDirName = basename(process.cwd())
  const relativeScriptPath = `..\\packages\\${pkgDirName}\\${scriptName}`

  const cmdContent = `@echo off
call "%~dp0\\${relativeScriptPath}" %*
`
  await writeFile(cmdPath, cmdContent)
  console.log(`Built ${name}`)
}

/**
 * Builds a wrapper for a PowerShell script.
 * @param scriptName - The name of the PowerShell script file (e.g., 'myscript.ps1').
 */
export async function buildPs1(scriptName: string) {
  const binDir = await ensureBin()
  const name = basename(scriptName, '.ps1')
  const cmdPath = join(binDir, `${name}.cmd`)

  console.log(`Creating launcher for ${scriptName} as ${name}...`)

  const pkgDirName = basename(process.cwd())
  const relativeScriptPath = `..\\packages\\${pkgDirName}\\${scriptName}`

  const cmdContent = `@echo off
pwsh -NoProfile -ExecutionPolicy Bypass -Command "$Input | & '%~dp0\\${relativeScriptPath}' %*"
`
  await writeFile(cmdPath, cmdContent)
  console.log(`Built ${name}`)
}

/**
 * Builds a wrapper for a TypeScript script (executed via Bun).
 * @param scriptName - The name of the TypeScript script file (e.g., 'index.ts').
 * @param commandName - Optional custom name for the command (defaults to script filename without extension).
 */
export async function buildTs(scriptName: string, commandName?: string) {
  const binDir = await ensureBin()
  const name = commandName || basename(scriptName, '.ts')
  const cmdPath = join(binDir, `${name}.cmd`)

  console.log(`Creating launcher for ${scriptName} as ${name}...`)

  const pkgDirName = basename(process.cwd())
  const relativeScriptPath = `..\\packages\\${pkgDirName}\\${scriptName}`

  const cmdContent = `@echo off
bun "%~dp0\\${relativeScriptPath}" %*
`
  await writeFile(cmdPath, cmdContent)
  console.log(`Built ${name}`)
}

/**
 * Builds a submodule by running a builder function and copying the artifact.
 * @param builderFn - A function that builds the submodule and returns the path to the artifact.
 */
export async function buildSubmodule(builderFn: () => Promise<string>) {
  const binDir = await ensureBin()

  const srcDir = resolve(process.cwd(), 'src')
  if (await exists(srcDir)) {
    const files = await readdir(srcDir)
    if (files.length === 0) {
      console.log("Submodule directory 'src' is empty. Initializing submodule...")
      try {
        await $`git submodule update --init --recursive`.cwd(process.cwd())
      } catch (e) {
        throw new Error('Failed to initialize submodule.')
      }
    }
  }

  console.log('Building submodule...')
  const artifactPath = await builderFn()

  if (!(await exists(artifactPath))) {
    throw new Error(`Artifact not found at ${artifactPath}`)
  }

  const artifactName = basename(artifactPath)
  const destPath = join(binDir, artifactName)

  console.log(`Copying ${artifactName} to bin...`)
  await copyFile(artifactPath, destPath)
  console.log(`Built ${artifactName}`)
}

/**
 * Builds a Rust project in a submodule.
 * @param submoduleDir - The directory of the submodule (relative to package root).
 * @param binaryName - The name of the binary to look for in target/release.
 * @returns The path to the built binary.
 */
export async function buildRust(submoduleDir: string, binaryName?: string): Promise<string> {
  const cwd = resolve(process.cwd(), submoduleDir)

  if (!(await exists(join(cwd, 'Cargo.toml')))) {
    console.warn(`No Cargo.toml found in ${cwd}. Skipping build.`)
    throw new Error(`No Cargo.toml found in ${cwd}`)
  }

  console.log(`Running cargo build in ${cwd}...`)
  try {
    await $`cargo build --release`.cwd(cwd)
  } catch (e) {
    throw new Error(`Cargo build failed`)
  }

  let name = binaryName
  if (!name) {
    name = basename(process.cwd())
  }

  const targetDir = join(cwd, 'target', 'release')

  if (name) {
    const exe = process.platform === 'win32' ? `${name}.exe` : name
    return join(targetDir, exe)
  } else {
    throw new Error('binaryName is required for buildRust (auto-detection not implemented)')
  }
}

/**
 * Copies shell helper scripts (csm.psm1, csm-load-env.bat) to the bin directory.
 */
export async function copyShellHelpers() {
  const binDir = await ensureBin()
  const shellDir = join(import.meta.dir, 'shell')

  const files = ['csm.psm1', 'csm-env.bat']
  for (const file of files) {
    const src = join(shellDir, file)
    let destName = file
    if (file === 'csm-env.bat') destName = 'csm-load-env.bat'

    const dest = join(binDir, destName)
    if (await exists(src)) {
      console.log(`Copying ${file} to bin/${destName}...`)
      await copyFile(src, dest)
    } else {
      console.warn(`Shell helper ${src} not found.`)
    }
  }
}
