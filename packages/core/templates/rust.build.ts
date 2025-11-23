import { buildSubmodule, rustBuild } from '@csm/core'

await buildSubmodule(() => rustBuild('src', '{{packageName}}'))
