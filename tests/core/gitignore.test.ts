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

  it('repeated calls keep all entries between header and footer, idempotent', () => {
    const { dir, cleanup } = createSandbox()
    try {
      const first = ensureIgnored(dir, ['.agents/.mcp-sync-state.json'])
      const second = ensureIgnored(dir, ['.env'])
      expect(first.added).toEqual(['.agents/.mcp-sync-state.json'])
      expect(second.added).toEqual(['.env'])

      const content = readFileSync(`${dir}/.gitignore`, 'utf8')
      const header = '# agents-mcp local (managed)'
      const footer = '# end agents-mcp local (managed)'
      expect(content.split(header).length - 1).toBe(1)
      expect(content.split(footer).length - 1).toBe(1)

      const headerIdx = content.indexOf(header)
      const footerIdx = content.indexOf(footer)
      expect(headerIdx).toBeGreaterThanOrEqual(0)
      expect(footerIdx).toBeGreaterThan(headerIdx)
      expect(content.slice(headerIdx, footerIdx)).toContain(
        '.agents/.mcp-sync-state.json',
      )
      expect(content.slice(headerIdx, footerIdx)).toContain('.env')

      // No accumulated blank lines: exactly one trailing newline.
      expect(content.endsWith('\n')).toBe(true)
      expect(content.endsWith('\n\n')).toBe(false)

      // Idempotent: a third call adds nothing.
      const third = ensureIgnored(dir, ['.agents/.mcp-sync-state.json', '.env'])
      expect(third.added).toEqual([])
      const again = readFileSync(`${dir}/.gitignore`, 'utf8')
      expect(again).toBe(content)
    } finally {
      cleanup()
    }
  })

  it('inserts new entries immediately before the footer when block exists', () => {
    const { dir, cleanup } = createSandbox()
    try {
      writeFileSync(
        `${dir}/.gitignore`,
        '# existing\n# agents-mcp local (managed)\n.env\n# end agents-mcp local (managed)\n',
        'utf8',
      )
      const result = ensureIgnored(dir, ['.agents/.mcp-sync-state.json'])
      expect(result.added).toEqual(['.agents/.mcp-sync-state.json'])

      const content = readFileSync(`${dir}/.gitignore`, 'utf8')
      const lines = content.split(/\r?\n/)
      const footerIdx = lines.findIndex(
        (l) => l.trim() === '# end agents-mcp local (managed)',
      )
      expect(lines[footerIdx - 1]).toBe('.agents/.mcp-sync-state.json')
      expect(lines[footerIdx - 2]).toBe('.env')
    } finally {
      cleanup()
    }
  })

  it('closes a corrupted header-only block by appending entries and footer', () => {
    const { dir, cleanup } = createSandbox()
    try {
      writeFileSync(
        `${dir}/.gitignore`,
        '# existing\n# agents-mcp local (managed)\n',
        'utf8',
      )
      const result = ensureIgnored(dir, [
        '.env',
        '.agents/.mcp-sync-state.json',
      ])
      expect(result.added).toEqual(['.env', '.agents/.mcp-sync-state.json'])

      const content = readFileSync(`${dir}/.gitignore`, 'utf8')
      expect(content).toContain('# end agents-mcp local (managed)')
      const headers = content.match(/# agents-mcp local \(managed\)/g)
      expect(headers).toHaveLength(1)
    } finally {
      cleanup()
    }
  })
})
