import { describe, expect, it, vi, afterEach, afterAll } from 'vitest'
import { main } from '$/src/index'

describe('CLI entrypoint', () => {
  const exitSpy = vi
    .spyOn(process, 'exit')
    .mockImplementation((() => {}) as NodeJS.Process['exit'])
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

  afterEach(() => {
    exitSpy.mockClear()
    logSpy.mockClear()
  })

  afterAll(() => {
    exitSpy.mockRestore()
    logSpy.mockRestore()
  })

  it('--version prints version and does not exit', async () => {
    const origArgv = process.argv
    process.argv = ['node', 'index.js', '--version']
    try {
      await expect(main()).resolves.toBeUndefined()
      expect(exitSpy).not.toHaveBeenCalled()
    } finally {
      process.argv = origArgv
    }
  })

  it('-v prints version and does not exit', async () => {
    const origArgv = process.argv
    process.argv = ['node', 'index.js', '-v']
    try {
      await expect(main()).resolves.toBeUndefined()
      expect(exitSpy).not.toHaveBeenCalled()
    } finally {
      process.argv = origArgv
    }
  })

  it('--help prints usage and does not exit', async () => {
    const origArgv = process.argv
    process.argv = ['node', 'index.js', '--help']
    try {
      await expect(main()).resolves.toBeUndefined()
      expect(exitSpy).not.toHaveBeenCalled()
    } finally {
      process.argv = origArgv
    }
  })

  it('-h prints usage and does not exit', async () => {
    const origArgv = process.argv
    process.argv = ['node', 'index.js', '-h']
    try {
      await expect(main()).resolves.toBeUndefined()
      expect(exitSpy).not.toHaveBeenCalled()
    } finally {
      process.argv = origArgv
    }
  })

  it('unknown command calls process.exit with 2', async () => {
    const origArgv = process.argv
    process.argv = ['node', 'index.js', 'nonexistent-command']
    try {
      // Mock process.exit to prevent vitest from detecting it
      const origExit = process.exit
      let exitCode: number | undefined
      process.exit = ((code: number) => {
        exitCode = code
      }) as unknown as NodeJS.Process['exit']
      try {
        await main()
        expect(exitCode).toBe(2)
      } finally {
        process.exit = origExit
      }
    } finally {
      process.argv = origArgv
    }
  })

  it('subcommand --help is not intercepted at root level', async () => {
    const origArgv = process.argv
    process.argv = ['node', 'index.js', 'sync', '--help']
    try {
      await expect(main()).resolves.toBeUndefined()
    } finally {
      process.argv = origArgv
    }
  })
})
