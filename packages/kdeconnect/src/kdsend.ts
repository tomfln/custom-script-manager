import { runKdeConnect, resolveDeviceArgs } from './utils'

const args = Bun.argv.slice(2)

const input = await Bun.stdin.text()

if (!input) {
  console.error('No input provided via pipe.')
  process.exit(1)
}

const proc = Bun.spawn(['powershell', '-NoProfile', '-Command', 'Set-Clipboard -Value $Input'], {
  stdin: 'pipe',
  stdout: 'ignore',
  stderr: 'inherit',
})

const writer = proc.stdin
writer.write(input)
writer.flush()
writer.end()
await proc.exited

const commandArgs = [...args, '--send-clipboard']
const finalArgs = resolveDeviceArgs(commandArgs)
await runKdeConnect(finalArgs)
