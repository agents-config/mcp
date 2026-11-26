import { z } from 'zod'
import { AgentIdSchema } from '$/src/core/schema'
import {
  AGENTS_DIR,
  AGENT_ORDER,
  STATE_FILE,
  STATE_VERSION,
} from '$/src/config'
import { readTextFile, writeFileAtomic } from '$/src/core/fs-atomic'
import { isPortablePath, toPortablePath } from '$/src/core/portable-path'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'

export type AgentId = z.infer<typeof AgentIdSchema>

export interface SyncStateAgent {
  /** Portable path recorded for diagnostics; never used for I/O. */
  path: string
  names: string[]
  updatedAt: string // ISO-8601
}

export interface SyncState {
  version: typeof STATE_VERSION
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

const PORTABLE_PATH_MESSAGE =
  'must be a portable path: relative to the project or prefixed with "~/", "$XDG_CONFIG_HOME/", or "$APPDATA/", using "/" separators (no absolute paths, drive letters, UNC prefixes, backslashes, or ".." segments)'

const PortablePathSchema = z.string().superRefine((value, ctx) => {
  if (!isPortablePath(value)) {
    ctx.addIssue({ code: 'custom', message: PORTABLE_PATH_MESSAGE })
  }
})

const SyncStateAgentSchema = z.object({
  path: PortablePathSchema,
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

function dedupe<T>(values: readonly T[]): T[] {
  return [...new Set(values)]
}

function dedupeSorted(values: readonly string[]): string[] {
  return dedupe(values).sort()
}

/**
 * Serialize the state deterministically for `.agents/mcp-lock.json`.
 *
 * Top-level key order is fixed (`version`, `scope`, `targets`, `agents`,
 * `managedPlugins`), agents follow `AGENT_ORDER`, targets preserve their
 * original order, and names/managed plugins are deduplicated and sorted. The
 * output uses two-space indentation with a trailing newline.
 */
export function serializeState(
  scope: ConfigScope,
  ctx: RuntimeContext,
  state: SyncState,
): string {
  const agents: Partial<Record<AgentId, SyncStateAgent>> = {}
  for (const agentId of AGENT_ORDER) {
    const agent = state.agents[agentId]
    if (!agent) {
      continue
    }
    agents[agentId] = {
      path: toPortablePath(agent.path, scope, ctx),
      names: dedupeSorted(agent.names),
      updatedAt: agent.updatedAt,
    }
  }

  const document = {
    version: STATE_VERSION,
    scope,
    targets: dedupe(state.targets),
    agents,
    managedPlugins: dedupeSorted(state.managedPlugins),
  }
  return JSON.stringify(document, null, 2) + '\n'
}

/**
 * Load the sync state from `.agents/mcp-lock.json`.
 *
 * - Missing lock → empty state, no warning.
 * - Corrupt JSON → warning + empty state.
 * - Unsupported version (including `version: 1`) → targeted warning + empty.
 * - Invalid shape or non-portable path → warning naming the field + empty.
 *
 * The legacy `.mcp-sync-state.json` file is never read.
 */
export function loadState(
  scope: ConfigScope,
  ctx: RuntimeContext,
): LoadStateResult {
  const lockPath = getStatePath(scope, ctx)
  const raw = readTextFile(lockPath)
  if (raw === null) {
    return { state: emptyState(scope), warnings: [] }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      state: emptyState(scope),
      warnings: [`Corrupt sync state at ${lockPath}; treating as empty`],
    }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      state: emptyState(scope),
      warnings: [
        `Invalid sync state at ${lockPath}; field \`root\` must be a JSON object. Treating as empty.`,
      ],
    }
  }

  const version = (parsed as Record<string, unknown>).version
  if (typeof version !== 'number') {
    return {
      state: emptyState(scope),
      warnings: [
        `Invalid sync state at ${lockPath}; field \`version\` must be the number ${STATE_VERSION}. Treating as empty.`,
      ],
    }
  }
  if (version !== STATE_VERSION) {
    return {
      state: emptyState(scope),
      warnings: [
        `Unsupported sync state version ${version} at ${lockPath}; expected version ${STATE_VERSION}. Treating as empty. Re-run \`sync --agents <list>\` to write a fresh lock.`,
      ],
    }
  }

  const result = SyncStateSchema.safeParse(parsed)
  if (!result.success) {
    const issue = result.error.issues[0]
    const field = issue && issue.path.length > 0 ? issue.path.join('.') : 'root'
    const detail = issue?.message ?? 'invalid value'
    return {
      state: emptyState(scope),
      warnings: [
        `Invalid sync state at ${lockPath}; field \`${field}\` is invalid: ${detail}. Treating as empty.`,
      ],
    }
  }

  return { state: result.data, warnings: [] }
}

/**
 * Write the sync state (`.agents/mcp-lock.json`) atomically.
 *
 * The state is serialized deterministically and validated against
 * `SyncStateSchema` before writing. When the existing lock is already
 * byte-identical, the file is not rewritten (avoids mtime-only churn). Never
 * touches `.gitignore` and never writes or deletes the legacy state file.
 */
export function writeState(
  scope: ConfigScope,
  ctx: RuntimeContext,
  state: SyncState,
): void {
  if (state.scope !== scope) {
    throw new Error(
      `Cannot write ${state.scope} sync state to the ${scope} lock`,
    )
  }

  const path = getStatePath(scope, ctx)
  const content = serializeState(scope, ctx, state)
  SyncStateSchema.parse(JSON.parse(content))

  if (readTextFile(path) === content) {
    return
  }
  writeFileAtomic(path, content)
}

/**
 * Merge `names` into the per-agent record for `agentId`, creating the record if
 * needed. Used by `import` to seed managed names (even with `--no-sync`).
 * `portablePath` is already portable; the per-agent `updatedAt` is refreshed
 * only when names/path change.
 */
export function seedAgentNames(
  state: SyncState,
  agentId: AgentId,
  names: string[],
  portablePath: string,
): SyncState {
  const existing = state.agents[agentId]
  const nextNames = existing
    ? [...new Set([...existing.names, ...names])]
    : names
  const changed =
    !existing ||
    existing.path !== portablePath ||
    existing.names.length !== nextNames.length ||
    nextNames.some((n) => !existing!.names.includes(n))
  const merged: SyncStateAgent = {
    path: portablePath,
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
