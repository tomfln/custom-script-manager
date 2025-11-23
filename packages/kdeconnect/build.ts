import { buildTs } from '@csm/core'

await buildTs('src/kdc.ts', 'kdc')
await buildTs('src/kdsend.ts', 'kdsend')
await buildTs('src/kdshare.ts', 'kdshare')

