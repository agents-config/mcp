import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { runSync } from '$/src/commands/sync'
import { persistCanonicalConfig } from '$/src/commands/util'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'

describe('commands integration', () => {
  it('init → sync → list flow', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      // init with agents and a server
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        servers: {
          github: {
            transport: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
          },
        },
      })

      // sync with targets
      const result = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code', 'cursor'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])

      expect(result.targets).toEqual(['claude-code', 'cursor'])
      expect(result.written.length).toBeGreaterThan(0)

      // Verify native file was written
      const content = readFileSync(`${ctx.cwd}/.mcp.json`, 'utf8')
      expect(content).toContain('mcpServers')
      expect(content).toContain('github')

      // Verify state was updated
      const stateContent = readFileSync(
        `${ctx.cwd}/.agents/.mcp-sync-state.json`,
        'utf8',
      )
      expect(stateContent).toContain('claude-code')
      expect(stateContent).toContain('cursor')
    } finally {
      cleanup()
    }
  })

  it('sync is byte-idempotent', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        servers: {
          github: {
            transport: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
          },
        },
      })

      const result1 = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])

      const result2 = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])

      expect(result2.written).toEqual(result1.written)
    } finally {
      cleanup()
    }
  })

  it('sync with no resolvable targets exits 1', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        servers: {},
      })

      const exitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation((() => {}) as NodeJS.Process['exit'])
      try {
        await runSync({
          scope: 'project',
          ctx,
          flag: undefined,
          dryRun: false,
          yes: true,
        } as Parameters<typeof runSync>[0])
        expect(exitSpy).toHaveBeenCalledWith(1)
      } finally {
        exitSpy.mockRestore()
      }
    } finally {
      cleanup()
    }
  })

  it('dry-run writes nothing', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        servers: {
          github: {
            transport: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
          },
        },
      })

      const result = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: true,
        yes: true,
      } as Parameters<typeof runSync>[0])

      expect(result.written).toEqual([])

      // Native file should not exist
      const fs = require('node:fs')
      expect(fs.existsSync(`${ctx.cwd}/.mcp.json`)).toBe(false)
    } finally {
      cleanup()
    }
  })
})
