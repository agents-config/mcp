import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { resolveRegistry } from '$/src/sources/registry'
import type { CanonicalServer } from '$/src/core/schema'

const originalFetch = global.fetch

function mockFetch(response: unknown, status = 200) {
  return vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        ({
          ok: status >= 200 && status < 300,
          status,
          text: async () => JSON.stringify(response),
          json: async () => response,
        }) as Response,
    ),
  )
}

function asStdio(server: CanonicalServer) {
  return server as Extract<CanonicalServer, { transport: 'stdio' }>
}

describe('sources registry', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', originalFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves @scope/name via npm registry', async () => {
    mockFetch({
      name: '@modelcontextprotocol/server-github',
      'dist-tags': { latest: '0.1.0' },
    })

    const result = await resolveRegistry('@modelcontextprotocol/server-github')

    expect(result.suggestedName).toBe('@modelcontextprotocol/server-github')
    const s = asStdio(result.definition)
    expect(s.transport).toBe('stdio')
    expect(s.command).toBe('npx -y @modelcontextprotocol/server-github@0.1.0')
  })

  it('resolves bare package name via npm registry', async () => {
    mockFetch({ name: 'server-github', 'dist-tags': { latest: '1.0.0' } })

    const result = await resolveRegistry('server-github')

    expect(result.suggestedName).toBe('server-github')
    const s = asStdio(result.definition)
    expect(s.command).toBe('npx -y server-github@1.0.0')
  })

  it('resolves via MCP Registry search when not on npm', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return {
          ok: false,
          status: 404,
          text: async () => 'Not Found',
        } as Response
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({ servers: [{ name: 'server-linear' }] }),
        json: async () => ({ servers: [{ name: 'server-linear' }] }),
      } as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server-linear')

    expect(result.suggestedName).toBe('server-linear')
    const s = asStdio(result.definition)
    expect(s.transport).toBe('stdio')
    expect(s.command).toBe('npx -y server-linear')
  })

  it('fails with ambiguous candidates under --yes=false', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return {
          ok: false,
          status: 404,
          text: async () => 'Not Found',
        } as Response
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            servers: [{ name: 'server-a' }, { name: 'server-b' }],
          }),
        json: async () => ({
          servers: [{ name: 'server-a' }, { name: 'server-b' }],
        }),
      } as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveRegistry('server', { yes: false })).rejects.toThrow(
      'Ambiguous registry match',
    )
  })

  it('selects first candidate under --yes=true', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return {
          ok: false,
          status: 404,
          text: async () => 'Not Found',
        } as Response
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            servers: [{ name: 'server-a' }, { name: 'server-b' }],
          }),
        json: async () => ({
          servers: [{ name: 'server-a' }, { name: 'server-b' }],
        }),
      } as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server', { yes: true })

    expect(result.suggestedName).toBe('server-a')
  })

  it('throws when no results found', async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      } as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveRegistry('nonexistent-package')).rejects.toThrow(
      'No MCP server found',
    )
  })
})
