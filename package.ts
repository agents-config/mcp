/**
 * `package.ts` — dist/ packaging script (§15).
 *
 * Creates the publishable `dist/` package from the root manifest:
 *   - create `dist/` if missing;
 *   - derive `dist/package.json` from root manifest, removing `scripts`,
 *     `devDependencies`, and `dependencies` (everything is bundled);
 *   - expose exactly one binary: `bin: { "agents-mcp": "./index.js" }`,
 *     with `main`/`exports` pointing at `./index.js`, explicit `files`,
 *     and `engines.node: ">=22"`;
 *   - verify that `spec/mcp.schema.json` `$id` ends with
 *     `v<version>/mcp.schema.json` and fail otherwise;
 *   - copy `LICENSE` and `README.md`; copy `CHANGELOG.md` when present
 *     (maintained by the changelog-management skill) and warn instead of
 *     failing when absent;
 *   - write the manifest with a trailing newline.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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

// 1. Verify that spec/mcp.schema.json $id ends with v<version>/mcp.schema.json
const schemaPath = resolve(root, 'spec', 'mcp.schema.json')
const schemaDoc = JSON.parse(readFileSync(schemaPath, 'utf8'))
const expectedSchemaIdSuffix = `v${version}/mcp.schema.json`
if (!schemaDoc.$id?.endsWith(expectedSchemaIdSuffix)) {
  console.error(
    `❌ Error: spec/mcp.schema.json $id "${schemaDoc.$id}" does not end with "${expectedSchemaIdSuffix}"`,
  )
  process.exit(1)
}

// 2. Create dist/ if missing
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true })
}

// 3. Write dist/package.json with trailing newline
writeFileSync(
  resolve(distDir, 'package.json'),
  JSON.stringify(distPkg, null, 2) + '\n',
)

// 4. Copy metadata files
const metadataFiles = ['LICENSE', 'README.md']
for (const file of metadataFiles) {
  const src = resolve(root, file)
  const dest = resolve(distDir, file)
  if (existsSync(src)) {
    copyFileSync(src, dest)
  } else {
    console.warn(`⚠️  Warning: ${file} not found, skipping copy to dist/`)
  }
}

// 5. Copy CHANGELOG.md when present, warn instead of failing when absent
const changelogSrc = resolve(root, 'CHANGELOG.md')
const changelogDest = resolve(distDir, 'CHANGELOG.md')
if (existsSync(changelogSrc)) {
  copyFileSync(changelogSrc, changelogDest)
} else {
  console.warn('⚠️  Warning: CHANGELOG.md not found, skipping copy to dist/')
}

console.log('✅ dist/package.json and metadata prepared in dist/ folder')
