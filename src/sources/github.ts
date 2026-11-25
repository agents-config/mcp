/**
 * GitHub source resolver (§10.3).
 *
 * Resolves `owner/repo[#ref]` and `https://github.com/owner/repo` →
 * `server.json` → `package.json`, following the MCP server manifest discovery
 * chain. HTTP interactions use the shared `fetchJson` from `src/sources/http`
 * (mocked in tests) with timeouts, retries, and a 2 MiB response cap.
 *
 * Command and arguments are always split (`command: 'npx'`, `args: ['-y', id]`)
 * so `doctor`, `opencode`, `zed`, and any `spawn`-based client work without a
 * shell.
 */

import { z } from 'zod'
import type {
  ResolvedServerPackage,
  SourceResolveOptions,
} from '$/src/sources/types'
import { fetchJson } from '$/src/sources/http'
import type { CanonicalServer } from '$/src/core/schema'

const GITHUB_RAW = 'https://raw.githubusercontent.com'
const GITHUB_API = 'https://api.github.com/repos'

const EnvVarSchema = z.object({
  name: z.string().min(1),
  is_required: z.boolean().optional(),
  is_secret: z.boolean().optional(),
  description: z.string().optional(),
})

const ServerJsonSchema = z
  .object({
    name: z.string().optional(),
    registry_type: z.string().optional(),
    identifier: z.string().optional(),
    environment_variables: z.array(EnvVarSchema).optional(),
  })
  .passthrough()

const PackageJsonSchema = z
  .object({
    name: z.string().optional(),
    bin: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
  })
  .passthrough()

export interface GithubSourceOptions {
  env?: Record<string, string>
  fetch?: typeof fetch
}

export async function resolveGithub(
  ref: string,
  opts: GithubSourceOptions = {},
): Promise<ResolvedServerPackage> {
  const { env, fetch: injectedFetch } = opts
  const { owner, repo, ref: gitRef } = parseRef(ref)

  // 1. Try server.json on ref, then main, then master.
  const branches = gitRef ? [gitRef] : ['main', 'master']
  let serverJson: unknown = null
  let resolvedRef = branches[0]
  for (const branch of branches) {
    try {
      serverJson = await fetchJson(
        `${GITHUB_RAW}/${owner}/${repo}/${branch}/server.json`,
        { env, fetch: injectedFetch },
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
      const repoInfo = await fetchJson(`${GITHUB_API}/${owner}/${repo}`, {
        env,
        fetch: injectedFetch,
      })
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
            { env, fetch: injectedFetch },
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
    const parsed = ServerJsonSchema.safeParse(serverJson)
    if (!parsed.success) {
      throw new Error(
        `Invalid server.json in ${owner}/${repo}: ${parsed.error.issues
          .map((i) => i.message)
          .join(', ')}`,
      )
    }
    const manifest = parsed.data
    const definition = manifestToServer(manifest, repo)

    // Parse environment_variables: required vars populate definition.env and
    // are reported in requiredEnv.
    const requiredEnv = (manifest.environment_variables ?? [])
      .filter((e) => e.is_required === true)
      .map((e) => ({
        name: e.name,
        description: e.description,
        isSecret: e.is_secret === true,
      }))

    if (requiredEnv.length > 0 && definition.type === 'stdio') {
      const envRecord: Record<string, string> = {}
      for (const e of requiredEnv) {
        envRecord[e.name] = `\${${e.name}}`
      }
      definition.env = { ...(definition.env ?? {}), ...envRecord }
    }

    return {
      suggestedName: manifest.name ?? repo,
      definition,
      requiredEnv,
      source: { type: 'github', ref },
    }
  }

  // 4. package.json fallback: bin selects <name> for `npx -y`.
  try {
    const pkg = await fetchJson(
      `${GITHUB_RAW}/${owner}/${repo}/${resolvedRef}/package.json`,
      { env, fetch: injectedFetch },
    )
    const parsed = PackageJsonSchema.safeParse(pkg)
    if (!parsed.success) {
      throw new Error(`Repository ${owner}/${repo} is not an MCP server`)
    }
    const { bin, name: pkgName } = parsed.data
    let binName: string
    if (typeof bin === 'string') {
      binName = bin
    } else if (bin && typeof bin === 'object' && Object.keys(bin).length > 0) {
      const first = Object.keys(bin)[0]
      binName = first ?? pkgName ?? repo
    } else {
      throw new Error(`Repository ${owner}/${repo} is not an MCP server`)
    }
    const definition: CanonicalServer = {
      type: 'stdio',
      command: 'npx',
      args: ['-y', binName],
    }
    return {
      suggestedName: pkgName ?? repo,
      definition,
      requiredEnv: [],
      source: { type: 'github', ref },
    }
  } catch {
    throw new Error(`Repository ${owner}/${repo} is not an MCP server`)
  }
}

function manifestToServer(
  manifest: z.infer<typeof ServerJsonSchema>,
  repo: string,
): CanonicalServer {
  const type = manifest.registry_type ?? 'npm'
  const id = manifest.identifier ?? ''

  switch (type) {
    case 'npm':
      return {
        type: 'stdio',
        command: 'npx',
        args: ['-y', id],
      }
    case 'pypi':
      return {
        type: 'stdio',
        command: 'uvx',
        args: [id],
      }
    case 'oci':
      return {
        type: 'stdio',
        command: 'docker',
        args: ['run', '-i', '--rm', id],
      }
    default:
      return {
        type: 'stdio',
        command: 'npx',
        args: ['-y', id],
      }
  }
}

function parseRef(ref: string): {
  owner: string
  repo: string
  ref: string | undefined
} {
  // https://github.com/owner/repo[/tree/ ref][.git][#ref]
  const urlMatch = ref.match(
    /^https?:\/\/github\.com\/([\w-]+)\/([\w.-]+?)(\/tree\/[^?#]+)?(\.git)?\/?(#.+)?$/,
  )
  if (urlMatch) {
    const owner = urlMatch[1] ?? ''
    const repo = urlMatch[2] ?? ''
    const hash = urlMatch[5]
    const gitRef = hash ? hash.slice(1) : undefined
    return { owner, repo, ref: gitRef }
  }

  // owner/repo[#ref]
  const [ownerRepo, gitRef] = ref.split('#', 2) as [string, string | undefined]
  const parts = (ownerRepo || '').split('/')
  const owner = parts[0] ?? ''
  const repo = parts[1] ?? ''
  if (!owner || !repo) {
    throw new Error(
      `Invalid GitHub ref: ${ref}. Expected owner/repo[#ref] or https://github.com/owner/repo.`,
    )
  }
  return { owner, repo, ref: gitRef || undefined }
}
