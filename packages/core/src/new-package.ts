import { mkdir, writeFile, readFile } from 'fs/promises'
import { join, resolve } from 'path'
import { parseArgs } from 'util'
import { $ } from 'bun'

export async function createPackage(
  packageName: string,
  options: { type?: string; url?: string; submodule?: string }
) {
  let type = options.type || 'ts'
  let url = options.url

  if (options.submodule) {
    type = 'submodule'
    url = options.submodule
  }

  const packagesDir = join(process.cwd(), 'packages')
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
    const srcDir = join(packageDir, 'src')
    await mkdir(srcDir, { recursive: true })

    // Initialize cargo project
    await $`cargo init --bin --name ${packageName}`.cwd(srcDir)

    await applyTemplate('rust.build.ts', 'build.ts')
    startFile = `src/main.rs`
    console.log(`\x1b[32mCreated ${join(srcDir, 'main.rs')}\x1b[0m`)
  } else if (type === 'submodule') {
    if (!url) {
      throw new Error('Error: --url or --submodule is required for submodule type.')
    }

    console.log(`Adding submodule from ${url}...`)
    const submodulePath = `packages/${packageName}/src`
    await $`git submodule add ${url} ${submodulePath}`.cwd(process.cwd())

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
  const cwd = process.cwd()
  const relativePath = resolve(startFilePath).replace(resolve(cwd) + '\\', '')
  console.log(`Start by editing ${relativePath}`)
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
      url: {
        type: 'string',
      },
      submodule: {
        type: 'string',
      },
    },
    strict: true,
    allowPositionals: true,
  })

  const packageName = positionals[0]
  if (!packageName) {
    console.error('Please provide a package name.')
    console.error('Usage: bun new <name> [-t <type>] [--url <url>]')
    console.error('       bun new <name> --submodule <url>')
    process.exit(1)
  }

  try {
    await createPackage(packageName, values)
  } catch (e: any) {
    console.error(e.message)
    process.exit(1)
  }
}
