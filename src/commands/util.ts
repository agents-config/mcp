/**
 * Shared helpers for the core commands (§11).
 *
 * Commands own the `RuntimeContext` + `PromptUi` creation and filesystem/state
 * access. Adapters and compilers remain pure.
 */

import { readTextFile, writeFileAtomic } from '$/src/core/fs-atomic'
import {
  getConfigPath,
  loadValidatedConfig,
  writeConfig,
  ConfigValidationError,
} from '$/src/core/store'
import {
  getStatePath,
  loadState,
  writeState,
  type SyncState,
} from '$/src/core/state'
import { resolveTargetsAsync } from '$/src/adapters/index'
import { createUi } from '$/src/index'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
import type { AgentId, AgentAdapter } from '$/src/adapters/types'
import { getAdapter } from '$/src/adapters/index'
import type { CanonicalServer, CanonicalMcpConfig } from '$/src/core/schema'
import { AGENTS_DIR, CONFIG_FILE, STATE_FILE } from '$/src/config'

export { writeFileAtomic } from '$/src/core/fs-atomic'

/** Create the `RuntimeContext` and `PromptUi` for the current process. */
export function createUiAndCtx({ yes = false }: { yes?: boolean } = {}): {
  ctx: RuntimeContext
  ui: ReturnType<typeof createUi>['ui']
} {
  const { ctx, ui } = createUi({ yes })
  return { ctx, ui }
}

/** Path to the canonical config for a scope. */
export function configPath(scope: ConfigScope, ctx: RuntimeContext): string {
  return getConfigPath(scope, ctx)
}

/** Path to the sync state for a scope. */
export function statePath(scope: ConfigScope, ctx: RuntimeContext): string {
  return getStatePath(scope, ctx)
}

/** Load the canonical config for a scope. Null when absent. */
export function loadCanonicalConfig(
  scope: ConfigScope,
  ctx: RuntimeContext,
): Awaited<ReturnType<typeof loadValidatedConfig>> | null {
  return loadValidatedConfig(scope, ctx)
}

/** Format a `ConfigValidationError` into a clean, human-readable string. */
export function formatConfigValidationError(
  err: ConfigValidationError,
): string {
  const issues = err.issues
    .map((issue) => `  • ${issue.path || 'root'} — ${issue.message}`)
    .join('\n')
  return `Invalid config at ${err.path}:\n${issues}`
}

/**
 * Load the canonical config for a scope, exiting with a formatted error when
 * it is missing or invalid. Shared by `add`, `sync`, `list`, `remove`, and
 * `import` so every command reports `ConfigValidationError` consistently.
 */
export function loadCanonicalOrExit(
  scope: ConfigScope,
  ctx: RuntimeContext,
  ui: ReturnType<typeof createUi>['ui'],
): CanonicalMcpConfig {
  try {
    const validated = loadValidatedConfig(scope, ctx)
    if (!validated) {
      ui.error(
        `No canonical config at ${configPath(scope, ctx)}. Run 'agents-mcp init' first.`,
      )
      process.exit(1)
    }
    return validated.config
  } catch (err) {
    if (err instanceof ConfigValidationError) {
      ui.error(formatConfigValidationError(err))
      process.exit(1)
    }
    throw err
  }
}

/** Load the sync state (empty state when absent/corrupt). */
export function loadSyncState(
  scope: ConfigScope,
  ctx: RuntimeContext,
): { state: SyncState; warnings: string[] } {
  return loadState(scope, ctx)
}

/** Persist the sync state atomically. */
export function persistSyncState(
  scope: ConfigScope,
  ctx: RuntimeContext,
  state: SyncState,
): void {
  writeState(scope, ctx, state)
}

/** Write the canonical config atomically (minimal serialization). */
export function persistCanonicalConfig(
  scope: ConfigScope,
  ctx: RuntimeContext,
  config: Record<string, unknown>,
): void {
  writeConfig({ scope, ctx, config })
}

/**
 * Resolve target agents with precedence flag → state → detection.
 */
export async function resolveTargetAgents({
  flag,
  state,
  ctx,
}: {
  flag: readonly string[] | undefined
  state: SyncState
  ctx: RuntimeContext
}): Promise<AgentId[]> {
  return resolveTargetsAsync({ flag, state, ctx })
}

/**
 * Read the existing native file content for an adapter (null when absent).
 */
export async function readNativeContent(
  adapter: AgentAdapter,
  scope: ConfigScope,
  ctx: RuntimeContext,
): Promise<string | null> {
  const path = adapter.getConfigPath(scope, ctx)
  if (path === null) {
    return null
  }
  return readTextFile(path)
}

/**
 * Write native content for an adapter atomically.
 */
export async function writeNativeContent(
  adapter: AgentAdapter,
  scope: ConfigScope,
  ctx: RuntimeContext,
  content: string,
): Promise<void> {
  const path = adapter.getConfigPath(scope, ctx)
  if (path === null) {
    return
  }
  writeFileAtomic(path, content)
}

/** Whether `dry-run` is active from the parsed citty args. */
export function isDryRun(args: Record<string, unknown>): boolean {
  return args['dry-run'] === true
}

/** Format planned file operations for a `--dry-run` preview. */
export function formatDryRunActions(
  actions: { type: 'write' | 'remove'; path: string }[],
): string {
  return actions.map((a) => `[dry-run] ${a.type} ${a.path}`).join('\n')
}

/**
 * Detects the `--no-sync` flag regardless of how citty parsed it.
 *
 * Citty consumes `--no-sync` before parsing and delivers `args.sync === false`
 * (without the `no-sync` key). This helper covers all forms:
 * `args['no-sync'] === true`, `args.sync === false` and `rawArgs.includes('--no-sync')`.
 */
export function isNoSyncFlag(
  args: Record<string, unknown>,
  rawArgs: readonly string[],
): boolean {
  return (
    args['no-sync'] === true ||
    args.sync === false ||
    rawArgs.includes('--no-sync')
  )
}

/** Normalizes a comma-separated list of agents. */
function splitAgentList(value: string): string[] | undefined {
  const ids = value
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
  return ids.length > 0 ? ids : undefined
}

/**
 * Extracts `--agents` from `args` (when citty already parsed the flag) and
 * from `rawArgs` (forms `--agents=<list>` and `--agents <list>`).
 *
 * The `rawArgs` fallback covers subcommands that do not declare `agents` and
 * the case where citty transforms `--agents <list>` into `true` + positional.
 */
export function parseAgentsFlag(
  args: Record<string, unknown>,
  rawArgs: readonly string[],
): string[] | undefined {
  const fromArgs = args.agents
  if (typeof fromArgs === 'string') {
    const parsed = splitAgentList(fromArgs)
    if (parsed) {
      return parsed
    }
  }

  for (let i = 0; i < rawArgs.length; i++) {
    const token = rawArgs[i]
    if (token === undefined) continue
    if (token === '--') break
    if (token.startsWith('--agents=')) {
      return splitAgentList(token.slice('--agents='.length))
    }
    if (token === '--agents') {
      const next = rawArgs[i + 1]
      if (next !== undefined && !next.startsWith('-')) {
        return splitAgentList(next)
      }
    }
  }

  return undefined
}

export { AGENTS_DIR, CONFIG_FILE, STATE_FILE, type CanonicalServer }
