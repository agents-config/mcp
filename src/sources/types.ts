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
