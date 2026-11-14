import { describe, expect, it } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import { ensureIgnored } from '$/src/core/gitignore'
import { createSandbox } from '$/tests/helpers/sandbox'

describe('gitignore.ensureIgnored', () => {
  it('creates .gitignore with the managed block when missing', () => {
    const { dir, cleanup } = createSandbox()
    try {
      const result = ensureIgnored(dir, [
        '.env',
        '.agents/.mcp-sync-state.json',
      ])
      expect(result.added).toEqual(['.env', '.agents/.mcp-sync-state.json'])
      const content = readFileSync(`${dir}/.gitignore`, 'utf8')
      expect(content).toContain('# agents-mcp local (managed)')
      expect(content).toContain('.env')
      expect(content).toContain('.agents/.mcp-sync-state.json')
      expect(content).toContain('# end agents-mcp local (managed)')
    } finally {
      cleanup()
    }
  })

  it('does not duplicate entries already covered', () => {
    const { dir, cleanup } = createSandbox()
    try {
      writeFileSync(
        `${dir}/.gitignore`,
        '# existing\n.env\n.node_modules\n',
        'utf8',
      )
      const result = ensureIgnored(dir, [
        '.env',
        '.agents/.mcp-sync-state.json',
      ])
      // `.env` already covered; only the state file is added.
      expect(result.added).toEqual(['.agents/.mcp-sync-state.json'])
      const content = readFileSync(`${dir}/.gitignore`, 'utf8')
      const managedBlocks = content.match(/# agents-mcp local \(managed\)/g)
      expect(managedBlocks).toHaveLength(1)
    } finally {
      cleanup()
    }
  })

  it('returns empty added when everything is already covered', () => {
    const { dir, cleanup } = createSandbox()
    try {
      writeFileSync(
        `${dir}/.gitignore`,
        '# agents-mcp local (managed)\n.env\n.agents/.mcp-sync-state.json\n# end agents-mcp local (managed)\n',
        'utf8',
      )
      const result = ensureIgnored(dir, [
        '.env',
        '.agents/.mcp-sync-state.json',
      ])
      expect(result.added).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('never touches agent configuration files', () => {
    const { dir, cleanup } = createSandbox()
    try {
      writeFileSync(`${dir}/.mcp.json`, '{}', 'utf8')
      writeFileSync(`${dir}/opencode.json`, '{}', 'utf8')
      ensureIgnored(dir, ['.env'])
      expect(readFileSync(`${dir}/.mcp.json`, 'utf8')).toBe('{}')
      expect(readFileSync(`${dir}/opencode.json`, 'utf8')).toBe('{}')
    } finally {
      cleanup()
    }
  })
})
