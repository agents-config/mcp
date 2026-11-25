import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { resolveGithub } from '$/src/sources/github'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer } from '$/src/core/schema'

const originalFetch = global.fetch

function asStdio(server: CanonicalServer) {
  return server as Extract<CanonicalServer, { type: 'stdio' }>
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

describe('sources github', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', originalFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves owner/repo via server.json on main branch', async () => {
    const fetchMock = vi.fn(async () =>
      responseFactory(
        {
          name: 'server-github',
          registry_type: 'npm',
          identifier: '@modelcontextprotocol/server-github',
          environment_variables: [
            { name: 'GITHUB_TOKEN', is_required: true, is_secret: true },
          ],
        },
        200,
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveGithub('modelcontextprotocol/server-github')

    expect(result.suggestedName).toBe('server-github')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', '@modelcontextprotocol/server-github'])
    expect(result.requiredEnv).toHaveLength(1)
    expect(result.requiredEnv[0]!.name).toBe('GITHUB_TOKEN')
    expect(result.requiredEnv[0]!.isSecret).toBe(true)
    expect(result.requiredEnv[0]!.description).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('resolves via package.json bin when no server.json', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('server.json')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory(
        {
          name: 'test-pkg',
          bin: { 'test-pkg': 'dist/index.js' },
        },
        200,
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveGithub('owner/test-pkg')

    expect(result.suggestedName).toBe('test-pkg')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', 'test-pkg'])
  })

  it('throws when repo is not an MCP server', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('server.json')) {
        return responseFactory('Not Found', 404)
      }
      return responseFactory({ name: 'not-mcp' }, 200)
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveGithub('owner/not-mcp')).rejects.toThrow(
      'is not an MCP server',
    )
  })

  it('accepts https://github.com/owner/repo URL and strips .git', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('server.json')) {
        return responseFactory(
          {
            name: 'server-linear',
            registry_type: 'npm',
            identifier: 'server-linear',
          },
          200,
        )
      }
      return responseFactory('Not Found', 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveGithub(
      'https://github.com/modelcontextprotocol/server-linear.git',
    )

    expect(result.suggestedName).toBe('server-linear')
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', 'server-linear'])
  })

  it('strips /tree/ref from GitHub URL', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('server.json')) {
        return responseFactory(
          {
            name: 'server-pypi',
            registry_type: 'pypi',
            identifier: 'mcp-server-pypi',
          },
          200,
        )
      }
      return responseFactory('Not Found', 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveGithub(
      'https://github.com/owner/server-pypi/tree/v1.0.0#main',
    )

    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('uvx')
    expect(s.args).toEqual(['mcp-server-pypi'])
  })

  it('uses oci docker command for registry_type oci', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('server.json')) {
        return responseFactory(
          {
            name: 'server-oci',
            registry_type: 'oci',
            identifier: 'myorg/mcp-server:latest',
          },
          200,
        )
      }
      return responseFactory('Not Found', 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveGithub('owner/server-oci')

    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('docker')
    expect(s.args).toEqual(['run', '-i', '--rm', 'myorg/mcp-server:latest'])
  })

  it('parses environment_variables with is_required', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('server.json')) {
        return responseFactory(
          {
            name: 'server-env',
            registry_type: 'npm',
            identifier: 'server-env',
            environment_variables: [
              { name: 'API_KEY', is_required: true, is_secret: true },
              { name: 'OPTIONAL_VAR', is_required: false },
              { name: 'REQUIRED_DESC', is_required: true, description: 'desc' },
            ],
          },
          200,
        )
      }
      return responseFactory('Not Found', 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveGithub('owner/server-env')

    expect(result.requiredEnv).toHaveLength(2)
    expect(result.requiredEnv.map((e) => e.name)).toEqual([
      'API_KEY',
      'REQUIRED_DESC',
    ])
    expect(result.requiredEnv[0]!.isSecret).toBe(true)
    expect(result.requiredEnv[1]!.isSecret).toBe(false)
    expect(result.requiredEnv[1]!.description).toBe('desc')

    const s = asStdio(result.definition)
    expect(s.env).toMatchObject({
      API_KEY: '${API_KEY}',
      REQUIRED_DESC: '${REQUIRED_DESC}',
    })
  })

  it('graceful error on malformed server.json', async () => {
    const fetchMock = vi.fn(async () =>
      responseFactory(
        {
          environment_variables: [{ name: '' }],
        },
        200,
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveGithub('owner/malformed')).rejects.toThrow(
      'Invalid server.json',
    )
  })

  it('throws invalid ref for bad input', async () => {
    await expect(resolveGithub('invalid')).rejects.toThrow('Invalid GitHub ref')
  })
})
