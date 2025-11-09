import { mkdirSync, copyFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const src = resolve('src/css/clndr.css')
const dest = resolve('dist/clndr.css')

try {
  mkdirSync(dirname(dest), { recursive: true })
  copyFileSync(src, dest)
  console.log(`[assets] Copied CSS: ${src} -> ${dest}`)
} catch (err) {
  console.error('[assets] Failed to copy CSS', err)
  process.exit(1)
}
