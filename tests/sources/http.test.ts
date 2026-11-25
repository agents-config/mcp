import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fetchJson } from '$/src/sources/http'

const originalFetch = global.fetch

type FetchMock = ReturnType<typeof vi.fn> & {
  mock: {
    calls: Array<[url: string, init?: RequestInit]>
  }
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

describe('sources http', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', originalFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches JSON and returns parsed body', async () => {
    const fetchMock = vi.fn(async () => responseFactory({ hello: 'world' }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchJson('https://api.example.com/data')

    expect(result).toEqual({ hello: 'world' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('sends User-Agent header with package version', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      responseFactory({ ok: true }),
    ) as unknown as FetchMock
    vi.stubGlobal('fetch', fetchMock)

    await fetchJson('https://api.example.com/data')

    const init = fetchMock.mock.calls[0]?.[1]
    const headers = init?.headers as Record<string, string>
    expect(headers['User-Agent']).toMatch(/^agents-mcp\/\d+\.\d+\.\d+$/)
  })

  it('sends Authorization Bearer GITHUB_TOKEN for api.github.com', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      responseFactory({ ok: true }),
    ) as unknown as FetchMock
    vi.stubGlobal('fetch', fetchMock)

    await fetchJson('https://api.github.com/repos/owner/repo', {
      env: { GITHUB_TOKEN: 'ghp_secret123' },
    })

    const init = fetchMock.mock.calls[0]?.[1]
    const headers = init?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer ghp_secret123')
  })

  it('sends Authorization Bearer GITHUB_TOKEN for raw.githubusercontent.com', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      responseFactory({ ok: true }),
    ) as unknown as FetchMock
    vi.stubGlobal('fetch', fetchMock)

    await fetchJson(
      'https://raw.githubusercontent.com/owner/repo/main/server.json',
      {
        env: { GITHUB_TOKEN: 'ghp_secret123' },
      },
    )

    const init = fetchMock.mock.calls[0]?.[1]
    const headers = init?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer ghp_secret123')
  })

  it('does not send Authorization for non-GitHub URLs', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      responseFactory({ ok: true }),
    ) as unknown as FetchMock
    vi.stubGlobal('fetch', fetchMock)

    await fetchJson('https://api.example.com/data', {
      env: { GITHUB_TOKEN: 'ghp_secret123' },
    })

    const init = fetchMock.mock.calls[0]?.[1]
    const headers = init?.headers as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
  })

  it('does not send Authorization when GITHUB_TOKEN is not set', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      responseFactory({ ok: true }),
    ) as unknown as FetchMock
    vi.stubGlobal('fetch', fetchMock)

    await fetchJson('https://api.github.com/repos/owner/repo')

    const init = fetchMock.mock.calls[0]?.[1]
    const headers = init?.headers as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
  })

  it('throws on non-ok HTTP status', async () => {
    const fetchMock = vi.fn(async () => responseFactory('Not Found', 404))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchJson('https://api.example.com/missing')).rejects.toThrow(
      'HTTP 404',
    )
  })

  it('retries on 5xx with exponential backoff', async () => {
    let calls = 0
    const fetchMock = vi.fn(async () => {
      calls += 1
      if (calls < 3) {
        return responseFactory('Server Error', 500)
      }
      return responseFactory({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchJson('https://api.example.com/data')

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('retries on 429 respecting Retry-After header', async () => {
    let calls = 0
    const fetchMock = vi.fn(async () => {
      calls += 1
      if (calls === 1) {
        return responseFactory('Too Many Requests', 429, {
          'Retry-After': '2',
        })
      }
      return responseFactory({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    const start = Date.now()
    await fetchJson('https://api.example.com/data')
    const elapsed = Date.now() - start

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(elapsed).toBeGreaterThanOrEqual(1900) // ~2s delay
  }, 10000)

  it('caps Retry-After delay at 5s', async () => {
    let calls = 0
    const fetchMock = vi.fn(async () => {
      calls += 1
      if (calls === 1) {
        return responseFactory('Too Many Requests', 429, {
          'Retry-After': '100',
        })
      }
      return responseFactory({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    const start = Date.now()
    await fetchJson('https://api.example.com/data')
    const elapsed = Date.now() - start

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(elapsed).toBeLessThan(6000) // capped at 5s
  }, 10000)

  it('retries on transient network errors', async () => {
    let calls = 0
    const fetchMock = vi.fn(async () => {
      calls += 1
      if (calls < 3) {
        throw new Error('fetch failed: ECONNREFUSED')
      }
      return responseFactory({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchJson('https://api.example.com/data')

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  }, 10000)

  it('gives up after max retries on persistent 5xx', async () => {
    const fetchMock = vi.fn(async () => responseFactory('Server Error', 500))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchJson('https://api.example.com/data')).rejects.toThrow(
      'HTTP 500',
    )
    expect(fetchMock).toHaveBeenCalledTimes(3) // initial + 2 retries
  }, 10000)

  it('enforces 2 MiB response cap', async () => {
    const bigResponse = 'x'.repeat(3 * 1024 * 1024) // 3 MiB
    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => bigResponse,
        json: async () => JSON.parse(bigResponse),
      } as unknown as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchJson('https://api.example.com/big')).rejects.toThrow(
      'too large',
    )
  })

  it('injects fetch via opts for testability', async () => {
    const globalFetchSpy = vi.spyOn(globalThis, 'fetch')
    const injectedFetch = vi.fn(async () => responseFactory({ injected: true }))

    const result = await fetchJson('https://api.example.com/data', {
      fetch: injectedFetch,
    })

    expect(result).toEqual({ injected: true })
    expect(injectedFetch).toHaveBeenCalledTimes(1)
    // global fetch should NOT have been called
    expect(globalFetchSpy).not.toHaveBeenCalled()
    globalFetchSpy.mockRestore()
  })

  it('passes AbortSignal to fetch', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      responseFactory({ ok: true }),
    ) as unknown as FetchMock
    vi.stubGlobal('fetch', fetchMock)

    await fetchJson('https://api.example.com/data')

    const init = fetchMock.mock.calls[0]?.[1]
    expect(init?.signal).toBeDefined()
  })
})
