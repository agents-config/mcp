import { z } from 'zod'
import type { ParseError } from 'jsonc-parser'
import { parse, printParseErrorCode } from 'jsonc-parser'
import { readTextFile, writeFileAtomic } from '$/src/core/fs-atomic'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import { AGENTS_DIR, CONFIG_FILE, DEFAULT_SCHEMA_URL } from '$/src/config'
import { CanonicalMcpConfigSchema, validateConfig } from '$/src/core/schema'

export class ConfigValidationError extends Error {
  readonly path: string
  readonly issues: Array<{ path: string; message: string }>

  constructor(
    message: string,
    path: string,
    issues: Array<{ path: string; message: string }> = [],
  ) {
    super(message)
    this.name = 'ConfigValidationError'
    this.path = path
    this.issues = issues
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
  const raw = readTextFile(path)
  if (raw === null) {
    return null
  }

  // jsonc-parser tolerates comments and trailing commas even in `.json` files.
  // Collect parse errors so corrupt/truncated input is surfaced with a clear
  // error instead of silently discarding the tail of the document.
  const errors: ParseError[] = []
  const config = parse(raw, errors, {
    allowTrailingComma: true,
    allowEmptyContent: true,
  }) as unknown as Record<string, unknown>

  if (errors.length > 0) {
    const first = errors[0]!
    const code = printParseErrorCode(first.error)
    throw new ConfigValidationError(
      `Invalid JSONC at ${path} (offset ${first.offset}): ${code}`,
      path,
      [
        {
          path: '',
          message: `JSONC parse error at offset ${first.offset}: ${code}`,
        },
      ],
    )
  }

  if (config === undefined) {
    return { config: {}, raw }
  }

  return { config, raw }
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
    const zodErr = err as z.ZodError
    const issues = zodErr.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    const firstPath = issues[0]?.path ?? ''
    throw new ConfigValidationError(
      `Invalid canonical config at ${getConfigPath(
        scope,
        ctx,
      )}: ${firstPath ? `${firstPath} — ` : ''}${zodErr.issues[0]?.message ?? ''}`,
      getConfigPath(scope, ctx),
      issues,
    )
  }

  const { warnings } = validateConfig(result.config)
  return { config, warnings }
}
