import { describe, expect, it } from 'vitest'
import type { CanonicalServer } from '$/src/core/schema'
import {
  compile,
  extractServers,
  applyServers,
  capabilities,
  getConfigPath,
  detect,
} from '$/src/adapters/windsurf'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

describe('windsurf adapter identity', () => {
  it('capabilities: global-only', () => {
    expect(capabilities).toEqual({
      scopes: ['global'],
      format: 'json',
      envSyntax: 'env-colon',
      nativeDefault: false,
      nativeDisabled: false,
      cwd: false,
    })
  })

  it('getConfigPath: global only, project is null', () => {
    expect(getConfigPath('global', ctx)).toBe(
      '/tmp/home/.codeium/windsurf/mcp_config.json',
    )
    expect(getConfigPath('project', ctx)).toBeNull()
  })

  it('detect: global false when missing, project always false', async () => {
    const { ctx: sctx, cleanup } = createSandbox()
    try {
      expect(await detect('global', sctx)).toBe(false)
      expect(await detect('project', sctx)).toBe(false)
    } finally {
      cleanup()
    }
  })
})

describe('windsurf compile', () => {
  it('global scope: stdio server, ${env:VAR}, default dropped', () => {
    const { entry, warnings } = compile({
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '${ARG:-fallback}'],
      env: { TOKEN: '${TOKEN}' },
    })
    expect(entry).toEqual({
      command: 'npx',
      args: ['-y', '${env:ARG}'],
      env: { TOKEN: '${env:TOKEN}' },
      enabled: true,
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('DEFAULT_DROPPED')
  })

  it('global scope: http server uses serverUrl', () => {
    const { entry } = compile({
      transport: 'http',
      url: 'https://x/mcp',
    })
    expect(entry).toEqual({ serverUrl: 'https://x/mcp', enabled: true })
  })

  it('disabled omitted', () => {
    const { entry } = compile({
      transport: 'stdio',
      command: 'npx',
      disabled: true,
      args: [],
    })
    expect(entry).toBeNull()
  })
})

describe('windsurf extractServers', () => {
  it('extracts stdio (command) and http (serverUrl)', () => {
    const raw = JSON.stringify({
      mcpServers: {
        gh: { command: 'npx', args: ['-y', 'pkg'] },
        lin: { serverUrl: 'https://x/mcp' },
      },
    })
    const { servers, warnings } = extractServers(raw, 'global')
    const gh = servers.gh as Extract<CanonicalServer, { transport: 'stdio' }>
    const lin = servers.lin as Extract<CanonicalServer, { transport: 'http' }>
    expect(gh.transport).toBe('stdio')
    expect(lin.transport).toBe('http')
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('TRANSPORT_INFERRED')
  })
})

describe('windsurf applyServers', () => {
  it('global scope: writes mcpServers and prunes previous managed', () => {
    const existing = JSON.stringify({
      mcpServers: { old: { command: 'old' } },
    })
    const { content, managedNames } = applyServers(
      existing,
      { gh: { transport: 'stdio', command: 'npx', args: [] } },
      { ...ctx, scope: 'global', previousManagedNames: new Set(['old']) },
    )
    expect(managedNames).toEqual(['gh'])
    const parsed = JSON.parse(content)
    expect(parsed.mcpServers.gh).toEqual({ command: 'npx', enabled: true })
    expect(parsed.mcpServers.old).toBeUndefined()
  })

  it('project scope: SCOPE_UNSUPPORTED, skips all servers', () => {
    const existing = JSON.stringify({ mcpServers: { old: { command: 'old' } } })
    const { content, managedNames, warnings } = applyServers(
      existing,
      { gh: { transport: 'stdio', command: 'npx', args: [] } },
      { ...ctx, scope: 'project' as const, previousManagedNames: new Set() },
    )
    expect(managedNames).toEqual([])
    expect(content).toBe(existing)
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('SCOPE_UNSUPPORTED')
  })
})
