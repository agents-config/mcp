import { describe, expect, it } from 'vitest'
import { runDoctor } from '$/src/commands/doctor.command'
import { runSync } from '$/src/commands/sync'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'
import { persistCanonicalConfig } from '$/src/commands/util'
import { writeFileAtomic } from '$/src/core/fs-atomic'
import { writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_SCHEMA_URL } from '$/src/config'

describe('doctor', () => {
  it('schema error: missing canonical config', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: false,
      })
      expect(result.errors).toBeGreaterThan(0)
      expect(result.results[0]!.code).toBe('SCHEMA')
    } finally {
      cleanup()
    }
  })

  it('env error: missing required env var', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            test: {
              type: 'stdio',
              command: 'npx',
              env: { MISSING_VAR: '${MISSING_VAR}' },
            },
          },
        }),
      )

      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: false,
      })
      const envErrors = result.results.filter((r) => r.code === 'ENV')
      expect(envErrors.length).toBeGreaterThan(0)
      expect(result.errors).toBeGreaterThan(0)
    } finally {
      cleanup()
    }
  })

  it('env: dotenv resolves placeholder, no error', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(join(ctx.cwd, '.env'), 'MY_TOKEN=abc123\n')
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            test: {
              type: 'stdio',
              command: 'npx',
              env: { MY_TOKEN: '${MY_TOKEN}' },
            },
          },
        }),
      )

      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: false,
      })
      const envErrors = result.results.filter((r) => r.code === 'ENV')
      expect(envErrors.length).toBe(0)
      expect(result.errors).toBe(0)
    } finally {
      cleanup()
    }
  })

  it('env: fallback placeholder resolves, no error', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            test: {
              type: 'stdio',
              command: 'npx',
              env: { MY_TOKEN: '${MISSING_VAR:-fallback}' },
            },
          },
        }),
      )

      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: false,
      })
      const envErrors = result.results.filter((r) => r.code === 'ENV')
      expect(envErrors.length).toBe(0)
      expect(result.errors).toBe(0)
    } finally {
      cleanup()
    }
  })

  it('runtime error: missing stdio binary', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            nonexistent: {
              type: 'stdio',
              command: 'nonexistent-binary-xyz',
            },
          },
        }),
      )

      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: false,
      })
      const runtimeErrors = result.results.filter((r) => r.code === 'RUNTIME')
      expect(runtimeErrors.length).toBeGreaterThan(0)
      expect(result.errors).toBeGreaterThan(0)
    } finally {
      cleanup()
    }
  })

  it('drift: reformatting native file does not trigger drift', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            test: {
              type: 'stdio',
              command: 'npx',
              args: ['-y', 'pkg'],
            },
          },
        }),
      )

      // First sync to create native file + state
      await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        yes: true,
      } as any)
      // Reformat the native file (different formatting, same content)
      const nativePath = join(ctx.cwd, '.mcp.json')
      writeFileAtomic(
        nativePath,
        JSON.stringify(
          {
            mcpServers: {
              test: {
                type: 'stdio',
                command: 'npx',
                args: ['-y', 'pkg'],
              },
            },
          },
          null,
          2,
        ),
      )

      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        strict: false,
      })
      const driftWarnings = result.results.filter((r) => r.code === 'DRIFT')
      expect(driftWarnings.length).toBe(0)
    } finally {
      cleanup()
    }
  })

  it('drift: removing managed entry on disk is reported as drift', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            test: {
              type: 'stdio',
              command: 'npx',
              args: ['-y', 'pkg'],
            },
          },
        }),
      )

      // First sync to create state
      await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        yes: true,
      } as any)

      // Remove the native file
      rmSync(join(ctx.cwd, '.mcp.json'), { force: true })

      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        strict: false,
      })
      const driftWarnings = result.results.filter((r) => r.code === 'DRIFT')
      expect(driftWarnings.length).toBeGreaterThan(0)
    } finally {
      cleanup()
    }
  })

  it('warnings do not fail unless --strict', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {
            test: {
              type: 'stdio',
              command: 'npx',
              env: { MISSING_VAR: '${MISSING_VAR}' },
            },
          },
        }),
      )

      const nonStrict = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: false,
      })
      // MISSING_VAR is not in .env, so it's an error even without --strict
      expect(nonStrict.errors).toBeGreaterThan(0)

      const strict = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: true,
      })
      expect(strict.errors).toBeGreaterThan(0)
    } finally {
      cleanup()
    }
  })

  it('state error: corrupt state', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      writeFileAtomic(
        join(ctx.cwd, '.agents', 'mcp.json'),
        JSON.stringify({
          $schema: DEFAULT_SCHEMA_URL,
          mcpServers: {},
        }),
      )
      // Write corrupt state
      writeFileAtomic(
        join(ctx.cwd, '.agents', '.mcp-sync-state.json'),
        '{ not valid json',
      )

      const result = await runDoctor({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        strict: false,
      })
      const stateErrors = result.results.filter((r) => r.code === 'STATE')
      expect(stateErrors.length).toBeGreaterThan(0)
      expect(result.errors).toBeGreaterThan(0)
    } finally {
      cleanup()
    }
  })
})
