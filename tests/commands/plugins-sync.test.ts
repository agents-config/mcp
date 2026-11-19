import { describe, expect, it, vi, afterAll } from 'vitest'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { runSync } from '$/src/commands/sync'
import { main } from '$/src/index'
import { createUiAndCtx, persistCanonicalConfig } from '$/src/commands/util'
import { loadState, writeState, emptyState } from '$/src/core/state'
import { getAdapter } from '$/src/adapters/index'
import type { PromptUi } from '$/src/ui/prompts'
import { createSandbox } from '$/tests/helpers/sandbox'

vi.mock('$/src/commands/util', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return { ...actual, createUiAndCtx: vi.fn() }
})

const exitSpy = vi
  .spyOn(process, 'exit')
  .mockImplementation((() => {}) as NodeJS.Process['exit'])

afterAll(() => {
  exitSpy.mockRestore()
})

function setupUi(ctx: ReturnType<typeof createSandbox>['ctx']) {
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

function seedCanonicalAndCollision(
  ctx: ReturnType<typeof createSandbox>['ctx'],
) {
  persistCanonicalConfig('project', ctx, {
    $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
    mcpServers: {
      taken: { type: 'stdio', command: 'npx', args: [] },
    },
  })

  const pluginDir = join(ctx.cwd, '.agents/plugins/taken')
  mkdirSync(pluginDir, { recursive: true })
  const sentinelPath = join(pluginDir, 'sentinel.txt')
  writeFileSync(sentinelPath, 'KEEP')
  return { sentinelPath, pluginDir }
}

describe('commands sync (B3/T5: unmanaged plugin collision)', () => {
  it('reporta PLUGIN_UNMANAGED como erro, sem resumo de sucesso', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      const { sentinelPath, pluginDir } = seedCanonicalAndCollision(ctx)

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toHaveLength(1)
      expect(summary.errors[0]).toContain('nao e gerenciado')
      expect(summary.warnings).toEqual([])
      expect(readFileSync(sentinelPath, 'utf8')).toBe('KEEP')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(false)

      expect(ui.error).toHaveBeenCalledWith(
        expect.stringContaining('Sincronizacao parcial concluida com falhas'),
      )
      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((note) => note.includes('Synced'))).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('aceita --agents <lista> separado por espaço no sync', async () => {
    const { ctx, cleanup } = createSandbox()
    setupUi(ctx)
    const localExit = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as NodeJS.Process['exit'])
    const originalCwd = process.cwd()
    const originalArgv = process.argv
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
        mcpServers: {
          remote: {
            type: 'streamable-http',
            url: 'https://example.com/mcp',
          },
        },
      })
      process.chdir(ctx.cwd)
      process.argv = ['node', 'index.js', 'sync', '--agents', 'antigravity']

      await main()

      expect(localExit).not.toHaveBeenCalled()
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/remote/mcp_config.json')),
      ).toBe(true)
    } finally {
      process.chdir(originalCwd)
      process.argv = originalArgv
      localExit.mockRestore()
      cleanup()
    }
  })

  it('faz o comando sync sair com código 1 na colisão não gerenciada', async () => {
    const { ctx, cleanup } = createSandbox()
    const localExit = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as NodeJS.Process['exit'])
    const originalCwd = process.cwd()
    const originalArgv = process.argv
    try {
      seedCanonicalAndCollision(ctx)
      process.chdir(ctx.cwd)
      process.argv = ['node', 'index.js', 'sync', '--agents', 'cursor']

      await main()

      expect(localExit).toHaveBeenCalledWith(1)
    } finally {
      process.chdir(originalCwd)
      process.argv = originalArgv
      localExit.mockRestore()
      cleanup()
    }
  })

  it('quietErrors suprime o bloco de erro de plugin no runSync', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonicalAndCollision(ctx)

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
        quietErrors: true,
      })

      expect(summary.errors).toHaveLength(1)
      expect(ui.error).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })
})

describe('commands sync (B5: skipAgentSync / allowEmptyTargets)', () => {
  function seedCanonical(ctx: ReturnType<typeof createSandbox>['ctx']) {
    persistCanonicalConfig('project', ctx, {
      $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
      mcpServers: {
        web: { type: 'streamable-http', url: 'https://example.com/mcp' },
      },
    })
  }

  it('allowEmptyTargets: zero targets nao sai com 1, gera plugin e emite nota de orientacao', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonical(ctx)

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        yes: true,
        allowEmptyTargets: true,
      })

      expect(exitSpy).not.toHaveBeenCalled()
      expect(summary.targets).toEqual([])
      expect(summary.errors).toEqual([])

      const pluginDir = join(ctx.cwd, '.agents/plugins/web')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)

      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.includes('Nenhum agente alvo'))).toBe(true)
      expect(notes.some((n) => n.includes('.agents/plugins/'))).toBe(true)
      expect(notes.some((n) => n.includes('agents-mcp sync --agents'))).toBe(
        true,
      )
      expect(notes.some((n) => n.startsWith('Synced'))).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('skipAgentSync nao toca arquivos de agente nem state.targets/state.agents', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonical(ctx)
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['cursor'],
        managedPlugins: [],
      })
      const cursorPath = getAdapter('cursor').getConfigPath('project', ctx)
      if (!cursorPath) {
        throw new Error(
          'cursor adapter nao tem caminho de configuracao no escopo do projeto',
        )
      }
      const cursorDir = dirname(cursorPath)
      mkdirSync(cursorDir, { recursive: true })
      writeFileSync(cursorPath, '{"mcpServers":{}}')

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
        skipAgentSync: true,
      })

      expect(exitSpy).not.toHaveBeenCalled()
      expect(summary.targets).toEqual([])
      expect(summary.errors).toEqual([])
      expect(readFileSync(cursorPath, 'utf8')).toBe('{"mcpServers":{}}')

      const pluginDir = join(ctx.cwd, '.agents/plugins/web')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual(['cursor'])
      expect(state.agents).toEqual({})
      expect(state.managedPlugins).toEqual(['web'])

      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.includes('--no-sync'))).toBe(true)
      expect(notes.some((n) => n.includes('.agents/plugins/'))).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('skipAgentSync com flag antigravity cria mcp_config.json e preserva targets', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonical(ctx)

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['antigravity'],
        dryRun: false,
        yes: true,
        skipAgentSync: true,
      })

      expect(exitSpy).not.toHaveBeenCalled()
      expect(summary.targets).toEqual([])
      expect(summary.errors).toEqual([])

      const pluginDir = join(ctx.cwd, '.agents/plugins/web')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual([])
      expect(state.managedPlugins).toEqual(['web'])

      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.includes('--no-sync'))).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('skipAgentSync com antigravity em state.targets (sem flag) cria mcp_config.json', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      seedCanonical(ctx)
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['antigravity'],
      })

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        yes: true,
        skipAgentSync: true,
      })

      expect(exitSpy).not.toHaveBeenCalled()
      expect(summary.errors).toEqual([])
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/web/mcp_config.json')),
      ).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual(['antigravity'])

      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.includes('--no-sync'))).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('allowEmptyTargets com colisao nao gerenciada registra erro sem sobrescrever o diretorio', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
        mcpServers: {
          taken: { type: 'stdio', command: 'npx', args: [] },
        },
      })
      const pluginDir = join(ctx.cwd, '.agents/plugins/taken')
      mkdirSync(pluginDir, { recursive: true })
      const sentinelPath = join(pluginDir, 'sentinel.txt')
      writeFileSync(sentinelPath, 'KEEP')

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
        allowEmptyTargets: true,
      })

      expect(exitSpy).not.toHaveBeenCalled()
      expect(summary.errors).toHaveLength(1)
      expect(summary.errors[0]).toContain('nao e gerenciado')
      expect(readFileSync(sentinelPath, 'utf8')).toBe('KEEP')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(false)

      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.startsWith('Synced'))).toBe(false)
      expect(ui.error).toHaveBeenCalledWith(
        expect.stringContaining('Sincronizacao parcial concluida com falhas'),
      )
    } finally {
      cleanup()
    }
  })
})
