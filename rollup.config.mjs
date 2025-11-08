import path from 'node:path'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import dts from 'rollup-plugin-dts'

const isProd = process.env.NODE_ENV === 'production'

// External libraries we never bundle
const external = ['jquery', 'luxon']

// UMD global names for externals
const globals = {
  jquery: 'jQuery',
  luxon: 'luxon'
}

/** @type {import('rollup').RollupOptions[]} */
export default [
  // JS bundles (ESM + UMD)
  {
    input: 'src/ts/index.ts',
    external,
    output: [
      {
        file: 'dist/clndr.esm.js',
        format: 'es',
        sourcemap: true
      },
      {
        file: 'dist/clndr.umd.js',
        format: 'umd',
        name: 'clndr',
        globals,
        exports: 'named',
        sourcemap: true
      }
    ],
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      // Explicitly set outputToFilesystem to silence plugin info message
      typescript({
        tsconfig: path.resolve('tsconfig.json'),
        outputToFilesystem: true
      }),
      ...(isProd ? [terser()] : [])
    ],
    onwarn(warning, warn) {
      // Silence circular dependency warnings from node internals, etc.
      if (warning.code === 'CIRCULAR_DEPENDENCY') return
      warn(warning)
    }
  },

  // Type declaration bundle
  {
    input: 'types/clndr.d.ts',
    output: [{ file: 'dist/clndr.d.ts', format: 'es' }],
    plugins: [dts()],
    onwarn(warning, warn) {
      // The dts bundle may report an EMPTY_BUNDLE when input contains only ambient types
      if (warning.code === 'EMPTY_BUNDLE') return
      warn(warning)
    }
  }
]
