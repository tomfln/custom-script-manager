import { rm, mkdir, exists, readdir, lstat } from 'fs/promises'
import { join } from 'path'

const binPath = join(process.cwd(), 'bin')

async function deleteRecursive(path: string) {
  try {
    const stats = await lstat(path)
    if (stats.isDirectory()) {
      const files = await readdir(path)
      for (const file of files) {
        await deleteRecursive(join(path, file))
      }
      try {
        await rm(path, { recursive: true, force: true })
      } catch (e: any) {
        if (e.code !== 'ENOTEMPTY' && e.code !== 'EPERM' && e.code !== 'EBUSY') {
          console.warn(`Failed to remove dir ${path}: ${e.message}`)
        }
      }
    } else {
      try {
        await rm(path, { force: true })
      } catch (e: any) {
        if (e.code === 'EBUSY' || e.code === 'EPERM') {
          console.warn(`Skipping locked file: ${path}`)
        } else {
          throw e
        }
      }
    }
  } catch (e: any) {
    if (e.code === 'ENOENT') return
    console.warn(`Error cleaning ${path}: ${e.message}`)
  }
}

if (await exists(binPath)) {
  console.log('Cleaning bin directory...')
  const files = await readdir(binPath)
  for (const file of files) {
    await deleteRecursive(join(binPath, file))
  }
} else {
  await mkdir(binPath, { recursive: true })
}

console.log('Bin directory cleaned.')
