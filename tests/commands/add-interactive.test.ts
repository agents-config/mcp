import { describe, expect, it, vi } from 'vitest'
import {
  collectInteractiveAddOptions,
  validateCommandInput,
  validateEnvEntry,
  validateHeaderEntry,
  validateHttpUrl,
  validateServerName,
} from '$/src/commands/add-interactive'
import type { PromptUi } from '$/src/ui/prompts'

interface ScriptedUi {
  ui: PromptUi
  intro: ReturnType<typeof vi.fn>
  warn: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  text: ReturnType<typeof vi.fn>
  confirm: ReturnType<typeof vi.fn>
}

/** Build a `PromptUi` whose prompts resolve from scripted answer queues. */
function createScriptedUi({
  select = [],
  text = [],
  confirm = [],
}: {
  select?: Array<'command' | 'http'>
  text?: string[]
  confirm?: boolean[]
} = {}): ScriptedUi {
  const intro = vi.fn()
  const warn = vi.fn()
  const selectMock = vi.fn(async () => select.shift())
  const textMock = vi.fn(async () => text.shift() ?? '')
  const confirmMock = vi.fn(async () => confirm.shift() ?? false)

  const ui = {
    intro,
    outro: vi.fn(),
    note: vi.fn(),
    warn,
    error: vi.fn(),
    confirm: confirmMock,
    select: selectMock,
    multiselect: vi.fn(async () => []),
    text: textMock,
    password: vi.fn(async () => ''),
    spinner: () => ({ start() {}, stop() {} }),
  } as unknown as PromptUi

  return {
    ui,
    intro,
    warn,
    select: selectMock,
    text: textMock,
    confirm: confirmMock,
  }
}

describe('collectInteractiveAddOptions', () => {
  it('coleta fluxo mínimo de comando', async () => {
    const scripted = createScriptedUi({
      select: ['command'],
      text: ['npx', ''],
      confirm: [false],
    })

    const result = await collectInteractiveAddOptions({
      ui: scripted.ui,
      initialName: 'github',
      checkConflict: vi.fn(),
    })

    expect(result).toEqual({
      name: 'github',
      options: {
        name: 'github',
        command: 'npx',
        arg: [],
        env: [],
      },
    })
    expect(scripted.intro).toHaveBeenCalledWith('Add MCP server')
    expect(scripted.select).toHaveBeenCalledTimes(1)
  })

  it('coleta comando completo com argumentos inline, extras e env', async () => {
    const scripted = createScriptedUi({
      select: ['command'],
      text: ['npx -y @scope/pkg', '--foo bar', 'API_KEY=abc', 'DEBUG'],
      confirm: [true, true, false],
    })

    const result = await collectInteractiveAddOptions({
      ui: scripted.ui,
      initialName: 'tool',
      checkConflict: vi.fn(),
    })

    expect(result.options.command).toBe('npx')
    expect(result.options.arg).toEqual(['-y', '@scope/pkg', '--foo', 'bar'])
    expect(result.options.env).toEqual(['API_KEY=abc', 'DEBUG'])
  })

  it('coleta fluxo mínimo de HTTP', async () => {
    const scripted = createScriptedUi({
      select: ['http'],
      text: ['https://api.example.com/mcp'],
      confirm: [false],
    })

    const result = await collectInteractiveAddOptions({
      ui: scripted.ui,
      initialName: 'remote',
      checkConflict: vi.fn(),
    })

    expect(result).toEqual({
      name: 'remote',
      options: {
        name: 'remote',
        http: 'https://api.example.com/mcp',
        header: [],
      },
    })
  })

  it('coleta HTTP completo com múltiplos headers', async () => {
    const scripted = createScriptedUi({
      select: ['http'],
      text: ['https://api.example.com/mcp', 'X: 1', 'Y: 2'],
      confirm: [true, true, false],
    })

    const result = await collectInteractiveAddOptions({
      ui: scripted.ui,
      initialName: 'remote',
      checkConflict: vi.fn(),
    })

    expect(result.options.header).toEqual(['X: 1', 'Y: 2'])
  })

  it('solicita o nome quando ausente', async () => {
    const scripted = createScriptedUi({
      select: ['command'],
      text: ['my-server', 'npx', ''],
      confirm: [false],
    })

    const result = await collectInteractiveAddOptions({
      ui: scripted.ui,
      checkConflict: vi.fn(),
    })

    expect(result.name).toBe('my-server')
    expect(scripted.text.mock.calls[0]?.[0]).toMatchObject({
      message: 'Server name',
      validate: validateServerName,
    })
  })

  it('avisa e re-solicita o nome quando o posicional é inválido', async () => {
    const scripted = createScriptedUi({
      select: ['command'],
      text: ['good-name', 'npx', ''],
      confirm: [false],
    })

    const result = await collectInteractiveAddOptions({
      ui: scripted.ui,
      initialName: 'Bad Name',
      checkConflict: vi.fn(),
    })

    expect(result.name).toBe('good-name')
    expect(scripted.warn).toHaveBeenCalledWith(
      expect.stringContaining('Invalid server name'),
    )
  })

  it('checa conflito antes de perguntar o tipo', async () => {
    const scripted = createScriptedUi({ select: ['command'] })
    const checkConflict = vi.fn(() => {
      throw new Error('conflict')
    })

    await expect(
      collectInteractiveAddOptions({
        ui: scripted.ui,
        initialName: 'existing',
        checkConflict,
      }),
    ).rejects.toThrow('conflict')

    expect(checkConflict).toHaveBeenCalledWith('existing')
    expect(scripted.select).not.toHaveBeenCalled()
  })

  it('não expõe o jargão stdio nas opções de tipo', async () => {
    const scripted = createScriptedUi({
      select: ['command'],
      text: ['npx', ''],
      confirm: [false],
    })

    await collectInteractiveAddOptions({
      ui: scripted.ui,
      initialName: 'tool',
      checkConflict: vi.fn(),
    })

    const selectOptions = scripted.select.mock.calls[0]?.[0] as {
      options: Array<{ label: string; value: string; hint?: string }>
    }
    expect(JSON.stringify(selectOptions)).not.toContain('stdio')
    expect(selectOptions.options.map((o) => o.value)).toEqual([
      'command',
      'http',
    ])
  })
})

describe('validators', () => {
  it('validateServerName', () => {
    expect(validateServerName('github')).toBeUndefined()
    expect(validateServerName('my-server_1.x')).toBeUndefined()
    expect(validateServerName('')).toBeDefined()
    expect(validateServerName('Bad Name')).toBeDefined()
    expect(validateServerName('-leading')).toBeDefined()
  })

  it('validateCommandInput', () => {
    expect(validateCommandInput('npx')).toBeUndefined()
    expect(validateCommandInput('npx -y @scope/pkg')).toBeUndefined()
    expect(validateCommandInput('')).toBeDefined()
    expect(validateCommandInput('   ')).toBeDefined()
  })

  it('validateHttpUrl', () => {
    expect(validateHttpUrl('http://localhost:3000/mcp')).toBeUndefined()
    expect(validateHttpUrl('https://api.example.com/mcp')).toBeUndefined()
    expect(validateHttpUrl('https://${HOST}/mcp')).toBeUndefined()
    expect(validateHttpUrl('')).toBeDefined()
    expect(validateHttpUrl('ftp://example.com')).toBeDefined()
    expect(validateHttpUrl('not a url')).toBeDefined()
  })

  it('validateEnvEntry', () => {
    expect(validateEnvEntry('API_KEY=abc')).toBeUndefined()
    expect(validateEnvEntry('API_KEY')).toBeUndefined()
    expect(validateEnvEntry('')).toBeDefined()
    expect(validateEnvEntry('=abc')).toBeDefined()
    expect(validateEnvEntry('1FOO=abc')).toBeDefined()
    expect(validateEnvEntry('PLUGIN_ROOT=x')).toBeDefined()
    expect(validateEnvEntry('PLUGIN_DATA')).toBeDefined()
  })

  it('validateHeaderEntry', () => {
    expect(validateHeaderEntry('Authorization: Bearer x')).toBeUndefined()
    expect(validateHeaderEntry('X: 1')).toBeUndefined()
    expect(validateHeaderEntry('')).toBeDefined()
    expect(validateHeaderEntry('NoColon')).toBeDefined()
    expect(validateHeaderEntry(': value')).toBeDefined()
  })
})
