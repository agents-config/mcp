import { describe, expect, it } from 'vitest'
import {
  parsePlaceholders,
  translate,
  type PlaceholderWarning,
} from '$/src/core/placeholder'

const posixKeepDefault = { syntax: 'posix' as const, nativeDefault: true }
const posixDropDefault = { syntax: 'posix' as const, nativeDefault: false }
const envColon = { syntax: 'env-colon' as const, nativeDefault: false }
const braceEnv = { syntax: 'brace-env' as const, nativeDefault: false }

describe('placeholder.parsePlaceholders', () => {
  it('extracts placeholders with name, fallback, and offsets', () => {
    const result = parsePlaceholders(
      'cmd ${TOKEN} and ${DB_URL:-postgres://local} tail',
    )
    expect(result).toEqual([
      {
        raw: '${TOKEN}',
        name: 'TOKEN',
        fallback: undefined,
        start: 4,
        end: 12,
      },
      {
        raw: '${DB_URL:-postgres://local}',
        name: 'DB_URL',
        fallback: 'postgres://local',
        start: 17,
        end: 44,
      },
    ])
  })

  it('returns empty array for a value without placeholders', () => {
    expect(parsePlaceholders('plain text')).toEqual([])
    expect(parsePlaceholders('')).toEqual([])
  })

  it('ignores malformed brace syntax', () => {
    expect(parsePlaceholders('${env:VAR}')).toEqual([])
    expect(parsePlaceholders('${}')).toEqual([])
    expect(parsePlaceholders('${123BAD}')).toEqual([])
  })
})

describe('placeholder.translate', () => {
  it.each([
    ['claude-code (posix, keep default)', posixKeepDefault, '${API_KEY}'],
    ['zed (posix, drop default)', posixDropDefault, '${API_KEY}'],
    ['cursor (env-colon)', envColon, '${env:API_KEY}'],
    ['vscode (env-colon)', envColon, '${env:API_KEY}'],
    ['windsurf (env-colon)', envColon, '${env:API_KEY}'],
    ['opencode (brace-env)', braceEnv, '{env:API_KEY}'],
  ])('%s: ${VAR} → %s', (_label, opts, expected) => {
    const result = translate('${API_KEY}', opts.syntax, opts)
    expect(result.value).toBe(expected)
    expect(result.warnings).toEqual([])
  })

  it.each([
    [
      'claude-code (posix, keep default)',
      posixKeepDefault,
      '${API_KEY:-secret}',
    ],
    ['zed (posix, drop default)', posixDropDefault, '${API_KEY}'],
    ['cursor (env-colon)', envColon, '${env:API_KEY}'],
    ['vscode (env-colon)', envColon, '${env:API_KEY}'],
    ['windsurf (env-colon)', envColon, '${env:API_KEY}'],
    ['opencode (brace-env)', braceEnv, '{env:API_KEY}'],
  ])('%s: ${VAR:-fallback} → %s', (_label, opts, expected) => {
    const result = translate('${API_KEY:-secret}', opts.syntax, opts)
    expect(result.value).toBe(expected)
  })

  it('drops default with DEFAULT_DROPPED warning unless nativeDefault', () => {
    const kept = translate('${API_KEY:-secret}', 'posix', {
      nativeDefault: true,
    })
    expect(kept.value).toBe('${API_KEY:-secret}')
    expect(kept.warnings).toEqual([])

    const dropped = translate('${API_KEY:-secret}', 'posix', {
      nativeDefault: false,
    })
    expect(dropped.value).toBe('${API_KEY}')
    expect(dropped.warnings).toHaveLength(1)
    expect(dropped.warnings[0]!.code).toBe('DEFAULT_DROPPED')
    expect(dropped.warnings[0]!.name).toBe('API_KEY')
  })

  it('translates multiple placeholders in one value', () => {
    const result = translate(
      'postgres://${USER}:${PASS}@${HOST:-localhost}:${PORT:-5432}/${DB}',
      'env-colon',
      { nativeDefault: false },
    )
    expect(result.value).toBe(
      'postgres://${env:USER}:${env:PASS}@${env:HOST}:${env:PORT}/${env:DB}',
    )
    const dropped = result.warnings.filter((w) => w.code === 'DEFAULT_DROPPED')
    expect(dropped.map((w) => w.name)).toEqual(['HOST', 'PORT'])
  })

  it('is idempotent: translating an already-translated value changes nothing', () => {
    const first = translate('${API_KEY}', 'env-colon', { nativeDefault: false })
    expect(first.value).toBe('${env:API_KEY}')

    const second = translate(first.value, 'env-colon', { nativeDefault: false })
    expect(second.value).toBe('${env:API_KEY}')
  })

  it('preserves unknown placeholder syntax verbatim with UNKNOWN_PLACEHOLDER warning', () => {
    const result = translate('${env:ALREADY} and ${}', 'posix', {
      nativeDefault: true,
    })
    expect(result.value).toBe('${env:ALREADY} and ${}')
    const unknown = result.warnings.filter(
      (w) => w.code === 'UNKNOWN_PLACEHOLDER',
    )
    expect(unknown.map((w) => w.name)).toEqual(['env:ALREADY', ''])
  })

  it('leaves values without placeholders untouched', () => {
    const result = translate('no secrets here', 'posix', {
      nativeDefault: true,
    })
    expect(result.value).toBe('no secrets here')
    expect(result.warnings).toEqual([])
  })
})

describe('placeholder.warnings shape', () => {
  it('DEFAULT_DROPPED warning carries name and message', () => {
    const result = translate('${KEY:-v}', 'env-colon', { nativeDefault: false })
    const w = result.warnings[0] as PlaceholderWarning
    expect(w.code).toBe('DEFAULT_DROPPED')
    expect(w.name).toBe('KEY')
    expect(typeof w.message).toBe('string')
    expect(w.message.length).toBeGreaterThan(0)
  })
})
