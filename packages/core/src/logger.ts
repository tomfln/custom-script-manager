export const log = {
  info: (msg: string) => console.log(`\x1b[36m[CSM]\x1b[0m ${msg}`),
  success: (msg: string) => console.log(`\x1b[32m[CSM]\x1b[0m ${msg}`),
  warn: (msg: string) => console.warn(`\x1b[33m[CSM]\x1b[0m ${msg}`),
  error: (msg: string) => console.error(`\x1b[31m[CSM]\x1b[0m ${msg}`),
}
