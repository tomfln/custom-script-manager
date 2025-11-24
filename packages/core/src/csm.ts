import { readdir, readFile, writeFile, exists, rename, mkdir } from 'fs/promises'
import { join, extname, basename, resolve } from 'path'
import { $ } from 'bun'
import { parseArgs } from 'util'
import { createPackage } from './new-package'
import { loadEnv, parseEnv } from './env'

await loadEnv()

const rootDir = resolve(import.meta.dir, '..', '..', '..')
const binDir = join(rootDir, 'bin')
const disabledDir = join(binDir, '.disabled')
const configFile = join(rootDir, 'csm.config.json')
const commandsFile = join(binDir, 'commands.json')

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

async function getDisabledCommands(): Promise<string[]> {
  if (await exists(configFile)) {
    try {
      const config = JSON.parse(await readFile(configFile, 'utf-8'))
      return config.disabled || []
    } catch {}
  }
  return []
}

async function setDisabledCommands(disabled: string[]) {
  let config: any = {}
  if (await exists(configFile)) {
    try {
      config = JSON.parse(await readFile(configFile, 'utf-8'))
    } catch {}
  }
  config.disabled = disabled
  await writeFile(configFile, JSON.stringify(config, null, 2))
}

async function getCommandDescriptions(): Promise<Record<string, string>> {
  if (await exists(commandsFile)) {
    try {
      return JSON.parse(await readFile(commandsFile, 'utf-8'))
    } catch {}
  }
  return {}
}

if (command === 'list') {
  try {
    const descriptions = await getCommandDescriptions()
    const disabled = await getDisabledCommands()
    
    const enabledFiles = await readdir(binDir).catch(() => [])
    const disabledFiles = await readdir(disabledDir).catch(() => [])
    
    const allCommands = new Set<string>()
    
    const processFiles = (files: string[]) => {
      files.forEach(file => {
        const ext = extname(file)
        const name = basename(file, ext)
        if (name === 'csm' || name === 'commands' || name.startsWith('.')) return
        
        if (process.platform === 'win32') {
          if (['.cmd', '.bat', '.exe', '.ps1'].includes(ext)) {
            allCommands.add(name)
          }
        } else {
          if (!['.cmd', '.bat', '.ps1', '.json'].includes(ext)) {
             allCommands.add(name)
          }
        }
      })
    }
    
    processFiles(enabledFiles)
    processFiles(disabledFiles)
    
    const sorted = Array.from(allCommands).sort((a, b) => {
      const aDisabled = disabled.includes(a)
      const bDisabled = disabled.includes(b)
      if (aDisabled === bDisabled) return a.localeCompare(b)
      return aDisabled ? 1 : -1
    })
    
    console.log('Available commands:')
    for (const cmd of sorted) {
      const isDisabled = disabled.includes(cmd)
      const desc = descriptions[cmd] || ''
      const status = isDisabled ? '\x1b[90m(disabled)\x1b[0m' : ''
      const nameColor = isDisabled ? '\x1b[90m' : '\x1b[36m'
      const reset = '\x1b[0m'
      
      console.log(`  ${nameColor}${cmd.padEnd(20)}${reset} ${desc} ${status}`)
    }
    console.log(`  \x1b[36mcsm${' '.repeat(17)}\x1b[0m This manager`)
  } catch (e) {
    console.error('Could not list bin directory:', e)
  }
} else if (command === 'enable') {
  const cmds = positionals.slice(1)
  if (cmds.length === 0) {
    console.error('Usage: csm enable <command> [command...]')
    process.exit(1)
  }
  
  const disabled = await getDisabledCommands()
  const newDisabled = disabled.filter(c => !cmds.includes(c))
  await setDisabledCommands(newDisabled)

  if (await exists(disabledDir)) {
    const files = await readdir(disabledDir)
    for (const cmd of cmds) {
      let found = false
      for (const file of files) {
        const ext = extname(file)
        const name = basename(file, ext)
        if (name === cmd) {
           await rename(join(disabledDir, file), join(binDir, file))
           found = true
        }
      }
      if (found) console.log(`Enabled ${cmd}`)
      else console.warn(`Command ${cmd} not found in disabled list (or files missing)`)
    }
  }
} else if (command === 'disable') {
  const cmds = positionals.slice(1)
  if (cmds.length === 0) {
    console.error('Usage: csm disable <command> [command...]')
    process.exit(1)
  }

  const disabled = await getDisabledCommands()
  const newDisabled = [...new Set([...disabled, ...cmds])]
  await setDisabledCommands(newDisabled)

  await mkdir(disabledDir, { recursive: true })
  
  const files = await readdir(binDir)
  for (const cmd of cmds) {
    if (cmd === 'csm') {
      console.warn('Cannot disable csm')
      continue
    }
    let found = false
    for (const file of files) {
      const ext = extname(file)
      const name = basename(file, ext)
      if (name === cmd) {
        await rename(join(binDir, file), join(disabledDir, file))
        found = true
      }
    }
    if (found) console.log(`Disabled ${cmd}`)
    else console.warn(`Command ${cmd} not found`)
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
    const installProc = Bun.spawn(['bun', 'install'], {
      cwd: rootDir,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    })
    if ((await installProc.exited) !== 0) {
      throw new Error('bun install & build failed')
    }

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
  console.log('  enable    Enable a command')
  console.log('  disable   Disable a command')
  console.log('  load-env  Output shell commands to load env vars')
}
