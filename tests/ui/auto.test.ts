import { describe, expect, it } from 'vitest'
import { createAutoUi } from '$/src/ui/auto'

describe('createAutoUi', () => {
  it('intro and outro log messages', async () => {
    const logs: string[] = []
    const ui = createAutoUi({
      defaults: {},
      log: { info: (m) => logs.push(m), warn: () => {}, error: () => {} },
    })
    ui.intro('hello')
    ui.outro('bye')
    expect(logs).toContain('hello')
    expect(logs).toContain('bye')
  })

  it('confirm returns default when no default provided', async () => {
    const ui = createAutoUi({ defaults: {}, log: undefined })
    await expect(
      ui.confirm({ message: 'ok?', initialValue: false }),
    ).resolves.toBe(false)
  })

  it('confirm uses provided default', async () => {
    const ui = createAutoUi({ defaults: { confirm: true }, log: undefined })
    await expect(
      ui.confirm({ message: 'ok?', initialValue: false }),
    ).resolves.toBe(true)
  })

  it('select uses first option when no default', async () => {
    const ui = createAutoUi({
      defaults: {},
      log: undefined,
    })
    await expect(
      ui.select({
        message: 'pick',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
      }),
    ).resolves.toBe('a')
  })

  it('select uses provided default', async () => {
    const ui = createAutoUi({
      defaults: { select: 'b' },
      log: undefined,
    })
    await expect(
      ui.select({
        message: 'pick',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
      }),
    ).resolves.toBe('b')
  })

  it('multiselect returns empty array when no default', async () => {
    const ui = createAutoUi({ defaults: {}, log: undefined })
    await expect(
      ui.multiselect({
        message: 'pick',
        options: [{ label: 'A', value: 'a' }],
      }),
    ).resolves.toEqual([])
  })

  it('text uses defaultValue', async () => {
    const ui = createAutoUi({
      defaults: { text: 'hello' },
      log: undefined,
    })
    await expect(ui.text({ message: 'say?' })).resolves.toBe('hello')
  })

  it('password masks output', async () => {
    const logs: string[] = []
    const ui = createAutoUi({
      defaults: { password: 'secret123' },
      log: { info: (m) => logs.push(m), warn: () => {}, error: () => {} },
    })
    await expect(ui.password({ message: 'pw?' })).resolves.toBe('secret123')
    expect(logs.some((l) => l.includes('***'))).toBe(true)
  })

  it('spinner start and stop do not throw', () => {
    const ui = createAutoUi({ defaults: {}, log: undefined })
    const spin = ui.spinner('working')
    expect(() => spin.start()).not.toThrow()
    expect(() => spin.stop('done')).not.toThrow()
  })
})
