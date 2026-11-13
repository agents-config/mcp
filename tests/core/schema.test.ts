import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import pkg from '$/package.json' with { type: 'json' }
import {
  CanonicalMcpConfigSchema,
  validateConfig,
  AgentIdSchema,
} from '$/src/core/schema'
import {
  DEFAULT_SCHEMA_URL,
  SPEC_VERSION,
  SERVER_NAME_PATTERN,
} from '$/src/config'

const schemaDoc = JSON.parse(readFileSync('spec/mcp.schema.json', 'utf8')) as {
  $id: string
}

describe('canonical schema', () => {
  it('derives $id from package.json version (never hardcoded)', () => {
    expect(SPEC_VERSION).toBe(pkg.version)
    expect(schemaDoc.$id).toBe(DEFAULT_SCHEMA_URL)
    expect(schemaDoc.$id).toContain(`/schema/v${pkg.version}/`)
    // The version segment must come from package.json, not a literal.
    expect(schemaDoc.$id).not.toContain('/schema/v0.1.0/')
    expect(schemaDoc.$id).not.toContain('/schema/v9.9.9/')
  })

  it('AgentIdSchema enumerates the six agents', () => {
    expect(AgentIdSchema.options).toEqual([
      'claude-code',
      'cursor',
      'vscode',
      'opencode',
      'windsurf',
      'zed',
    ])
  })

  it('SERVER_NAME_PATTERN accepts valid names and rejects invalid ones', () => {
    expect(SERVER_NAME_PATTERN.test('github')).toBe(true)
    expect(SERVER_NAME_PATTERN.test('my.server_v1')).toBe(true)
    expect(SERVER_NAME_PATTERN.test('GitHub')).toBe(false)
    expect(SERVER_NAME_PATTERN.test('-bad')).toBe(false)
    expect(SERVER_NAME_PATTERN.test('')).toBe(false)
  })

  it('parses a valid canonical config', () => {
    const config = CanonicalMcpConfigSchema.parse({
      $schema: DEFAULT_SCHEMA_URL,
      servers: {
        github: {
          transport: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
        },
        linear: {
          transport: 'http',
          url: 'https://mcp.linear.app/mcp',
        },
      },
    })
    expect(config.servers.github!.transport).toBe('stdio')
    expect(config.servers.linear!.transport).toBe('http')
  })

  it('applies args default without materializing on write', () => {
    const parsed = CanonicalMcpConfigSchema.parse({
      $schema: DEFAULT_SCHEMA_URL,
      servers: {
        github: { transport: 'stdio', command: 'npx' },
      },
    })
    const github = parsed.servers.github!
    expect(github.transport).toBe('stdio')
    if (github.transport === 'stdio') {
      expect(github.args).toEqual([])
    }
  })

  it('rejects unknown top-level keys (z.strictObject)', () => {
    expect(() =>
      CanonicalMcpConfigSchema.parse({
        $schema: DEFAULT_SCHEMA_URL,
        servers: {},
        bogus: true,
      }),
    ).toThrow()
  })

  it('validateConfig warns on $schema mismatch but does not fail', () => {
    const { warnings } = validateConfig({
      $schema: 'https://example.com/other.json',
      servers: {},
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain(DEFAULT_SCHEMA_URL)
  })

  it('validateConfig does not warn when $schema matches', () => {
    const { warnings } = validateConfig({
      $schema: DEFAULT_SCHEMA_URL,
      servers: {},
    })
    expect(warnings).toEqual([])
  })
})
