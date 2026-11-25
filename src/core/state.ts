import { z } from 'zod'
import { AgentIdSchema } from '$/src/core/schema'
import { AGENTS_DIR, STATE_FILE, STATE_VERSION } from '$/src/config'
import { readTextFile, writeFileAtomic } from '$/src/core/fs-atomic'
import { ensureIgnored } from '$/src/core/gitignore'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'

export type AgentId = z.infer<typeof AgentIdSchema>

export interface SyncStateAgent {
  path: string
  names: string[]
  updatedAt: string // ISO-8601
}

export interface SyncState {
  version: 1
  scope: ConfigScope
  targets: AgentId[]
  agents: Partial<Record<AgentId, SyncStateAgent>>
  /** Nomes de plugins gerenciados pela CLI em `.agents/plugins/<name>/`. */
  managedPlugins: string[]
}

export interface LoadStateResult {
  state: SyncState
  warnings: string[]
}

const SyncStateAgentSchema = z.object({
  path: z.string(),
  names: z.array(z.string()),
  updatedAt: z.string().datetime(),
})

const SyncStateSchema = z.object({
  version: z.literal(STATE_VERSION),
  scope: z.enum(['project', 'global']),
  targets: z.array(AgentIdSchema),
  agents: z.partialRecord(AgentIdSchema, SyncStateAgentSchema).default({}),
  /** Nomes de plugins gerenciados pela CLI (retrocompatível: default []). */
  managedPlugins: z.array(z.string()).default([]),
})

/**
 * Build an empty sync state for the given scope. Public so callers (and tests)
 * can construct a fresh state without relying on a mutable singleton.
 */
export function emptyState(scope: ConfigScope): SyncState {
  return {
    version: STATE_VERSION,
    scope,
    targets: [],
    agents: {},
    managedPlugins: [],
  }
}

export function getStatePath(scope: ConfigScope, ctx: RuntimeContext): string {
  const base = scope === 'project' ? ctx.cwd : ctx.homeDir
  return `${base}/${AGENTS_DIR}/${STATE_FILE}`
}

/**
 * Load the sync state. Missing file → empty state, no warning.
 * Corrupt / unknown-version file → warn, treat as empty.
 */
export function loadState(
  scope: ConfigScope,
  ctx: RuntimeContext,
): LoadStateResult {
  const path = getStatePath(scope, ctx)
  const raw = readTextFile(path)
  if (raw === null) {
    return { state: emptyState(scope), warnings: [] }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      state: emptyState(scope),
      warnings: [`Corrupt sync state at ${path}; treating as empty`],
    }
  }

  const result = SyncStateSchema.safeParse(parsed)
  if (!result.success) {
    return {
      state: emptyState(scope),
      warnings: [`Invalid sync state at ${path}; treating as empty`],
    }
  }

  return { state: result.data, warnings: [] }
}

/**
 * Write the sync state atomically. No root-level `updatedAt` is emitted — the
 * per-agent `updatedAt` is updated only when that agent's `names`/`path`
 * actually changes, so identical states produce byte-identical files.
 */
export function writeState(
  scope: ConfigScope,
  ctx: RuntimeContext,
  state: SyncState,
): void {
  const path = getStatePath(scope, ctx)
  // Lazily protect the project-scope sync state file inside the managed
  // .gitignore block before writing it.
  if (scope === 'project') {
    ensureIgnored(ctx.cwd, [`${AGENTS_DIR}/${STATE_FILE}`])
  }
  writeFileAtomic(path, JSON.stringify(state, null, 2) + '\n')
}

/**
 * Merge `names` into the per-agent record for `agentId`, creating the record if
 * needed. Used by `import` to seed managed names (even with `--no-sync`).
 * The per-agent `updatedAt` is refreshed only when names/path change.
 */
export function seedAgentNames(
  state: SyncState,
  agentId: AgentId,
  names: string[],
  configPath: string,
): SyncState {
  const existing = state.agents[agentId]
  const nextNames = existing
    ? [...new Set([...existing.names, ...names])]
    : names
  const changed =
    !existing ||
    existing.path !== configPath ||
    existing.names.length !== nextNames.length ||
    nextNames.some((n) => !existing!.names.includes(n))
  const merged: SyncStateAgent = {
    path: configPath,
    names: nextNames,
    updatedAt: changed
      ? new Date().toISOString()
      : (existing?.updatedAt ?? new Date().toISOString()),
  }
  return {
    ...state,
    agents: { ...state.agents, [agentId]: merged },
  }
}

/**
 * Prune names no longer present in `currentNames` for `agentId`. Used by
 * `remove` and `sync` to keep state consistent without touching manual entries.
 * The per-agent `updatedAt` is refreshed only when names actually change.
 */
export function pruneAgentNames(
  state: SyncState,
  agentId: AgentId,
  currentNames: string[],
): SyncState {
  const existing = state.agents[agentId]
  if (!existing) {
    return state
  }
  const kept = existing.names.filter((name) => currentNames.includes(name))
  if (kept.length === existing.names.length) {
    return state
  }
  return {
    ...state,
    agents: {
      ...state.agents,
      [agentId]: {
        ...existing,
        names: kept,
        updatedAt: new Date().toISOString(),
      },
    },
  }
}
