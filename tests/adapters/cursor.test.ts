import { describe, expect, it } from 'vitest'
import {
  compile,
  extractServers,
  applyServers,
  capabilities,
  getConfigPath,
  detect,
} from '$/src/adapters/cursor'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

describe('cursor adapter identity', () => {
  it('id, capabilities', () => {
    expect(capabilities).toEqual({
      scopes: ['project', 'global'],
      format: 'json',
      envSyntax: 'env-colon',
      nativeDefault: false,
      nativeDisabled: false,
      cwd: false,
    })
  })

  it('getConfigPath project and global', () => {
    expect(getConfigPath('project', ctx)).toBe('/tmp/proj/.cursor/mcp.json')
    expect(getConfigPath('global', ctx)).toBe('/tmp/home/.cursor/mcp.json')
  })

  it('detect false for missing file', async () => {
    const { ctx: sctx, cleanup } = createSandbox()
    try {
      expect(await detect('project', sctx)).toBe(false)
    } finally {
      cleanup()
    }
  })
})

describe('cursor compile', () => {
  it('stdio server: no type, ${env:VAR}, default dropped', () => {
    const { entry, warnings } = compile({
      type: 'stdio',
      command: 'npx',
      args: ['-y', 'pkg'],
      env: { TOKEN: '${TOKEN:-secret}' },
    })
    expect(entry).toEqual({
      command: 'npx',
      args: ['-y', 'pkg'],
      env: { TOKEN: '${env:TOKEN}' },
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('DEFAULT_DROPPED')
  })

  it('streamable-http server: no type', () => {
    const { entry } = compile({
      type: 'streamable-http',
      url: 'https://x/mcp',
      headers: { Authorization: 'Bearer ${env:KEY}' },
    })
    expect(entry).toEqual({
      url: 'https://x/mcp',
      headers: { Authorization: 'Bearer ${env:KEY}' },
    })
  })

  it('sse server: no type', () => {
    const { entry } = compile({
      type: 'sse',
      url: 'https://x/sse',
      headers: { Authorization: 'Bearer ${env:KEY}' },
    })
    expect(entry).toEqual({
      url: 'https://x/sse',
      headers: { Authorization: 'Bearer ${env:KEY}' },
    })
  })
})

describe('cursor extractServers', () => {
  it('extracts stdio (command) and streamable-http (url)', () => {
    const raw = JSON.stringify({
      mcpServers: {
        gh: { command: 'npx', args: ['-y', 'pkg'] },
        lin: { url: 'https://x/mcp' },
      },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    const gh = servers.gh as Extract<CanonicalServer, { type: 'stdio' }>
    const lin = servers.lin as Extract<
      CanonicalServer,
      { type: 'streamable-http' }
    >
    expect(isStdioServer(gh)).toBe(true)
    expect(gh.command).toBe('npx')
    expect(isHttpServer(lin)).toBe(true)
    expect(lin.type).toBe('streamable-http')
    expect(lin.url).toBe('https://x/mcp')
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('TRANSPORT_INFERRED')
  })

  it('extracts sse from native type sse', () => {
    const raw = JSON.stringify({
      mcpServers: {
        lin: { type: 'sse', url: 'https://x/sse' },
      },
    })
    const { servers } = extractServers(raw, 'project')
    const lin = servers.lin as Extract<CanonicalServer, { type: 'sse' }>
    expect(lin.type).toBe('sse')
    expect(lin.url).toBe('https://x/sse')
  })
})

describe('cursor applyServers', () => {
  it('writes mcpServers and prunes previous managed names', () => {
    const existing = JSON.stringify({
      mcpServers: { old: { command: 'old' } },
    })
    const { content, managedNames } = applyServers(
      existing,
      { gh: { type: 'stdio', command: 'npx', args: [] } },
      { ...ctx, scope: 'project', previousManagedNames: new Set(['old']) },
    )
    expect(managedNames).toEqual(['gh'])
    const parsed = JSON.parse(content)
    expect(parsed.mcpServers.gh!).toEqual({ command: 'npx' })
    expect(parsed.mcpServers.old).toBeUndefined()
  })
})
