import { describe, expect, it } from 'vitest'
import {
  getConfigPath,
  readConfig,
  writeConfig,
  loadValidatedConfig,
  ConfigValidationError,
} from '$/src/core/store'
import { createSandbox } from '$/tests/helpers/sandbox'

describe('store', () => {
  it('getConfigPath returns project and global paths', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      expect(getConfigPath('project', ctx)).toBe(`${ctx.cwd}/.agents/mcp.json`)
      expect(getConfigPath('global', ctx)).toBe(
        `${ctx.homeDir}/.agents/mcp.json`,
      )
    } finally {
      cleanup()
    }
  })

  it('readConfig returns null for missing file', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      expect(readConfig('project', ctx)).toBeNull()
      expect(readConfig('global', ctx)).toBeNull()
    } finally {
      cleanup()
    }
  })

  it('readConfig parses JSONC with comments and trailing commas', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/mcp.json`
    try {
      const raw = `{\n  // comment\n  "servers": {\n    "github": {\n      "transport": "stdio",\n      "command": "npx",\n    },\n  },\n}\n`
      // Simulate a pre-existing file by writing directly.
      // writeConfig creates the directory? No — it doesn't mkdir. We write via
      // a raw fs call here just to feed readConfig.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('node:fs').mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      require('node:fs').writeFileSync(path, raw, 'utf8')

      const result = readConfig('project', ctx)
      expect(result).not.toBeNull()
      expect(result!.raw).toBe(raw)
      const servers = (result!.config as Record<string, unknown>)
        .servers as Record<string, unknown>
      expect((servers.github as Record<string, unknown>).transport).toBe(
        'stdio',
      )
    } finally {
      cleanup()
    }
  })

  it('writeConfig writes atomically and round-trips', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeConfig({
        scope: 'project',
        ctx,
        config: {
          $schema: 'https://agents-mcp.dev/schema/v0.0.0/mcp.schema.json',
          servers: {
            github: {
              transport: 'stdio',
              command: 'npx',
              args: ['-y', '@modelcontextprotocol/server-github'],
            },
          },
        },
      })

      const result = readConfig('project', ctx)
      expect(result).not.toBeNull()
      const servers = (result!.config as Record<string, unknown>)
        .servers as Record<string, unknown>
      expect((servers.github as Record<string, unknown>).command).toBe('npx')
      expect(result!.config.$schema).toContain('/schema/v0.0.0/')
    } finally {
      cleanup()
    }
  })

  it('writeConfig does not materialize defaults (minimal serialization)', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeConfig({
        scope: 'project',
        ctx,
        config: {
          $schema: 'https://agents-mcp.dev/schema/v0.0.0/mcp.schema.json',
          servers: {
            github: { transport: 'stdio', command: 'npx' },
          },
        },
      })

      const result = readConfig('project', ctx)
      const raw = result!.raw
      // `args` has a default but should not be materialized on write.
      expect(raw).not.toContain('"args"')
      expect(raw).not.toContain('"env"')
    } finally {
      cleanup()
    }
  })

  it('loadValidatedConfig returns null for missing file', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      expect(loadValidatedConfig('project', ctx)).toBeNull()
    } finally {
      cleanup()
    }
  })

  it('loadValidatedConfig validates and returns warnings', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/mcp.json`
    try {
      // Write directly (not via writeConfig, which overwrites $schema) so we
      // can control the $schema value.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('node:fs').mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
      require('node:fs').writeFileSync(
        path,
        JSON.stringify({
          $schema: 'https://example.com/other.json',
          servers: {
            github: { transport: 'stdio', command: 'npx' },
          },
        }),
        'utf8',
      )

      const result = loadValidatedConfig('project', ctx)
      expect(result).not.toBeNull()
      const servers = (result!.config.servers as Record<string, unknown>)
        .github as Record<string, unknown>
      expect(servers.command).toBe('npx')
      expect(result!.warnings.length).toBeGreaterThan(0)
      expect(result!.warnings[0]).toContain('$schema')
    } finally {
      cleanup()
    }
  })

  it('loadValidatedConfig throws ConfigValidationError on invalid schema', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeConfig({
        scope: 'project',
        ctx,
        config: {
          $schema: 'https://agents-mcp.dev/schema/v0.0.0/mcp.schema.json',
          servers: {
            'Bad Name': { transport: 'stdio', command: 'npx' },
          },
        },
      })

      expect(() => loadValidatedConfig('project', ctx)).toThrow(
        ConfigValidationError,
      )
    } finally {
      cleanup()
    }
  })
})
