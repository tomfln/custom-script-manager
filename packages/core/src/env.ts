import { exists, readFile } from 'fs/promises'
import { join, resolve } from 'path'

export async function parseEnv(): Promise<Record<string, string>> {
  const rootDir = resolve(import.meta.dir, '..', '..', '..')
  const envPath = join(rootDir, '.env')
  const env: Record<string, string> = {}

  if (await exists(envPath)) {
    const content = await readFile(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim()
        let val = trimmed.substring(eqIdx + 1).trim()
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.substring(1, val.length - 1)
        }
        env[key] = val
      }
    }
  }
  return env
}

export async function loadEnv() {
  const env = await parseEnv()
  Object.assign(process.env, env)
}
