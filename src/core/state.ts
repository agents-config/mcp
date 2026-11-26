import { z } from 'zod'
import { AgentIdSchema } from '$/src/core/schema'
import {
  AGENTS_DIR,
  LEGACY_STATE_FILE,
  STATE_FILE,
  STATE_VERSION,
} from '$/src/config'
import { readTextFile, writeFileAtomic } from '$/src/core/fs-atomic'
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
  /** Non-fatal hints surfaced to the user (e.g. a legacy file was imported). */
  notices: string[]
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

export function getLegacyStatePath(
  scope: ConfigScope,
  ctx: RuntimeContext,
): string {
  const base = scope === 'project' ? ctx.cwd : ctx.homeDir
  return `${base}/${AGENTS_DIR}/${LEGACY_STATE_FILE}`
}

/**
 * Parse a sync state file with `SyncStateSchema`.
 *
 * The caller handles the missing-file case before calling this. Returns the
 * parsed state on success, or a warning for corrupt JSON / invalid shape.
 */
function parseStateFile(
  raw: string,
  path: string,
): { state: SyncState } | { warning: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { warning: `Corrupt sync state at ${path}; treating as empty` }
  }

  const result = SyncStateSchema.safeParse(parsed)
  if (!result.success) {
    return { warning: `Invalid sync state at ${path}; treating as empty` }
  }

  return { state: result.data }
}

/**
 * Load the sync state with precedence: new lock (`.agents/mcp-lock.json`)
 * → legacy file (`.mcp-sync-state.json`) → empty state.
 *
 * - Neither file present → empty state, no warning.
 * - New lock present and valid → it wins; the legacy file is ignored silently.
 * - New lock corrupt/invalid → warning + empty state; NO fallback to legacy
 *   (avoid resurrecting stale state over a newer corrupt file).
 * - New absent + legacy valid → legacy state plus a non-fatal notice.
 * - New absent + legacy corrupt → warning + empty state.
 */
export function loadState(
  scope: ConfigScope,
  ctx: RuntimeContext,
): LoadStateResult {
  const lockPath = getStatePath(scope, ctx)
  const legacyPath = getLegacyStatePath(scope, ctx)

  // 1. New lock file.
  const lockRaw = readTextFile(lockPath)
  if (lockRaw !== null) {
    const parsed = parseStateFile(lockRaw, lockPath)
    if ('state' in parsed) {
      return { state: parsed.state, warnings: [], notices: [] }
    }
    // Corrupt/invalid new lock: warn + empty, never read the legacy file.
    return { state: emptyState(scope), warnings: [parsed.warning], notices: [] }
  }

  // 2. Legacy fallback: only when the new lock is absent.
  const legacyRaw = readTextFile(legacyPath)
  if (legacyRaw !== null) {
    const parsed = parseStateFile(legacyRaw, legacyPath)
    if ('state' in parsed) {
      return {
        state: parsed.state,
        warnings: [],
        notices: [
          `Legacy sync state at ${legacyPath} was imported; it will be replaced by ${lockPath} on the next write. You can delete the legacy file.`,
        ],
      }
    }
    return {
      state: emptyState(scope),
      warnings: [parsed.warning],
      notices: [],
    }
  }

  // 3. Neither file exists → empty state.
  return { state: emptyState(scope), warnings: [], notices: [] }
}

/**
 * Write the sync state (`.agents/mcp-lock.json`) atomically. No root-level
 * `updatedAt` is emitted — the per-agent `updatedAt` is updated only when
 * that agent's `names`/`path` actually changes, so identical states produce
 * byte-identical files. Never touches `.gitignore` and never writes or
 * deletes the legacy state file.
 */
export function writeState(
  scope: ConfigScope,
  ctx: RuntimeContext,
  state: SyncState,
): void {
  const path = getStatePath(scope, ctx)
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
