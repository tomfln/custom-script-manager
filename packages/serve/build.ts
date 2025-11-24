import { buildSubmodule, buildRust } from '@csm/core'
import { $ } from 'bun'

await buildSubmodule(async () => {
  await $`cd src/app && pnpm i && pnpm build`

  return buildRust('src', 'serve')
}, 'Serve files via HTTP with a nice UI')
