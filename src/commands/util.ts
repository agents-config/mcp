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
import type { CanonicalServer } from '$/src/core/schema'
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

export { AGENTS_DIR, CONFIG_FILE, STATE_FILE, type CanonicalServer }
