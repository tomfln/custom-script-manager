import { copyFile, mkdir, exists } from 'fs/promises'
import { join } from 'path'
import { copyShellHelpers } from './src/index'

const srcDir = join(import.meta.dir, 'src')
const binDir = join(import.meta.dir, '..', '..', 'bin')

if (!(await exists(binDir))) {
  await mkdir(binDir, { recursive: true })
}

await copyFile(join(srcDir, 'csm.cmd'), join(binDir, 'csm.cmd'))

await copyShellHelpers()

console.log('csm-core built successfully.')
