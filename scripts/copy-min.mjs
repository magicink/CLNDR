import fs from 'node:fs'
import path from 'node:path'

const src = path.resolve('dist', 'clndr.min.js')
const srcMap = path.resolve('dist', 'clndr.min.js.map')
const dst = path.resolve('clndr.min.js')
const dstMap = path.resolve('clndr.min.js.map')

function copyIfExists(from, to) {
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, to)
    console.log(`[copy-min] Copied ${path.basename(from)} -> ${to}`)
  }
}

copyIfExists(src, dst)
copyIfExists(srcMap, dstMap)
