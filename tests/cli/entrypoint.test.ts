import { describe, expect, it, vi, afterEach, afterAll } from 'vitest'
import { runCommand } from 'citty'
import { main, normalizeGlobalArgs } from '$/src/index'
import { ConfigValidationError } from '$/src/core/store'
import pkg from '$/package.json' with { type: 'json' }

vi.mock('citty', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    runCommand: vi.fn(actual.runCommand as (...args: unknown[]) => unknown),
    showUsage: vi.fn(actual.showUsage as (...args: unknown[]) => unknown),
  }
})

describe('normalizeGlobalArgs', () => {
  it('converte --agents <lista> em --agents=<lista>', () => {
    expect(
      normalizeGlobalArgs(['sync', '--agents', 'antigravity,cursor']),
    ).toEqual(['sync', '--agents=antigravity,cursor'])
  })

  it('preserva --agents=<lista>', () => {
    expect(normalizeGlobalArgs(['sync', '--agents=antigravity'])).toEqual([
      'sync',
      '--agents=antigravity',
    ])
  })

  it('não converte --agents sem valor', () => {
    expect(normalizeGlobalArgs(['sync', '--agents'])).toEqual([
      'sync',
      '--agents',
    ])
  })

  it('não converte --agents após o separador --', () => {
    expect(
      normalizeGlobalArgs(['sync', '--', '--agents', 'antigravity']),
    ).toEqual(['sync', '--', '--agents', 'antigravity'])
  })
})

describe('CLI entrypoint', () => {
  const exitSpy = vi
    .spyOn(process, 'exit')
    .mockImplementation((() => {}) as NodeJS.Process['exit'])
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  afterEach(() => {
    exitSpy.mockClear()
    logSpy.mockClear()
    errorSpy.mockClear()
  })

  afterAll(() => {
    exitSpy.mockRestore()
    logSpy.mockRestore()
    errorSpy.mockRestore()
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

  it('executa main() quando argv[1] é um symlink para index.js (bin instalado)', async () => {
    const { symlink, unlink } = await import('node:fs/promises')
    const { join } = await import('node:path')
    const { tmpdir } = await import('node:os')

    const symlinkPath = join(tmpdir(), `agents-mcp-test-${Date.now()}`)
    const target = join(process.cwd(), 'dist/index.js')

    try {
      await symlink(target, symlinkPath)
    } catch {
      // symlink pode já existir de uma execução anterior
    }

    const origArgv = process.argv
    const origVitest = process.env.VITEST
    const origExit = process.exit
    const origLog = console.log
    let exitCode: number | undefined
    let logged: string[] = []
    process.exit = ((code: number) => {
      exitCode = code
    }) as unknown as NodeJS.Process['exit']
    console.log = ((msg: unknown) => {
      logged.push(String(msg))
    }) as unknown as typeof console.log

    delete process.env.VITEST
    process.argv = ['node', symlinkPath, '--version']

    try {
      await main()
      expect(exitCode).toBeUndefined()
      expect(logged.some((m) => m.includes(pkg.version))).toBe(true)
    } finally {
      process.env.VITEST = origVitest
      process.argv = origArgv
      process.exit = origExit
      console.log = origLog
      try {
        await unlink(symlinkPath)
      } catch {
        // ignore
      }
    }
  })

  it('imprime erro no stderr antes de sair com código 1 em erro de runtime (ConfigValidationError)', async () => {
    const origArgv = process.argv
    const origExit = process.exit
    const origError = console.error
    let exitCode: number | undefined
    let errors: string[] = []
    process.exit = ((code: number) => {
      exitCode = code
    }) as unknown as NodeJS.Process['exit']
    console.error = ((msg: unknown) => {
      errors.push(String(msg))
    }) as unknown as typeof console.error

    process.argv = ['node', 'index.js', 'add', 'x', '--command=npx']
    vi.mocked(runCommand).mockRejectedValueOnce(
      new ConfigValidationError(
        'Invalid canonical config at /home/user/.agents/mcp.json: mcpServers — required',
        '/home/user/.agents/mcp.json',
      ),
    )

    try {
      await main()
      expect(exitCode).toBe(1)
      expect(errors.some((m) => m.includes('Invalid canonical config'))).toBe(
        true,
      )
    } finally {
      process.argv = origArgv
      process.exit = origExit
      console.error = origError
    }
  })
})
