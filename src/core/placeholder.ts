/**
 * Placeholder grammar, translation, and required-variable collection.
 *
 * Canonical values use the `${VAR}` / `${VAR:-fallback}` grammar. Translation is
 * purely syntactic and idempotent: values are never substituted, only re-syntaxed
 * into the target agent's env syntax (`${VAR}`, `${env:VAR}`, `{env:VAR}`).
 *
 * Implements BLUEPRINT §8.4 and the MATRIX.md §3 translation table.
 */

import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer } from '$/src/core/schema'

/**
 * Grammar: `${NAME}` or `${NAME:-fallback}`, where `NAME` is
 * `[A-Za-z_][A-Za-z0-9_]*`. Single pass, non-overlapping.
 */
export const PLACEHOLDER_RE = /\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-([^}]*))?\}/g

/** Any `${...}` that did not match the grammar (preserved verbatim). */
const BRACE_RE = /\$\{[^}]*\}/g

export type EnvSyntax = 'posix' | 'env-colon' | 'brace-env'

export interface Placeholder {
  raw: string
  name: string
  fallback?: string
  start: number
  end: number
}

export interface PlaceholderWarning {
  code: 'UNKNOWN_PLACEHOLDER' | 'DEFAULT_DROPPED'
  name: string
  message: string
}

export interface TranslateResult {
  value: string
  warnings: PlaceholderWarning[]
}

/** Secret key heuristic (BLUEPRINT §13). */
export const SECRET_KEY_RE =
  /(?:^|_)(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|CREDENTIAL|PRIVATE_KEY|AUTHORIZATION|AUTH|DSN)(?:_|$)/i

export interface RequiredEnvVar {
  name: string
  description?: string
  isSecret: boolean
}

/**
 * Derive a canonical env var name from a server name and field, e.g.
 * `derivedKey('github', 'token')` → `GITHUB_TOKEN`.
 */
export function derivedKey(serverName: string, field: string): string {
  const sanitizedServer = serverName.replace(/[^A-Za-z0-9_]/g, '_')
  const sanitized = field.replace(/[^A-Za-z0-9_]/g, '_')
  return `${sanitizedServer.toUpperCase()}_${sanitized.toUpperCase()}`
}

/**
 * Extract every grammar-matching placeholder from `value`, in order of
 * appearance, with its raw text, name, optional fallback, and offsets.
 */
export function parsePlaceholders(value: string): Placeholder[] {
  const placeholders: Placeholder[] = []
  let match: RegExpExecArray | null
  PLACEHOLDER_RE.lastIndex = 0
  while ((match = PLACEHOLDER_RE.exec(value)) !== null) {
    placeholders.push({
      raw: match[0]!,
      name: match[1]!,
      fallback: match[2] === undefined ? undefined : match[2]!,
      start: match.index,
      end: match.index + match[0]!.length,
    })
  }
  return placeholders
}

function encodeSyntax(name: string, syntax: EnvSyntax): string {
  switch (syntax) {
    case 'posix':
      return `${name}`
    case 'env-colon':
      return `env:${name}`
    case 'brace-env':
      return `env:${name}`
  }
}

function wrap(inner: string, syntax: EnvSyntax): string {
  switch (syntax) {
    case 'posix':
      return `\${${inner}}`
    case 'env-colon':
      return `\${${inner}}`
    case 'brace-env':
      return `{${inner}}`
  }
}

/**
 * Translate canonical `${NAME}` / `${NAME:-fallback}` placeholders into the
 * target agent's env syntax. Never substitutes values.
 *
 * - `posix` (`claude-code`, `zed`): `${NAME}` kept as-is.
 * - `env-colon` (`cursor`, `vscode`, `windsurf`): `${NAME}` → `${env:NAME}`.
 * - `brace-env` (`opencode`): `${NAME}` → `{env:NAME}`.
 *
 * When `nativeDefault` is false, a `:-fallback` has no native equivalent and is
 * dropped with a `DEFAULT_DROPPED` warning (claude-code keeps fallbacks).
 * Unknown placeholder syntax is preserved verbatim with an `UNKNOWN_PLACEHOLDER`
 * warning.
 */
export function translate(
  value: string,
  syntax: EnvSyntax,
  opts: { nativeDefault: boolean },
): TranslateResult {
  const defaultWarnings: PlaceholderWarning[] = []
  const placeholders = parsePlaceholders(value)

  // Build the translated value by splicing replacements from last to first so
  // offsets of earlier placeholders stay valid after later ones are replaced.
  let result = value
  for (let i = placeholders.length - 1; i >= 0; i--) {
    const ph = placeholders[i]!
    const hasFallback = ph.fallback !== undefined
    let inner: string
    if (hasFallback && !opts.nativeDefault) {
      defaultWarnings.push({
        code: 'DEFAULT_DROPPED',
        name: ph.name,
        message: `Default for \${${ph.name}} dropped: ${syntax} has no native equivalent`,
      })
      inner = encodeSyntax(ph.name, syntax)
    } else {
      inner = hasFallback
        ? `${encodeSyntax(ph.name, syntax)}:-${ph.fallback}`
        : encodeSyntax(ph.name, syntax)
    }
    result =
      result.slice(0, ph.start) + wrap(inner, syntax) + result.slice(ph.end)
  }

  // Unknown placeholder syntax: any `${...}` in the ORIGINAL value that did not
  // match the grammar is preserved verbatim (it is already in `result`) and
  // reported. Detect against the original value so freshly translated
  // `${env:NAME}` / `{env:NAME}` text is not mistaken for unknowns.
  const unknownWarnings: PlaceholderWarning[] = []
  const translatedSpans = new Set(placeholders.map((ph) => ph.start))
  BRACE_RE.lastIndex = 0
  let braceMatch: RegExpExecArray | null
  while ((braceMatch = BRACE_RE.exec(value)) !== null) {
    if (!translatedSpans.has(braceMatch.index)) {
      const raw = braceMatch[0]!
      unknownWarnings.push({
        code: 'UNKNOWN_PLACEHOLDER',
        name: raw.slice(2, -1),
        message: `Unknown placeholder syntax: ${raw}`,
      })
    }
  }

  // defaultWarnings were collected right-to-left, so reverse them to surface
  // in left-to-right (appearance) order; unknownWarnings are already ordered.
  const warnings = [...defaultWarnings.reverse(), ...unknownWarnings]

  return { value: result, warnings }
}

/**
 * Collect the environment variables required by a canonical server, scanning
 * `env` values, `headers` values, `args` items, and `url`. A value already
 * wrapped in `${...}` is never flagged as a literal secret; `isSecret` is
 * derived from the field key name.
 */
export function collectRequiredVars(server: CanonicalServer): RequiredEnvVar[] {
  const vars: RequiredEnvVar[] = []
  const seen = new Set<string>()

  const add = (name: string, isSecret: boolean): void => {
    if (seen.has(name)) return
    seen.add(name)
    vars.push({ name, isSecret })
  }

  const isSecretKey = (key: string): boolean => SECRET_KEY_RE.test(key)

  const scanString = (value: string, isSecret: boolean): void => {
    for (const ph of parsePlaceholders(value)) {
      add(ph.name, isSecret)
    }
  }

  if (isStdioServer(server)) {
    for (const arg of server.args ?? []) {
      scanString(arg, false)
    }
    if (server.env) {
      for (const [key, value] of Object.entries(server.env)) {
        scanString(value, isSecretKey(key))
      }
    }
  } else {
    if (server.url) {
      scanString(server.url, false)
    }
    if (server.headers) {
      for (const [key, value] of Object.entries(server.headers)) {
        scanString(value, isSecretKey(key))
      }
    }
  }

  return vars
}
