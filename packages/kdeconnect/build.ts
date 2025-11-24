import { buildTs } from '@csm/core'

await buildTs('src/kdc.ts', 'kdc', 'KDE Connect CLI wrapper')
await buildTs('src/kdsend.ts', 'kdsend', 'Send files to KDE Connect device')
await buildTs('src/kdshare.ts', 'kdshare', 'Share text/links to KDE Connect device')

