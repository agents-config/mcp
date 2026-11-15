import { describe, expect, it, vi } from 'vitest'
import { runSync } from '$/src/commands/sync'
import { persistCanonicalConfig } from '$/src/commands/util'
import { createRuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'

describe('commands runSync', () => {
  it('runSync with no targets exits 1 with hint', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      // Create a canonical config first so runSync doesn't return early
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {},
      })

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })
      try {
        await expect(
          runSync({
            scope: 'project',
            ctx,
            flag: undefined,
            dryRun: false,
            yes: true,
          } as Parameters<typeof runSync>[0]),
        ).rejects.toThrow('process.exit called')
        expect(exitSpy).toHaveBeenCalledWith(1)
      } finally {
        exitSpy.mockRestore()
      }
    } finally {
      cleanup()
    }
  })

  it('runSync with no canonical config returns early', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const result = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: true,
        yes: true,
      } as Parameters<typeof runSync>[0])
      expect(result.targets).toEqual([])
      expect(result.written).toEqual([])
    } finally {
      cleanup()
    }
  })
})
