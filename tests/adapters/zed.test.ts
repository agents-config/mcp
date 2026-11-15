import { describe, expect, it } from 'vitest'
import {
  compile,
  extractServers,
  applyServers,
  capabilities,
  getConfigPath,
  detect,
} from '$/src/adapters/zed'
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

describe('zed adapter identity', () => {
  it('capabilities', () => {
    expect(capabilities).toEqual({
      scopes: ['project', 'global'],
      format: 'jsonc',
      envSyntax: 'posix',
      nativeDefault: false,
      nativeDisabled: false,
      cwd: false,
    })
  })

  it('getConfigPath project and global', () => {
    expect(getConfigPath('project', ctx)).toBe('/tmp/proj/.zed/settings.json')
    expect(getConfigPath('global', ctx)).toBe(
      '/tmp/home/.config/zed/settings.json',
    )
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

describe('zed compile', () => {
  it('stdio server: nested command, ${VAR} unchanged', () => {
    const { entry, warnings } = compile({
      type: 'stdio',
      command: 'npx',
      args: ['-y', 'pkg'],
      env: { TOKEN: '${TOKEN}' },
    })
    expect(entry).toEqual({
      command: {
        path: 'npx',
        args: ['-y', 'pkg'],
        env: { TOKEN: '${TOKEN}' },
      },
    })
    expect(warnings).toEqual([])
  })

  it('streamable-http server', () => {
    const { entry } = compile({
      type: 'streamable-http',
      url: 'https://x/mcp',
    })
    expect(entry).toEqual({ url: 'https://x/mcp' })
  })

  it('sse server', () => {
    const { entry } = compile({
      type: 'sse',
      url: 'https://x/sse',
    })
    expect(entry).toEqual({ url: 'https://x/sse' })
  })
})

describe('zed extractServers', () => {
  it('extracts stdio (command.path) and streamable-http (url)', () => {
    const raw = JSON.stringify({
      context_servers: {
        gh: { command: { path: 'npx', args: ['-y', 'pkg'] } },
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
})

describe('zed applyServers', () => {
  it('writes context_servers and prunes previous managed', () => {
    const existing = JSON.stringify({
      context_servers: { old: { command: { path: 'old' } } },
    })
    const { content, managedNames } = applyServers(
      existing,
      { gh: { type: 'stdio', command: 'npx', args: [] } },
      { ...ctx, scope: 'project', previousManagedNames: new Set(['old']) },
    )
    expect(managedNames).toEqual(['gh'])
    const parsed = JSON.parse(content)
    expect(parsed.context_servers.gh).toEqual({
      command: { path: 'npx' },
    })
    expect(parsed.context_servers.old).toBeUndefined()
  })
})
