/**
 * `.env` parsing, resolution, and secret-extraction planning.
 *
 * Implements BLUEPRINT §8.5 and the secret-hygiene policy of BLUEPRINT §13 /
 * ADR-0007: `.env` wins over `process.env`, symbolic placeholders stay in
 * versioned files, real values live only in `.env` (mode `0600`), and existing
 * `.env` keys are never overwritten.
 */

import { basename, dirname, join } from 'node:path'
import { readTextFile, writeFileAtomic } from '$/src/core/fs-atomic'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'
import { AGENTS_DIR, ENV_FILE, STATE_FILE } from '$/src/config'
import type { CanonicalServer } from '$/src/core/schema'
import { SECRET_KEY_RE, derivedKey } from '$/src/core/placeholder'
import { ensureIgnored } from '$/src/core/gitignore'

export interface DotenvParseResult {
  vars: Record<string, string>
  warnings: string[]
}

export interface ReadDotenvResult {
  vars: Record<string, string>
  raw: string | null
}

export type ResolveVarSource = 'dotenv' | 'processEnv' | 'fallback' | 'unset'

export interface ResolveVarResult {
  value: string | undefined
  source: ResolveVarSource
}

export interface SecretWrite {
  key: string
  value: string
  description?: string
}

export interface PlanSecretExtractionResult {
  writes: SecretWrite[]
  warnings: string[]
}

export interface AppendToDotenvResult {
  added: string[]
  warnings: string[]
}

export interface SyncEnvExampleResult {
  added: string[]
  warnings: string[]
}

/**
 * Parse a `.env` document line by line.
 *
 * - `KEY=VALUE` and `KEY="VALUE"` / `KEY='VALUE'` (surrounding quotes stripped).
 * - `KEY=` → empty value.
 * - Whole-line `#` comments and blank lines are skipped.
 * - A leading `export ` is stripped.
 * - Duplicate keys: last wins. No variable expansion.
 */
export function parseDotenv(content: string): DotenvParseResult {
  const vars: Record<string, string> = {}
  const warnings: string[] = []

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('#')) {
      continue
    }
    let body = line
    if (body.startsWith('export ')) {
      body = body.slice('export '.length)
    }
    const eq = body.indexOf('=')
    if (eq === -1) {
      continue
    }
    let key = body.slice(0, eq).trim()
    let value = body.slice(eq + 1)
    // Strip surrounding matching quotes.
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1)
    }
    vars[key] = value
  }

  return { vars, warnings }
}

function getDotenvPath(scope: ConfigScope, ctx: RuntimeContext): string {
  const base = scope === 'project' ? ctx.cwd : ctx.homeDir
  return scope === 'project'
    ? join(base, ENV_FILE)
    : join(base, AGENTS_DIR, ENV_FILE)
}

/**
 * Read the scope `.env`. Missing file → empty vars, no warning.
 */
export function readDotenv(
  scope: ConfigScope,
  ctx: RuntimeContext,
): ReadDotenvResult {
  const path = getDotenvPath(scope, ctx)
  const raw = readTextFile(path)
  if (raw === null) {
    return { vars: {}, raw: null }
  }
  return { vars: parseDotenv(raw).vars, raw }
}

/**
 * Resolve a variable name with precedence dotenv → processEnv → fallback.
 * An empty string counts as unset for fallback purposes.
 */
export function resolveVar(
  name: string,
  opts: {
    dotenv: Record<string, string>
    processEnv: NodeJS.ProcessEnv
    fallback?: string
  },
): ResolveVarResult {
  const dotenvVal = opts.dotenv[name]
  if (dotenvVal !== undefined && dotenvVal !== '') {
    return { value: dotenvVal, source: 'dotenv' }
  }
  const envVal = opts.processEnv[name]
  if (envVal !== undefined && envVal !== '') {
    return { value: envVal, source: 'processEnv' }
  }
  if (opts.fallback !== undefined && opts.fallback !== '') {
    return { value: opts.fallback, source: 'fallback' }
  }
  return { value: undefined, source: 'unset' }
}

/** Known secret value prefixes (BLUEPRINT §13). */
const SECRET_VALUE_PREFIXES = [
  'ghp_',
  'github_pat_',
  'sk-',
  'xoxb-',
  'xoxa-',
  'xoxp-',
  'xoxr-',
  'xoxs-',
]

export function isSecretValue(value: string): boolean {
  for (const prefix of SECRET_VALUE_PREFIXES) {
    if (value.startsWith(prefix)) {
      return true
    }
  }
  // URL credentials: scheme://user:pass@
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^:@]+:[^@]+@/.test(value)) {
    return true
  }
  return false
}

function isLiteral(value: string): boolean {
  return !/^\$\{[A-Za-z_][A-Za-z0-9_]*(?::-[^}]*)?\}$/.test(value)
}

/**
 * Plan which literal (non-placeholder) secret values in `server` should be
 * extracted to `.env`. Never touches disk.
 *
 * - `policy: 'warn'` → warnings only, no writes (CI / `--yes` default).
 * - `policy: 'extract'` → writes to be appended to `.env`.
 *
 * A value already wrapped in `${...}` is never flagged. Non-secret values such
 * as `NODE_ENV=production` are not flagged.
 */
export function planSecretExtraction(
  server: CanonicalServer,
  opts: { policy: 'warn' | 'extract' },
): PlanSecretExtractionResult {
  const writes: SecretWrite[] = []
  const warnings: string[] = []
  const { policy } = opts

  const consider = (key: string, value: string): void => {
    if (!isLiteral(value)) {
      return
    }
    const secret = SECRET_KEY_RE.test(key) || isSecretValue(value)
    if (!secret) {
      return
    }
    const envVarKey = derivedKey(
      server.transport === 'stdio' ? server.command : 'http',
      key,
    )
    if (policy === 'extract') {
      writes.push({ key: envVarKey, value })
    }
    warnings.push(
      `Secret detected for server field \`${key}\`; extract to \`.env\` as \${${envVarKey}}`,
    )
  }

  if (server.transport === 'stdio') {
    if (server.args) {
      for (const arg of server.args) {
        // Args can embed secrets (e.g. a token passed positionally).
        consider('args', arg)
      }
    }
    if (server.env) {
      for (const [key, value] of Object.entries(server.env)) {
        consider(key, value)
      }
    }
  } else {
    if (server.headers) {
      for (const [key, value] of Object.entries(server.headers)) {
        consider(key, value)
      }
    }
    // For URLs, only flag embedded credentials (user:pass@), not length.
    consider('url', server.url)
  }

  return { writes, warnings }
}

/**
 * Append `writes` to the `.env` at `path`, creating it with mode `0600` when
 * missing. Never overwrites an existing key; warns when a key exists with a
 * different value. Ensures `.env` (and the sync state) are git-ignored first.
 */
export function appendToDotenv(
  path: string,
  writes: SecretWrite[],
): AppendToDotenvResult {
  const added: string[] = []
  const warnings: string[] = []

  const rootDir = dirname(path)
  // Only manage .gitignore in project scope: global scope writes to
  // ~/.agents/.env (parent dir is .agents), project scope writes to <cwd>/.env.
  const isProjectScope = basename(rootDir) !== AGENTS_DIR
  if (isProjectScope) {
    ensureIgnored(rootDir, [ENV_FILE, `${AGENTS_DIR}/${STATE_FILE}`])
  }

  let existing: Record<string, string> = {}
  const raw = readTextFile(path)
  if (raw !== null) {
    existing = parseDotenv(raw).vars
  }
  const lines: string[] = raw !== null ? splitLines(raw) : []

  for (const { key, value } of writes) {
    if (key in existing) {
      if (existing[key] !== value) {
        warnings.push(
          `.env key \`${key}\` already exists with a different value; not overwriting`,
        )
      }
      continue
    }
    existing[key] = value
    added.push(key)
    lines.push(`${key}=${value}`)
  }

  // Never create an empty .env when there's nothing to write and no existing file.
  if (added.length > 0) {
    writeFileAtomic(path, lines.join('\n') + (lines.length > 0 ? '\n' : ''), {
      mode: 0o600,
    })
  }

  return { added, warnings }
}

/**
 * Split a text file into lines, dropping the single trailing `''` artifact
 * produced when the content ends with a newline. Interior blank lines are kept.
 */
function splitLines(content: string): string[] {
  const lines = content.split(/\r?\n/)
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }
  return lines
}

/**
 * Append missing `KEY=` entries to `.env.example`, preserving order, comments,
 * and existing lines. Never writes values.
 */
export function syncEnvExample(
  path: string,
  keys: string[],
): SyncEnvExampleResult {
  const added: string[] = []
  const warnings: string[] = []

  // .env.example is meant to be committed (keys only, no secrets) — never
  // gitignore it.
  const rootDir = dirname(path)

  let raw: string | null = readTextFile(path)
  const lines: string[] = raw !== null ? splitLines(raw) : []
  const present = new Set<string>()
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq !== -1) {
      present.add(trimmed.slice(0, eq).trim())
    }
  }

  for (const key of keys) {
    if (present.has(key)) continue
    present.add(key)
    added.push(key)
    lines.push(`${key}=`)
  }

  if (added.length > 0 || raw === null) {
    writeFileAtomic(path, lines.join('\n') + (lines.length > 0 ? '\n' : ''))
  }

  return { added, warnings }
}
