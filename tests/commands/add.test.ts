import { describe, expect, it, vi, beforeEach, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { addCommand } from '$/src/commands/add.command'
import { createUiAndCtx } from '$/src/commands/util'
import { getConfigPath } from '$/src/core/store'
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
