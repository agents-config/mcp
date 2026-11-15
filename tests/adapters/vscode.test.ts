import { describe, expect, it } from 'vitest'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import {
  compile,
  extractServers,
  applyServers,
  capabilities,
  getConfigPath,
} from '$/src/adapters/vscode'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

describe('vscode adapter identity', () => {
  it('capabilities', () => {
    expect(capabilities).toEqual({
      scopes: ['project', 'global'],
      format: 'jsonc',
      envSyntax: 'env-colon',
      nativeDefault: false,
      nativeDisabled: false,
      cwd: false,
    })
  })

  it('getConfigPath project and global', () => {
    expect(getConfigPath('project', ctx)).toBe('/tmp/proj/.vscode/mcp.json')
    expect(getConfigPath('global', ctx)).toBe('/tmp/home/.vscode/mcp.json')
  })
})

describe('vscode compile', () => {
  it('stdio server with type, ${env:VAR}, default dropped', () => {
    const { entry, warnings } = compile({
      type: 'stdio',
      command: 'uvx',
      args: ['mcp-server-postgres', '${DB_URL:-local}'],
      env: { DB_URL: '${DB_URL}' },
    })
    expect(entry).toEqual({
      type: 'stdio',
      command: 'uvx',
      args: ['mcp-server-postgres', '${env:DB_URL}'],
      env: { DB_URL: '${env:DB_URL}' },
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('DEFAULT_DROPPED')
  })

  it('streamable-http server with type http (vscode preserves)', () => {
    const { entry } = compile({
      type: 'streamable-http',
      url: 'https://x/mcp',
    })
    expect(entry).toEqual({ type: 'http', url: 'https://x/mcp' })
  })

  it('sse server with type sse (vscode preserves)', () => {
    const { entry } = compile({
      type: 'sse',
      url: 'https://x/sse',
    })
    expect(entry).toEqual({ type: 'sse', url: 'https://x/sse' })
  })
})

describe('vscode extractServers', () => {
  it('extracts stdio and streamable-http from servers key', () => {
    const raw = JSON.stringify({
      servers: {
        pg: {
          type: 'stdio',
          command: 'uvx',
          args: ['pg'],
          env: { DB: '${DB}' },
        },
        lin: { type: 'http', url: 'https://x/mcp' },
      },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    const pg = servers.pg as Extract<CanonicalServer, { type: 'stdio' }>
    const lin = servers.lin as Extract<
      CanonicalServer,
      { type: 'streamable-http' }
    >
    expect(isStdioServer(pg)).toBe(true)
    expect(pg.command).toBe('uvx')
    expect(isHttpServer(lin)).toBe(true)
    expect(lin.type).toBe('streamable-http')
    expect(lin.url).toBe('https://x/mcp')
    expect(warnings).toEqual([])
  })

  it('extracts sse from native type sse', () => {
    const raw = JSON.stringify({
      servers: {
        lin: { type: 'sse', url: 'https://x/sse' },
      },
    })
    const { servers } = extractServers(raw, 'project')
    const lin = servers.lin as Extract<CanonicalServer, { type: 'sse' }>
    expect(lin.type).toBe('sse')
    expect(lin.url).toBe('https://x/sse')
  })

  it('imports URL-only as streamable-http with TRANSPORT_INFERRED', () => {
    const raw = JSON.stringify({ servers: { lin: { url: 'https://x/mcp' } } })
    const { servers, warnings } = extractServers(raw, 'project')
    const lin = servers.lin as Extract<
      CanonicalServer,
      { type: 'streamable-http' }
    >
    expect(isHttpServer(lin)).toBe(true)
    expect(lin.type).toBe('streamable-http')
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('TRANSPORT_INFERRED')
  })
})

describe('vscode applyServers', () => {
  it('writes servers key and prunes previous managed', () => {
    const existing = JSON.stringify({
      servers: { old: { type: 'stdio', command: 'old', args: [] } },
    })
    const { content, managedNames } = applyServers(
      existing,
      { pg: { type: 'stdio', command: 'uvx', args: [] } },
      { ...ctx, scope: 'project', previousManagedNames: new Set(['old']) },
    )
    expect(managedNames).toEqual(['pg'])
    const parsed = JSON.parse(content)
    expect(parsed.servers.pg).toEqual({ type: 'stdio', command: 'uvx' })
    expect(parsed.servers.old).toBeUndefined()
  })

  it('preserves inputs array (sibling key)', () => {
    const existing = JSON.stringify({
      inputs: [{ id: 'env', description: 'd' }],
      servers: { old: { type: 'stdio', command: 'old', args: [] } },
    })
    const { content } = applyServers(
      existing,
      { pg: { type: 'stdio', command: 'uvx', args: [] } },
      { ...ctx, scope: 'project', previousManagedNames: new Set(['old']) },
    )
    const parsed = JSON.parse(content)
    expect(parsed.inputs).toEqual([{ id: 'env', description: 'd' }])
    expect(parsed.servers.pg).toBeDefined()
  })
})
