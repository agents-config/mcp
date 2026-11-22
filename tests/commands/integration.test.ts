import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runSync } from '$/src/commands/sync'
import { removeCommand } from '$/src/commands/remove.command'
import { persistCanonicalConfig } from '$/src/commands/util'
import { loadState, emptyState, writeState } from '$/src/core/state'
import { createSandbox } from '$/tests/helpers/sandbox'

describe('commands integration', () => {
  it('init → sync → list flow', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      // init with agents and a server
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {
          github: {
            type: 'stdio',
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
        mcpServers: {
          github: {
            type: 'stdio',
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
        mcpServers: {},
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
        mcpServers: {
          github: {
            type: 'stdio',
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

  it('remove alpha mantem somente beta no canônico e nos agentes (AC1)', async () => {
    const { ctx, cleanup } = createSandbox()
    const origCwd = process.cwd()
    // `removeCommand.run` cria o `RuntimeContext` internamente via
    // `createUiAndCtx()`, que usa `process.cwd()`. Forçar o cwd para o sandbox
    // garante que o comando leia/grave arquivos dentro dele (sem tocar o disco
    // real do repositorio).
    mkdirSync(ctx.cwd, { recursive: true })
    process.chdir(ctx.cwd)

    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as NodeJS.Process['exit'])
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      // 1. Semente o canônico com `alpha` e `beta` (stdio, npx, args vazio).
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {
          alpha: { type: 'stdio', command: 'npx', args: [] },
          beta: { type: 'stdio', command: 'npx', args: [] },
        },
      })
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['cursor'],
        agents: {},
        managedPlugins: ['alpha', 'beta'],
      })

      // 2. Sincroniza com `cursor`: cria os plugins e o `.cursor/mcp.json`.
      await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])

      // 3. Remove `alpha` (sem `--no-sync`: executa `runSync` de fato).
      await removeCommand.run!({
        args: { _: ['alpha'], global: false, yes: true },
        rawArgs: ['alpha'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      // Nunca deve sair com codigo de saida diferente de zero.
      expect(exitSpy).not.toHaveBeenCalled()

      // Canônico reparseado: somente `beta`, definicao inalterada.
      const canonical = JSON.parse(
        readFileSync(join(ctx.cwd, '.agents/mcp.json'), 'utf8'),
      )
      expect(Object.keys(canonical.mcpServers)).toEqual(['beta'])
      expect(canonical.mcpServers.beta).toEqual({
        type: 'stdio',
        command: 'npx',
        args: [],
      })

      // `.cursor/mcp.json` continua existindo e contem `beta` (nao `alpha`).
      const cursorContent = readFileSync(
        join(ctx.cwd, '.cursor/mcp.json'),
        'utf8',
      )
      expect(cursorContent).toContain('beta')
      expect(cursorContent).not.toContain('alpha')

      // Plugin gerenciado de `beta` permanece inteiro.
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/beta/plugin.json')),
      ).toBe(true)
      expect(existsSync(join(ctx.cwd, '.agents/plugins/beta/mcp.json'))).toBe(
        true,
      )

      // Diretorio de `alpha` foi apagado (so havia arquivos gerenciados).
      expect(existsSync(join(ctx.cwd, '.agents/plugins/alpha'))).toBe(false)

      // Estado: `managedPlugins` encolheu para `['beta']`.
      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['beta'])
    } finally {
      exitSpy.mockRestore()
      logSpy.mockRestore()
      errorSpy.mockRestore()
      process.chdir(origCwd)
      cleanup()
    }
  })
})
