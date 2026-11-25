import { describe, expect, it } from 'vitest'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import { adapters } from '$/src/adapters/index'
import type {
  AgentId,
  AdapterCapabilities,
  Warning,
} from '$/src/adapters/types'
import { createRuntimeContext } from '$/src/core/context'
import { readFileSync } from 'node:fs'
import { parse as jsoncParse } from 'jsonc-parser'
import { createSandbox } from '$/tests/helpers/sandbox'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

/** A canonical server used as a contract fixture. */
interface ServerFixture {
  name: string
  server: CanonicalServer
  /** Expected native entry produced by `compile(server)`. */
  entry: unknown
  /**
   * Expected canonical server after `extractServers(wrap(rootKey, { [name]: entry }))`.
   * Defaults to `server` when the round trip is lossless.
   */
  roundTrip?: CanonicalServer
  /** Warnings expected from `compile(server)`. Defaults to []. */
  compileWarnings?: readonly Partial<Warning>[]
  /** Warnings expected from `extractServers(...)`. Defaults to []. */
  extractWarnings?: readonly Partial<Warning>[]
}

/** Plain (non-placeholder) values so env/headers round-trip losslessly. */
const stdioServer: CanonicalServer = {
  type: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github'],
  env: { GITHUB_TOKEN: 'ghp_test_token' },
}

const httpServer: CanonicalServer = {
  type: 'streamable-http',
  url: 'https://mcp.linear.app/mcp',
  headers: { Authorization: 'Bearer test-token' },
}

const sseServer: CanonicalServer = {
  type: 'sse',
  url: 'https://mcp.linear.app/sse',
  headers: { Authorization: 'Bearer test-token' },
}

/** Per-adapter compile + extract round-trip fixtures. */
const FIXTURES: Record<AgentId, ServerFixture[]> = {
  'claude-code': [
    {
      name: 'github',
      server: stdioServer,
      entry: {
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'ghp_test_token' },
      },
    },
    {
      name: 'linear',
      server: httpServer,
      entry: {
        type: 'http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      roundTrip: {
        type: 'streamable-http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
    },
  ],
  cursor: [
    {
      name: 'github',
      server: stdioServer,
      entry: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'ghp_test_token' },
      },
    },
    {
      name: 'linear',
      server: httpServer,
      entry: {
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      roundTrip: {
        type: 'streamable-http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      // Cursor native http entries carry no `type` → transport inferred.
      extractWarnings: [
        { code: 'TRANSPORT_INFERRED', agent: 'cursor', server: 'linear' },
      ],
    },
  ],
  vscode: [
    {
      name: 'github',
      server: stdioServer,
      entry: {
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'ghp_test_token' },
      },
    },
    {
      name: 'linear',
      server: httpServer,
      entry: {
        type: 'http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      roundTrip: {
        type: 'streamable-http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
    },
  ],
  opencode: [
    {
      name: 'github',
      server: stdioServer,
      entry: {
        type: 'local',
        command: ['npx', '-y', '@modelcontextprotocol/server-github'],
        environment: { GITHUB_TOKEN: 'ghp_test_token' },
      },
      roundTrip: {
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'ghp_test_token' },
      },
    },
    {
      name: 'linear',
      server: httpServer,
      entry: {
        type: 'remote',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      roundTrip: {
        type: 'streamable-http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
    },
  ],
  windsurf: [
    {
      name: 'github',
      server: stdioServer,
      entry: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'ghp_test_token' },
      },
    },
    {
      name: 'linear',
      server: httpServer,
      entry: {
        serverUrl: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      roundTrip: {
        type: 'streamable-http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      // Windsurf native http entries carry no `type` → transport inferred.
      extractWarnings: [
        { code: 'TRANSPORT_INFERRED', agent: 'windsurf', server: 'linear' },
      ],
    },
  ],
  zed: [
    {
      name: 'github',
      server: stdioServer,
      entry: {
        command: {
          path: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: { GITHUB_TOKEN: 'ghp_test_token' },
        },
      },
      roundTrip: {
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'ghp_test_token' },
      },
    },
    {
      name: 'linear',
      server: httpServer,
      entry: {
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      roundTrip: {
        type: 'streamable-http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      // Zed native http entries carry no `type` → transport inferred.
      extractWarnings: [
        { code: 'TRANSPORT_INFERRED', agent: 'zed', server: 'linear' },
      ],
    },
  ],
  antigravity: [
    {
      name: 'github',
      server: stdioServer,
      entry: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: { GITHUB_TOKEN: 'ghp_test_token' },
      },
    },
    {
      name: 'linear',
      server: httpServer,
      entry: {
        serverUrl: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
      roundTrip: {
        type: 'streamable-http',
        url: 'https://mcp.linear.app/mcp',
        headers: { Authorization: 'Bearer test-token' },
      },
    },
    {
      name: 'linearSse',
      server: sseServer,
      entry: {
        serverUrl: 'https://mcp.linear.app/sse',
        headers: { Authorization: 'Bearer test-token' },
      },
      roundTrip: {
        type: 'streamable-http',
        url: 'https://mcp.linear.app/sse',
        headers: { Authorization: 'Bearer test-token' },
      },
    },
  ],
}

/** Scope each adapter supports for round-trip / apply tests. */
function roundTripScope(adapter: {
  capabilities: AdapterCapabilities
}): 'project' | 'global' {
  return adapter.capabilities.scopes.includes('project') ? 'project' : 'global'
}

describe('adapter contract: capabilities invariants (all 7 adapters)', () => {
  it('registry exposes exactly the seven agents', () => {
    expect(adapters).toHaveLength(7)
    expect(adapters.map((a) => a.id)).toEqual([
      'claude-code',
      'cursor',
      'vscode',
      'opencode',
      'zed',
      'windsurf',
      'antigravity',
    ])
  })

  it.each(adapters)('capabilities for $id', (adapter) => {
    const caps = adapter.capabilities
    expect(Array.isArray(caps.scopes) && caps.scopes.length > 0).toBe(true)
    expect(['json', 'jsonc']).toContain(caps.format)
    expect(['posix', 'env-colon', 'brace-env']).toContain(caps.envSyntax)
    expect(typeof caps.nativeDefault).toBe('boolean')
    expect(typeof caps.nativeDisabled).toBe('boolean')
    expect(typeof caps.cwd).toBe('boolean')
    expect(['single-file', 'per-plugin']).toContain(caps.layout)
    if (caps.layout === 'single-file') {
      expect(typeof caps.rootKey).toBe('string')
      expect(caps.rootKey!.length).toBeGreaterThan(0)
    }
  })
})

describe('adapter contract: compile + extractServers round-trip', () => {
  it.each(adapters)('round-trips servers for $id', (adapter) => {
    const scope = roundTripScope(adapter)
    const rootKey = adapter.capabilities.rootKey!
    const fixtures = FIXTURES[adapter.id as AgentId]
    expect(fixtures).toBeDefined()

    for (const fixture of fixtures!) {
      const { entry, warnings: compileWarnings } = adapter.compile(
        fixture.server,
      )
      expect(entry).toEqual(fixture.entry)
      expect(compileWarnings).toEqual(
        (fixture.compileWarnings ?? []).map((w) => expect.objectContaining(w)),
      )

      const raw = JSON.stringify({ [rootKey]: { [fixture.name]: entry } })
      const { servers, warnings: extractWarnings } = adapter.extractServers(
        raw,
        scope,
      )
      expect(extractWarnings).toEqual(
        (fixture.extractWarnings ?? []).map((w) => expect.objectContaining(w)),
      )
      expect(servers[fixture.name]).toEqual(fixture.roundTrip ?? fixture.server)
    }
  })
})

describe('adapter contract: applyServers idempotence', () => {
  it.each(adapters)('is idempotent for $id', (adapter) => {
    const scope = roundTripScope(adapter)
    const servers = {
      github: stdioServer,
      linear: httpServer,
    }

    const ctx1 = { ...ctx, scope, previousManagedNames: new Set<string>() }
    const r1 = adapter.applyServers(null, servers, ctx1)

    const ctx2 = {
      ...ctx,
      scope,
      previousManagedNames: new Set(r1.managedNames),
    }
    const r2 = adapter.applyServers(r1.content, servers, ctx2)

    const ctx3 = {
      ...ctx,
      scope,
      previousManagedNames: new Set(r2.managedNames),
    }
    const r3 = adapter.applyServers(r2.content, servers, ctx3)

    // Re-applying the same servers to the adapter's own output is
    // byte-identical once the output has been normalized (fixed point).
    expect(r3.content).toBe(r2.content)
    expect(r3.managedNames).toEqual(r1.managedNames)
    expect(r2.managedNames).toEqual(r1.managedNames)
  })
})

describe('adapter contract: JSONC comment / manual-entry preservation', () => {
  it.each(adapters.filter((a) => a.capabilities.layout === 'single-file'))(
    'preserves comments and manual entries for $id',
    (adapter) => {
      const scope = roundTripScope(adapter)
      const existing = `{\n  // manual entry maintained by the user\n  "manualEntry": { "type": "stdio", "command": "manual-cmd" }\n}\n`

      const { content, managedNames } = adapter.applyServers(
        existing,
        { github: stdioServer },
        { ...ctx, scope, previousManagedNames: new Set<string>() },
      )

      expect(content).toContain('// manual entry maintained by the user')
      expect(content).toContain('"manualEntry"')

      const errors: Array<{ error: number; offset: number; length: number }> =
        []
      const parsed = jsoncParse(content, errors)
      expect(errors).toEqual([])
      expect((parsed as Record<string, unknown>).manualEntry).toEqual({
        type: 'stdio',
        command: 'manual-cmd',
      })
      expect(
        (parsed as Record<string, unknown>)[adapter.capabilities.rootKey!],
      ).toHaveProperty('github')
      expect(managedNames).toEqual(['github'])
    },
  )
})

describe('adapter contract: RuntimeContext OS-path purity', () => {
  const FORBIDDEN = [
    { pattern: /process\.platform/, name: 'process.platform' },
    { pattern: /os\.homedir\(/, name: 'os.homedir()' },
    { pattern: /process\.env/, name: 'process.env' },
  ]

  it.each(adapters)(
    'adapter $id source avoids OS-specific globals',
    (adapter) => {
      const sourcePath = new URL(
        `../../src/adapters/${adapter.id}.ts`,
        import.meta.url,
      ).pathname
      const source = readFileSync(sourcePath, 'utf8')
      for (const { pattern, name } of FORBIDDEN) {
        expect(source, `${adapter.id} must not use ${name}`).not.toMatch(
          pattern,
        )
      }
    },
  )
})

describe('adapter contract: detect returns false when no config present', () => {
  it.each(adapters)(
    'detect($id) is false with no native config',
    async (adapter) => {
      const { ctx: sctx, cleanup } = createSandbox()
      try {
        expect(await adapter.detect('project', sctx)).toBe(false)
        expect(await adapter.detect('global', sctx)).toBe(false)
      } finally {
        cleanup()
      }
    },
  )
})
