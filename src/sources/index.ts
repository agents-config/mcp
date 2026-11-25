/**
 * Source resolution order (§10.5).
 *
 * Explicit flags → remote URL → `owner/repo` / GitHub URL → registry/npm. The
 * resolver never writes files; `commands/add.ts` owns persistence.
 */

import type {
  ResolvedServerPackage,
  SourceResolveOptions,
} from '$/src/sources/types'
import { resolveDirect } from '$/src/sources/direct'
import { resolveGithub } from '$/src/sources/github'
import { resolveRegistry } from '$/src/sources/registry'

export interface SourceOptions {
  command?: string
  arg?: string[]
  http?: string
  sse?: string
  env?: string[]
  header?: string[]
  cwd?: string
  name?: string
  source?: string
}

export async function resolveSource(
  options: SourceOptions,
  resolveOpts: SourceResolveOptions = {},
): Promise<ResolvedServerPackage> {
  const { fetch } = resolveOpts

  // 1. Explicit flags (direct source)
  if (
    options.command ||
    options.http ||
    options.sse ||
    options.arg?.length ||
    options.env?.length ||
    options.header?.length
  ) {
    return resolveDirect(options)
  }

  // 2. GitHub URL: https://github.com/owner/repo[/tree/ ref] or owner/repo[#ref]
  if (options.source) {
    const githubRef = parseGitHubRef(options.source)
    if (githubRef) {
      return resolveGithub(githubRef, {
        env: resolveOpts.env,
        fetch,
      })
    }
  }

  // 3. Other remote URL (https?://...)
  if (options.source && /^https?:\/\//.test(options.source)) {
    return resolveDirect({ http: options.source, name: options.name })
  }

  // 4. npm package (@scope/pkg or bare name) / MCP Registry query
  if (options.source) {
    return resolveRegistry(options.source, {
      env: resolveOpts.env,
      yes: resolveOpts.yes,
      selectCandidate: resolveOpts.selectCandidate,
      fetch,
    })
  }

  throw new Error(
    'No source specified. Pass --command/--http/--sse/--arg/--env/--header or a source argument.',
  )
}

/**
 * Parse a GitHub reference from `owner/repo[#ref]` or
 * `https://github.com/owner/repo[/tree/ ref][.git]`.
 * Returns `owner/repo[#ref]` or `null` when it is not a GitHub source.
 */
function parseGitHubRef(source: string): string | null {
  // Direct owner/repo[#ref]
  const ownerRepoMatch = source.match(/^([\w-]+)\/([\w.-]+)(#.+)?$/)
  if (ownerRepoMatch) {
    return source
  }

  // https://github.com/owner/repo[/tree/ ref][.git]
  const urlMatch = source.match(
    /^https?:\/\/github\.com\/([\w-]+)\/([\w.-]+?)(\/tree\/[^?#]+)?(\.git)?\/?(#.+)?$/,
  )
  if (urlMatch) {
    const [, owner, repo, , , hash] = urlMatch
    let ref = `${owner}/${repo}`
    if (hash) ref += hash
    return ref
  }

  return null
}
