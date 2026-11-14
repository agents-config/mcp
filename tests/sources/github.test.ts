import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { resolveGithub } from '$/src/sources/github'
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

describe('sources github', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', originalFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves owner/repo via server.json on main branch', async () => {
    mockFetch({
      name: 'server-github',
      registry_type: 'npm',
      identifier: '@modelcontextprotocol/server-github',
      environment_variables: [{ name: 'GITHUB_TOKEN', is_secret: true }],
    })

    const result = await resolveGithub('modelcontextprotocol/server-github')

    expect(result.suggestedName).toBe('server-github')
    const s = asStdio(result.definition)
    expect(s.transport).toBe('stdio')
    expect(s.command).toBe('npx -y @modelcontextprotocol/server-github')
    expect(result.requiredEnv).toHaveLength(1)
    expect(result.requiredEnv[0]!.name).toBe('GITHUB_TOKEN')
    expect(result.requiredEnv[0]!.isSecret).toBe(true)
  })

  it('resolves via package.json bin when no server.json', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('server.json')) {
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
            name: 'test-pkg',
            bin: { 'test-pkg': 'dist/index.js' },
          }),
        json: async () => ({
          name: 'test-pkg',
          bin: { 'test-pkg': 'dist/index.js' },
        }),
      } as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveGithub('owner/test-pkg')

    expect(result.suggestedName).toBe('test-pkg')
    const s = asStdio(result.definition)
    expect(s.transport).toBe('stdio')
    expect(s.command).toBe('npx -y test-pkg')
  })

  it('throws when repo is not an MCP server', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('server.json')) {
        return {
          ok: false,
          status: 404,
          text: async () => 'Not Found',
        } as Response
      }
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ name: 'not-mcp' }),
        json: async () => ({ name: 'not-mcp' }),
      } as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveGithub('owner/not-mcp')).rejects.toThrow(
      'is not an MCP server',
    )
  })
})
