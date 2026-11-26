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

describe('commands sync (B3/T5: authoritative plugin adoption)', () => {
  it('fresh clone: pre-existing plugin dir (sentinel) is adopted, sem lock, sem erro de plugin', async () => {
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

      // Nenhum erro de plugin: o nome e declarado no canônico, entao e adotado.
      expect(summary.errors).toEqual([])
      expect(readFileSync(sentinelPath, 'utf8')).toBe('KEEP')
      // Os arquivos gerenciados sao sobrescritos (adocao autoritativa).
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'plugin.json'), 'utf8')).name,
      ).toBe('taken')
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'mcp.json'), 'utf8')).mcpServers
          .taken,
      ).toBeDefined()
      // O lock e criado no disco e registra o plugin como gerenciado.
      expect(existsSync(join(ctx.cwd, '.agents', 'mcp-lock.json'))).toBe(true)
      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toContain('taken')

      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.startsWith('Synced'))).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('com antigravity direcionado, o mesmo diretorio pre-existente tambem recebe mcp_config.json sobrescrito', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      const { sentinelPath, pluginDir } = seedCanonicalAndCollision(ctx)

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor', 'antigravity'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(readFileSync(sentinelPath, 'utf8')).toBe('KEEP')
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'plugin.json'), 'utf8')).name,
      ).toBe('taken')
      // mcp_config.json so e gravado quando antigravity esta entre os alvos.
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'mcp_config.json'), 'utf8'))
          .mcpServers.taken,
      ).toBeDefined()
      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toContain('taken')
      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.startsWith('Synced'))).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('diretorio de plugin pre-existente cujo nome NAO e declarado no canônico nao e modificado, nao deletado e nao gera erro', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      // Apenas um servidor declarado no canônico.
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
        mcpServers: {
          web: { type: 'streamable-http', url: 'https://example.com/mcp' },
        },
      })
      // Diretorio pre-existente com um nome que NAO esta no canônico.
      const pluginDir = join(ctx.cwd, '.agents/plugins/undeclared')
      mkdirSync(pluginDir, { recursive: true })
      const sentinelPath = join(pluginDir, 'sentinel.txt')
      writeFileSync(sentinelPath, 'UNTOUCHED')
      writeFileSync(join(pluginDir, 'plugin.json'), '{"name":"undeclared"}')
      writeFileSync(join(pluginDir, 'mcp.json'), '{}')

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(readFileSync(sentinelPath, 'utf8')).toBe('UNTOUCHED')
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'plugin.json'), 'utf8')).name,
      ).toBe('undeclared')
      expect(existsSync(pluginDir)).toBe(true)
      expect(existsSync(join(ctx.cwd, '.agents/plugins/web'))).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).not.toContain('undeclared')
      expect(state.managedPlugins).toContain('web')
    } finally {
      cleanup()
    }
  })

  it('dry-run planeja as gravacoes de plugin mas nao escreve nenhum arquivo, lock ou .gitignore', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
        mcpServers: {
          web: { type: 'streamable-http', url: 'https://example.com/mcp' },
        },
      })

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: true,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      // Nenhum arquivo de plugin gravado no disco.
      expect(existsSync(join(ctx.cwd, '.agents/plugins/web'))).toBe(false)
      // Nenhum lock persistido.
      expect(existsSync(join(ctx.cwd, '.agents', 'mcp-lock.json'))).toBe(false)
      // Nenhum .gitignore criado/tocado.
      expect(existsSync(join(ctx.cwd, '.gitignore'))).toBe(false)

      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.includes('.agents/plugins/'))).toBe(true)
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
      expect(notes.some((n) => n.includes('No target agents'))).toBe(true)
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

  it('allowEmptyTargets com nome declarado no canônico: diretorio pre-existente e adotado (sem erro de colisao), sentinel preservado', async () => {
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
      // Nome declarado: adotado autoritativamente, sem erro de colisao.
      expect(summary.errors).toEqual([])
      expect(readFileSync(sentinelPath, 'utf8')).toBe('KEEP')
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'plugin.json'), 'utf8')).name,
      ).toBe('taken')
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'mcp.json'), 'utf8')).mcpServers
          .taken,
      ).toBeDefined()
      expect(existsSync(join(ctx.cwd, '.agents', 'mcp-lock.json'))).toBe(true)
      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toContain('taken')

      const notes = ui.note.mock.calls.map((call) => String(call[0]))
      expect(notes.some((n) => n.startsWith('Synced'))).toBe(true)
    } finally {
      cleanup()
    }
  })
})

describe('commands sync (B6/T2: poda de plugins obsoletos e mcp_config.json)', () => {
  const SCHEMA_URL = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'

  function seedPluginFiles(
    ctx: ReturnType<typeof createSandbox>['ctx'],
    name: string,
    extra: Record<string, string> = {},
  ): string {
    const pluginDir = join(ctx.cwd, '.agents/plugins', name)
    mkdirSync(pluginDir, { recursive: true })
    for (const file of ['plugin.json', 'mcp.json', 'mcp_config.json']) {
      writeFileSync(join(pluginDir, file), '{}')
    }
    for (const [file, content] of Object.entries(extra)) {
      writeFileSync(join(pluginDir, file), content)
    }
    return pluginDir
  }

  function seedManagedState(
    ctx: ReturnType<typeof createSandbox>['ctx'],
    managedPlugins: string[],
  ) {
    writeState('project', ctx, {
      ...emptyState('project'),
      managedPlugins,
    })
  }

  function canonicalEmpty(ctx: ReturnType<typeof createSandbox>['ctx']) {
    persistCanonicalConfig('project', ctx, {
      $schema: SCHEMA_URL,
      mcpServers: {},
    })
  }

  function canonicalWithWeb(ctx: ReturnType<typeof createSandbox>['ctx']) {
    persistCanonicalConfig('project', ctx, {
      $schema: SCHEMA_URL,
      mcpServers: {
        web: { type: 'streamable-http', url: 'https://example.com/mcp' },
      },
    })
  }

  it('remove plugin obsoleto quando servidor sai do canônico (managedPlugins esvazia)', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      canonicalEmpty(ctx)
      seedManagedState(ctx, ['alpha'])
      const pluginDir = seedPluginFiles(ctx, 'alpha')

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(existsSync(pluginDir)).toBe(false)
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('preserva arquivo manual e diretorio de plugin obsoleto nao vazio', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      canonicalEmpty(ctx)
      seedManagedState(ctx, ['alpha'])
      const pluginDir = seedPluginFiles(ctx, 'alpha', {
        'sentinel.txt': 'KEEP-ME',
      })

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'sentinel.txt'))).toBe(true)
      expect(existsSync(pluginDir)).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('preserva mcp_config.json e state.agents.antigravity ao desselecionar antigravity (ADR-0013)', async () => {
    const { ctx, cleanup } = createSandbox()
    setupUi(ctx)
    try {
      canonicalWithWeb(ctx)
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['antigravity'],
        managedPlugins: ['web'],
        agents: {
          antigravity: {
            path: join(ctx.cwd, '.agents/plugins'),
            names: ['web'],
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
      })
      const pluginDir = seedPluginFiles(ctx, 'web')

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      // Nao-destrutivo: mcp_config.json permanece mesmo sem antigravity nos alvos.
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['web'])
      // `--agents` e aditivo: cursor e anexado preservando a ordem existente.
      expect(state.targets).toEqual(['antigravity', 'cursor'])
      expect(state.agents.antigravity).toEqual({
        path: join(ctx.cwd, '.agents/plugins'),
        names: ['web'],
        updatedAt: '2026-01-01T00:00:00.000Z',
      })
    } finally {
      cleanup()
    }
  })

  it('sync --agents antigravity e aditivo a state.targets existente', async () => {
    const { ctx, cleanup } = createSandbox()
    setupUi(ctx)
    try {
      canonicalWithWeb(ctx)
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['opencode'],
        managedPlugins: [],
      })

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['antigravity'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/web/mcp_config.json')),
      ).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual(['opencode', 'antigravity'])
      expect(state.agents.antigravity?.names).toEqual(['web'])
    } finally {
      cleanup()
    }
  })

  it('sync sem argumentos sincroniza todos os state.targets (opencode + antigravity)', async () => {
    const { ctx, cleanup } = createSandbox()
    setupUi(ctx)
    try {
      canonicalWithWeb(ctx)
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['opencode', 'antigravity'],
        managedPlugins: [],
      })

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: undefined,
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(summary.targets).toEqual(['opencode', 'antigravity'])
      expect(existsSync(join(ctx.cwd, 'opencode.json'))).toBe(true)
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/web/mcp_config.json')),
      ).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual(['opencode', 'antigravity'])
    } finally {
      cleanup()
    }
  })

  it('mantem mcp_config.json quando antigravity esta no alvo', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      canonicalWithWeb(ctx)
      seedManagedState(ctx, ['web'])
      seedPluginFiles(ctx, 'web')

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['antigravity'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/web/mcp_config.json')),
      ).toBe(true)
      expect(existsSync(join(ctx.cwd, '.agents/plugins/web/plugin.json'))).toBe(
        true,
      )
      expect(existsSync(join(ctx.cwd, '.agents/plugins/web/mcp.json'))).toBe(
        true,
      )

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['web'])
    } finally {
      cleanup()
    }
  })

  it('dryRun nao remove nada no disco e nao persiste estado', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      canonicalEmpty(ctx)
      seedManagedState(ctx, ['alpha'])
      const pluginDir = seedPluginFiles(ctx, 'alpha')

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: true,
        yes: true,
      })

      expect(summary.errors).toEqual([])
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['alpha'])
    } finally {
      cleanup()
    }
  })

  it('sync repetido e idempotente: estado igual e segundo run sem erros', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      canonicalWithWeb(ctx)
      seedManagedState(ctx, ['web'])
      seedPluginFiles(ctx, 'web')

      const summary1 = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })
      expect(summary1.errors).toEqual([])
      const stateAfterFirst = loadState('project', ctx).state

      const summary2 = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })
      expect(summary2.errors).toEqual([])
      const stateAfterSecond = loadState('project', ctx).state

      expect(stateAfterSecond).toEqual(stateAfterFirst)
      expect(stateAfterSecond.managedPlugins).toEqual(['web'])
    } finally {
      cleanup()
    }
  })

  it('skipAgentSync nao poda mcp_config.json preexistente de plugin gerenciado', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      canonicalWithWeb(ctx)
      seedManagedState(ctx, ['web'])
      const pluginDir = seedPluginFiles(ctx, 'web')

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
        skipAgentSync: true,
      })

      expect(summary.errors).toEqual([])
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['web'])
      expect(state.targets).toEqual([])
    } finally {
      cleanup()
    }
  })

  it('erro de limpeza de plugin obsoleto: erro reportado, nome mantido em managedPlugins e retry no proximo sync', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      canonicalEmpty(ctx)
      seedManagedState(ctx, ['alpha'])
      const pluginDir = join(ctx.cwd, '.agents/plugins/alpha')
      mkdirSync(pluginDir, { recursive: true })
      writeFileSync(join(pluginDir, 'mcp.json'), '{}')
      writeFileSync(join(pluginDir, 'mcp_config.json'), '{}')
      // plugin.json como diretorio provoca EISDIR ao tentar unlinkSync.
      mkdirSync(join(pluginDir, 'plugin.json'))

      // Primeiro run: falha na limpeza, erro reportado e nome preservado.
      const summary1 = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })

      expect(summary1.errors).toHaveLength(1)
      expect(summary1.errors[0]).toContain('Failed to remove plugin `alpha`')
      expect(ui.error).toHaveBeenCalledWith(
        expect.stringContaining('Partial sync completed with failures'),
      )

      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(pluginDir)).toBe(true)

      // Nome preservado para ser reprocessado no proximo sync.
      expect(loadState('project', ctx).state.managedPlugins).toEqual(['alpha'])

      // Segundo run: nome ainda gerenciado, o mesmo erro se repete (retry).
      const summary2 = await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      })
      expect(summary2.errors).toHaveLength(1)
      expect(summary2.errors[0]).toContain('Failed to remove plugin `alpha`')
    } finally {
      cleanup()
    }
  })

  it('erro de limpeza de plugin obsoleto faz o comando sync sair com codigo 1', async () => {
    const { ctx, cleanup } = createSandbox()
    setupUi(ctx)
    const localExit = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as NodeJS.Process['exit'])
    const originalCwd = process.cwd()
    const originalArgv = process.argv
    try {
      canonicalEmpty(ctx)
      seedManagedState(ctx, ['alpha'])
      const pluginDir = join(ctx.cwd, '.agents/plugins/alpha')
      mkdirSync(pluginDir, { recursive: true })
      writeFileSync(join(pluginDir, 'mcp.json'), '{}')
      writeFileSync(join(pluginDir, 'mcp_config.json'), '{}')
      // plugin.json como diretorio provoca EISDIR ao tentar unlinkSync.
      mkdirSync(join(pluginDir, 'plugin.json'))

      process.chdir(ctx.cwd)
      process.argv = ['node', 'index.js', 'sync', '--agents', 'cursor']

      await main()

      expect(localExit).toHaveBeenCalledWith(1)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(pluginDir)).toBe(true)
      expect(loadState('project', ctx).state.managedPlugins).toEqual(['alpha'])
    } finally {
      process.chdir(originalCwd)
      process.argv = originalArgv
      localExit.mockRestore()
      cleanup()
    }
  })
})

describe('commands sync (B6/T2: fresh-clone native-config overwrite preservando manual)', () => {
  const SCHEMA_URL = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'

  it('claude-code: sem lock, sobrescride entradas canonicas e preserva top-level nao gerenciado + entrada manual', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: SCHEMA_URL,
        mcpServers: {
          web: { type: 'stdio', command: 'npx', args: ['run', 'web'] },
        },
      })

      // Native arquivo ja existe (fresh clone: lock ausente) com uma
      // configuracao top-level nao relacionada e uma entrada manual nao declarada.
      const nativePath = join(ctx.cwd, '.mcp.json')
      writeFileSync(
        nativePath,
        JSON.stringify(
          {
            unrelated: 'preserve-me',
            mcpServers: {
              'manual-server': { type: 'stdio', command: 'manual-cmd' },
            },
          },
          null,
          2,
        ),
      )

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])

      const content = JSON.parse(readFileSync(nativePath, 'utf8'))
      // Top-level nao gerenciado e preservado.
      expect(content.unrelated).toBe('preserve-me')
      // Entrada manual (nao declarada no canônico, nao gerenciada) e preservada.
      expect(content.mcpServers['manual-server']).toMatchObject({
        type: 'stdio',
        command: 'manual-cmd',
      })
      // Entrada canonica sobrescrita.
      expect(content.mcpServers.web).toMatchObject({
        type: 'stdio',
        command: 'npx',
        args: ['run', 'web'],
      })

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toContain('web')
    } finally {
      cleanup()
    }
  })

  it('vscode: sem lock, sobrescride entradas canonicas e preserva comentarios fora da raiz gerenciada + inputs + entrada manual', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: SCHEMA_URL,
        mcpServers: {
          web: { type: 'stdio', command: 'npx', args: ['run', 'web'] },
        },
      })

      // Native JSONC ja existe (fresh clone: lock ausente) com comentario
      // FORA da chave gerenciada, inputs e entrada manual nao declarada.
      const nativeDir = join(ctx.cwd, '.vscode')
      mkdirSync(nativeDir, { recursive: true })
      const nativePath = join(nativeDir, 'mcp.json')
      writeFileSync(
        nativePath,
        `// Configuracao do VS Code (fora de servers - comentario preservado)\n{\n  "inputs": [\n    { "id": "token", "type": "promptString", "label": "Token" }\n  ],\n  // Comentario dentro de servers pode ser normalizado\n  "servers": {\n    "manual-server": { "type": "stdio", "command": "manual-cmd" }\n  }\n}\n`,
      )

      const summary = await runSync({
        scope: 'project',
        ctx,
        flag: ['vscode'],
        dryRun: false,
        yes: true,
      })

      expect(summary.errors).toEqual([])

      const content = readFileSync(nativePath, 'utf8')
      // Comentario e inputs FORA da raiz gerenciada sobrevivem.
      expect(content).toContain('Configuracao do VS Code')
      expect(content).toContain('"inputs"')
      expect(content).toContain('"token"')
      // Entrada manual preservada (nao declarada no canônico).
      expect(content).toContain('"manual-server"')
      // Entrada canonica sobrescrita.
      expect(content).toContain('"web"')
      expect(content).toContain('"command": "npx"')

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toContain('web')
    } finally {
      cleanup()
    }
  })
})
