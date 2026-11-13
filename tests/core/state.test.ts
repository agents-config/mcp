import { describe, expect, it } from 'vitest'
import {
  loadState,
  writeState,
  seedAgentNames,
  pruneAgentNames,
  EMPTY_STATE,
  type SyncState,
} from '$/src/core/state'
import { createSandbox } from '$/tests/helpers/sandbox'

describe('state', () => {
  it('loadState returns empty state for missing file, no warning', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const result = loadState('project', ctx)
      expect(result.state).toEqual(EMPTY_STATE)
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

  it('loadState treats corrupt file as empty with warning', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/.mcp-sync-state.json`
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('node:fs').mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      require('node:fs').writeFileSync(path, '{ not valid json', 'utf8')

      const result = loadState('project', ctx)
      expect(result.state).toEqual(EMPTY_STATE)
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
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('node:fs').mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      require('node:fs').writeFileSync(
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
      expect(result.state).toEqual(EMPTY_STATE)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('version')
    } finally {
      cleanup()
    }
  })

  it('seedAgentNames creates and merges agent records', () => {
    const state: SyncState = { ...EMPTY_STATE, scope: 'project' }
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

  it('pruneAgentNames removes names no longer present', () => {
    const state: SyncState = {
      ...EMPTY_STATE,
      scope: 'project',
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
    const state: SyncState = { ...EMPTY_STATE, scope: 'project' }
    const pruned = pruneAgentNames(state, 'zed', ['github'])
    expect(pruned).toEqual(state)
  })
})
