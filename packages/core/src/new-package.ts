import { mkdir, writeFile, readFile } from 'fs/promises'
import { join, resolve } from 'path'
import { parseArgs } from 'util'
import { $ } from 'bun'
import { input, select, confirm } from '@inquirer/prompts'

export type PackageType = 'ts' | 'rust' | 'ps1' | 'bat' | 'submodule'

export const PACKAGE_TYPES: { value: PackageType; name: string; description: string }[] = [
  { value: 'ts', name: 'TypeScript', description: 'A TypeScript command compiled with Bun' },
  { value: 'rust', name: 'Rust', description: 'A Rust command compiled with Cargo' },
  { value: 'ps1', name: 'PowerShell', description: 'A PowerShell script' },
  { value: 'bat', name: 'Batch', description: 'A Windows batch script' },
  { value: 'submodule', name: 'Git Submodule', description: 'Import an existing git repository as a submodule' },
]

export interface CreatePackageResult {
  packageDir: string
  startFile: string
  type: PackageType
}

export async function createPackage(
  packageName: string,
  options: { type?: string; submodule?: string }
): Promise<CreatePackageResult> {
  let type = options.type || 'ts'
  let url: string | undefined

  if (options.submodule) {
    type = 'submodule'
    url = options.submodule
  }

  // Always resolve paths relative to the CSM repo root, not cwd
  const rootDir = resolve(import.meta.dir, '..', '..', '..')
  const packagesDir = join(rootDir, 'packages')
  const packageDir = join(packagesDir, packageName)
  const templatesDir = resolve(import.meta.dir, '..', 'templates')

  await mkdir(packageDir, { recursive: true })

  const packageJson = {
    name: packageName,
    version: '1.0.0',
    scripts: {
      build: 'bun build.ts',
    },
  }

  await writeFile(join(packageDir, 'package.json'), JSON.stringify(packageJson, null, 2))
  console.log(`\x1b[34mCreated ${join(packageDir, 'package.json')}\x1b[0m`)

  async function applyTemplate(templateName: string, destName: string) {
    const templatePath = join(templatesDir, templateName)
    let content = await readFile(templatePath, 'utf-8')
    content = content.replaceAll('{{packageName}}', packageName!)
    const destPath = join(packageDir, destName)
    await writeFile(destPath, content)
    if (destName === 'build.ts') {
      console.log(`\x1b[34mCreated ${destPath}\x1b[0m`)
    } else {
      console.log(`\x1b[32mCreated ${destPath}\x1b[0m`)
    }
  }

  let startFile = ''

  if (type === 'bat') {
    await applyTemplate('bat.file.bat', `${packageName}.bat`)
    await applyTemplate('bat.build.ts', 'build.ts')
    startFile = `${packageName}.bat`
  } else if (type === 'rust') {
    // Initialize cargo project in package root (cargo creates its own 'src' directory)
    await $`cargo init --bin --name ${packageName}`.cwd(packageDir)

    await applyTemplate('rust.build.ts', 'build.ts')
    startFile = `src/main.rs`
    console.log(`\x1b[32mCreated ${join(packageDir, 'src', 'main.rs')}\x1b[0m`)
  } else if (type === 'submodule') {
    if (!url) {
      throw new Error('Error: --submodule <url> is required for submodule type.')
    }

    console.log(`Adding submodule from ${url}...`)
    const submodulePath = `packages/${packageName}/src`
    await $`git submodule add ${url} ${submodulePath}`.cwd(rootDir)

    await applyTemplate('submodule.build.ts', 'build.ts')
    startFile = `build.ts`
  } else if (['ps1', 'powershell', 'pwsh'].includes(type!)) {
    await applyTemplate('ps1.file.ps1', `${packageName}.ps1`)
    await applyTemplate('ps1.build.ts', 'build.ts')
    startFile = `${packageName}.ps1`
  } else if (['ts', 'typescript'].includes(type!)) {
    await applyTemplate('ts.file.ts', 'index.ts')
    await applyTemplate('ts.build.ts', 'build.ts')
    startFile = `index.ts`
  } else {
    throw new Error(`Unknown type: ${type}`)
  }

  console.log(`\nAdded new script '${packageName}'`)
  const startFilePath = join(packageDir, startFile)
  const relativePath = resolve(startFilePath).replace(resolve(rootDir) + '\\', '').replace(resolve(rootDir) + '/', '')
  console.log(`Start by editing ${relativePath}`)

  return {
    packageDir,
    startFile,
    type: type as PackageType,
  }
}

export async function runInteractiveWizard(existingName?: string): Promise<{
  packageName: string
  type: PackageType
  submoduleUrl?: string
}> {
  let packageName = existingName
  
  if (!packageName) {
    packageName = await input({
      message: 'Package name:',
      validate: (value) => {
        if (!value.trim()) return 'Package name is required'
        if (!/^[a-z0-9-]+$/i.test(value)) return 'Package name must be alphanumeric with dashes only'
        return true
      },
    })
  }

  const type = await select<PackageType>({
    message: 'Select package type:',
    choices: PACKAGE_TYPES.map((t) => ({
      value: t.value,
      name: t.name,
      description: t.description,
    })),
  })

  let submoduleUrl: string | undefined
  if (type === 'submodule') {
    submoduleUrl = await input({
      message: 'Git repository URL:',
      validate: (value) => {
        if (!value.trim()) return 'URL is required for submodules'
        return true
      },
    })
  }

  return { packageName, type, submoduleUrl }
}

export async function promptOpenEditor(result: CreatePackageResult): Promise<void> {
  const openEditor = await confirm({
    message: 'Open the created file in an editor?',
    default: true,
  })

  if (!openEditor) return

  const editor = await select<'vscode' | 'neovim' | 'none'>({
    message: 'Select editor:',
    choices: [
      { value: 'vscode', name: 'VS Code', description: 'Open folder and select file' },
      { value: 'neovim', name: 'Neovim', description: 'Open file directly' },
      { value: 'none', name: 'Cancel', description: 'Do not open' },
    ],
  })

  if (editor === 'none') return

  const filePath = join(result.packageDir, result.startFile)

  if (editor === 'vscode') {
    // Open folder in VS Code and go to the file
    await $`code ${result.packageDir} --goto ${filePath}`
  } else if (editor === 'neovim') {
    // Open file in Neovim
    const nvim = Bun.spawn(['nvim', filePath], {
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    })
    await nvim.exited
  }
}

if (import.meta.main) {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      type: {
        type: 'string',
        short: 't',
        default: 'ts',
      },
      submodule: {
        type: 'string',
      },
    },
    strict: true,
    allowPositionals: true,
  })

  let packageName = positionals[0]
  let options = values

  // Check if type was explicitly provided
  const explicitlyTyped = Bun.argv.some(arg => arg === '-t' || arg.startsWith('--type') || arg.startsWith('--submodule'))

  // Run wizard if no package name OR if type was not explicitly provided
  if (!packageName || !explicitlyTyped) {
    try {
      const wizard = await runInteractiveWizard(packageName)
      packageName = wizard.packageName
      options = {
        type: wizard.type,
        submodule: wizard.submoduleUrl,
      }
    } catch (e: any) {
      // User cancelled (Ctrl+C)
      if (e.name === 'ExitPromptError') {
        process.exit(0)
      }
      throw e
    }
  }

  try {
    const result = await createPackage(packageName, options)
    // If user explicitly provided -t or --submodule, skip the editor prompt
    if (!explicitlyTyped) {
      await promptOpenEditor(result)
    }
  } catch (e: any) {
    console.error(e.message)
    process.exit(1)
  }
}
