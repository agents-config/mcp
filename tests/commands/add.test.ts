import { describe, expect, it, vi, beforeEach, afterAll } from 'vitest'
import {
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from 'node:fs'
import { join } from 'node:path'
import { addCommand } from '$/src/commands/add.command'
import { createUiAndCtx, persistCanonicalConfig } from '$/src/commands/util'
import { getConfigPath } from '$/src/core/store'
import { loadState, writeState, emptyState } from '$/src/core/state'
import { DEFAULT_SCHEMA_URL } from '$/src/config'
import type { RuntimeContext } from '$/src/core/context'
import type { PromptUi } from '$/src/ui/prompts'
import { createSandbox } from '$/tests/helpers/sandbox'

vi.mock('$/src/commands/util', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return { ...actual, createUiAndCtx: vi.fn() }
})

const exitSpy = vi
  .spyOn(process, 'exit')
  .mockImplementation((() => {}) as NodeJS.Process['exit'])

beforeEach(() => {
  exitSpy.mockClear()
})

afterAll(() => {
  exitSpy.mockRestore()
})

/** Executa `add` num sandbox e devolve o canonical config gravado. */
async function runAddInSandbox(
  rawArgs: string[],
  opts: { command?: string; http?: string; sse?: string } = {},
) {
  const { ctx, cleanup } = createSandbox()
  let content = ''
  try {
    vi.mocked(createUiAndCtx).mockImplementation(() => ({
      ctx,
      ui: {
        error: vi.fn(),
        warn: vi.fn(),
        note: vi.fn(),
      } as unknown as PromptUi,
    }))

    await addCommand.run!({
      args: {
        yes: false,
        global: false,
        'no-sync': true,
        force: false,
        'extract-secrets': false,
        command: opts.command ?? 'npx',
        http: opts.http,
        sse: opts.sse,
        cwd: undefined,
        name: 'st',
        _: [],
      },
      rawArgs,
    } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])
    content = readFileSync(getConfigPath('project', ctx), 'utf8')
  } finally {
    cleanup()
  }
  return content
}

describe('commands add (R53: repeatable flags from rawArgs)', () => {
  it('acumula múltiplas --arg= valor, incluindo valor iniciado com -', async () => {
    const content = await runAddInSandbox([
      '--command=npx',
      '--arg=-y',
      '--arg=@modelcontextprotocol/server-sequential-thinking',
      '--name=st',
    ])
    const config = JSON.parse(content)
    expect(config.mcpServers.st.type).toBe('stdio')
    expect(config.mcpServers.st.args).toEqual([
      '-y',
      '@modelcontextprotocol/server-sequential-thinking',
    ])
  })

  it('acumula múltiplas --arg na forma --flag valor (espaço)', async () => {
    const content = await runAddInSandbox([
      '--command=npx',
      '--arg',
      '-y',
      '--arg',
      '@scope/pkg',
      '--name=st',
    ])
    const config = JSON.parse(content)
    expect(config.mcpServers.st.args).toEqual(['-y', '@scope/pkg'])
  })

  it('acumula múltiplas --env', async () => {
    const content = await runAddInSandbox([
      '--command=npx',
      '--env=FOO=bar',
      '--env=BAZ=qux',
      '--name=st',
    ])
    const config = JSON.parse(content)
    expect(config.mcpServers.st.env).toEqual({ FOO: 'bar', BAZ: 'qux' })
  })

  it('acumula múltiplas --header', async () => {
    const content = await runAddInSandbox(
      [
        '--http=https://api.example.com/mcp',
        '--header=X:1',
        '--header=Y:2',
        '--name=st',
      ],
      { http: 'https://api.example.com/mcp' },
    )
    const config = JSON.parse(content)
    expect(config.mcpServers.st.headers).toEqual({ X: '1', Y: '2' })
  })

  it('mantém uma única --arg (não regressa)', async () => {
    const content = await runAddInSandbox([
      '--command=npx',
      '--arg=-y',
      '--name=st',
    ])
    const config = JSON.parse(content)
    expect(config.mcpServers.st.args).toEqual(['-y'])
  })

  it('mescla --flag=valor com --flag valor', async () => {
    const content = await runAddInSandbox([
      '--command=npx',
      '--arg=-y',
      '--arg',
      '@scope/pkg',
      '--name=st',
    ])
    const config = JSON.parse(content)
    expect(config.mcpServers.st.args).toEqual(['-y', '@scope/pkg'])
  })

  it('não consome o próximo token quando ele começa com --', async () => {
    const content = await runAddInSandbox([
      '--arg',
      '--command=npx',
      '--name=st',
    ])
    const config = JSON.parse(content)
    expect(config.mcpServers.st.args).toEqual([])
  })

  it('não grava nada quando não há --arg/--env/--header', async () => {
    const content = await runAddInSandbox(['--command=npx', '--name=st'])
    const config = JSON.parse(content)
    expect(config.mcpServers.st.args).toEqual([])
    expect(config.mcpServers.st.env).toBeUndefined()
    expect(config.mcpServers.st.headers).toBeUndefined()
  })

  it('não chama process.exit ao adicionar com sucesso', async () => {
    await runAddInSandbox(['--command=npx', '--arg=-y', '--name=st'])
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it('exibe --command (e não --stdio) na mensagem de uso sem fonte', async () => {
    const { ctx, cleanup } = createSandbox()
    const errorMock = vi.fn()
    // `restoreMocks` (vitest.config.ts) restaura process.exit antes de cada
    // teste, então re-mockamos aqui para não lançar ao chamar process.exit(2).
    vi.spyOn(process, 'exit').mockImplementation(
      (() => {}) as NodeJS.Process['exit'],
    )
    try {
      vi.mocked(createUiAndCtx).mockImplementation(() => ({
        ctx,
        ui: {
          error: errorMock,
          warn: vi.fn(),
          note: vi.fn(),
        } as unknown as PromptUi,
      }))

      await addCommand.run!({
        args: {
          yes: false,
          global: false,
          'no-sync': true,
          force: false,
          'extract-secrets': false,
          command: undefined,
          http: undefined,
          sse: undefined,
          cwd: undefined,
          name: 'st',
          _: [],
        },
        rawArgs: [],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])
    } finally {
      cleanup()
    }

    const message = errorMock.mock.calls[0]?.[0] as string
    expect(message).toContain('--command')
    expect(message).not.toContain('--stdio')
  })
})

describe('commands add (B2: interactive flow)', () => {
  it('inicia o fluxo interativo no TTY e grava o canonical config', async () => {
    const { ctx, cleanup } = createSandbox()
    const intro = vi.fn()
    const outro = vi.fn()
    const note = vi.fn()
    const select = vi.fn(async () => 'command')
    const text = vi.fn().mockResolvedValueOnce('npx').mockResolvedValueOnce('')
    const confirm = vi.fn(async () => false)
    try {
      const interactiveCtx = {
        ...ctx,
        isTTY: true,
        env: { ...ctx.env, CI: undefined },
      }
      vi.mocked(createUiAndCtx).mockImplementation(() => ({
        ctx: interactiveCtx,
        ui: {
          intro,
          outro,
          note,
          warn: vi.fn(),
          error: vi.fn(),
          select,
          text,
          confirm,
        } as unknown as PromptUi,
      }))

      await addCommand.run!({
        args: {
          yes: false,
          global: false,
          'no-sync': true,
          force: false,
          'extract-secrets': false,
          command: undefined,
          http: undefined,
          sse: undefined,
          cwd: undefined,
          name: undefined,
          _: ['my-server'],
        },
        rawArgs: [],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      const content = readFileSync(
        getConfigPath('project', interactiveCtx),
        'utf8',
      )
      const config = JSON.parse(content)
      expect(config.mcpServers['my-server']).toMatchObject({
        type: 'stdio',
        command: 'npx',
        args: [],
      })
      expect(intro).toHaveBeenCalledWith('Add MCP server')
      expect(outro).toHaveBeenCalled()
      expect(note).toHaveBeenCalledWith('Added server `my-server`')
    } finally {
      cleanup()
    }
  })

  it('sai com código 2 sem TTY quando só há <nome> posicional', async () => {
    const { ctx, cleanup } = createSandbox()
    const errorMock = vi.fn()
    vi.spyOn(process, 'exit').mockImplementation(
      (() => {}) as NodeJS.Process['exit'],
    )
    try {
      vi.mocked(createUiAndCtx).mockImplementation(() => ({
        ctx,
        ui: {
          error: errorMock,
          warn: vi.fn(),
          note: vi.fn(),
        } as unknown as PromptUi,
      }))

      await addCommand.run!({
        args: {
          yes: false,
          global: false,
          'no-sync': true,
          force: false,
          'extract-secrets': false,
          command: undefined,
          http: undefined,
          sse: undefined,
          cwd: undefined,
          name: undefined,
          _: ['my-server'],
        },
        rawArgs: [],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(process.exit).toHaveBeenCalledWith(2)
      const message = errorMock.mock.calls[0]?.[0] as string
      expect(message).toContain('--command')
      expect(message).not.toContain('--stdio')
      expect(existsSync(getConfigPath('project', ctx))).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('sai com código 2 com --yes mesmo em TTY', async () => {
    const { ctx, cleanup } = createSandbox()
    vi.spyOn(process, 'exit').mockImplementation(
      (() => {}) as NodeJS.Process['exit'],
    )
    try {
      const ttyCtx = {
        ...ctx,
        isTTY: true,
        env: { ...ctx.env, CI: undefined },
      }
      vi.mocked(createUiAndCtx).mockImplementation(() => ({
        ctx: ttyCtx,
        ui: {
          error: vi.fn(),
          warn: vi.fn(),
          note: vi.fn(),
        } as unknown as PromptUi,
      }))

      await addCommand.run!({
        args: {
          yes: true,
          global: false,
          'no-sync': true,
          force: false,
          'extract-secrets': false,
          command: undefined,
          http: undefined,
          sse: undefined,
          cwd: undefined,
          name: undefined,
          _: ['my-server'],
        },
        rawArgs: [],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(process.exit).toHaveBeenCalledWith(2)
      expect(existsSync(getConfigPath('project', ttyCtx))).toBe(false)
    } finally {
      cleanup()
    }
  })
})

describe('commands add (B3/T5: --agents, --no-sync and plugin generation)', () => {
  function setupUi(ctx: RuntimeContext) {
    const ui = {
      error: vi.fn(),
      warn: vi.fn(),
      note: vi.fn(),
      intro: vi.fn(),
      outro: vi.fn(),
    }
    vi.mocked(createUiAndCtx).mockImplementation(() => ({
      ctx,
      ui: ui as unknown as PromptUi,
    }))
    return ui
  }

  /** Args equivalentes ao parse real do citty para `--no-sync`. */
  function baseArgs(
    overrides: Record<string, unknown> = {},
  ): Record<string, unknown> {
    return {
      yes: true,
      global: false,
      force: false,
      'extract-secrets': false,
      command: 'npx',
      http: undefined,
      sse: undefined,
      cwd: undefined,
      name: 'my-tool',
      _: [],
      ...overrides,
    }
  }

  it('gera plugin com --no-sync em projeto sem targets e não executa runSync', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      await addCommand.run!({
        args: baseArgs({ sync: false }),
        rawArgs: ['--command=npx', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      const pluginDir = join(ctx.cwd, '.agents/plugins/my-tool')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual([])
      expect(state.managedPlugins).toEqual(['my-tool'])
      expect(ui.error).not.toHaveBeenCalled()
      expect(exitSpy).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('honra --no-sync vindo de rawArgs mesmo sem args.sync', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      await addCommand.run!({
        args: baseArgs(),
        rawArgs: ['--command=npx', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/my-tool/plugin.json')),
      ).toBe(true)
      expect(loadState('project', ctx).state.targets).toEqual([])
      expect(ui.error).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('honra --agents=<lista> no add e persiste o target selecionado', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      await addCommand.run!({
        args: baseArgs({ name: 'remote-mcp', agents: 'antigravity' }),
        rawArgs: ['--command=npx', '--agents=antigravity'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/remote-mcp/mcp_config.json')),
      ).toBe(true)
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/remote-mcp/mcp.json')),
      ).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual(['antigravity'])
      expect(state.managedPlugins).toEqual(['remote-mcp'])
      expect(ui.error).not.toHaveBeenCalled()
      expect(exitSpy).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('honra --agents <lista> separado por espaço no add', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      await addCommand.run!({
        args: baseArgs({ name: 'remote-mcp' }),
        rawArgs: ['--command=npx', '--agents', 'antigravity'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/remote-mcp/mcp_config.json')),
      ).toBe(true)
      expect(loadState('project', ctx).state.targets).toEqual(['antigravity'])
      expect(ui.error).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('gera mcp_config.json com --agents antigravity --no-sync', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      await addCommand.run!({
        args: baseArgs({ sync: false }),
        rawArgs: ['--command=npx', '--agents', 'antigravity', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/my-tool/mcp_config.json')),
      ).toBe(true)
      // runSync não roda: targets persistidos permanecem vazios.
      expect(loadState('project', ctx).state.targets).toEqual([])
      expect(ui.error).not.toHaveBeenCalled()
    } finally {
      cleanup()
    }
  })

  it('plugin dir existente com nome declarado no canônico e adotado por add --force (sem bloqueio; arquivos sobrescritos; registrado em managedPlugins)', async () => {
    const { ctx, cleanup } = createSandbox()
    const ui = setupUi(ctx)
    try {
      // Declara `my-tool` no canônico e deixa um diretorio de plugin pre-existente.
      persistCanonicalConfig('project', ctx, {
        $schema: DEFAULT_SCHEMA_URL,
        mcpServers: {
          'my-tool': { type: 'stdio', command: 'npx', args: [] },
        },
      })
      const pluginDir = join(ctx.cwd, '.agents/plugins/my-tool')
      mkdirSync(pluginDir, { recursive: true })
      const sentinelPath = join(pluginDir, 'sentinel.txt')
      writeFileSync(sentinelPath, 'ADOTADO')

      await addCommand.run!({
        args: baseArgs({ force: true, name: 'my-tool' }),
        rawArgs: ['--command=npx', '--force'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(ui.error).not.toHaveBeenCalled()

      // O sentinel (arquivo nao gerenciado) e preservado pela sincronizacao.
      expect(readFileSync(sentinelPath, 'utf8')).toBe('ADOTADO')
      // Os arquivos gerenciados sao sobrescritos/adotados.
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'plugin.json'), 'utf8')).name,
      ).toBe('my-tool')
      expect(
        JSON.parse(readFileSync(join(pluginDir, 'mcp.json'), 'utf8'))
          .mcpServers['my-tool'],
      ).toBeDefined()

      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toContain('my-tool')
    } finally {
      cleanup()
    }
  })
})

describe('commands add (T6: integridade do índice canônico)', () => {
  it('reporta mensagem clara quando .agents/mcp.json está inválido (sem mcpServers)', async () => {
    const { ctx, cleanup } = createSandbox()
    const errorMock = vi.fn()
    const exitMock = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as NodeJS.Process['exit'])

    // Escreve um .agents/mcp.json inválido diretamente (bypassa writeConfig).
    const { mkdirSync, writeFileSync } = await import('node:fs')
    mkdirSync(`${ctx.cwd}/.agents`, { recursive: true })
    writeFileSync(
      `${ctx.cwd}/.agents/mcp.json`,
      JSON.stringify({ $schema: DEFAULT_SCHEMA_URL }),
      'utf8',
    )

    try {
      vi.mocked(createUiAndCtx).mockImplementation(() => ({
        ctx,
        ui: {
          error: errorMock,
          warn: vi.fn(),
          note: vi.fn(),
        } as unknown as PromptUi,
      }))

      await addCommand.run!({
        args: {
          yes: true,
          global: false,
          'no-sync': true,
          force: false,
          'extract-secrets': false,
          command: 'npx',
          http: undefined,
          sse: undefined,
          cwd: undefined,
          name: 'my-tool',
          _: [],
        },
        rawArgs: ['--command=npx', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(errorMock).toHaveBeenCalled()
      const message = errorMock.mock.calls[0]?.[0] as string
      expect(message).toContain('Invalid')
      expect(message).toContain('agents-mcp init --force')
      expect(exitMock).toHaveBeenCalledWith(1)
    } finally {
      cleanup()
      exitMock.mockRestore()
    }
  })
})

describe('commands add (B5: plugin criado independentemente de sync/targets)', () => {
  function baseUi(ctx: ReturnType<typeof createSandbox>['ctx']) {
    const note = vi.fn()
    const errorMock = vi.fn()
    const warnMock = vi.fn()
    vi.mocked(createUiAndCtx).mockImplementation(() => ({
      ctx,
      ui: {
        error: errorMock,
        warn: warnMock,
        note,
        intro: vi.fn(),
        outro: vi.fn(),
      } as unknown as PromptUi,
    }))
    return { note, errorMock, warn: warnMock }
  }

  function addArgs(name: string, noSync: boolean, yes = true) {
    return {
      yes,
      global: false,
      force: false,
      'extract-secrets': false,
      'no-sync': noSync,
      command: 'npx',
      http: undefined,
      sse: undefined,
      cwd: undefined,
      name,
      _: [],
    }
  }

  it('regressao B5: add sem --no-sync e sem targets nao chama exit, cria plugin', async () => {
    const { ctx, cleanup } = createSandbox()
    const { note, errorMock } = baseUi(ctx)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      await addCommand.run!({
        args: addArgs('web', false),
        rawArgs: ['--command=npx'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(errorMock).not.toHaveBeenCalled()

      const pluginDir = join(ctx.cwd, '.agents/plugins/web')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual([])
      expect(state.managedPlugins).toEqual(['web'])

      const outputs = [
        ...note.mock.calls.map((call) => String(call[0])),
        ...logSpy.mock.calls.map((call) => String(call[0])),
      ]
      expect(outputs.some((o) => o.includes('No target agents'))).toBe(true)
      expect(outputs.some((o) => o.includes('agents-mcp sync --agents'))).toBe(
        true,
      )
    } finally {
      logSpy.mockRestore()
      cleanup()
    }
  })

  it('surfaces a corrupt/v1 lock warning before overwriting state', async () => {
    const { ctx, cleanup } = createSandbox()
    const { warn } = baseUi(ctx)
    try {
      // Lock corrompido: add deve surfacar o aviso antes de sobrescrever o estado.
      mkdirSync(join(ctx.cwd, '.agents'), { recursive: true })
      writeFileSync(
        join(ctx.cwd, '.agents', 'mcp-lock.json'),
        '{ not valid json',
      )

      await addCommand.run!({
        args: addArgs('web', false),
        rawArgs: ['--command=npx'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      const warnMessages = warn.mock.calls.map((c) => String(c[0]))
      expect(warnMessages.length).toBeGreaterThan(0)
      expect(
        warnMessages.some(
          (m) => m.includes('mcp-lock.json') || m.includes('Corrupt'),
        ),
      ).toBe(true)
      // O lock foi reescrito como v2 valido.
      const state = loadState('project', ctx).state
      expect(state.version).toBe(2)
    } finally {
      cleanup()
    }
  })

  it('fluxo interativo com sincronizacao habilitada cria plugin, chama outro e nao sai com exit', async () => {
    const { ctx, cleanup } = createSandbox()
    const intro = vi.fn()
    const outro = vi.fn()
    const note = vi.fn()
    const select = vi.fn(async () => 'command')
    const text = vi.fn().mockResolvedValueOnce('npx').mockResolvedValueOnce('')
    const confirm = vi.fn(async () => false)
    const interactiveCtx = {
      ...ctx,
      isTTY: true,
      env: { ...ctx.env, CI: undefined },
    }
    try {
      vi.mocked(createUiAndCtx).mockImplementation(() => ({
        ctx: interactiveCtx,
        ui: {
          intro,
          outro,
          note,
          warn: vi.fn(),
          error: vi.fn(),
          select,
          text,
          confirm,
        } as unknown as PromptUi,
      }))

      await addCommand.run!({
        args: {
          yes: false,
          global: false,
          force: false,
          'extract-secrets': false,
          'no-sync': false,
          command: undefined,
          http: undefined,
          sse: undefined,
          cwd: undefined,
          name: undefined,
          _: ['my-server'],
        },
        rawArgs: [],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(outro).toHaveBeenCalled()
      expect(intro).toHaveBeenCalledWith('Add MCP server')

      const pluginDir = join(interactiveCtx.cwd, '.agents/plugins/my-server')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('--no-sync preserva targets semeados no estado', async () => {
    const { ctx, cleanup } = createSandbox()
    baseUi(ctx)
    try {
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['cursor'],
        managedPlugins: [],
      })

      await addCommand.run!({
        args: addArgs('my-tool', true),
        rawArgs: ['--command=npx', '--no-sync'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(loadState('project', ctx).state.targets).toEqual(['cursor'])

      const pluginDir = join(ctx.cwd, '.agents/plugins/my-tool')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('antigravity via state.targets cria mcp_config.json sem --agents', async () => {
    const { ctx, cleanup } = createSandbox()
    baseUi(ctx)
    try {
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['antigravity'],
      })

      await addCommand.run!({
        args: addArgs('my-tool', false),
        rawArgs: ['--command=npx'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()

      const pluginDir = join(ctx.cwd, '.agents/plugins/my-tool')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp_config.json'))).toBe(true)

      const state = loadState('project', ctx).state
      expect(state.targets).toEqual(['antigravity'])
      expect(state.managedPlugins).toEqual(['my-tool'])
    } finally {
      cleanup()
    }
  })

  it('definicao identica recria plugin ausente sem process.exit', async () => {
    const { ctx, cleanup } = createSandbox()
    const { note, errorMock } = baseUi(ctx)
    try {
      await addCommand.run!({
        args: addArgs('srv', false),
        rawArgs: ['--command=npx'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()

      const pluginDir = join(ctx.cwd, '.agents/plugins/srv')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)

      // Simula o plugin sumindo do disco (usuario afetado pelo B5 repete o add).
      rmSync(pluginDir, { recursive: true, force: true })
      expect(existsSync(pluginDir)).toBe(false)
      note.mockClear()

      await addCommand.run!({
        args: addArgs('srv', false),
        rawArgs: ['--command=npx'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      expect(exitSpy).not.toHaveBeenCalled()
      expect(errorMock).not.toHaveBeenCalled()
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)

      const notes = note.mock.calls.map((call) => String(call[0]))
      expect(
        notes.some((n) =>
          n.includes('already present with identical definition'),
        ),
      ).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('B8: add succeeds even when an unrelated plugin path exists (file instead of directory)', async () => {
    const { ctx, cleanup } = createSandbox()
    const errorMock = vi.fn()
    const note = vi.fn()
    const exitMock = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as NodeJS.Process['exit'])
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: DEFAULT_SCHEMA_URL,
        mcpServers: {
          srv: { type: 'stdio', command: 'npx', args: [] },
        },
      })
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: [],
        agents: {},
        managedPlugins: ['srv'],
      })
      const pluginsDir = join(ctx.cwd, '.agents/plugins')
      mkdirSync(pluginsDir, { recursive: true })
      // Unrelated plugin path is a file, not a directory — add must not fail
      // because of it (B8: onlyPluginNames limits sync to the new server).
      const srvPluginPath = join(pluginsDir, 'srv')
      writeFileSync(srvPluginPath, 'not a directory')

      vi.mocked(createUiAndCtx).mockImplementation(() => ({
        ctx,
        ui: {
          error: errorMock,
          warn: vi.fn(),
          note,
          intro: vi.fn(),
          outro: vi.fn(),
        } as unknown as PromptUi,
      }))

      await addCommand.run!({
        args: addArgs('my-tool', false),
        rawArgs: ['--command=npx'],
      } as unknown as Parameters<NonNullable<typeof addCommand.run>>[0])

      // add succeeds; unrelated plugin path does not cause failure.
      expect(exitMock).not.toHaveBeenCalled()
      expect(errorMock).not.toHaveBeenCalled()

      // Both servers are in the canonical index.
      const config = JSON.parse(
        readFileSync(getConfigPath('project', ctx), 'utf8'),
      )
      expect(config.mcpServers.srv).toBeDefined()
      expect(config.mcpServers['my-tool']).toBeDefined()

      // Plugin for the newly added server was created.
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/my-tool/plugin.json')),
      ).toBe(true)
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/my-tool/mcp.json')),
      ).toBe(true)

      // The unrelated srv path was not touched (still a file, not a directory).
      expect(existsSync(srvPluginPath)).toBe(true)
      expect(existsSync(join(srvPluginPath, 'plugin.json'))).toBe(false)
    } finally {
      cleanup()
      exitMock.mockRestore()
    }
  })
})
