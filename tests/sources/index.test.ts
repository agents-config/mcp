import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { resolveSource } from '$/src/sources/index'
import { resolveDirect } from '$/src/sources/direct'
import type { ResolvedServerPackage } from '$/src/sources/types'

const originalFetch = global.fetch

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

describe('sources index', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', originalFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('dispatches direct flags to resolveDirect', async () => {
    const result = await resolveSource({
      command: 'npx',
      arg: ['-y', '@scope/pkg'],
      name: 'my-server',
    })
    expect(result.source.type).toBe('direct')
    expect(result.suggestedName).toBe('my-server')
  })

  it('includes sse in direct-flag dispatch', async () => {
    const result = await resolveSource({
      sse: 'https://mcp.linear.app/sse',
      name: 'linear',
    })
    expect(result.source.type).toBe('direct')
    expect(result.suggestedName).toBe('linear')
  })

  it('routes https://github.com/owner/repo to resolveGithub', async () => {
    const fetchMock = vi.fn(async () =>
      responseFactory(
        {
          name: 'server-github',
          registry_type: 'npm',
          identifier: '@modelcontextprotocol/server-github',
        },
        200,
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveSource({
      source: 'https://github.com/modelcontextprotocol/server-github',
      name: 'my-github',
    })

    expect(result.source.type).toBe('github')
    expect(result.suggestedName).toBe('server-github')
    expect(fetchMock).toHaveBeenCalled()
  })

  it('routes owner/repo to resolveGithub', async () => {
    const fetchMock = vi.fn(async () =>
      responseFactory(
        {
          name: 'server-github',
          registry_type: 'npm',
          identifier: '@modelcontextprotocol/server-github',
        },
        200,
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveSource({
      source: 'modelcontextprotocol/server-github',
    })

    expect(result.source.type).toBe('github')
    expect(fetchMock).toHaveBeenCalled()
  })

  it('routes other https URLs to resolveDirect as http', async () => {
    const result = await resolveSource({
      source: 'https://mcp.example.com/mcp',
      name: 'remote',
    })
    expect(result.source.type).toBe('direct')
    expect(result.suggestedName).toBe('remote')
  })

  it('routes bare package name to resolveRegistry', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('registry.npmjs.org')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          servers: [
            {
              name: 'server-query',
              packages: [{ name: 'server-query', type: 'npm' }],
            },
          ],
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveSource({ source: 'server-query' })

    expect(result.source.type).toBe('registry')
    expect(result.suggestedName).toBe('server-query')
  })

  it('forwards env to resolvers', async () => {
    const fetchMock = vi.fn(async () =>
      responseFactory(
        {
          name: 'server-env',
          registry_type: 'npm',
          identifier: 'server-env',
          environment_variables: [{ name: 'API_KEY', is_required: true }],
        },
        200,
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveSource(
      { source: 'owner/server-env' },
      { env: { GITHUB_TOKEN: 'ghp_token' } },
    )

    expect(result.source.type).toBe('github')
    expect(fetchMock).toHaveBeenCalled()
  })

  it('throws when no source specified', async () => {
    await expect(resolveSource({})).rejects.toThrow('No source specified')
  })

  it('passes fetch injection through to resolvers', async () => {
    const injectedFetch = vi.fn(async () =>
      responseFactory(
        {
          name: 'server-github',
          registry_type: 'npm',
          identifier: '@modelcontextprotocol/server-github',
        },
        200,
      ),
    )
    vi.stubGlobal('fetch', originalFetch)

    await resolveSource(
      { source: 'https://github.com/owner/repo' },
      { fetch: injectedFetch },
    )

    expect(injectedFetch).toHaveBeenCalled()
  })
})
