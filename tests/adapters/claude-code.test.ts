import { describe, expect, it } from 'vitest'
import { parse as jsoncParse, type ParseError } from 'jsonc-parser'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import {
  compile,
  extractServers,
  applyServers,
  capabilities,
  getConfigPath,
  detect,
  id,
  displayName,
} from '$/src/adapters/claude-code'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

describe('claude-code adapter identity', () => {
  it('id, displayName, capabilities', () => {
    expect(id).toBe('claude-code')
    expect(displayName).toBe('Claude Code')
    expect(capabilities).toEqual({
      scopes: ['project', 'global'],
      format: 'json',
      envSyntax: 'posix',
      nativeDefault: true,
      nativeDisabled: false,
      cwd: false,
    })
  })

  it('getConfigPath project and global', () => {
    expect(getConfigPath('project', ctx)).toBe('/tmp/proj/.mcp.json')
    expect(getConfigPath('global', ctx)).toBe('/tmp/home/.claude.json')
  })

  it('detect returns false for missing file', async () => {
    const { ctx: sctx, cleanup } = createSandbox()
    try {
      expect(await detect('project', sctx)).toBe(false)
      expect(await detect('global', sctx)).toBe(false)
    } finally {
      cleanup()
    }
  })
})

describe('claude-code compile', () => {
  it('stdio server with env placeholder kept as-is (nativeDefault)', () => {
    const { entry, warnings } = compile({
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_TOKEN}' },
    })
    expect(entry).toEqual({
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_TOKEN}' },
    })
    expect(warnings).toEqual([])
  })

  it('streamable-http server compiles to type http (claude-code preserves)', () => {
    const { entry, warnings } = compile({
      type: 'streamable-http',
      url: 'https://mcp.linear.app/mcp',
      headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
    })
    expect(entry).toEqual({
      type: 'http',
      url: 'https://mcp.linear.app/mcp',
      headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
    })
    expect(warnings).toEqual([])
  })

  it('sse server compiles to type sse (claude-code preserves)', () => {
    const { entry, warnings } = compile({
      type: 'sse',
      url: 'https://mcp.linear.app/sse',
      headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
    })
    expect(entry).toEqual({
      type: 'sse',
      url: 'https://mcp.linear.app/sse',
      headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
    })
    expect(warnings).toEqual([])
  })

  it('omits args when empty and env when absent', () => {
    const { entry } = compile({
      type: 'stdio',
      command: 'npx',
      args: [],
    })
    expect(entry).toEqual({ type: 'stdio', command: 'npx' })
    expect(entry).not.toHaveProperty('args')
    expect(entry).not.toHaveProperty('env')
  })

  it('reports CWD_UNSUPPORTED warning', () => {
    const { entry, warnings } = compile({
      type: 'stdio',
      command: 'npx',
      args: [],
      cwd: '/some/dir',
    })
    expect(entry).toEqual({ type: 'stdio', command: 'npx' })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('CWD_UNSUPPORTED')
  })
})

describe('claude-code extractServers', () => {
  it('extracts stdio and streamable-http servers from .mcp.json', () => {
    const raw = JSON.stringify({
      mcpServers: {
        github: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: { GITHUB_TOKEN: '${GITHUB_TOKEN}' },
        },
        linear: {
          type: 'http',
          url: 'https://mcp.linear.app/mcp',
          headers: { Authorization: 'Bearer ${LINEAR_API_KEY}' },
        },
      },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    const github = servers.github as Extract<CanonicalServer, { type: 'stdio' }>
    expect(isStdioServer(github)).toBe(true)
    expect(github.command).toBe('npx')
    expect(github.args).toEqual(['-y', '@modelcontextprotocol/server-github'])
    expect(github.env).toEqual({ GITHUB_TOKEN: '${GITHUB_TOKEN}' })
    // legacy native 'http' → canonical streamable-http
    expect(isHttpServer(servers.linear!)).toBe(true)
    if (isHttpServer(servers.linear!)) {
      expect(servers.linear!.type).toBe('streamable-http')
      expect(servers.linear!.url).toBe('https://mcp.linear.app/mcp')
      expect(servers.linear!.headers).toEqual({
        Authorization: 'Bearer ${LINEAR_API_KEY}',
      })
    }
    expect(warnings).toEqual([])
  })

  it('extracts sse server from native type sse', () => {
    const raw = JSON.stringify({
      mcpServers: {
        linearSse: {
          type: 'sse',
          url: 'https://mcp.linear.app/sse',
        },
      },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    expect(isHttpServer(servers.linearSse!)).toBe(true)
    if (isHttpServer(servers.linearSse!)) {
      expect(servers.linearSse!.type).toBe('sse')
    }
    expect(warnings).toEqual([])
  })

  it('imports a URL-only entry as streamable-http with TRANSPORT_INFERRED', () => {
    const raw = JSON.stringify({
      mcpServers: {
        linear: { url: 'https://mcp.linear.app/mcp' },
      },
    })
    const { servers, warnings } = extractServers(raw, 'project')
    expect(isHttpServer(servers.linear!)).toBe(true)
    if (isHttpServer(servers.linear!)) {
      expect(servers.linear!.type).toBe('streamable-http')
      expect(servers.linear!.url).toBe('https://mcp.linear.app/mcp')
    }
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('TRANSPORT_INFERRED')
  })

  it('treats command without url as stdio', () => {
    const raw = JSON.stringify({
      mcpServers: {
        github: { command: 'npx', args: ['-y', 'pkg'] },
      },
    })
    const { servers } = extractServers(raw, 'project')
    const github = servers.github as Extract<CanonicalServer, { type: 'stdio' }>
    expect(isStdioServer(github)).toBe(true)
    expect(github.command).toBe('npx')
  })

  it('returns empty for missing mcpServers', () => {
    const { servers } = extractServers(JSON.stringify({ other: 1 }), 'project')
    expect(servers).toEqual({})
  })
})

describe('claude-code applyServers', () => {
  it('writes a new file with mcpServers', () => {
    const { content, managedNames } = applyServers(
      null,
      {
        github: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
        },
      },
      { ...ctx, scope: 'project', previousManagedNames: new Set() },
    )
    expect(managedNames).toEqual(['github'])
    expect(JSON.parse(content)).toEqual({
      mcpServers: {
        github: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
        },
      },
    })
  })

  it('preserves JSONC comments and unrelated keys', () => {
    const existing = `{\n  // unrelated comment\n  "otherSetting": true,\n  "mcpServers": {\n    "old": { "type": "stdio", "command": "old" }\n  }\n}\n`
    const { content } = applyServers(
      existing,
      {
        github: {
          type: 'stdio',
          command: 'npx',
          args: [],
        },
      },
      { ...ctx, scope: 'project', previousManagedNames: new Set(['old']) },
    )
    expect(content).toContain('// unrelated comment')
    expect(content).toContain('"otherSetting": true')
    const parseErrors: ParseError[] = []
    const parsed = jsoncParse(content, parseErrors)
    expect(parseErrors).toEqual([])
    expect((parsed as Record<string, unknown>).otherSetting).toBe(true)
    expect((parsed as Record<string, unknown>).mcpServers).toMatchObject({
      github: { type: 'stdio', command: 'npx' },
    })
    // old was previously managed and is no longer produced → pruned.
    expect((parsed as Record<string, unknown>).mcpServers).not.toHaveProperty(
      'old',
    )
  })

  it('preserves manual entries not in state', () => {
    const existing = JSON.stringify({
      mcpServers: {
        manual: { type: 'stdio', command: 'manual-cmd' },
      },
    })
    const { content } = applyServers(
      existing,
      {
        github: { type: 'stdio', command: 'npx', args: [] },
      },
      { ...ctx, scope: 'project', previousManagedNames: new Set() },
    )
    const parsed = JSON.parse(content)
    expect(parsed.mcpServers.manual).toEqual({
      type: 'stdio',
      command: 'manual-cmd',
    })
    expect(parsed.mcpServers.github).toBeDefined()
  })

  it('handles empty existing content', () => {
    const { content } = applyServers(
      '',
      {
        github: { type: 'stdio', command: 'npx', args: [] },
      },
      { ...ctx, scope: 'project', previousManagedNames: new Set() },
    )
    expect(JSON.parse(content).mcpServers.github).toBeDefined()
  })
})
