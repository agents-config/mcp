/**
 * Registry source resolver (§10.4).
 *
 * Resolves `@scope/name` or bare package names via npm, falling back to the
 * MCP Registry `v0/search`. Under `--yes`, prefers an exact name match, else
 * fails with the candidate list.
 */

import type { ResolvedServerPackage } from '$/src/sources/types'
import { resolveDirect } from '$/src/sources/direct'
import type { CanonicalServer } from '$/src/core/schema'

const NPM_REGISTRY = 'https://registry.npmjs.org'
const MCP_REGISTRY = 'https://registry.modelcontextprotocol.io/v0/servers'
const RESPONSE_CAP = 2 * 1024 * 1024
const TIMEOUT_MS = 10_000

export interface RegistrySourceOptions {
  ref: string
  yes?: boolean
}

export async function resolveRegistry(
  ref: string,
  opts: { yes?: boolean } = {},
): Promise<ResolvedServerPackage> {
  const { yes = false } = opts

  // 1. npm for @scope/name or bare package names.
  try {
    const pkg = await fetchJson(`${NPM_REGISTRY}/${encodeURIComponent(ref)}`)
    const name = (pkg as { name?: string }).name ?? ref
    const version = (pkg as { 'dist-tags'?: { latest?: string } })['dist-tags']
      ?.latest
    const spec = version ? `${name}@${version}` : name
    const definition: CanonicalServer = {
      transport: 'stdio',
      command: `npx -y ${spec}`,
      args: [],
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

  // 2. MCP Registry v0/search.
  const results = await searchMcpRegistry(ref)
  if (results.length === 0) {
    throw new Error(`No MCP server found for "${ref}" on npm or MCP Registry.`)
  }
  if (results.length > 1 && !yes) {
    const candidates = results.map((r) => r.name ?? r).join(', ')
    throw new Error(
      `Ambiguous registry match for "${ref}". Candidates: ${candidates}. Pass --yes to select the first.`,
    )
  }
  const selected = results[0]!
  const name = selected.name ?? ref
  const definition: CanonicalServer = {
    transport: 'stdio',
    command: `npx -y ${name}`,
    args: [],
  }
  return {
    suggestedName: name,
    definition,
    requiredEnv: [],
    source: { type: 'registry', ref },
  }
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

async function searchMcpRegistry(
  query: string,
): Promise<Array<{ name?: string }>> {
  try {
    const res = await fetchJson(
      `${MCP_REGISTRY}?search=${encodeURIComponent(query)}&limit=10`,
    )
    const arr = (res as { servers?: unknown[] })?.servers ?? []
    return Array.isArray(arr) ? (arr as Array<{ name?: string }>) : []
  } catch {
    return []
  }
}
