import { exists } from 'fs/promises'
import { join } from 'path'
import { loadEnv } from '@csm/core/src/env'

await loadEnv()

export async function getKdeConnectPath(): Promise<string> {
  if (process.platform !== 'win32') {
    return 'kdeconnect-cli'
  }

  if (process.env.KDECONNECT_PATH) {
    const customPath = join(process.env.KDECONNECT_PATH, 'kdeconnect-cli.exe')
    if (await exists(customPath)) {
      return customPath
    }
    if (await exists(process.env.KDECONNECT_PATH) && process.env.KDECONNECT_PATH.endsWith('.exe')) {
        return process.env.KDECONNECT_PATH
    }
  }

  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files'
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'

  const candidates = [
    join(programFiles, 'KDE Connect', 'bin', 'kdeconnect-cli.exe'),
    join(programFiles, 'KDE Connect', 'kdeconnect-cli.exe'),
    join(programFilesX86, 'KDE Connect', 'bin', 'kdeconnect-cli.exe'),
    join(programFilesX86, 'KDE Connect', 'kdeconnect-cli.exe'),
  ]

  for (const path of candidates) {
    if (await exists(path)) {
      return path
    }
  }

  throw new Error(
    'Could not find kdeconnect-cli.exe. Please set KDECONNECT_PATH in your .env file to the directory containing the executable.'
  )
}

export async function runKdeConnect(args: string[]) {
  const exePath = await getKdeConnectPath()
  
  const proc = Bun.spawn([exePath, ...args], {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  })

  const exitCode = await proc.exited
  if (exitCode !== 0) {
    process.exit(exitCode)
  }
}

export function resolveDeviceArgs(args: string[]): string[] {
  const hasDevice = args.includes('-d') || args.includes('--device') || args.includes('-n') || args.includes('--name')
  
  if (!hasDevice && process.env.KDE_DEFAULT_DEVICE) {
    const dev = process.env.KDE_DEFAULT_DEVICE
    const isId = /^[0-9a-fA-F]{32}$/.test(dev) || /^[0-9a-fA-F_]{16,}$/.test(dev)
    
    const flag = isId ? '-d' : '-n'
    
    return [flag, dev, ...args]
  }
  
  return args
}
