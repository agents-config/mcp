import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const distDir = resolve(root, 'dist')

const rootPkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const version = rootPkg.version

const distPkg: Record<string, unknown> = {
  name: rootPkg.name,
  version,
  description: rootPkg.description,
  homepage: rootPkg.homepage,
  bugs: rootPkg.bugs,
  repository: rootPkg.repository,
  license: rootPkg.license,
  author: rootPkg.author,
  type: 'module',
  engines: { node: '>=22' },
  main: './index.js',
  exports: {
    '.': './index.js',
  },
  bin: {
    'agents-mcp': './index.js',
  },
  files: ['index.js'],
}

// 1. Create dist/ if missing
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true })
}

// 2. Write dist/package.json with trailing newline
writeFileSync(
  resolve(distDir, 'package.json'),
  JSON.stringify(distPkg, null, 2) + '\n',
)

// 3. Copy metadata files
const metadataFiles = ['LICENSE', 'README.md', 'CHANGELOG.md']
for (const file of metadataFiles) {
  const src = resolve(root, file)
  const dest = resolve(distDir, file)
  if (existsSync(src)) {
    copyFileSync(src, dest)
  } else {
    console.warn(`⚠️  Warning: ${file} not found, skipping copy to dist/`)
  }
}

console.log('✅ dist/package.json and metadata prepared in dist/ folder')
