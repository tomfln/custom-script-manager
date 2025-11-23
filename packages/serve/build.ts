import { buildSubmodule, buildRust } from '@csm/core'
import { join } from 'path'

await buildSubmodule(async () => {
  const appDir = join(process.cwd(), 'src', 'app')
  
  console.log('Installing frontend dependencies...')
  const install = Bun.spawn(['pnpm', 'install'], {
    cwd: appDir,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  })
  if ((await install.exited) !== 0) {
    throw new Error('Frontend install failed')
  }

  console.log('Building frontend...')
  const build = Bun.spawn(['pnpm', 'build'], {
    cwd: appDir,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  })
  if ((await build.exited) !== 0) {
    throw new Error('Frontend build failed')
  }

  return buildRust('src', 'serve')
})
