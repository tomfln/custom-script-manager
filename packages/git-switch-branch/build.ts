import { buildSubmodule, buildRust } from '@csm/core'

await buildSubmodule(() => buildRust('src', 'git-switch-branch'))
