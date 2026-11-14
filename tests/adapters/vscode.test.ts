import { describe, expect, it } from 'vitest'
import type { CanonicalServer } from '$/src/core/schema'
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
      transport: 'stdio',
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

  it('http server with type', () => {
    const { entry } = compile({
      transport: 'http',
      url: 'https://x/mcp',
    })
    expect(entry).toEqual({ type: 'http', url: 'https://x/mcp' })
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

describe('vscode extractServers', () => {
  it('extracts stdio and http from servers key', () => {
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
    const pg = servers.pg as Extract<CanonicalServer, { transport: 'stdio' }>
    const lin = servers.lin as Extract<CanonicalServer, { transport: 'http' }>
    expect(pg.transport).toBe('stdio')
    expect(lin.transport).toBe('http')
    expect(warnings).toEqual([])
  })

  it('imports URL-only as http with TRANSPORT_INFERRED', () => {
    const raw = JSON.stringify({ servers: { lin: { url: 'https://x/mcp' } } })
    const { servers, warnings } = extractServers(raw, 'project')
    const lin = servers.lin as Extract<CanonicalServer, { transport: 'http' }>
    expect(lin.transport).toBe('http')
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
      { pg: { transport: 'stdio', command: 'uvx', args: [] } },
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
      { pg: { transport: 'stdio', command: 'uvx', args: [] } },
      { ...ctx, scope: 'project', previousManagedNames: new Set(['old']) },
    )
    const parsed = JSON.parse(content)
    expect(parsed.inputs).toEqual([{ id: 'env', description: 'd' }])
    expect(parsed.servers.pg).toBeDefined()
  })
})
