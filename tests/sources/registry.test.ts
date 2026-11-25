import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { resolveRegistry } from '$/src/sources/registry'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'

const originalFetch = global.fetch

function asStdio(server: CanonicalServer) {
  return server as Extract<CanonicalServer, { type: 'stdio' }>
}

function asHttp(server: CanonicalServer) {
  return server as Extract<
    CanonicalServer,
    { type: 'streamable-http' } | { type: 'sse' }
  >
}

function responseFactory(
  response: unknown,
  status = 200,
  extra?: Record<string, string>,
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(extra ?? {}),
    text: async () => JSON.stringify(response),
    json: async () => response,
  } as unknown as Response
}

describe('sources registry', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', originalFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves @scope/name via npm registry', async () => {
    const fetchMock = vi.fn(async () =>
      responseFactory({
        name: '@modelcontextprotocol/server-github',
        'dist-tags': { latest: '0.1.0' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('@modelcontextprotocol/server-github')

    expect(result.suggestedName).toBe('@modelcontextprotocol/server-github')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', '@modelcontextprotocol/server-github@0.1.0'])
  })

  it('resolves bare package name via npm registry', async () => {
    const fetchMock = vi.fn(async () =>
      responseFactory({
        name: 'server-github',
        'dist-tags': { latest: '1.0.0' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server-github')

    expect(result.suggestedName).toBe('server-github')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', 'server-github@1.0.0'])
  })

  it('resolves bare package name without dist-tags', async () => {
    const fetchMock = vi.fn(async () =>
      responseFactory({ name: 'server-github' }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server-github')

    expect(result.suggestedName).toBe('server-github')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', 'server-github'])
  })

  it('resolves via MCP Registry search when not on npm', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            {
              name: 'server-linear',
              packages: [{ name: 'server-linear', type: 'npm' }],
            },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server-linear')

    expect(result.suggestedName).toBe('server-linear')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', 'server-linear'])
  })

  it('interprets MCP Registry packages with pypi type', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            {
              name: 'server-pypi',
              packages: [{ name: 'mcp-server-pypi', type: 'pypi' }],
            },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server-pypi')

    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('uvx')
    expect(s.args).toEqual(['mcp-server-pypi'])
  })

  it('interprets MCP Registry packages with oci type', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            {
              name: 'server-oci',
              packages: [{ name: 'myorg/mcp-server:latest', type: 'oci' }],
            },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server-oci')

    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('docker')
    expect(s.args).toEqual(['run', '-i', '--rm', 'myorg/mcp-server:latest'])
  })

  it('interprets MCP Registry remotes as streamable-http', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            {
              name: 'remote-http',
              remotes: [
                {
                  type: 'streamable-http',
                  url: 'https://mcp.example.com/mcp',
                  headers: { 'X-API-Key': 'secret' },
                },
              ],
            },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('remote-http')

    const s = asHttp(result.definition)
    expect(isHttpServer(s)).toBe(true)
    expect(s.type).toBe('streamable-http')
    expect(s.url).toBe('https://mcp.example.com/mcp')
    expect(s.headers).toEqual({ 'X-API-Key': 'secret' })
  })

  it('interprets MCP Registry remotes as sse', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            {
              name: 'remote-sse',
              remotes: [{ type: 'sse', url: 'https://mcp.example.com/sse' }],
            },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('remote-sse')

    const s = asHttp(result.definition)
    expect(isHttpServer(s)).toBe(true)
    expect(s.type).toBe('sse')
    expect(s.url).toBe('https://mcp.example.com/sse')
  })

  it('exact name match wins automatically (case-insensitive)', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            {
              name: 'Server-Linear',
              packages: [{ name: 'server-linear', type: 'npm' }],
            },
            {
              name: 'server-other',
              packages: [{ name: 'server-other', type: 'npm' }],
            },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server-linear')

    expect(result.suggestedName).toBe('Server-Linear')
    const s = asStdio(result.definition)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', 'server-linear'])
  })

  it('fails with ambiguous candidates under --yes=false', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            { name: 'server-a', packages: [{ name: 'server-a', type: 'npm' }] },
            { name: 'server-b', packages: [{ name: 'server-b', type: 'npm' }] },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveRegistry('server', { yes: false })).rejects.toThrow(
      'Ambiguous registry match',
    )
  })

  it('selects first candidate under --yes=true', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            { name: 'server-a', packages: [{ name: 'server-a', type: 'npm' }] },
            { name: 'server-b', packages: [{ name: 'server-b', type: 'npm' }] },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveRegistry('server', { yes: true })

    expect(result.suggestedName).toBe('server-a')
  })

  it('uses selectCandidate callback when provided', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            { name: 'server-a', packages: [{ name: 'server-a', type: 'npm' }] },
            { name: 'server-b', packages: [{ name: 'server-b', type: 'npm' }] },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const selectCandidate = vi.fn(async (candidates) => {
      expect(candidates).toHaveLength(2)
      return candidates[1] // pick second
    })

    const result = await resolveRegistry('server', {
      yes: false,
      selectCandidate,
    })

    expect(selectCandidate).toHaveBeenCalledTimes(1)
    expect(result.suggestedName).toBe('server-b')
  })

  it('throws when selectCandidate returns null', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            { name: 'server-a', packages: [{ name: 'server-a', type: 'npm' }] },
            { name: 'server-b', packages: [{ name: 'server-b', type: 'npm' }] },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      resolveRegistry('server', {
        yes: false,
        selectCandidate: async () => null,
      }),
    ).rejects.toThrow('No candidate selected')
  })

  it('throws when no results found', async () => {
    const fetchMock = vi.fn(async () => responseFactory('Not Found', 404))
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveRegistry('nonexistent-package')).rejects.toThrow(
      'No MCP server found',
    )
  })
})
