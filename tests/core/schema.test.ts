import { describe, expect, it } from 'vitest'
import {
  CanonicalMcpConfigSchema,
  validateConfig,
  AgentIdSchema,
  isStdioServer,
  isHttpServer,
} from '$/src/core/schema'
import { DEFAULT_SCHEMA_URL } from '$/src/config'

describe('canonical schema', () => {
  it('rejects an unsupported type value (Zod)', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'websocket', url: 'https://example.com' },
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing type value (Zod)', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { url: 'https://example.com' },
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing $schema (required)', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      mcpServers: {
        github: { type: 'stdio', command: 'npx' },
      },
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues.some((i) => i.path.includes('$schema'))).toBe(
      true,
    )
  })

  it('rejects disabled field on server', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx', disabled: true },
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects targets field on server', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx', targets: ['claude-code'] },
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects PLUGIN_ROOT as an env key', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx', env: { PLUGIN_ROOT: '/x' } },
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects PLUGIN_DATA as an env key', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx', env: { PLUGIN_DATA: '/x' } },
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects cwd outside allowed plugin paths', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx', cwd: '/absolute/path' },
      },
    })
    expect(result.success).toBe(false)
  })

  it('accepts cwd with ./ prefix', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx', cwd: './subdir' },
      },
    })
    expect(result.success).toBe(true)
  })

  it('accepts cwd with ${PLUGIN_ROOT}/ prefix', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx', cwd: '${PLUGIN_ROOT}/subdir' },
      },
    })
    expect(result.success).toBe(true)
  })

  it('accepts cwd with ${PLUGIN_DATA}/ prefix', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx', cwd: '${PLUGIN_DATA}/subdir' },
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects $schema with a different URI', () => {
    const result = CanonicalMcpConfigSchema.safeParse({
      $schema: 'https://example.com/other.json',
      mcpServers: {
        github: { type: 'stdio', command: 'npx' },
      },
    })
    expect(result.success).toBe(false)
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

  it('parses a valid canonical config', () => {
    const config = CanonicalMcpConfigSchema.parse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
        },
        linear: {
          type: 'streamable-http',
          url: 'https://mcp.linear.app/mcp',
        },
        'linear-sse': {
          type: 'sse',
          url: 'https://mcp.linear.app/sse',
        },
      },
    })
    expect(isStdioServer(config.mcpServers.github!)).toBe(true)
    if (isStdioServer(config.mcpServers.github!)) {
      expect(config.mcpServers.github!.command).toBe('npx')
    }
    expect(isHttpServer(config.mcpServers.linear!)).toBe(true)
    if (isHttpServer(config.mcpServers.linear!)) {
      expect(config.mcpServers.linear!.type).toBe('streamable-http')
    }
    expect(isHttpServer(config.mcpServers['linear-sse']!)).toBe(true)
    if (isHttpServer(config.mcpServers['linear-sse']!)) {
      expect(config.mcpServers['linear-sse']!.type).toBe('sse')
    }
  })

  it('applies args default without materializing on write', () => {
    const parsed = CanonicalMcpConfigSchema.parse({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {
        github: { type: 'stdio', command: 'npx' },
      },
    })
    const github = parsed.mcpServers.github!
    expect(isStdioServer(github)).toBe(true)
    if (isStdioServer(github)) {
      expect(github.args).toEqual([])
    }
  })

  it('rejects unknown top-level keys (z.strictObject)', () => {
    expect(() =>
      CanonicalMcpConfigSchema.parse({
        $schema: DEFAULT_SCHEMA_URL,
        mcpServers: {},
        bogus: true,
      }),
    ).toThrow()
  })

  it('validateConfig warns on $schema mismatch but does not fail', () => {
    const { warnings } = validateConfig({
      $schema: 'https://example.com/other.json',
      mcpServers: {},
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain(DEFAULT_SCHEMA_URL)
  })

  it('validateConfig does not warn when $schema matches', () => {
    const { warnings } = validateConfig({
      $schema: DEFAULT_SCHEMA_URL,
      mcpServers: {},
    })
    expect(warnings).toEqual([])
  })
})
