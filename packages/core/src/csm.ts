import { readdir } from 'fs/promises'
import { join, extname, basename, resolve } from 'path'
import { $ } from 'bun'
import { parseArgs } from 'util'
import { createPackage } from './new-package'
import { loadEnv, parseEnv } from './env'

await loadEnv()

const rootDir = resolve(import.meta.dir, '..', '..', '..')
const binDir = join(rootDir, 'bin')

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
    shell: {
      type: 'string',
    },
  },
  strict: true,
  allowPositionals: true,
})

const command = positionals[0]

if (command === 'list') {
  try {
    const files = await readdir(binDir)
    files.forEach((file) => {
      const ext = extname(file)
      const name = basename(file, ext)
      if (['.cmd', '.bat', '.exe', '.ps1'].includes(ext)) {
        if (name !== 'csm') {
          console.log(`- ${name}`)
        }
      }
    })
    console.log('- csm (This manager)')
  } catch (e) {
    console.error('Could not list bin directory:', e)
  }
} else if (command === 'update') {
  console.log('Updating custom-script-manager...')
  try {
    console.log('Running git pull...')
    try {
      await $`git pull`.cwd(rootDir)
    } catch (e: any) {
      console.warn('Skipped git pull, reason:', e.message)
    }

    console.log('Running bun install...')
    await $`bun install`.cwd(rootDir)

    console.log('Running build...')
    await $`bun run build`.cwd(rootDir)

    console.log('Update complete.')
  } catch (error: any) {
    console.error('Update failed:', error.message)
    process.exit(1)
  }
} else if (command === 'new') {
  const packageName = positionals[1]

  if (!packageName) {
    console.error('Please provide a package name.')
    console.error('Usage: csm new <name> [-t <type>] [--url <url>]')
    console.error('       csm new <name> --submodule <url>')
    process.exit(1)
  }

  try {
    await createPackage(packageName, values)
  } catch (e: any) {
    console.error(e.message)
    process.exit(1)
  }
} else if (command === 'load-env') {
  const shell = values.shell || 'cmd'
  const env = await parseEnv()

  if (shell === 'cmd' || shell === 'batch') {
    for (const [key, val] of Object.entries(env)) {
      console.log(`set "${key}=${val}"`)
    }
  } else if (shell === 'powershell' || shell === 'pwsh') {
    for (const [key, val] of Object.entries(env)) {
      const escapedVal = val.replace(/'/g, "''")
      console.log(`$env:${key} = '${escapedVal}'`)
    }
  } else if (shell === 'sh' || shell === 'bash') {
    for (const [key, val] of Object.entries(env)) {
      const escapedVal = val.replace(/'/g, "'\\''")
      console.log(`export ${key}='${escapedVal}'`)
    }
  } else {
    console.error(`Unknown shell: ${shell}`)
    process.exit(1)
  }
} else {
  console.log('Usage: csm <command>')
  console.log('Commands:')
  console.log('  list      List available scripts')
  console.log('  update    Update the repository and rebuild')
  console.log('  new       Create a new package')
  console.log('  load-env  Output shell commands to load env vars')
}
