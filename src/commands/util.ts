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

/**
 * Detecta a flag `--no-sync` independente de como o citty a parseou.
 *
 * O citty consome `--no-sync` antes do parse e entrega `args.sync === false`
 * (sem a chave `no-sync`). Esta helper cobre todas as formas:
 * `args['no-sync'] === true`, `args.sync === false` e `rawArgs.includes('--no-sync')`.
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

/** Normaliza uma lista de agentes separada por vírgulas. */
function splitAgentList(value: string): string[] | undefined {
  const ids = value
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
  return ids.length > 0 ? ids : undefined
}

/**
 * Extrai `--agents` tanto de `args` (quando o citty já parseou a flag) quanto
 * de `rawArgs` (formas `--agents=<lista>` e `--agents <lista>`).
 *
 * O fallback por `rawArgs` cobre subcomandos que não declaram `agents` e o
 * caso em que o citty transforma `--agents <lista>` em `true` + posicional.
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
