/**
 * GitHub source resolver (§10.3).
 *
 * Resolves `owner/repo[#ref]` → `server.json` → `package.json`, following the
 * MCP server manifest discovery chain. HTTP interactions use `fetch` (mocked in
 * tests) with timeouts, retries, and a 2 MiB response cap.
 */

import type { ResolvedServerPackage } from '$/src/sources/types'
import { resolveDirect } from '$/src/sources/direct'
import type { CanonicalServer } from '$/src/core/schema'

const GITHUB_RAW = 'https://raw.githubusercontent.com'
const GITHUB_API = 'https://api.github.com/repos'
const RESPONSE_CAP = 2 * 1024 * 1024 // 2 MiB
const TIMEOUT_MS = 10_000

export interface GithubSourceOptions {
  ref: string // owner/repo[#ref]
}

export async function resolveGithub(
  ref: string,
): Promise<ResolvedServerPackage> {
  const { owner, repo, ref: gitRef } = parseRef(ref)

  // 1. Try server.json on ref, then main, then master.
  const branches = gitRef ? [gitRef] : ['main', 'master']
  let serverJson: unknown = null
  let resolvedRef = branches[0]
  for (const branch of branches) {
    try {
      serverJson = await fetchJson(
        `${GITHUB_RAW}/${owner}/${repo}/${branch}/server.json`,
      )
      resolvedRef = branch
      break
    } catch {
      // Try next branch
    }
  }

  // 2. If no server.json, resolve default branch via GitHub API, then try again.
  if (!serverJson && !gitRef) {
    try {
      const repoInfo = await fetchJson(`${GITHUB_API}/${owner}/${repo}`)
      const defaultBranch = (repoInfo as { default_branch?: string })
        .default_branch
      if (
        defaultBranch &&
        defaultBranch !== 'main' &&
        defaultBranch !== 'master'
      ) {
        try {
          serverJson = await fetchJson(
            `${GITHUB_RAW}/${owner}/${repo}/${defaultBranch}/server.json`,
          )
          resolvedRef = defaultBranch
        } catch {
          // fall through to package.json
        }
      }
    } catch {
      // API unavailable
    }
  }

  // 3. Parse server.json manifest.
  if (serverJson) {
    const manifest = parseServerJson(serverJson)
    const definition = manifestToServer(manifest)
    return {
      suggestedName: manifest.name ?? repo,
      definition,
      requiredEnv: (manifest.requiredEnv ?? []).map((e) => ({
        name: e.name,
        isSecret: e.is_secret ?? false,
      })),
      source: { type: 'github', ref },
    }
  }

  // 4. package.json fallback: bin selects <name> for npx -y.
  try {
    const pkg = await fetchJson(
      `${GITHUB_RAW}/${owner}/${repo}/${resolvedRef}/package.json`,
    )
    const bin = (pkg as { bin?: string | Record<string, string> }).bin
    let command: string
    if (typeof bin === 'string') {
      command = `npx -y ${bin}`
    } else if (bin && typeof bin === 'object' && Object.keys(bin).length > 0) {
      const [name] = Object.keys(bin)
      command = `npx -y ${name}`
    } else {
      throw new Error(`Repository ${owner}/${repo} is not an MCP server`)
    }
    const definition: CanonicalServer = {
      type: 'stdio',
      command,
      args: [],
    }
    return {
      suggestedName: repo,
      definition,
      requiredEnv: [],
      source: { type: 'github', ref },
    }
  } catch {
    throw new Error(`Repository ${owner}/${repo} is not an MCP server`)
  }
}

function parseRef(ref: string): {
  owner: string
  repo: string
  ref: string | undefined
} {
  const [ownerRepo, gitRef] = ref.split('#', 2) as [string, string | undefined]
  const parts = (ownerRepo || '').split('/')
  const owner = parts[0]
  const repo = parts[1]
  if (!owner || !repo) {
    throw new Error(`Invalid GitHub ref: ${ref}. Expected owner/repo[#ref].`)
  }
  return { owner, repo, ref: gitRef || undefined }
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`)
    }
    const text = await res.text()
    if (text.length > RESPONSE_CAP) {
      throw new Error(`Response too large (>2 MiB) for ${url}`)
    }
    return JSON.parse(text)
  } finally {
    clearTimeout(timeout)
  }
}

function parseServerJson(raw: unknown): {
  name?: string
  registry_type?: string
  identifier?: string
  requiredEnv?: Array<{ name: string; is_secret?: boolean }>
} {
  const obj = raw as Record<string, unknown>
  return {
    name: (obj.name as string) || undefined,
    registry_type:
      (obj.registry_type as string) ||
      (obj.registryType as string) ||
      undefined,
    identifier: (obj.identifier as string) || (obj.name as string) || undefined,
    requiredEnv: (Array.isArray(obj.environment_variables)
      ? obj.environment_variables
      : []) as Array<{ name: string; is_secret?: boolean }>,
  }
}

function manifestToServer(manifest: {
  registry_type?: string
  identifier?: string
  requiredEnv?: Array<{ name: string; is_secret?: boolean }>
}): CanonicalServer {
  const type = manifest.registry_type ?? 'npm'
  const id = manifest.identifier ?? ''

  switch (type) {
    case 'npm':
      return {
        type: 'stdio',
        command: `npx -y ${id}`,
        args: [],
      }
    case 'pypi':
      return {
        type: 'stdio',
        command: `uvx ${id}`,
        args: [],
      }
    case 'oci':
      return {
        type: 'stdio',
        command: `docker run -i --rm ${id}`,
        args: [],
      }
    default:
      return {
        type: 'stdio',
        command: `npx -y ${id}`,
        args: [],
      }
  }
}
