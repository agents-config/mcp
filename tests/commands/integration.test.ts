import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { runSync } from '$/src/commands/sync'
import { importCommand } from '$/src/commands/import.command'
import { main } from '$/src/index'
import { removeCommand } from '$/src/commands/remove.command'
import { persistCanonicalConfig } from '$/src/commands/util'
import { loadState, emptyState, writeState } from '$/src/core/state'
import { createSandbox } from '$/tests/helpers/sandbox'

describe('commands integration', () => {
  it('init → sync → list flow', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      // init with agents and a server
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {
          github: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
          },
        },
      })

      // sync with targets
      const result = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code', 'cursor'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])

      expect(result.targets).toEqual(['claude-code', 'cursor'])
      expect(result.written.length).toBeGreaterThan(0)

      // Verify native file was written
      const content = readFileSync(`${ctx.cwd}/.mcp.json`, 'utf8')
      expect(content).toContain('mcpServers')
      expect(content).toContain('github')

      // Verify state was updated (lock file)
      const stateContent = readFileSync(
        `${ctx.cwd}/.agents/mcp-lock.json`,
        'utf8',
      )
      expect(stateContent).toContain('claude-code')
      expect(stateContent).toContain('cursor')
    } finally {
      cleanup()
    }
  })

  it('sync is byte-idempotent', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {
          github: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
          },
        },
      })

      const result1 = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])

      const result2 = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])

      expect(result2.written).toEqual(result1.written)
    } finally {
      cleanup()
    }
  })

  it('runSync strict default: zero resolvable targets exits 1 (programmatic caller)', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {},
      })

      const exitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation((() => {}) as NodeJS.Process['exit'])
      try {
        await runSync({
          scope: 'project',
          ctx,
          flag: undefined,
          dryRun: false,
          yes: true,
        } as Parameters<typeof runSync>[0])
        expect(exitSpy).toHaveBeenCalledWith(1)
      } finally {
        exitSpy.mockRestore()
      }
    } finally {
      cleanup()
    }
  })

  it('sync COMMAND com zero alvos resolviveis sai com 0, materializa plugins e imprime orientacao de sem-alvo', async () => {
    const { ctx, cleanup } = createSandbox()
    const logged: string[] = []
    try {
      // Canonical com servidores, mas nenhum arquivo nativo de agente => zero alvos detectados.
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {
          github: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
          },
        },
      })

      const savedArgv = process.argv
      const savedCwd = process.cwd()
      const savedExit = process.exit
      const savedLog = console.log
      let exitCode: number | undefined
      process.argv = ['node', 'index.js', 'sync', '--yes']
      process.chdir(ctx.cwd)
      process.exit = ((code: number) => {
        exitCode = code
      }) as unknown as NodeJS.Process['exit']
      console.log = ((message: unknown) => {
        logged.push(String(message))
      }) as typeof console.log

      try {
        await main()
        expect(exitCode).toBeUndefined() // comando nao chama process.exit (sucesso)
      } finally {
        process.argv = savedArgv
        process.chdir(savedCwd)
        process.exit = savedExit
        console.log = savedLog
      }

      // Plugin files materializados pela fase de plugin (mesmo sem alvos).
      const pluginDir = join(ctx.cwd, '.agents/plugins/github')
      expect(existsSync(join(pluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(pluginDir, 'mcp.json'))).toBe(true)

      // Lock persistido.
      expect(existsSync(join(ctx.cwd, '.agents', 'mcp-lock.json'))).toBe(true)

      // Orientacao de "sem alvos" foi impressa.
      const output = logged.join('\n')
      expect(output).toContain('No target agents')
      expect(output).toContain('agents-mcp sync --agents')
    } finally {
      cleanup()
    }
  })

  it('dry-run writes nothing', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {
          github: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
          },
        },
      })

      const result = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: true,
        yes: true,
      } as Parameters<typeof runSync>[0])

      expect(result.written).toEqual([])

      // Native file should not exist
      const fs = require('node:fs')
      expect(fs.existsSync(`${ctx.cwd}/.mcp.json`)).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('remove alpha mantem somente beta no canônico e nos agentes (AC1)', async () => {
    const { ctx, cleanup } = createSandbox()
    const origCwd = process.cwd()
    // `removeCommand.run` cria o `RuntimeContext` internamente via
    // `createUiAndCtx()`, que usa `process.cwd()`. Forçar o cwd para o sandbox
    // garante que o comando leia/grave arquivos dentro dele (sem tocar o disco
    // real do repositorio).
    mkdirSync(ctx.cwd, { recursive: true })
    process.chdir(ctx.cwd)

    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as NodeJS.Process['exit'])
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      // 1. Semente o canônico com `alpha` e `beta` (stdio, npx, args vazio).
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {
          alpha: { type: 'stdio', command: 'npx', args: [] },
          beta: { type: 'stdio', command: 'npx', args: [] },
        },
      })
      writeState('project', ctx, {
        ...emptyState('project'),
        targets: ['cursor'],
        agents: {},
        managedPlugins: ['alpha', 'beta'],
      })

      // 2. Sincroniza com `cursor`: cria os plugins e o `.cursor/mcp.json`.
      await runSync({
        scope: 'project',
        ctx,
        flag: ['cursor'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])

      // 3. Remove `alpha` (sem `--no-sync`: executa `runSync` de fato).
      await removeCommand.run!({
        args: { _: ['alpha'], global: false, yes: true },
        rawArgs: ['alpha'],
      } as unknown as Parameters<NonNullable<typeof removeCommand.run>>[0])

      // Nunca deve sair com codigo de saida diferente de zero.
      expect(exitSpy).not.toHaveBeenCalled()

      // Canônico reparseado: somente `beta`, definicao inalterada.
      const canonical = JSON.parse(
        readFileSync(join(ctx.cwd, '.agents/mcp.json'), 'utf8'),
      )
      expect(Object.keys(canonical.mcpServers)).toEqual(['beta'])
      expect(canonical.mcpServers.beta).toEqual({
        type: 'stdio',
        command: 'npx',
        args: [],
      })

      // `.cursor/mcp.json` continua existindo e contem `beta` (nao `alpha`).
      const cursorContent = readFileSync(
        join(ctx.cwd, '.cursor/mcp.json'),
        'utf8',
      )
      expect(cursorContent).toContain('beta')
      expect(cursorContent).not.toContain('alpha')

      // Plugin gerenciado de `beta` permanece inteiro.
      expect(
        existsSync(join(ctx.cwd, '.agents/plugins/beta/plugin.json')),
      ).toBe(true)
      expect(existsSync(join(ctx.cwd, '.agents/plugins/beta/mcp.json'))).toBe(
        true,
      )

      // Diretorio de `alpha` foi apagado (so havia arquivos gerenciados).
      expect(existsSync(join(ctx.cwd, '.agents/plugins/alpha'))).toBe(false)

      // Estado: `managedPlugins` encolheu para `['beta']`.
      const state = loadState('project', ctx).state
      expect(state.managedPlugins).toEqual(['beta'])
    } finally {
      exitSpy.mockRestore()
      logSpy.mockRestore()
      errorSpy.mockRestore()
      process.chdir(origCwd)
      cleanup()
    }
  })

  it('lock contains only portable paths and no machine-specific leakage', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {
          github: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
          },
        },
      })

      const result = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code', 'cursor', 'opencode', 'antigravity'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])
      expect(result.errors).toEqual([])

      const lockPath = join(ctx.cwd, '.agents', 'mcp-lock.json')
      const lock = readFileSync(lockPath, 'utf8')
      const parsed = JSON.parse(lock)
      expect(parsed.version).toBe(2)
      // Exact portable paths per SPEC project-scope table.
      expect(parsed.agents['claude-code']?.path).toBe('.mcp.json')
      expect(parsed.agents['cursor']?.path).toBe('.cursor/mcp.json')
      expect(parsed.agents['opencode']?.path).toBe('opencode.json')
      expect(parsed.agents['antigravity']?.path).toBe('.agents/plugins')

      // No machine-specific leakage anywhere in the raw lock.
      expect(lock).not.toContain(ctx.cwd)
      expect(lock).not.toContain(ctx.homeDir)
      expect(lock).not.toContain('\\')
      // No POSIX absolute prefix or Windows drive letter in any path value.
      for (const agentId of Object.keys(parsed.agents)) {
        const p = (parsed.agents as Record<string, { path: string }>)[agentId]!
          .path
        expect(p).not.toMatch(/^\//)
        expect(p).not.toMatch(/^[A-Za-z]:/)
        expect(p).not.toContain('\\')
        expect(p).not.toContain('..')
      }
    } finally {
      cleanup()
    }
  })

  it('sync twice produces a byte-identical lock', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {
          github: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
          },
        },
      })

      const run = () =>
        runSync({
          scope: 'project',
          ctx,
          flag: ['claude-code', 'cursor'],
          dryRun: false,
          yes: true,
        } as Parameters<typeof runSync>[0])

      await run()
      const lock1 = readFileSync(
        join(ctx.cwd, '.agents', 'mcp-lock.json'),
        'utf8',
      )
      await run()
      const lock2 = readFileSync(
        join(ctx.cwd, '.agents', 'mcp-lock.json'),
        'utf8',
      )

      expect(lock2).toBe(lock1)
    } finally {
      cleanup()
    }
  })

  it('cross-sandbox: sync produces a byte-identical lock across different cwd and homeDir', async () => {
    const { ctx: ctxA, cleanup: cleanupA } = createSandbox()
    const { ctx: ctxB, cleanup: cleanupB } = createSandbox()
    try {
      const canonical = {
        $schema: 'https://example.com/schema.json',
        mcpServers: {
          github: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
          },
        },
      }
      expect(ctxA.cwd).not.toBe(ctxB.cwd)
      expect(ctxA.homeDir).not.toBe(ctxB.homeDir)

      persistCanonicalConfig('project', ctxA, canonical)
      persistCanonicalConfig('project', ctxB, canonical)

      await runSync({
        scope: 'project',
        ctx: ctxA,
        flag: ['claude-code', 'cursor'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])
      const lockA = readFileSync(
        join(ctxA.cwd, '.agents', 'mcp-lock.json'),
        'utf8',
      )

      // Copy canonical + lock to sandbox B (different cwd/homeDir).
      persistCanonicalConfig('project', ctxB, canonical)
      writeFileSync(join(ctxB.cwd, '.agents', 'mcp-lock.json'), lockA)

      await runSync({
        scope: 'project',
        ctx: ctxB,
        flag: ['claude-code', 'cursor'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])
      const lockB = readFileSync(
        join(ctxB.cwd, '.agents', 'mcp-lock.json'),
        'utf8',
      )

      expect(lockB).toBe(lockA)
      const parsedB = JSON.parse(lockB)
      expect(parsedB.version).toBe(2)
      for (const agentId of Object.keys(parsedB.agents)) {
        const p = (parsedB.agents as Record<string, { path: string }>)[agentId]!
          .path
        expect(p).not.toContain(ctxB.cwd)
        expect(p).not.toContain(ctxB.homeDir)
        expect(p).not.toContain('\\')
      }
    } finally {
      cleanupA()
      cleanupB()
    }
  })

  it('import --no-sync twice produces a byte-identical lock and preserves updatedAt', async () => {
    const { ctx, cleanup } = createSandbox()
    const origCwd = process.cwd()
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as NodeJS.Process['exit'])
    try {
      mkdirSync(ctx.cwd, { recursive: true })
      process.chdir(ctx.cwd)
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {},
      })
      // Native claude-code config that import will scan.
      writeFileSync(
        join(ctx.cwd, '.mcp.json'),
        JSON.stringify({
          mcpServers: {
            github: { type: 'stdio', command: 'npx', args: ['-y', 'pkg'] },
          },
        }),
      )

      const importArgs = {
        yes: true,
        global: false,
        'no-sync': true,
        force: false,
        'extract-secrets': false,
        _: [],
      }

      await importCommand.run!({
        args: importArgs,
        rawArgs: [],
      } as unknown as Parameters<NonNullable<typeof importCommand.run>>[0])
      const lock1 = readFileSync(
        join(ctx.cwd, '.agents', 'mcp-lock.json'),
        'utf8',
      )
      const parsed1 = JSON.parse(lock1)
      const updatedAt1 = parsed1.agents['claude-code']?.updatedAt
      expect(updatedAt1).toBeDefined()

      await importCommand.run!({
        args: importArgs,
        rawArgs: [],
      } as unknown as Parameters<NonNullable<typeof importCommand.run>>[0])
      const lock2 = readFileSync(
        join(ctx.cwd, '.agents', 'mcp-lock.json'),
        'utf8',
      )
      const parsed2 = JSON.parse(lock2)

      // Byte-identical and updatedAt preserved when nothing changed.
      expect(lock2).toBe(lock1)
      expect(parsed2.agents['claude-code']?.updatedAt).toBe(updatedAt1)
      expect(parsed2.version).toBe(2)
      expect(parsed2.agents['claude-code']?.path).toBe('.mcp.json')
    } finally {
      exitSpy.mockRestore()
      process.chdir(origCwd)
      cleanup()
    }
  })

  it('sync with a v1 lock warns and rewrites it as version 2', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      persistCanonicalConfig('project', ctx, {
        $schema: 'https://example.com/schema.json',
        mcpServers: {
          github: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
          },
        },
      })
      // Seed a v1 lock with an absolute path.
      writeFileSync(
        join(ctx.cwd, '.agents', 'mcp-lock.json'),
        JSON.stringify({
          version: 1,
          scope: 'project',
          targets: ['claude-code'],
          agents: {
            'claude-code': {
              path: join(ctx.cwd, '.mcp.json'),
              names: ['github'],
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          },
          managedPlugins: [],
        }),
      )

      const result = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])
      expect(result.errors).toEqual([])
      expect(
        result.warnings.some((w) =>
          w.includes('Unsupported sync state version 1'),
        ),
      ).toBe(true)

      const lock = readFileSync(
        join(ctx.cwd, '.agents', 'mcp-lock.json'),
        'utf8',
      )
      const parsed = JSON.parse(lock)
      expect(parsed.version).toBe(2)
      expect(parsed.agents['claude-code'].path).toBe('.mcp.json')
      expect(lock).not.toContain(ctx.cwd)
    } finally {
      cleanup()
    }
  })
})
