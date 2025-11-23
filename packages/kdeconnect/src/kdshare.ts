import { runKdeConnect, resolveDeviceArgs } from './utils'
import { resolve } from 'path'
import { exists } from 'fs/promises'

const args = Bun.argv.slice(2)
const deviceArgs: string[] = []
let targetFile: string | undefined

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (['-n', '--name', '-d', '--device'].includes(arg)) {
    deviceArgs.push(arg)
    if (i + 1 < args.length) {
      deviceArgs.push(args[i + 1])
      i++
    }
  } else if (arg.startsWith('-')) {
    deviceArgs.push(arg)
  } else {
    if (!targetFile) {
      targetFile = arg
    } else {
      console.warn(`Ignoring extra argument: ${arg}`)
    }
  }
}

if (!targetFile) {
  console.error('Usage: kdshare <file> [options]')
  process.exit(1)
}

const filePath = resolve(process.cwd(), targetFile)

if (!(await exists(filePath))) {
  console.error(`File not found: ${filePath}`)
  process.exit(1)
}

const commandArgs = [...deviceArgs, '--share', filePath]

const finalArgs = resolveDeviceArgs(commandArgs)
await runKdeConnect(finalArgs)
