import { describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import {
  loadState,
  writeState,
  getStatePath,
  getLegacyStatePath,
  seedAgentNames,
  pruneAgentNames,
  emptyState,
  type SyncState,
} from '$/src/core/state'
import { createSandbox } from '$/tests/helpers/sandbox'

describe('state', () => {
  it('getStatePath returns the new lock path for project and global scope', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      expect(getStatePath('project', ctx)).toBe(
        `${ctx.cwd}/.agents/mcp-lock.json`,
      )
      expect(getStatePath('global', ctx)).toBe(
        `${ctx.homeDir}/.agents/mcp-lock.json`,
      )
    } finally {
      cleanup()
    }
  })

  it('getLegacyStatePath returns the legacy path for project and global scope', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      expect(getLegacyStatePath('project', ctx)).toBe(
        `${ctx.cwd}/.agents/.mcp-sync-state.json`,
      )
      expect(getLegacyStatePath('global', ctx)).toBe(
        `${ctx.homeDir}/.agents/.mcp-sync-state.json`,
      )
    } finally {
      cleanup()
    }
  })

  it('loadState returns empty state for missing file, no warning', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toEqual([])
      expect(result.notices).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('loadState returns empty state for global scope too', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const result = loadState('global', ctx)
      expect(result.state).toEqual(emptyState('global'))
      expect(result.state.scope).toBe('global')
      expect(result.warnings).toEqual([])
      expect(result.notices).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('writeState round-trips atomically', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const state: SyncState = {
        version: 1,
        scope: 'project',
        targets: ['claude-code', 'opencode'],
        agents: {
          'claude-code': {
            path: `${ctx.cwd}/.mcp.json`,
            names: ['github', 'postgres'],
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
        managedPlugins: [],
      }
      writeState('project', ctx, state)

      const loaded = loadState('project', ctx)
      expect(loaded.state.targets).toEqual(['claude-code', 'opencode'])
      expect(loaded.state.agents['claude-code']!.names).toEqual([
        'github',
        'postgres',
      ])
      expect(loaded.warnings).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('writeState produces byte-identical output for identical state', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const state: SyncState = {
        version: 1,
        scope: 'project',
        targets: ['claude-code'],
        agents: {},
        managedPlugins: [],
      }
      writeState('project', ctx, state)
      const first = readFileSync(`${ctx.cwd}/.agents/mcp-lock.json`, 'utf8')
      writeState('project', ctx, state)
      const second = readFileSync(`${ctx.cwd}/.agents/mcp-lock.json`, 'utf8')
      expect(second).toBe(first)
    } finally {
      cleanup()
    }
  })

  it('loadState treats corrupt file as empty with warning', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/mcp-lock.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(path, '{ not valid json', 'utf8')

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('Corrupt')
      expect(result.warnings[0]).toContain(path)
      expect(result.notices).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('loadState treats unknown version as empty with warning', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/mcp-lock.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(
        path,
        JSON.stringify({
          version: 99,
          scope: 'project',
          targets: [],
          agents: {},
        }),
        'utf8',
      )

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('Invalid sync state')
    } finally {
      cleanup()
    }
  })

  it('loadState rejects invalid agent id in targets', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/mcp-lock.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(
        path,
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: ['not-an-agent'],
          agents: {},
        }),
        'utf8',
      )

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings.length).toBeGreaterThan(0)
    } finally {
      cleanup()
    }
  })

  it('loadState treats missing agents key as empty state', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/mcp-lock.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(
        path,
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: [],
        }),
        'utf8',
      )

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.state.agents).toEqual({})
      expect(result.warnings).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('loadState rejects unknown agent key in agents as corrupt state', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/mcp-lock.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(
        path,
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: [],
          agents: {
            'not-an-agent': {
              path: `${ctx.cwd}/.mcp.json`,
              names: ['github'],
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          },
        }),
        'utf8',
      )

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings.length).toBeGreaterThan(0)
    } finally {
      cleanup()
    }
  })

  it('seedAgentNames creates and merges agent records', () => {
    const state: SyncState = emptyState('project')
    const next = seedAgentNames(
      state,
      'claude-code',
      ['github'],
      '/abs/.mcp.json',
    )
    expect(next.agents['claude-code']!.names).toEqual(['github'])

    const merged = seedAgentNames(
      next,
      'claude-code',
      ['postgres'],
      '/abs/.mcp.json',
    )
    expect(merged.agents['claude-code']!.names).toEqual(['github', 'postgres'])

    // No duplicates.
    const again = seedAgentNames(
      merged,
      'claude-code',
      ['github'],
      '/abs/.mcp.json',
    )
    expect(again.agents['claude-code']!.names).toEqual(['github', 'postgres'])
  })

  it('seedAgentNames does not refresh updatedAt when nothing changed', () => {
    const state: SyncState = {
      ...emptyState('project'),
      agents: {
        'claude-code': {
          path: '/abs/.mcp.json',
          names: ['github'],
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    }
    const again = seedAgentNames(
      state,
      'claude-code',
      ['github'],
      '/abs/.mcp.json',
    )
    expect(again.agents['claude-code']!.updatedAt).toBe(
      '2026-01-01T00:00:00.000Z',
    )
  })

  it('pruneAgentNames removes names no longer present', () => {
    const state: SyncState = {
      ...emptyState('project'),
      agents: {
        'claude-code': {
          path: '/abs/.mcp.json',
          names: ['github', 'postgres', 'linear'],
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    }
    const pruned = pruneAgentNames(state, 'claude-code', ['github', 'linear'])
    expect(pruned.agents['claude-code']!.names).toEqual(['github', 'linear'])
  })

  it('pruneAgentNames leaves state unchanged for unknown agent', () => {
    const state: SyncState = emptyState('project')
    const pruned = pruneAgentNames(state, 'zed', ['github'])
    expect(pruned).toEqual(state)
  })

  /* --- Legacy migration / precedence --- */

  it('loads a legacy-only file with a single notice naming both paths', () => {
    const { ctx, cleanup } = createSandbox()
    const lockPath = `${ctx.cwd}/.agents/mcp-lock.json`
    const legacyPath = `${ctx.cwd}/.agents/.mcp-sync-state.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(
        legacyPath,
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: ['claude-code'],
          agents: {
            'claude-code': {
              path: `${ctx.cwd}/.mcp.json`,
              names: ['github'],
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          },
          managedPlugins: [],
        }),
        'utf8',
      )

      const result = loadState('project', ctx)
      expect(result.state.targets).toEqual(['claude-code'])
      expect(result.state.agents['claude-code']!.names).toEqual(['github'])
      expect(result.warnings).toEqual([])
      expect(result.notices).toHaveLength(1)
      expect(result.notices[0]).toContain(legacyPath)
      expect(result.notices[0]).toContain(lockPath)
    } finally {
      cleanup()
    }
  })

  it('when both files exist the new lock wins and the legacy is ignored silently', () => {
    const { ctx, cleanup } = createSandbox()
    const lockPath = `${ctx.cwd}/.agents/mcp-lock.json`
    const legacyPath = `${ctx.cwd}/.agents/.mcp-sync-state.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(
        lockPath,
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: ['opencode'],
          agents: {},
          managedPlugins: [],
        }),
        'utf8',
      )
      writeFileSync(
        legacyPath,
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: ['claude-code'],
          agents: {
            'claude-code': {
              path: `${ctx.cwd}/.mcp.json`,
              names: ['github'],
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          },
          managedPlugins: [],
        }),
        'utf8',
      )

      const result = loadState('project', ctx)
      expect(result.state.targets).toEqual(['opencode'])
      expect(result.state.agents).toEqual({})
      expect(result.warnings).toEqual([])
      expect(result.notices).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('a corrupt new lock does NOT fall back to a valid legacy file', () => {
    const { ctx, cleanup } = createSandbox()
    const lockPath = `${ctx.cwd}/.agents/mcp-lock.json`
    const legacyPath = `${ctx.cwd}/.agents/.mcp-sync-state.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(lockPath, '{ not valid json', 'utf8')
      writeFileSync(
        legacyPath,
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: ['claude-code'],
          agents: {},
          managedPlugins: [],
        }),
        'utf8',
      )

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain(lockPath)
      expect(result.notices).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('a corrupt legacy file warns and yields empty state with no notices', () => {
    const { ctx, cleanup } = createSandbox()
    const legacyPath = `${ctx.cwd}/.agents/.mcp-sync-state.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(legacyPath, '{ not valid json', 'utf8')

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain(legacyPath)
      expect(result.notices).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('missing both files yields empty state with no warnings and no notices', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toEqual([])
      expect(result.notices).toEqual([])
    } finally {
      cleanup()
    }
  })

  /* --- .gitignore policy (writeState never touches .gitignore) --- */

  it("writeState('project') writes only mcp-lock.json and never creates .gitignore", () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const state: SyncState = {
        version: 1,
        scope: 'project',
        targets: ['claude-code'],
        agents: {},
        managedPlugins: [],
      }
      writeState('project', ctx, state)

      expect(existsSync(`${ctx.cwd}/.agents/mcp-lock.json`)).toBe(true)
      expect(existsSync(`${ctx.cwd}/.gitignore`)).toBe(false)
      expect(existsSync(`${ctx.cwd}/.agents/.mcp-sync-state.json`)).toBe(false)
    } finally {
      cleanup()
    }
  })

  it("writeState('project') leaves a pre-existing legacy file untouched", () => {
    const { ctx, cleanup } = createSandbox()
    const legacyPath = `${ctx.cwd}/.agents/.mcp-sync-state.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      const legacyContent = JSON.stringify({
        version: 1,
        scope: 'project',
        targets: ['claude-code'],
        agents: {},
        managedPlugins: [],
      })
      writeFileSync(legacyPath, legacyContent, 'utf8')

      const state: SyncState = {
        version: 1,
        scope: 'project',
        targets: ['opencode'],
        agents: {},
        managedPlugins: [],
      }
      writeState('project', ctx, state)

      expect(readFileSync(legacyPath, 'utf8')).toBe(legacyContent)
      expect(existsSync(`${ctx.cwd}/.agents/mcp-lock.json`)).toBe(true)
      expect(existsSync(`${ctx.cwd}/.gitignore`)).toBe(false)
    } finally {
      cleanup()
    }
  })

  it("writeState('global') does not touch <cwd>/.gitignore", async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const state: SyncState = {
        version: 1,
        scope: 'global',
        targets: ['claude-code'],
        agents: {},
        managedPlugins: [],
      }
      writeState('global', ctx, state)

      expect(
        readFileSync(`${ctx.homeDir}/.agents/mcp-lock.json`, 'utf8'),
      ).toContain('"scope": "global"')

      // global scope must not create or modify <cwd>/.gitignore
      expect(existsSync(`${ctx.cwd}/.gitignore`)).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('writeState leaves a pre-existing <cwd>/.gitignore byte-identical', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      mkdirSync(ctx.cwd, { recursive: true })
      const original = '# existing\n.env\n# custom\n'
      writeFileSync(`${ctx.cwd}/.gitignore`, original, 'utf8')

      const state: SyncState = {
        version: 1,
        scope: 'project',
        targets: ['claude-code'],
        agents: {},
        managedPlugins: [],
      }
      writeState('project', ctx, state)

      expect(readFileSync(`${ctx.cwd}/.gitignore`, 'utf8')).toBe(original)
    } finally {
      cleanup()
    }
  })
})
