/**
 * Shared resilient HTTP client (§10.1).
 *
 * `fetchJson(url, opts?)` is the single network primitive used by every
 * source resolver. It enforces a 10s timeout, a 2 MiB response cap, sends a
 * `User-Agent: agents-mcp/<version>` header, optionally attaches
 * `Authorization: Bearer <GITHUB_TOKEN>` for GitHub endpoints, and retries
 * (bounded exponential backoff, max 2 retries) on HTTP `429`/`5xx` and
 * transient network errors.
 *
 * The `fetch` function is injectable via `opts.fetch` so tests never make
 * live network calls.
 */

import pkg from '$/package.json' with { type: 'json' }

const VERSION = pkg.version as string
const TIMEOUT_MS = 10_000
const RESPONSE_CAP = 2 * 1024 * 1024 // 2 MiB
const MAX_RETRIES = 2

export interface FetchJsonOptions {
  /** Optional injected `fetch` (tests pass a mock here). */
  fetch?: typeof fetch
  /** Extra headers merged on top of the defaults. */
  headers?: Record<string, string>
  /** Environment record used to resolve `GITHUB_TOKEN`. */
  env?: Record<string, string>
  /** External abort signal. */
  signal?: AbortSignal
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function combineSignals(
  ...signals: (AbortSignal | undefined | null)[]
): AbortSignal | undefined {
  const active = signals.filter(
    (s): s is AbortSignal => s !== null && s !== undefined && !s.aborted,
  )
  if (active.length === 0) return undefined
  if (active.length === 1) return active[0]
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  for (const s of active) {
    s.addEventListener('abort', onAbort, { once: true })
  }
  controller.signal.addEventListener(
    'abort',
    () => {
      for (const s of active) {
        s.removeEventListener('abort', onAbort)
      }
    },
    { once: true },
  )
  return controller.signal
}

function isTransientError(err: unknown): boolean {
  if (err instanceof Error) {
    const name = err.name
    const message = err.message
    return (
      name === 'AbortError' ||
      name === 'TypeError' ||
      message.includes('fetch') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ENOTFOUND') ||
      message.includes('ETIMEDOUT') ||
      message.includes('network')
    )
  }
  return false
}

export async function fetchJson(
  url: string,
  opts: FetchJsonOptions = {},
): Promise<unknown> {
  const { fetch: injectedFetch, headers: extraHeaders, env, signal } = opts
  const fetchFn = injectedFetch ?? (globalThis.fetch as typeof fetch)

  const headers: Record<string, string> = {
    'User-Agent': `agents-mcp/${VERSION}`,
    ...extraHeaders,
  }

  const githubToken = env?.GITHUB_TOKEN
  if (
    githubToken &&
    (url.includes('api.github.com') ||
      url.includes('raw.githubusercontent.com'))
  ) {
    headers['Authorization'] = `Bearer ${githubToken}`
  }

  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), TIMEOUT_MS)
  const combinedSignal = combineSignals(signal, timeoutController.signal)

  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchFn(url, {
        signal: combinedSignal,
        headers,
      })
      if (res.ok) {
        const text = await res.text()
        if (text.length > RESPONSE_CAP) {
          throw new Error(`Response too large (>2 MiB) for ${url}`)
        }
        return JSON.parse(text)
      }

      const status = res.status
      const canRetry = attempt < MAX_RETRIES
      const retryAfterHeader =
        res.headers && typeof res.headers.get === 'function'
          ? res.headers.get('Retry-After')
          : undefined

      if (canRetry && (status === 429 || status >= 500)) {
        let delayMs = 0
        if (retryAfterHeader !== null && retryAfterHeader !== undefined) {
          const parsed = Number(retryAfterHeader)
          delayMs = Number.isFinite(parsed) ? Math.max(parsed, 0) * 1000 : 0
          delayMs = Math.min(delayMs, 5000) // capped at 5s
        } else {
          delayMs = Math.pow(2, attempt) * 1000 // 1s, 2s
        }
        await sleep(delayMs)
        continue
      }

      throw new Error(`HTTP ${status} for ${url}`)
    } catch (err) {
      lastError = err
      const canRetry = attempt < MAX_RETRIES
      if (canRetry && isTransientError(err)) {
        const delayMs = Math.pow(2, attempt) * 1000 // 1s, 2s
        await sleep(delayMs)
        continue
      }
      throw err
    }
  }

  clearTimeout(timeoutId)
  throw lastError
}
