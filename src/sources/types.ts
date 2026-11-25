/**
 * Source resolvers DTOs (§10).
 *
 * `ResolvedServerPackage` is the common output of every source resolver
 * (direct, github, registry), ready to be turned into a canonical server by
 * `commands/add.ts`.
 */

import type { CanonicalServer } from '$/src/core/schema'

export interface RequiredEnvVar {
  name: string
  description?: string
  isSecret: boolean
}

export interface ResolvedServerPackage {
  suggestedName: string
  definition: CanonicalServer
  requiredEnv: RequiredEnvVar[]
  source: { type: 'direct' | 'github' | 'registry'; ref: string }
}

/** Optional inputs shared by all source resolvers (§10.5). */
export interface SourceResolveOptions {
  /** Runtime environment record (e.g. process.env) used to resolve GITHUB_TOKEN for fetch. */
  env?: Record<string, string>
  yes?: boolean
  /** Interactive candidate selector (TTY, `!yes`). Receives the candidates and must return one or `null` to abort. */
  selectCandidate?: (candidates: Candidate[]) => Promise<Candidate | null>
  /** Injectable `fetch` for tests (zero live network calls). */
  fetch?: typeof fetch
}

/** A registry/GitHub candidate presented to the user for disambiguation. */
export interface Candidate {
  name: string
  ref: string
  type: 'npm' | 'pypi' | 'oci' | 'streamable-http' | 'sse'
  url?: string
}
