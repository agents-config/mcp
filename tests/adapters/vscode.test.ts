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
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

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
      layout: 'single-file',
      rootKey: 'servers',
    })
  })

  it('getConfigPath project and global', () => {
    expect(getConfigPath('project', ctx)).toBe('/tmp/proj/.vscode/mcp.json')
    // linux (default platform in CI), no XDG_CONFIG_HOME → ~/.config/Code/User/mcp.json
    expect(getConfigPath('global', ctx)).toBe(
      '/tmp/home/.config/Code/User/mcp.json',
    )
  })

  describe('getConfigPath global (OS-aware)', () => {
    it('linux with XDG_CONFIG_HOME', () => {
      const linuxCtx = createRuntimeContext({
        cwd: '/tmp/proj',
        homeDir: '/home/alex',
        platform: 'linux',
        env: { XDG_CONFIG_HOME: '/home/alex/.config' },
        isTTY: false,
      })
      expect(getConfigPath('global', linuxCtx)).toBe(
        '/home/alex/.config/Code/User/mcp.json',
      )
    })

    it('linux without XDG_CONFIG_HOME falls back to ~/.config', () => {
      const linuxCtx = createRuntimeContext({
        cwd: '/tmp/proj',
        homeDir: '/home/alex',
        platform: 'linux',
        env: {},
        isTTY: false,
      })
      expect(getConfigPath('global', linuxCtx)).toBe(
        '/home/alex/.config/Code/User/mcp.json',
      )
    })

    it('darwin uses Library/Application Support', () => {
      const darwinCtx = createRuntimeContext({
        cwd: '/tmp/proj',
        homeDir: '/Users/alex',
        platform: 'darwin',
        env: {},
        isTTY: false,
      })
      expect(getConfigPath('global', darwinCtx)).toBe(
        '/Users/alex/Library/Application Support/Code/User/mcp.json',
      )
    })

    it('win32 with APPDATA', () => {
      const winCtx = createRuntimeContext({
        cwd: 'C:\\proj',
        homeDir: 'C:\\Users\\alex',
        platform: 'win32',
        env: { APPDATA: 'C:\\Users\\alex\\AppData\\Roaming' },
        isTTY: false,
      })
      expect(getConfigPath('global', winCtx)).toBe(
        'C:\\Users\\alex\\AppData\\Roaming\\Code\\User\\mcp.json',
      )
    })

    it('win32 without APPDATA falls back to ~/AppData/Roaming', () => {
      const winCtx = createRuntimeContext({
        cwd: 'C:\\proj',
        homeDir: 'C:\\Users\\alex',
        platform: 'win32',
        env: {},
        isTTY: false,
      })
      expect(getConfigPath('global', winCtx)).toBe(
        'C:\\Users\\alex\\AppData\\Roaming\\Code\\User\\mcp.json',
      )
    })

    it('probes Code - Insiders when its User dir exists', () => {
      const { ctx: sctx, cleanup, dir } = createSandbox()
      try {
        // sctx.platform is linux, sctx.homeDir is sandbox home,
        // sctx.env.XDG_CONFIG_HOME is <home>/.config
        const base = sctx.env.XDG_CONFIG_HOME!
        mkdirSync(join(base, 'Code - Insiders', 'User'), {
          recursive: true,
        })
        expect(getConfigPath('global', sctx)).toBe(
          join(base, 'Code - Insiders', 'User', 'mcp.json'),
        )
      } finally {
        cleanup()
      }
    })

    it('probes VSCodium when Insiders missing but VSCodium present', () => {
      const { ctx: sctx, cleanup, dir } = createSandbox()
      try {
        const base = sctx.env.XDG_CONFIG_HOME!
        mkdirSync(join(base, 'VSCodium', 'User'), { recursive: true })
        expect(getConfigPath('global', sctx)).toBe(
          join(base, 'VSCodium', 'User', 'mcp.json'),
        )
      } finally {
        cleanup()
      }
    })

    it('defaults to Code when no channel User dir exists', () => {
      const { ctx: sctx, cleanup } = createSandbox()
      try {
        expect(getConfigPath('global', sctx)).toBe(
          join(sctx.env.XDG_CONFIG_HOME!, 'Code', 'User', 'mcp.json'),
        )
      } finally {
        cleanup()
      }
    })

    it('respects channel order: Code wins over Insiders when both exist', () => {
      const { ctx: sctx, cleanup } = createSandbox()
      try {
        const base = sctx.env.XDG_CONFIG_HOME!
        mkdirSync(join(base, 'Code', 'User'), { recursive: true })
        mkdirSync(join(base, 'Code - Insiders', 'User'), { recursive: true })
        expect(getConfigPath('global', sctx)).toBe(
          join(base, 'Code', 'User', 'mcp.json'),
        )
      } finally {
        cleanup()
      }
    })
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
