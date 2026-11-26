import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { removeCommand } from '$/src/commands/remove.command'
import {
  createUiAndCtx,
  persistCanonicalConfig,
  loadSyncState,
} from '$/src/commands/util'
import { loadState, emptyState, writeState } from '$/src/core/state'
import { DEFAULT_SCHEMA_URL } from '$/src/config'
import type { RuntimeContext } from '$/src/core/context'
import type { PromptUi } from '$/src/ui/prompts'
import { createSandbox } from '$/tests/helpers/sandbox'

vi.mock('$/src/commands/util', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return { ...actual, createUiAndCtx: vi.fn() }
})

// `runSync` é mockado no nível do módulo para provar que `--no-sync` não o chama.
vi.mock('$/src/commands/sync', () => ({
  runSync: vi.fn().mockResolvedValue({
    scope: 'project' as const,
    targets: [],
    written: [],
    warnings: [],
    errors: [],
  }),
}))
import { runSync } from '$/src/commands/sync'
const runSyncMock = vi.mocked(runSync)

let exitSpy: ReturnType<typeof vi.spyOn>

function setupUi(ctx: RuntimeContext) {
  const ui = {
    error: vi.fn(),
    warn: vi.fn(),
    note: vi.fn(),
  }
  vi.mocked(createUiAndCtx).mockImplementation(() => ({
    ctx,
    ui: ui as unknown as PromptUi,
  }))
  return ui
}

function baseArgs(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    yes: true,
    global: false,
    _: [],
    ...overrides,
  }
}

/** Escreve um canônico com `alpha` e `beta` e grava o estado com ambos gerenciados. */
function seedCanonicalAndState(
  ctx: RuntimeContext,
  opts: { stateManaged?: string[] } = {},
) {
  persistCanonicalConfig('project', ctx, {
    $schema: DEFAULT_SCHEMA_URL,
    mcpServers: {
      alpha: { type: 'stdio', command: 'npx', args: ['-y', 'pkg-a'] },
      beta: { type: 'stdio', command: 'npx', args: ['-y', 'pkg-b'] },
    },
  })
  writeState('project', ctx, {
    ...emptyState('project'),
    targets: [],
    agents: {},
    managedPlugins: opts.stateManaged ?? ['alpha', 'beta'],
  })
}

function writePluginFiles(
  ctx: RuntimeContext,
  name: string,
  extra: string[] = [],
) {
  const dir = join(ctx.cwd, '.agents/plugins', name)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'plugin.json'), '{}')
  writeFileSync(join(dir, 'mcp.json'), '{}')
  writeFileSync(join(dir, 'mcp_config.json'), '{}')
  for (const f of extra) {
    writeFileSync(join(dir, f), 'keep')
  }
}

describe('commands remove (T3)', () => {
  beforeEach(() => {
    runSyncMock.mockClear()
    exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as NodeJS.Process['exit'])
    exitSpy.mockClear()
  })

  afterEach(() => {
    exitSpy.mockRestore()
  })

  it('AC1: remove alpha deixa só beta no canônico, definição idêntica', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)

      await removeCommand.run!({
        args: baseArgs({ _: ['alpha'] }),
        rawArgs: ['alpha'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      const content = readFileSync(join(ctx.cwd, '.agents/mcp.json'), 'utf8')
      const config = JSON.parse(content)
      expect(Object.keys(config.mcpServers)).toEqual(['beta'])
      expect(config.mcpServers.beta).toEqual({
        type: 'stdio',
        command: 'npx',
        args: ['-y', 'pkg-b'],
      })
      expect(ui.error).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('AC2: --no-sync via args.sync===false não chama runSync; targets/agents preservados; plugin limpo', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)
      writePluginFiles(ctx, 'alpha')
      writePluginFiles(ctx, 'beta')

      await removeCommand.run!({
        args: baseArgs({ sync: false, _: ['alpha'] }),
        rawArgs: ['alpha'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(runSyncMock).not.toHaveBeenCalled()
      expect(exitSpy).not.toHaveBeenCalled()

      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/alpha/plugin.json')),
      ).toBe(false)
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/beta/plugin.json')),
      ).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual([])
      expect(state.agents).toEqual({})
      expect(state.managedPlugins).toEqual(['beta'])
      expect(ui.error).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('AC2: --no-sync via rawArgs sem args.sync → mesmo comportamento', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)
      writePluginFiles(ctx, 'alpha')

      await removeCommand.run!({
        args: baseArgs({ _: ['alpha'] }),
        rawArgs: ['alpha', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(runSyncMock).not.toHaveBeenCalled()
      expect(exitSpy).not.toHaveBeenCalled()

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['beta'])
      expect(state.targets).toEqual([])
      expect(ui.error).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('AC4: sentinel.txt impede remoção do diretório e permanece intacto', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)
      writePluginFiles(ctx, 'alpha', ['sentinel.txt'])

      await removeCommand.run!({
        args: baseArgs({ sync: false, _: ['alpha'] }),
        rawArgs: ['alpha', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/alpha/sentinel.txt')),
      ).toBe(true)
      expect(existsSync(join(ctx.cwd, '.agents/plugins/alpha'))).toBe(true)
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/alpha/plugin.json')),
      ).toBe(false)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['beta'])
    } finally {
      cleanup()
    }
  })

  it('AC5: plugin não gerenciado (managedPlugins sem o nome) → arquivos intactos', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx, { stateManaged: ['beta'] })
      writePluginFiles(ctx, 'alpha')

      await removeCommand.run!({
        args: baseArgs({ sync: false, _: ['alpha'] }),
        rawArgs: ['alpha', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/alpha/plugin.json')),
      ).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['beta'])
    } finally {
      cleanup()
    }
  })

  it('AC8: --dry-run não altera canônico, plugin nem estado', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)
      writePluginFiles(ctx, 'alpha')

      await removeCommand.run!({
        args: baseArgs({ 'dry-run': true, _: ['alpha'] }),
        rawArgs: ['alpha', '--dry-run'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()

      const content = readFileSync(join(ctx.cwd, '.agents/mcp.json'), 'utf8')
      const config = JSON.parse(content)
      expect(Object.keys(config.mcpServers)).toEqual(['alpha', 'beta'])

      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/alpha/plugin.json')),
      ).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['alpha', 'beta'])
      expect(ui.error).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('AC9: plugin já apagado manualmente → sucesso, sem exit 1', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)

      await removeCommand.run!({
        args: baseArgs({ sync: false, _: ['alpha'] }),
        rawArgs: ['alpha', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(ui.error).not.toHaveBeenCalled()

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['beta'])
    } finally {
      cleanup()
    }
  })

  it('AC10: falha de I/O (plugin.json como diretório) em --no-sync → ui.error, exit 1, nome mantido em managedPlugins', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)
      const dir = join(ctx.cwd, '.agents/plugins/alpha')
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, 'mcp.json'), '{}')
      writeFileSync(join(dir, 'mcp_config.json'), '{}')
      mkdirSync(join(dir, 'plugin.json'), { recursive: true })

      await removeCommand.run!({
        args: baseArgs({ sync: false, _: ['alpha'] }),
        rawArgs: ['alpha', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(exitSpy).toHaveBeenCalledWith(1)
      expect(ui.error).toHaveBeenCalled()

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['alpha', 'beta'])
    } finally {
      cleanup()
    }
  })

  it('remoção com sync real: plugin do removido apagado, do restante presente, managedPlugins sem o removido', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)
      // Sync precisa de targets resolvíveis para não sair com "no targets".
      writeState('project', ctx, {
        ...loadState('project', ctx).state,
        targets: ['cursor'],
      })
      writePluginFiles(ctx, 'alpha')
      writePluginFiles(ctx, 'beta')

      // Sync real para este teste (depende da poda implementada em T2).
      const { runSync: realRunSync } = await vi.importActual(
        '$/src/commands/sync',
      )
      runSyncMock.mockImplementation(realRunSync as any)

      await removeCommand.run!({
        args: baseArgs({ _: ['alpha'] }),
        rawArgs: ['alpha'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(ui.error).not.toHaveBeenCalled()

      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/alpha/plugin.json')),
      ).toBe(false)
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/beta/plugin.json')),
      ).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).not.toContain('alpha')
    } finally {
      cleanup()
    }
  })

  it('--no-sync surfaca aviso de lock corrompido antes de gravar estado', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)
      mkdirSync(join(ctx.cwd, '.agents'), { recursive: true })
      writeFileSync(
        join(ctx.cwd, '.agents', 'mcp-lock.json'),
        '{ not valid json',
      )

      await removeCommand.run!({
        args: baseArgs({ sync: false, _: ['alpha'] }),
        rawArgs: ['alpha', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      const warnMessages = ui.warn.mock.calls.map((c) => String(c[0]))
      expect(warnMessages.length).toBeGreaterThan(0)
      expect(
        warnMessages.some(
          (m) => m.includes('mcp-lock.json') || m.includes('Corrupt'),
        ),
      ).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('caminho normal de remocao nao duplica aviso de estado (runSync reporta)', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndState(ctx)
      mkdirSync(join(ctx.cwd, '.agents'), { recursive: true })
      writeFileSync(
        join(ctx.cwd, '.agents', 'mcp-lock.json'),
        '{ not valid json',
      )
      // Reseta o runSync mockado para nao reportar avisos; o caminho normal
      // de `remove` nao deve reportar o aviso de estado diretamente.
      runSyncMock.mockResolvedValue({
        scope: 'project' as const,
        targets: [],
        written: [],
        warnings: [],
        errors: [],
      })

      await removeCommand.run!({
        args: baseArgs({ _: ['alpha'] }),
        rawArgs: ['alpha'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      // `remove` nao reporta avisos diretamente no caminho normal (delega ao
      // runSync), portanto nao deve haver aviso duplicado aqui.
      expect(ui.warn).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })
})
