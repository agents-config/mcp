import { describe, expect, it } from 'vitest'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import {
  getConfigPath,
  readConfig,
  writeConfig,
  loadValidatedConfig,
  ConfigValidationError,
} from '$/src/core/store'
import { DEFAULT_SCHEMA_URL } from '$/src/config'
import { createSandbox } from '$/tests/helpers/sandbox'

function writeRaw(
  ctx: ReturnType<typeof createSandbox>['ctx'],
  raw: string,
): void {
  mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
  writeFileSync(`${ctx.cwd}/.agents/mcp.json`, raw, 'utf8')
}

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
    const raw = `{\n  // comment\n  "mcpServers": {\n    "github": {\n      "type": "stdio",\n      "command": "npx",\n    },\n  },\n}\n`
    try {
      writeRaw(ctx, raw)

      const result = readConfig('project', ctx)
      expect(result).not.toBeNull()
      expect(result!.raw).toBe(raw)
      const mcpServers = (result!.config as Record<string, unknown>)
        .mcpServers as Record<string, unknown>
      expect((mcpServers.github as Record<string, unknown>).type).toBe('stdio')
    } finally {
      cleanup()
    }
  })

  it('readConfig raises ConfigValidationError on truncated JSONC', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeRaw(ctx, '{ not valid json')
      expect(() => readConfig('project', ctx)).toThrow(ConfigValidationError)
    } finally {
      cleanup()
    }
  })

  it('readConfig raises ConfigValidationError on valid-prefix plus trailing garbage', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeRaw(ctx, '{"$schema":"x","mcpServers":{}} >>> GARBAGE')
      expect(() => readConfig('project', ctx)).toThrow(ConfigValidationError)
    } finally {
      cleanup()
    }
  })

  it('readConfig leaves file byte-identical after a failed load', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.agents/mcp.json`
    const raw = '{ not valid json\n'
    try {
      writeRaw(ctx, raw)
      expect(() => readConfig('project', ctx)).toThrow(ConfigValidationError)
      expect(readFileSync(path, 'utf8')).toBe(raw)
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
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            github: {
              type: 'stdio',
              command: 'npx',
              args: ['-y', '@modelcontextprotocol/server-github'],
            },
          },
        },
      })

      const result = readConfig('project', ctx)
      expect(result).not.toBeNull()
      const mcpServers = (result!.config as Record<string, unknown>)
        .mcpServers as Record<string, unknown>
      expect((mcpServers.github as Record<string, unknown>).command).toBe('npx')
      expect(result!.config.$schema).toBe(DEFAULT_SCHEMA_URL)
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
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            github: { type: 'stdio', command: 'npx' },
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
    try {
      writeRaw(
        ctx,
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            github: { type: 'stdio', command: 'npx' },
          },
        }),
      )

      const result = loadValidatedConfig('project', ctx)
      expect(result).not.toBeNull()
      const mcpServers = (result!.config.mcpServers as Record<string, unknown>)
        .github as Record<string, unknown>
      expect(mcpServers.command).toBe('npx')
      expect(result!.warnings.length).toBe(0)
    } finally {
      cleanup()
    }
  })

  it('loadValidatedConfig throws ConfigValidationError on wrong $schema', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeRaw(
        ctx,
        JSON.stringify({
          $schema: 'https://example.com/other.json',
          mcpServers: {
            github: { type: 'stdio', command: 'npx' },
          },
        }),
      )

      try {
        loadValidatedConfig('project', ctx)
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(ConfigValidationError)
      }
    } finally {
      cleanup()
    }
  })
})
