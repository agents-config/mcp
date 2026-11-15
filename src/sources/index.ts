/**
 * Source resolution order (§10.5).
 *
 * Explicit flags → remote URL → `owner/repo` → registry/npm. The resolver
 * never writes files; `commands/add.ts` owns persistence.
 */

import type { ResolvedServerPackage } from '$/src/sources/types'
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
): Promise<ResolvedServerPackage> {
  // 1. Explicit flags (direct source)
  if (
    options.command ||
    options.http ||
    options.arg?.length ||
    options.env?.length ||
    options.header?.length
  ) {
    return resolveDirect(options)
  }

  // 2. Remote URL
  if (options.source && /^https?:\/\//.test(options.source)) {
    return resolveDirect({ http: options.source, name: options.name })
  }

  // 3. owner/repo
  if (options.source && /^[\w-]+\/[\w.-]+(#.+)?$/.test(options.source)) {
    return resolveGithub(options.source)
  }

  // 4. Registry/npm
  if (options.source) {
    return resolveRegistry(options.source)
  }

  throw new Error(
    'No source specified. Pass --command/--http/--arg/--env/--header or a source argument.',
  )
}
