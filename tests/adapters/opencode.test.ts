import { describe, expect, it } from 'vitest'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import {
  compile,
  extractServers,
  applyServers,
  capabilities,
  getConfigPath,
} from '$/src/adapters/opencode'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'
import { join } from 'node:path'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

describe('opencode adapter identity', () => {
  it('capabilities', () => {
    expect(capabilities).toEqual({
      scopes: ['project', 'global'],
      format: 'jsonc',
      envSyntax: 'brace-env',
      nativeDefault: false,
      nativeDisabled: true,
      cwd: false,
      layout: 'single-file',
      rootKey: 'mcp',
    })
  })

  it('getConfigPath project and global', () => {
    expect(getConfigPath('project', ctx)).toBe('/tmp/proj/opencode.json')
    // linux (default platform in CI), no XDG_CONFIG_HOME → ~/.config/opencode/opencode.json
    expect(getConfigPath('global', ctx)).toBe(
      '/tmp/home/.config/opencode/opencode.json',
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
        '/home/alex/.config/opencode/opencode.json',
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
        '/home/alex/.config/opencode/opencode.json',
      )
    })

    it('darwin uses ~/.config/opencode (not Library)', () => {
      const darwinCtx = createRuntimeContext({
        cwd: '/tmp/proj',
        homeDir: '/Users/alex',
        platform: 'darwin',
        env: {},
        isTTY: false,
      })
      expect(getConfigPath('global', darwinCtx)).toBe(
        '/Users/alex/.config/opencode/opencode.json',
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
        'C:\\Users\\alex\\AppData\\Roaming\\opencode\\opencode.json',
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
        'C:\\Users\\alex\\AppData\\Roaming\\opencode\\opencode.json',
      )
    })
  })
})

describe('opencode compile', () => {
  it('stdio server: merged command array, {env:VAR}', () => {
    const { entry, warnings } = compile({
      type: 'stdio',
      command: 'npx',
      args: ['-y', '${ARG:-fallback}'],
      env: { TOKEN: '${TOKEN}' },
    })
    expect(entry).toEqual({
      type: 'local',
      command: ['npx', '-y', '{env:ARG}'],
      environment: { TOKEN: '{env:TOKEN}' },
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]!.code).toBe('DEFAULT_DROPPED')
  })

  it('streamable-http server: serverUrl, {env:VAR}', () => {
    const { entry } = compile({
      type: 'streamable-http',
      url: 'https://x/mcp',
      headers: { Authorization: 'Bearer ${KEY}' },
    })
    expect(entry).toEqual({
      type: 'remote',
      url: 'https://x/mcp',
      headers: { Authorization: 'Bearer {env:KEY}' },
    })
  })

  it('sse server: serverUrl, {env:VAR}', () => {
    const { entry } = compile({
      type: 'sse',
      url: 'https://x/sse',
      headers: { Authorization: 'Bearer ${KEY}' },
    })
    expect(entry).toEqual({
      type: 'remote',
      url: 'https://x/sse',
      headers: { Authorization: 'Bearer {env:KEY}' },
    })
  })
})

describe('opencode extractServers', () => {
  it('extracts local and remote entries', () => {
    const raw = JSON.stringify({
      mcp: {
        gh: {
          type: 'local',
          command: ['npx', 'pkg'],
          environment: { T: '${T}' },
          enabled: true,
        },
        lin: { type: 'remote', url: 'https://x/mcp', enabled: true },
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
    expect(gh.args).toEqual(['pkg'])
    expect(isHttpServer(lin)).toBe(true)
    expect(lin.type).toBe('streamable-http')
    expect(lin.url).toBe('https://x/mcp')
    expect(warnings).toEqual([])
  })

  it('imports serverUrl-only as streamable-http with TRANSPORT_INFERRED', () => {
    const raw = JSON.stringify({ mcp: { lin: { serverUrl: 'https://x/mcp' } } })
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

describe('opencode applyServers', () => {
  it('writes mcp key and prunes previous managed', () => {
    const existing = JSON.stringify({
      mcp: { old: { type: 'local', command: ['old'], enabled: true } },
    })
    const { content, managedNames } = applyServers(
      existing,
      { gh: { type: 'stdio', command: 'npx', args: [] } },
      { ...ctx, scope: 'project', previousManagedNames: new Set(['old']) },
    )
    expect(managedNames).toEqual(['gh'])
    const parsed = JSON.parse(content)
    expect(parsed.mcp.gh).toEqual({
      type: 'local',
      command: ['npx'],
    })
    expect(parsed.mcp.old).toBeUndefined()
  })
})
