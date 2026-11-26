import { describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import {
  loadState,
  writeState,
  getStatePath,
  seedAgentNames,
  pruneAgentNames,
  emptyState,
  serializeState,
  type SyncState,
  type SyncStateAgent,
} from '$/src/core/state'
import { createSandbox } from '$/tests/helpers/sandbox'

function lockPath(cwd: string): string {
  return `${cwd}/.agents/mcp-lock.json`
}

function writeLock(cwd: string, content: string): void {
  mkdirSync(`${cwd}/.agents`, { recursive: true })
  writeFileSync(lockPath(cwd), content, 'utf8')
}

function makeState(overrides: Partial<SyncState> = {}): SyncState {
  return { ...emptyState('project'), ...overrides }
}

function agent(
  path: string,
  names: string[] = [],
  updatedAt = '2026-01-01T00:00:00.000Z',
): SyncStateAgent {
  return { path, names, updatedAt }
}

function v2Lock(agents: Record<string, SyncStateAgent> = {}): string {
  return JSON.stringify({
    version: 2,
    scope: 'project',
    targets: [],
    agents,
    managedPlugins: [],
  })
}

describe('state', () => {
  it('getStatePath returns the lock path for project and global scope', () => {
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

  it('emptyState emits version 2 for both scopes', () => {
    expect(emptyState('project').version).toBe(2)
    expect(emptyState('global').version).toBe(2)
  })

  it('loadState returns empty state for a missing lock, no warning', () => {
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

  it('writeState normalizes project absolute paths and round-trips', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const state = makeState({
        targets: ['claude-code', 'cursor', 'opencode', 'antigravity'],
        agents: {
          'claude-code': agent(`${ctx.cwd}/.mcp.json`, ['github', 'postgres']),
          cursor: agent(`${ctx.cwd}/.cursor/mcp.json`, ['github']),
          antigravity: agent(`${ctx.cwd}/.agents/plugins`, ['github']),
        },
      })
      writeState('project', ctx, state)

      const raw = readFileSync(lockPath(ctx.cwd), 'utf8')
      expect(raw).not.toContain(ctx.cwd)
      expect(raw).not.toContain('\\')

      const parsed = JSON.parse(raw)
      expect(parsed.version).toBe(2)
      expect(parsed.agents['claude-code'].path).toBe('.mcp.json')
      expect(parsed.agents.cursor.path).toBe('.cursor/mcp.json')
      expect(parsed.agents.antigravity.path).toBe('.agents/plugins')

      const loaded = loadState('project', ctx)
      expect(loaded.warnings).toEqual([])
      expect(loaded.state.agents['claude-code']!.path).toBe('.mcp.json')
      expect(loaded.state.agents['claude-code']!.names).toEqual([
        'github',
        'postgres',
      ])
      expect(loaded.state.targets).toEqual([
        'claude-code',
        'cursor',
        'opencode',
        'antigravity',
      ])
    } finally {
      cleanup()
    }
  })

  it('writeState normalizes global absolute paths to ~/', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const state = makeState({
        scope: 'global',
        targets: ['claude-code', 'vscode'],
        agents: {
          'claude-code': agent(`${ctx.homeDir}/.claude.json`, ['github']),
          vscode: agent(`${ctx.homeDir}/.config/Code/User/mcp.json`, [
            'github',
          ]),
        },
      })
      writeState('global', ctx, state)

      const raw = readFileSync(`${ctx.homeDir}/.agents/mcp-lock.json`, 'utf8')
      expect(raw).not.toContain(ctx.homeDir)
      const parsed = JSON.parse(raw)
      expect(parsed.agents['claude-code'].path).toBe('~/.claude.json')
      expect(parsed.agents.vscode.path).toBe('~/.config/Code/User/mcp.json')
    } finally {
      cleanup()
    }
  })

  it('serializeState is deterministic regardless of insertion order', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const first = makeState({
        targets: ['vscode', 'cursor', 'vscode'],
        agents: {
          cursor: agent('.cursor/mcp.json', ['z', 'a', 'z']),
          'claude-code': agent('.mcp.json', ['postgres', 'github']),
        },
        managedPlugins: ['zeta', 'alpha', 'zeta'],
      })
      const second = makeState({
        targets: ['vscode', 'cursor'],
        agents: {
          'claude-code': agent('.mcp.json', ['github', 'postgres']),
          cursor: agent('.cursor/mcp.json', ['a', 'z']),
        },
        managedPlugins: ['alpha', 'zeta'],
      })

      const content = serializeState('project', ctx, first)
      expect(serializeState('project', ctx, second)).toBe(content)
      expect(content.endsWith('\n')).toBe(true)

      const document = JSON.parse(content)
      expect(Object.keys(document)).toEqual([
        'version',
        'scope',
        'targets',
        'agents',
        'managedPlugins',
      ])
      expect(document.targets).toEqual(['vscode', 'cursor'])
      expect(Object.keys(document.agents)).toEqual(['claude-code', 'cursor'])
      expect(document.agents['claude-code'].names).toEqual([
        'github',
        'postgres',
      ])
      expect(document.agents.cursor.names).toEqual(['a', 'z'])
      expect(document.managedPlugins).toEqual(['alpha', 'zeta'])
    } finally {
      cleanup()
    }
  })

  it('writeState produces byte-identical output for identical state', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const state = makeState({
        targets: ['claude-code'],
        agents: { 'claude-code': agent('.mcp.json', ['github']) },
      })
      writeState('project', ctx, state)
      const first = readFileSync(lockPath(ctx.cwd), 'utf8')
      writeState('project', ctx, state)
      const second = readFileSync(lockPath(ctx.cwd), 'utf8')
      expect(second).toBe(first)
    } finally {
      cleanup()
    }
  })

  it('writeState rejects a scope mismatch', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      expect(() =>
        writeState('project', ctx, makeState({ scope: 'global' })),
      ).toThrow('global')
    } finally {
      cleanup()
    }
  })

  it('writeState validates the serialized document before writing', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const state = makeState({
        agents: {
          'claude-code': agent('.mcp.json', [], 'not-a-date'),
        },
      })
      expect(() => writeState('project', ctx, state)).toThrow()
      expect(existsSync(lockPath(ctx.cwd))).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('loadState treats corrupt JSON as empty with warning', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeLock(ctx.cwd, '{ not valid json')

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain('Corrupt')
      expect(result.warnings[0]).toContain(lockPath(ctx.cwd))
    } finally {
      cleanup()
    }
  })

  it('loadState rejects a version 1 lock with an actionable warning', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeLock(
        ctx.cwd,
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: ['claude-code'],
          agents: {
            'claude-code': agent('.mcp.json', ['github']),
          },
          managedPlugins: [],
        }),
      )

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain(lockPath(ctx.cwd))
      expect(result.warnings[0]).toContain('expected version 2')
      expect(result.warnings[0]).toContain('sync')
    } finally {
      cleanup()
    }
  })

  it('loadState rejects another unsupported version with a warning', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeLock(
        ctx.cwd,
        JSON.stringify({
          version: 99,
          scope: 'project',
          targets: [],
          agents: {},
        }),
      )

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain(lockPath(ctx.cwd))
      expect(result.warnings[0]).toContain('version 99')
      expect(result.warnings[0]).toContain('expected version 2')
    } finally {
      cleanup()
    }
  })

  it('loadState names the version field when it is missing', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeLock(
        ctx.cwd,
        JSON.stringify({
          scope: 'project',
          targets: [],
          agents: {},
        }),
      )

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain('version')
      expect(result.warnings[0]).toContain(lockPath(ctx.cwd))
    } finally {
      cleanup()
    }
  })

  it('loadState rejects invalid agent ids in targets', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeLock(
        ctx.cwd,
        JSON.stringify({
          version: 2,
          scope: 'project',
          targets: ['not-an-agent'],
          agents: {},
        }),
      )

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain('targets')
    } finally {
      cleanup()
    }
  })

  it('loadState treats a missing agents key as empty state', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeLock(
        ctx.cwd,
        JSON.stringify({
          version: 2,
          scope: 'project',
          targets: [],
        }),
      )

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.state.agents).toEqual({})
      expect(result.warnings).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('loadState rejects an unknown agent key in agents', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeLock(
        ctx.cwd,
        v2Lock({
          'not-an-agent': agent('.mcp.json', ['github']),
        }),
      )

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toHaveLength(1)
    } finally {
      cleanup()
    }
  })

  const invalidPaths = [
    '/abs/.mcp.json',
    'C:\\Users\\alice\\.mcp.json',
    'C:/Users/alice/.mcp.json',
    '\\\\server\\share\\x',
    '//server/share/x',
    'a\\b',
    '../.mcp.json',
    '.mcp.json/../x',
  ]

  it.each(invalidPaths)(
    'loadState rejects non-portable path %j and does not partially load',
    (invalidPath) => {
      const { ctx, cleanup } = createSandbox()
      try {
        writeLock(
          ctx.cwd,
          v2Lock({ 'claude-code': agent(invalidPath, ['github']) }),
        )

        const result = loadState('project', ctx)
        expect(result.state).toEqual(emptyState('project'))
        expect(result.warnings).toHaveLength(1)
        expect(result.warnings[0]).toContain('path')
        expect(result.warnings[0]).toContain('portable')
      } finally {
        cleanup()
      }
    },
  )

  it('loadState accepts ~/ and env-root portable paths', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeLock(
        ctx.cwd,
        v2Lock({
          'claude-code': agent('~/.claude.json', ['github']),
          cursor: agent('$XDG_CONFIG_HOME/cursor/mcp.json', ['github']),
          vscode: agent('$APPDATA/Code/User/mcp.json', ['github']),
        }),
      )

      const result = loadState('project', ctx)
      expect(result.warnings).toEqual([])
      expect(result.state.agents['claude-code']!.path).toBe('~/.claude.json')
      expect(result.state.agents.cursor!.path).toBe(
        '$XDG_CONFIG_HOME/cursor/mcp.json',
      )
      expect(result.state.agents.vscode!.path).toBe(
        '$APPDATA/Code/User/mcp.json',
      )
    } finally {
      cleanup()
    }
  })

  it('a legacy-only file is ignored and left untouched', () => {
    const { ctx, cleanup } = createSandbox()
    const legacyPath = `${ctx.cwd}/.agents/.mcp-sync-state.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      const legacyContent = JSON.stringify({
        version: 1,
        scope: 'project',
        targets: ['claude-code'],
        agents: {
          'claude-code': agent('.mcp.json', ['github']),
        },
        managedPlugins: [],
      })
      writeFileSync(legacyPath, legacyContent, 'utf8')

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toEqual([])
      expect(readFileSync(legacyPath, 'utf8')).toBe(legacyContent)
      expect(existsSync(lockPath(ctx.cwd))).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('a corrupt legacy file does not produce a warning or state', () => {
    const { ctx, cleanup } = createSandbox()
    const legacyPath = `${ctx.cwd}/.agents/.mcp-sync-state.json`
    try {
      mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      writeFileSync(legacyPath, '{ not valid json', 'utf8')

      const result = loadState('project', ctx)
      expect(result.state).toEqual(emptyState('project'))
      expect(result.warnings).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('seedAgentNames creates and merges agent records with a portable path', () => {
    const state: SyncState = emptyState('project')
    const next = seedAgentNames(state, 'claude-code', ['github'], '.mcp.json')
    expect(next.agents['claude-code']!.path).toBe('.mcp.json')
    expect(next.agents['claude-code']!.names).toEqual(['github'])

    const merged = seedAgentNames(
      next,
      'claude-code',
      ['postgres'],
      '.mcp.json',
    )
    expect(merged.agents['claude-code']!.names).toEqual(['github', 'postgres'])

    // No duplicates.
    const again = seedAgentNames(merged, 'claude-code', ['github'], '.mcp.json')
    expect(again.agents['claude-code']!.names).toEqual(['github', 'postgres'])
  })

  it('seedAgentNames does not refresh updatedAt when nothing changed', () => {
    const state: SyncState = {
      ...emptyState('project'),
      agents: {
        'claude-code': agent('.mcp.json', ['github']),
      },
    }
    const again = seedAgentNames(state, 'claude-code', ['github'], '.mcp.json')
    expect(again.agents['claude-code']!.updatedAt).toBe(
      '2026-01-01T00:00:00.000Z',
    )
  })

  it('seedAgentNames refreshes updatedAt when the portable path changes', () => {
    const state: SyncState = {
      ...emptyState('project'),
      agents: {
        'claude-code': agent('.mcp.json', ['github']),
      },
    }
    const next = seedAgentNames(
      state,
      'claude-code',
      ['github'],
      '.config/mcp.json',
    )
    expect(next.agents['claude-code']!.path).toBe('.config/mcp.json')
    expect(next.agents['claude-code']!.updatedAt).not.toBe(
      '2026-01-01T00:00:00.000Z',
    )
  })

  it('pruneAgentNames removes names no longer present', () => {
    const state: SyncState = {
      ...emptyState('project'),
      agents: {
        'claude-code': agent('.mcp.json', ['github', 'postgres', 'linear']),
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

  /* --- .gitignore policy (writeState never touches .gitignore) --- */

  it("writeState('project') writes only mcp-lock.json and never creates .gitignore", () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeState(
        'project',
        ctx,
        makeState({
          targets: ['claude-code'],
        }),
      )

      expect(existsSync(lockPath(ctx.cwd))).toBe(true)
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

      writeState(
        'project',
        ctx,
        makeState({
          targets: ['opencode'],
        }),
      )

      expect(readFileSync(legacyPath, 'utf8')).toBe(legacyContent)
      expect(existsSync(lockPath(ctx.cwd))).toBe(true)
      expect(existsSync(`${ctx.cwd}/.gitignore`)).toBe(false)
    } finally {
      cleanup()
    }
  })

  it("writeState('global') does not touch <cwd>/.gitignore", () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeState(
        'global',
        ctx,
        makeState({
          scope: 'global',
          targets: ['claude-code'],
        }),
      )

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

      writeState(
        'project',
        ctx,
        makeState({
          targets: ['claude-code'],
        }),
      )

      expect(readFileSync(`${ctx.cwd}/.gitignore`, 'utf8')).toBe(original)
    } finally {
      cleanup()
    }
  })
})
