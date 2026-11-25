/**
 * Registry source resolver (§10.4).
 *
 * Resolves `@scope/name` or bare package names via npm, falling back to the
 * MCP Registry `v0/servers?search=...`. Command and arguments are always
 * split (`command: 'npx'`, `args: ['-y', spec]`) so `doctor`, `opencode`,
 * `zed`, and any `spawn`-based client work without a shell.
 *
 * Candidate selection:
 * - Exact name match (case-insensitive) wins automatically when unambiguous.
 * - Multiple non-exact candidates: invoke `selectCandidate` when provided
 *   (TTY, `!yes`); otherwise fail with an actionable error listing candidates.
 */

import { z } from 'zod'
import type {
  ResolvedServerPackage,
  SourceResolveOptions,
  Candidate,
} from '$/src/sources/types'
import { fetchJson } from '$/src/sources/http'
import type { CanonicalServer } from '$/src/core/schema'

const NPM_REGISTRY = 'https://registry.npmjs.org'
const MCP_REGISTRY = 'https://registry.modelcontextprotocol.io/v0/servers'

const EnvVarSchema = z.object({
  name: z.string().min(1),
  is_required: z.boolean().optional(),
  is_secret: z.boolean().optional(),
  description: z.string().optional(),
})

const RegistryPackageSchema = z
  .object({
    name: z.string().min(1),
    type: z.enum(['npm', 'pypi', 'oci']),
    environment_variables: z.array(EnvVarSchema).optional(),
  })
  .passthrough()

const RegistryRemoteSchema = z
  .object({
    type: z.enum(['streamable-http', 'sse']),
    url: z.string().min(1),
    headers: z.record(z.string(), z.string()).optional(),
  })
  .passthrough()

const RegistryResponseSchema = z
  .object({
    servers: z.array(
      z.object({
        name: z.string().min(1),
        packages: z.array(RegistryPackageSchema).optional(),
        remotes: z.array(RegistryRemoteSchema).optional(),
      }),
    ),
  })
  .passthrough()

export interface RegistrySourceOptions {
  yes?: boolean
  env?: Record<string, string>
  selectCandidate?: (candidates: Candidate[]) => Promise<Candidate | null>
  fetch?: typeof fetch
}

export async function resolveRegistry(
  ref: string,
  opts: RegistrySourceOptions = {},
): Promise<ResolvedServerPackage> {
  const { yes = false, env, selectCandidate, fetch: injectedFetch } = opts

  // 1. npm for @scope/name or bare package names.
  try {
    const pkg = await fetchJson(`${NPM_REGISTRY}/${encodeURIComponent(ref)}`, {
      env,
      fetch: injectedFetch,
    })
    const parsed = z
      .object({
        name: z.string().optional(),
        'dist-tags': z.object({ latest: z.string().optional() }).optional(),
      })
      .safeParse(pkg)
    const name = parsed.success && parsed.data.name ? parsed.data.name : ref
    const version =
      parsed.success && parsed.data['dist-tags']?.latest
        ? parsed.data['dist-tags'].latest
        : undefined
    const spec = version ? `${name}@${version}` : name
    const definition: CanonicalServer = {
      type: 'stdio',
      command: 'npx',
      args: ['-y', spec],
    }
    return {
      suggestedName: name,
      definition,
      requiredEnv: [],
      source: { type: 'registry', ref },
    }
  } catch {
    // Not on npm; try MCP Registry.
  }

  // 2. MCP Registry v0/servers?search=...
  const results = await searchMcpRegistry(ref, { env, fetch: injectedFetch })
  if (results.length === 0) {
    throw new Error(`No MCP server found for "${ref}" on npm or MCP Registry.`)
  }

  // Candidate selection: exact name match (case-insensitive) wins when unambiguous.
  const exact = results.filter(
    (r) => r.name.toLowerCase() === ref.toLowerCase(),
  )
  if (exact.length === 1) {
    return buildFromServer(exact[0]!, ref, { env, fetch: injectedFetch })
  }

  // Multiple non-exact candidates.
  if (results.length > 1) {
    const candidates: Candidate[] = results.map((r) => ({
      name: r.name,
      ref: r.name,
      type: 'npm',
    }))
    if (selectCandidate) {
      const chosen = await selectCandidate(candidates)
      if (!chosen) {
        throw new Error(`No candidate selected for "${ref}".`)
      }
      const chosenServer = results.find((r) => r.name === chosen.name)
      if (!chosenServer) {
        throw new Error(`Selected candidate "${chosen.name}" not found.`)
      }
      return buildFromServer(chosenServer, ref, { env, fetch: injectedFetch })
    }
    if (yes) {
      return buildFromServer(results[0]!, ref, { env, fetch: injectedFetch })
    }
    const names = results.map((r) => r.name).join(', ')
    throw new Error(
      `Ambiguous registry match for "${ref}". Candidates: ${names}. Pass --yes to select the first or disambiguate.`,
    )
  }

  // Single non-exact candidate.
  return buildFromServer(results[0]!, ref, { env, fetch: injectedFetch })
}

/**
 * Build a `ResolvedServerPackage` from a registry server entry, interpreting
 * `packages` (npm/pypi/oci with environment_variables) and `remotes`
 * (streamable-http/sse with url and headers).
 */
function buildFromServer(
  server: { name: string; packages?: unknown[]; remotes?: unknown[] },
  ref: string,
  opts: { env?: Record<string, string>; fetch?: typeof fetch },
): ResolvedServerPackage {
  const { name, packages, remotes } = server
  const { env } = opts

  // Prefer remotes (HTTP) when present.
  if (remotes && remotes.length > 0) {
    const remote = remotes[0]
    const parsed = RegistryRemoteSchema.safeParse(remote)
    if (!parsed.success) {
      throw new Error(
        `Invalid remote entry for MCP server "${name}": ${parsed.error.issues
          .map((i) => i.message)
          .join(', ')}`,
      )
    }
    const definition: CanonicalServer = {
      type: parsed.data.type,
      url: parsed.data.url,
      ...(parsed.data.headers && Object.keys(parsed.data.headers).length > 0
        ? { headers: parsed.data.headers }
        : {}),
    }
    const requiredEnv = extractRequiredEnv(parsed.data.headers ?? {})
    return {
      suggestedName: name,
      definition,
      requiredEnv,
      source: { type: 'registry', ref },
    }
  }

  // Otherwise interpret packages.
  if (packages && packages.length > 0) {
    const pkg = packages[0]
    const parsed = RegistryPackageSchema.safeParse(pkg)
    if (!parsed.success) {
      throw new Error(
        `Invalid package entry for MCP server "${name}": ${parsed.error.issues
          .map((i) => i.message)
          .join(', ')}`,
      )
    }
    const definition = packageTypeToServer(parsed.data)
    const requiredEnv = extractRequiredEnvVars(
      parsed.data.environment_variables ?? [],
    )
    if (requiredEnv.length > 0 && definition.type === 'stdio') {
      const envRecord: Record<string, string> = {}
      for (const e of requiredEnv) {
        envRecord[e.name] = `\${${e.name}}`
      }
      definition.env = { ...(definition.env ?? {}), ...envRecord }
    }
    return {
      suggestedName: name,
      definition,
      requiredEnv,
      source: { type: 'registry', ref },
    }
  }

  throw new Error(`No usable package or remote for MCP server "${name}".`)
}

function packageTypeToServer(
  pkg: z.infer<typeof RegistryPackageSchema>,
): CanonicalServer {
  switch (pkg.type) {
    case 'npm':
      return {
        type: 'stdio',
        command: 'npx',
        args: ['-y', pkg.name],
      }
    case 'pypi':
      return {
        type: 'stdio',
        command: 'uvx',
        args: [pkg.name],
      }
    case 'oci':
      return {
        type: 'stdio',
        command: 'docker',
        args: ['run', '-i', '--rm', pkg.name],
      }
  }
}

function extractRequiredEnvVars(
  vars: z.infer<typeof EnvVarSchema>[],
): { name: string; description?: string; isSecret: boolean }[] {
  return vars
    .filter((v) => v.is_required === true)
    .map((v) => ({
      name: v.name,
      description: v.description,
      isSecret: v.is_secret === true,
    }))
}

function extractRequiredEnv(
  headers: Record<string, string>,
): { name: string; description?: string; isSecret: boolean }[] {
  return []
}

async function searchMcpRegistry(
  query: string,
  opts: { env?: Record<string, string>; fetch?: typeof fetch },
): Promise<Array<{ name: string; packages?: unknown[]; remotes?: unknown[] }>> {
  try {
    const res = await fetchJson(
      `${MCP_REGISTRY}?search=${encodeURIComponent(query)}&limit=10`,
      { env: opts.env, fetch: opts.fetch },
    )
    const parsed = RegistryResponseSchema.safeParse(res)
    if (!parsed.success) {
      return []
    }
    return parsed.data.servers.map((s) => ({
      name: s.name,
      packages: s.packages,
      remotes: s.remotes,
    }))
  } catch {
    return []
  }
}
