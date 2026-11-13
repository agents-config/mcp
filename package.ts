import { resolve } from 'node:path'
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'

const root = process.cwd()
const source = resolve(root, 'package.json')
const target = resolve(root, 'dist/package.json')
const pkgInfo = JSON.parse(readFileSync(source, 'utf8'))

// 1. Remove useless fields for production package
delete pkgInfo.scripts
delete pkgInfo.devDependencies

// 2. Adjust file paths, as the package root will now be the dist/ folder
pkgInfo.main = 'index.js'

// 3. Save the modified package.json inside the dist/ folder
writeFileSync(target, JSON.stringify(pkgInfo, null, 2))

// 4. Copy important metadata files to NPM
copyFileSync(resolve(root, 'LICENSE'), resolve(root, 'dist/LICENSE'))
copyFileSync(resolve(root, 'README.md'), resolve(root, 'dist/README.md'))
copyFileSync(resolve(root, 'CHANGELOG.md'), resolve(root, 'dist/CHANGELOG.md'))

console.log('✅ Minimal package.json and metadata prepared in dist/ folder')
