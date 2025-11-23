import { runKdeConnect, resolveDeviceArgs } from './utils'

const args = Bun.argv.slice(2)

await runKdeConnect(args)
