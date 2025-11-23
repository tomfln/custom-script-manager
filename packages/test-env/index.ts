import { loadEnv } from '@csm/core/src/env'

await loadEnv()
console.log('Env var TEST_VAR:', process.env.TEST_VAR)
