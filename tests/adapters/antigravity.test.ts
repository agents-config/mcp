import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import {
  capabilities,
  detect,
  compile,
  extractServers,
  applyServers,
  id,
  displayName,
  getConfigPath,
} from '$/src/adapters/antigravity'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

const stdioServer: CanonicalServer = {
  type: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github'],
  env: { GITHUB_TOKEN: '${GITHUB_TOKEN}' },
}

const httpServer: CanonicalServer = {
  type: 'streamable-http',
  url: 'https://mcp.linear.app/mcp',
  headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
}

const sseServer: CanonicalServer = {
  type: 'sse',
  url: 'https://mcp.linear.app/sse',
  headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
}

describe('antigravity adapter identity', () => {
  it('id and displayName', () => {
    expect(id).toBe('antigravity')
    expect(displayName).toBe('Antigravity')
  })

  it('capabilities invariants (per-plugin layout)', () => {
    expect(capabilities).toEqual({
      scopes: ['project', 'global'],
      format: 'json',
      envSyntax: 'posix',
      nativeDefault: false,
      nativeDisabled: false,
      cwd: false,
      layout: 'per-plugin',
      rootKey: 'mcpServers',
    })
  })

  it('getConfigPath returns null (no single native config path)', () => {
    expect(getConfigPath('project', ctx)).toBe(null)
    expect(getConfigPath('global', ctx)).toBe(null)
  })
})

describe('antigravity detect', () => {
  it('returns false when no plugins directory exists', async () => {
    const { ctx: sctx, cleanup } = createSandbox()
    try {
      expect(await detect('project', sctx)).toBe(false)
      expect(await detect('global', sctx)).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('returns false when plugins dir exists but has no mcp_config.json', async () => {
    const { ctx: sctx, cleanup } = createSandbox()
    try {
      const emptyPlugin = join(sctx.cwd, '.agents', 'plugins', 'empty-plugin')
      mkdirSync(emptyPlugin, { recursive: true })
      expect(await detect('project', sctx)).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('returns true when any .agents/plugins/*/mcp_config.json exists (project)', async () => {
    const { ctx: sctx, cleanup } = createSandbox()
    try {
      const pluginDir = join(sctx.cwd, '.agents', 'plugins', 'github')
      mkdirSync(pluginDir, { recursive: true })
      writeFileSync(
        join(pluginDir, 'mcp_config.json'),
        JSON.stringify({ mcpServers: {} }),
      )
      expect(await detect('project', sctx)).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('returns true for global scope under homeDir', async () => {
    const { ctx: sctx, cleanup } = createSandbox()
    try {
      const pluginDir = join(sctx.homeDir, '.agents', 'plugins', 'linear')
      mkdirSync(pluginDir, { recursive: true })
      writeFileSync(
        join(pluginDir, 'mcp_config.json'),
        JSON.stringify({ mcpServers: {} }),
      )
      expect(await detect('global', sctx)).toBe(true)
    } finally {
      cleanup()
    }
  })
})

describe('antigravity compile', () => {
  it('stdio -> { command, args, env } with no type field', () => {
    const { entry, warnings } = compile(stdioServer)
    expect(entry).toEqual({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_TOKEN: '${GITHUB_TOKEN}' },
    })
    expect(entry).not.toHaveProperty('type')
    expect(warnings).toEqual([])
  })

  it('omits args when empty and env when absent', () => {
    const { entry } = compile({ type: 'stdio', command: 'npx', args: [] })
    expect(entry).toEqual({ command: 'npx' })
    expect(entry).not.toHaveProperty('args')
    expect(entry).not.toHaveProperty('env')
  })

  it('streamable-http -> { serverUrl, headers } with no type field', () => {
    const { entry, warnings } = compile(httpServer)
    expect(entry).toEqual({
      serverUrl: 'https://mcp.linear.app/mcp',
      headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
    })
    expect(entry).not.toHaveProperty('type')
    expect(warnings).toEqual([])
  })

  it('sse -> { serverUrl, headers } (serverUrl form, no type field)', () => {
    const { entry } = compile(sseServer)
    expect(entry).toEqual({
      serverUrl: 'https://mcp.linear.app/sse',
      headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
    })
    expect(entry).not.toHaveProperty('type')
  })

  it('ignores cwd with no warning', () => {
    const { entry, warnings } = compile({
      type: 'stdio',
      command: 'npx',
      args: [],
      cwd: '/some/dir',
    })
    expect(entry).toEqual({ command: 'npx' })
    expect(warnings).toEqual([])
  })
})

describe('antigravity extractServers', () => {
  it('round-trips stdio and streamable-http entries', () => {
    const raw = JSON.stringify({
      mcpServers: {
        github: {
          command: 'npx',
          args: ['-y', 'pkg'],
          env: { GITHUB_TOKEN: '${GITHUB_TOKEN}' },
        },
        linear: {
          serverUrl: 'https://mcp.linear.app/mcp',
          headers: { Authorization: 'Bearer x' },
        },
      },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    expect(warnings).toEqual([])
    const github = servers.github as Extract<CanonicalServer, { type: 'stdio' }>
    expect(isStdioServer(github)).toBe(true)
    expect(github.command).toBe('npx')
    expect(github.args).toEqual(['-y', 'pkg'])
    expect(github.env).toEqual({ GITHUB_TOKEN: '${GITHUB_TOKEN}' })
    const linear = servers.linear as Extract<
      CanonicalServer,
      { type: 'streamable-http' }
    >
    expect(isHttpServer(linear)).toBe(true)
    expect(linear.type).toBe('streamable-http')
    expect(linear.url).toBe('https://mcp.linear.app/mcp')
    expect(linear.headers).toEqual({ Authorization: 'Bearer x' })
  })

  it('imports sse entry as streamable-http (transport not distinguished)', () => {
    const raw = JSON.stringify({
      mcpServers: {
        linearSse: { serverUrl: 'https://mcp.linear.app/sse' },
      },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    const linearSse = servers.linearSse!
    expect(isHttpServer(linearSse)).toBe(true)
    if (isHttpServer(linearSse)) {
      expect(linearSse.type).toBe('streamable-http')
      expect(linearSse.url).toBe('https://mcp.linear.app/sse')
    }
    expect(warnings).toEqual([])
  })

  it('drops entries with neither command nor serverUrl (UNKNOWN_FIELD_DROPPED)', () => {
    const raw = JSON.stringify({
      mcpServers: { broken: { type: 'stdio' } },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    expect(servers).toEqual({})
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('UNKNOWN_FIELD_DROPPED')
    expect(warnings[0]!.agent).toBe('antigravity')
    expect(warnings[0]!.server).toBe('broken')
  })

  it('returns empty for missing mcpServers', () => {
    const { servers } = extractServers(JSON.stringify({ other: 1 }), 'project')
    expect(servers).toEqual({})
  })

  it('returns empty for invalid JSON', () => {
    const { servers } = extractServers('{ not valid json', 'project')
    expect(servers).toEqual({})
  })
})

describe('antigravity applyServers', () => {
  const adapterCtx = {
    ...ctx,
    scope: 'project' as const,
    previousManagedNames: new Set<string>(),
  }

  it('is a no-op passthrough: returns existing content with managedNames', () => {
    const { content, managedNames, warnings } = applyServers(
      'existing raw content',
      { github: stdioServer },
      adapterCtx,
    )
    expect(content).toBe('existing raw content')
    expect(managedNames).toEqual(['github'])
    expect(warnings).toEqual([])
  })

  it('treats null existing content as empty string', () => {
    const { content } = applyServers(null, { github: stdioServer }, adapterCtx)
    expect(content).toBe('')
  })

  it('managedNames reflect all produced server names', () => {
    const { managedNames } = applyServers(
      '',
      { github: stdioServer, linear: httpServer },
      adapterCtx,
    )
    expect(managedNames).toEqual(['github', 'linear'])
  })
})
