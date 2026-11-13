import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  dts: false,
  clean: true,
  sourcemap: false,
  splitting: false,
  treeshake: true,
  banner: { js: '#!/usr/bin/env node' },
})
