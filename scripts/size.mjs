import { statSync } from 'node:fs'

const files = ['dist/clndr.esm.js', 'dist/clndr.umd.js']

let ok = true
for (const f of files) {
  try {
    const s = statSync(f).size
    const kb = (s / 1024).toFixed(1)
    console.log(`${f}: ${kb} KB`)
  } catch (err) {
    ok = false
    console.error(`Missing file: ${f}`)
  }
}

process.exit(ok ? 0 : 1)
