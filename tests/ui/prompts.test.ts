import { afterEach, describe, expect, it, vi } from 'vitest'
import { createClackUi } from '$/src/ui/prompts'

// Wait for the dynamic clack import to settle (microtasks + one macrotask).
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('createClackUi (loss-proof writes)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('error writes console.error synchronously in the same tick', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const ui = createClackUi()
    ui.error('boom')
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledWith('boom')
  })

  it('warn writes console.warn synchronously in the same tick', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const ui = createClackUi()
    ui.warn('careful')
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith('careful')
  })

  it('note writes console.log synchronously in the same tick', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const ui = createClackUi()
    ui.note('info')
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy).toHaveBeenCalledWith('info')
  })

  it('intro writes console.log synchronously in the same tick', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const ui = createClackUi()
    ui.intro('hello')
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy).toHaveBeenCalledWith('hello')
  })

  it('outro writes console.log synchronously in the same tick', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const ui = createClackUi()
    ui.outro('bye')
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy).toHaveBeenCalledWith('bye')
  })

  it('error is recorded before mocked process.exit (ordering regression)', () => {
    const trace: string[] = []
    vi.spyOn(console, 'error').mockImplementation((m) => {
      trace.push(`console.error:${m}`)
    })
    vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      trace.push(`exit:${code}`)
    }) as NodeJS.Process['exit'])
    const ui = createClackUi()
    ui.error('boom')
    process.exit(1)
    expect(trace).toEqual(['console.error:boom', 'exit:1'])
  })

  it('does not duplicate the message after clack loads', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const ui = createClackUi()
    ui.error('boom')
    expect(errorSpy).toHaveBeenCalledTimes(1)
    await flush()
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('spinner.stop prints message once before clack load and does not throw', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const ui = createClackUi()
    const spin = ui.spinner('working')
    expect(() => spin.stop('done')).not.toThrow()
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy).toHaveBeenCalledWith('done')
  })
})
