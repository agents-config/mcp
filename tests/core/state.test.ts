import { describe, expect, it } from 'vitest'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import {
  loadState,
  writeState,
  seedAgentNames,
  pruneAgentNames,
  emptyState,
  type SyncState,
} from '$/src/core/state'
import { createSandbox } from '$/tests/helpers/sandbox'

describe('state', () => {
  it('loadState returns empty state for missing file, no warning', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toEqual([])
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
      const first = readFileSync(
        `${ctx.cwd}/.agents/.mcp-sync-state.json`,
        'utf8',
      )
      writeState('project', ctx, state)
      const second = readFileSync(
        `${ctx.cwd}/.agents/.mcp-sync-state.json`,
        'utf8',
      )
      expect(second).toBe(first)
    } finally {
      cleanup()
    }
  })

  it('loadState treats corrupt file as empty with warning', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/.mcp-sync-state.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(path, '{ not valid json', 'utf8')

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('Corrupt')
    } finally {
      cleanup()
    }
  })

  it('loadState treats unknown version as empty with warning', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/.mcp-sync-state.json`
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
    const path = `${ctx.cwd}/.agents/.mcp-sync-state.json`
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
    const path = `${ctx.cwd}/.agents/.mcp-sync-state.json`
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
    const path = `${ctx.cwd}/.agents/.mcp-sync-state.json`
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
})
