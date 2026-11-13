import { readFileSync } from 'node:fs'
import { parse } from 'jsonc-parser'
import { writeFileAtomic } from '$/src/core/fs-atomic'
import type { RuntimeContext } from '$/src/core/context'
import { AGENTS_DIR, CONFIG_FILE, DEFAULT_SCHEMA_URL } from '$/src/config'
import { CanonicalMcpConfigSchema, validateConfig } from '$/src/core/schema'

export type ConfigScope = 'project' | 'global'

export class ConfigValidationError extends Error {
  readonly path: string

  constructor(message: string, path: string) {
    super(message)
    this.name = 'ConfigValidationError'
    this.path = path
  }
}

export function getConfigPath(scope: ConfigScope, ctx: RuntimeContext): string {
  const base = scope === 'project' ? ctx.cwd : ctx.homeDir
  return `${base}/${AGENTS_DIR}/${CONFIG_FILE}`
}

export interface ReadConfigResult {
  config: Record<string, unknown>
  raw: string
}

export function readConfig(
  scope: ConfigScope,
  ctx: RuntimeContext,
): ReadConfigResult | null {
  const path = getConfigPath(scope, ctx)
  const raw = readTextFileOrNull(path)
  if (raw === null) {
    return null
  }
  // jsonc-parser tolerates comments and trailing commas even in `.json` files.
  const config = parse(raw, [], {}) as unknown as Record<string, unknown>
  return { config, raw }
}

function readTextFileOrNull(path: string): string | null {
  try {
    return readFileSync(path, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw err
  }
}

export interface WriteConfigOptions {
  scope: ConfigScope
  ctx: RuntimeContext
  config: Record<string, unknown>
}

/**
 * Write the canonical config atomically, serializing only `$schema` and
 * `servers` (minimal, defaults not materialized). A user who omits `args`
 * keeps omitting it, so `sync` stays idempotent and produces minimal diffs.
 */
export function writeConfig({ scope, ctx, config }: WriteConfigOptions): void {
  const path = getConfigPath(scope, ctx)
  const serialized = serializeMinimal(config)
  writeFileAtomic(path, serialized)
}

function serializeMinimal(config: Record<string, unknown>): string {
  const servers = config['servers']
  const document: Record<string, unknown> = {
    $schema: DEFAULT_SCHEMA_URL,
    servers,
  }
  return JSON.stringify(document, null, 2) + '\n'
}

export interface LoadValidatedConfigResult {
  config: ReturnType<typeof CanonicalMcpConfigSchema.parse>
  warnings: string[]
}

export function loadValidatedConfig(
  scope: ConfigScope,
  ctx: RuntimeContext,
): LoadValidatedConfigResult | null {
  const result = readConfig(scope, ctx)
  if (result === null) {
    return null
  }

  let config: ReturnType<typeof CanonicalMcpConfigSchema.parse>
  try {
    config = CanonicalMcpConfigSchema.parse(result.config)
  } catch (err) {
    throw new ConfigValidationError(
      `Invalid canonical config at ${getConfigPath(scope, ctx)}`,
      getConfigPath(scope, ctx),
    )
  }

  const { warnings } = validateConfig(result.config)
  return { config, warnings }
}
