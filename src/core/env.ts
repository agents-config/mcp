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
import { isStdioServer, isHttpServer } from '$/src/core/schema'
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

export interface SecretReplacement {
  location: 'env' | 'headers' | 'args' | 'url'
  fieldKey?: string
  argIndex?: number
  match: string
  envKey: string
  secretValue: string
}

export interface PlanSecretExtractionResult {
  writes: SecretWrite[]
  replacements: SecretReplacement[]
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
  'AIza',
  'AKIA',
]

const SECRET_PREFIX_RE = new RegExp(
  `^(?:${SECRET_VALUE_PREFIXES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
)

/** Authorization schemes whose prefix is preserved during replacement. */
const AUTH_SCHEMES = ['Bearer ', 'Basic ', 'Token ']

/**
 * Extract the replaceable secret substring from `value`, if any.
 *
 * Returns the `match` substring (what gets replaced with `${ENV_KEY}`) and the
 * `secretValue` (what gets written to `.env`). For `Bearer <token>` the match is
 * just `<token>`, so the `Bearer ` prefix is preserved by the replacement.
 */
function extractSecretParts(
  value: string,
): { match: string; secretValue: string } | null {
  // Known prefix at start of string (or after an auth scheme prefix).
  for (const scheme of AUTH_SCHEMES) {
    if (value.startsWith(scheme)) {
      const rest = value.slice(scheme.length)
      if (SECRET_PREFIX_RE.test(rest) || isHighEntropy(rest)) {
        return { match: rest, secretValue: rest }
      }
    }
  }
  if (SECRET_PREFIX_RE.test(value)) {
    return { match: value, secretValue: value }
  }
  // URL credentials: scheme://user:pass@
  const urlCreds = value.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/([^:@]+:[^@]+)@/)
  if (urlCreds) {
    return { match: urlCreds[1]!, secretValue: urlCreds[1]! }
  }
  // High-entropy string.
  if (isHighEntropy(value)) {
    return { match: value, secretValue: value }
  }
  return null
}

export function isSecretValue(value: string): boolean {
  return extractSecretParts(value) !== null
}

/**
 * High-entropy heuristic: ≥ 20 chars, no whitespace, ≥ 3 character classes
 * (lowercase, uppercase, digits, symbols). Excludes plain http(s) URLs without
 * credentials and filesystem paths containing `/` or `\`.
 */
function isHighEntropy(value: string): boolean {
  if (value.length < 20) return false
  if (/\s/.test(value)) return false
  // Exclude plain http(s) URLs without embedded credentials.
  if (/^https?:\/\//.test(value) && !/@/.test(value)) return false
  // Exclude filesystem paths.
  if (value.includes('/') || value.includes('\\')) return false

  let classes = 0
  if (/[a-z]/.test(value)) classes++
  if (/[A-Z]/.test(value)) classes++
  if (/[0-9]/.test(value)) classes++
  if (/[^A-Za-z0-9]/.test(value)) classes++
  return classes >= 3
}

function isLiteral(value: string): boolean {
  return !/^\$\{[A-Za-z_][A-Za-z0-9_]*(?::-[^}]*)?\}$/.test(value)
}

/** Matches any `${...}` placeholder substring (used to skip symbolic values). */
const PLACEHOLDER_ANY_RE = /\$\{[A-Za-z_][A-Za-z0-9_]*(?::-[^}]*)?\}/

/**
 * Plan which literal (non-placeholder) secret values in `server` should be
 * extracted to `.env`. Never touches disk.
 *
 * - `policy: 'warn'` → warnings only, no writes (CI / `--yes` default).
 * - `policy: 'extract'` → writes to be appended to `.env`.
 *
 * A value already wrapped in `${...}` is never flagged. Non-secret values such
 * as `NODE_ENV=production` are not flagged.
 *
 * Env var names are derived from `serverName` (via `derivedKey`), sanitizing
 * non-alphanumeric characters, so two servers never collide on env keys.
 *
 * Returns structured `replacements` metadata describing exactly where each
 * secret lives (`env`/`headers`/`args`/`url`), the substring to replace
 * (`match`), the derived env key, and the secret value to persist.
 */
export function planSecretExtraction(
  serverName: string,
  server: CanonicalServer,
  opts: { policy: 'warn' | 'extract' },
): PlanSecretExtractionResult {
  const writes: SecretWrite[] = []
  const replacements: SecretReplacement[] = []
  const warnings: string[] = []
  const { policy } = opts

  const consider = (
    location: 'env' | 'headers' | 'args' | 'url',
    fieldKey: string,
    value: string,
    argIndex?: number,
  ): void => {
    if (!isLiteral(value) || PLACEHOLDER_ANY_RE.test(value)) {
      return
    }
    let parts = extractSecretParts(value)
    if (!parts && SECRET_KEY_RE.test(fieldKey)) {
      // Key-pattern match: the whole literal value is the secret. Strip any
      // auth scheme prefix so `Bearer ` / `Basic ` / `Token ` is preserved.
      let match = value
      for (const scheme of AUTH_SCHEMES) {
        if (value.startsWith(scheme)) {
          match = value.slice(scheme.length)
          break
        }
      }
      parts = { match, secretValue: match }
    }
    if (!parts) {
      return
    }
    const envVarKey = derivedKey(serverName, fieldKey)
    if (policy === 'extract') {
      writes.push({ key: envVarKey, value: parts.secretValue })
    }
    replacements.push({
      location,
      ...(argIndex === undefined ? { fieldKey } : { argIndex }),
      match: parts.match,
      envKey: envVarKey,
      secretValue: parts.secretValue,
    })
    warnings.push(
      `Secret detected for server field \`${fieldKey}\`; extract to \`.env\` as \${${envVarKey}}`,
    )
  }

  if (isStdioServer(server)) {
    if (server.args) {
      for (let i = 0; i < server.args.length; i++) {
        // Args can embed secrets (e.g. a token passed positionally).
        consider('args', 'args', server.args[i]!, i)
      }
    }
    if (server.env) {
      for (const [key, value] of Object.entries(server.env)) {
        consider('env', key, value)
      }
    }
  } else {
    if (server.headers) {
      for (const [key, value] of Object.entries(server.headers)) {
        consider('headers', key, value)
      }
    }
    // For URLs, only flag embedded credentials (user:pass@), not length.
    if (server.url) {
      consider('url', 'url', server.url)
    }
  }

  return { writes, replacements, warnings }
}

/**
 * Pure secret extraction applier. Deep-clones `server` (never mutates input)
 * and applies each replacement from `plan.replacements` deterministically by
 * location, preserving auth scheme prefixes (`Bearer ` / `Basic ` / `Token `).
 */
export function applySecretExtraction(
  server: CanonicalServer,
  plan: PlanSecretExtractionResult,
): CanonicalServer {
  const result = deepCloneServer(server)

  for (const rep of plan.replacements) {
    const replacement = `\${${rep.envKey}}`
    switch (rep.location) {
      case 'env':
        if (isStdioServer(result) && result.env && rep.fieldKey) {
          result.env[rep.fieldKey] = result.env[rep.fieldKey]!.replace(
            rep.match,
            replacement,
          )
        }
        break
      case 'headers':
        if (isHttpServer(result) && result.headers && rep.fieldKey) {
          result.headers[rep.fieldKey] = result.headers[rep.fieldKey]!.replace(
            rep.match,
            replacement,
          )
        }
        break
      case 'args':
        if (
          isStdioServer(result) &&
          result.args &&
          rep.argIndex !== undefined
        ) {
          result.args[rep.argIndex] = result.args[rep.argIndex]!.replace(
            rep.match,
            replacement,
          )
        }
        break
      case 'url':
        if (isHttpServer(result) && result.url) {
          result.url = result.url.replace(rep.match, replacement)
        }
        break
    }
  }

  return result
}

function deepCloneServer(server: CanonicalServer): CanonicalServer {
  return JSON.parse(JSON.stringify(server)) as CanonicalServer
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
