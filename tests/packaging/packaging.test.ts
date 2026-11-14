import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const root = process.cwd()
const distDir = resolve(root, 'dist')

describe('packaging', () => {
  it('dist/package.json has exactly one bin, no dependencies/scripts, engines.node >= 22', () => {
    const distPkg = JSON.parse(
      readFileSync(resolve(distDir, 'package.json'), 'utf8'),
    )

    // Exactly one binary
    expect(Object.keys(distPkg.bin)).toEqual(['agents-mcp'])
    expect(distPkg.bin['agents-mcp']).toBe('./index.js')

    // No dependencies, scripts, devDependencies
    expect(distPkg.dependencies).toBeUndefined()
    expect(distPkg.devDependencies).toBeUndefined()
    expect(distPkg.scripts).toBeUndefined()

    // main/exports point to ./index.js
    expect(distPkg.main).toBe('./index.js')
    expect(distPkg.exports['.']).toBe('./index.js')

    // engines.node >= 22
    expect(distPkg.engines.node).toBe('>=22')

    // Explicit files
    expect(distPkg.files).toEqual(['index.js'])
  })

  it('spec/mcp.schema.json $id matches package.json version', () => {
    const rootPkg = JSON.parse(
      readFileSync(resolve(root, 'package.json'), 'utf8'),
    )
    const schemaDoc = JSON.parse(
      readFileSync(resolve(root, 'spec', 'mcp.schema.json'), 'utf8'),
    )
    const expectedSuffix = `v${rootPkg.version}/mcp.schema.json`
    expect(schemaDoc.$id.endsWith(expectedSuffix)).toBe(true)
  })

  it('dist/ contains expected files and index.js starts with shebang', () => {
    const actualFiles = readdirSync(distDir).sort()
    expect(actualFiles).toEqual(
      ['LICENSE', 'README.md', 'index.js', 'package.json'].sort(),
    )

    const indexJs = readFileSync(resolve(distDir, 'index.js'), 'utf8')
    expect(indexJs.startsWith('#!/usr/bin/env node')).toBe(true)
  })

  it('dist:package script runs without errors', () => {
    expect(() => {
      execFileSync('npx', ['tsx', 'package.ts'], {
        cwd: root,
        stdio: 'pipe',
      })
    }).not.toThrow()
  })
})
