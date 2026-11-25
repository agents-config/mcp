/**
 * Global flag contract across every subcommand.
 *
 * `citty` does not inherit the root command aliases into subcommands, so
 * `normalizeGlobalArgs` canonicalizes `-g` → `--global` and `-y` → `--yes`
 * before and after the subcommand token, and commands read them through
 * `isGlobalFlag` / `isYesFlag`. These tests exercise the whole contract via
 * the real entrypoint for all 7 commands.
 */

import { describe, expect, it } from 'vitest'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { main, normalizeGlobalArgs } from '$/src/index'
import {
  isGlobalFlag,
  isYesFlag,
  persistCanonicalConfig,
} from '$/src/commands/util'
import { DEFAULT_SCHEMA_URL } from '$/src/config'
import type { RuntimeContext } from '$/src/core/context'
import { createSandbox } from '$/tests/helpers/sandbox'

const SUBCOMMANDS = [
  'sync',
  'init',
  'remove',
  'list',
  'import',
  'add',
  'doctor',
] as const

describe('normalizeGlobalArgs: short global aliases', () => {
  for (const subcommand of SUBCOMMANDS) {
    it(`canonicaliza -g/-y antes de \`${subcommand}\``, () => {
      expect(normalizeGlobalArgs(['-g', '-y', subcommand])).toEqual([
        subcommand,
        '--global',
        '--yes',
      ])
    })

    it(`canonicaliza -g/-y depois de \`${subcommand}\``, () => {
      expect(normalizeGlobalArgs([subcommand, '-g', '-y'])).toEqual([
        subcommand,
        '--global',
        '--yes',
      ])
    })
  }
})

describe('isGlobalFlag / isYesFlag', () => {
  it('aceita as formas longa e curta', () => {
    expect(isGlobalFlag({ global: true })).toBe(true)
    expect(isGlobalFlag({ g: true })).toBe(true)
    expect(isGlobalFlag({})).toBe(false)
    expect(isYesFlag({ yes: true })).toBe(true)
    expect(isYesFlag({ y: true })).toBe(true)
    expect(isYesFlag({})).toBe(false)
  })
})

interface CliResult {
  exitCode: number | undefined
  stdout: string[]
  stderr: string[]
}

const savedEnvKeys = ['HOME', 'XDG_CONFIG_HOME'] as const

/** Run the real CLI in a sandbox, capturing output, exit code and disk scope. */
async function runCli(
  argv: readonly string[],
  sandbox: ReturnType<typeof createSandbox>,
): Promise<CliResult> {
  mkdirSync(sandbox.ctx.cwd, { recursive: true })
  mkdirSync(sandbox.ctx.homeDir, { recursive: true })

  const result: CliResult = {
    exitCode: undefined,
    stdout: [],
    stderr: [],
  }
  const savedArgv = process.argv
  const savedCwd = process.cwd()
  const savedExit = process.exit
  const savedLog = console.log
  const savedError = console.error
  const savedEnv = new Map<string, string | undefined>()
  for (const key of savedEnvKeys) {
    savedEnv.set(key, process.env[key])
  }

  process.argv = ['node', 'index.js', ...argv]
  process.chdir(sandbox.ctx.cwd)
  process.env.HOME = sandbox.ctx.homeDir
  process.env.XDG_CONFIG_HOME = join(sandbox.ctx.homeDir, '.config')
  process.exit = ((code: number) => {
    result.exitCode = code
  }) as unknown as NodeJS.Process['exit']
  console.log = ((message: unknown) => {
    result.stdout.push(String(message))
  }) as typeof console.log
  console.error = ((message: unknown) => {
    result.stderr.push(String(message))
  }) as typeof console.error

  try {
    await main()
  } finally {
    process.argv = savedArgv
    process.chdir(savedCwd)
    process.exit = savedExit
    console.log = savedLog
    console.error = savedError
    for (const [key, value] of savedEnv) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }

  return result
}

function seedGlobalCanonicalConfig(ctx: RuntimeContext): void {
  persistCanonicalConfig('global', ctx, {
    $schema: DEFAULT_SCHEMA_URL,
    mcpServers: {
      gonly: {
        type: 'streamable-http',
        url: 'https://example.com/mcp',
      },
    },
  })
}

/**
 * Every command must honor `-g`/`--global` regardless of where the flag sits.
 * `expected` is matched against stdout unless `stderrExcludes` is set.
 */
const CASES: Array<{
  name: string
  argv: string[]
  expected: (homeDir: string) => string
  stderrExcludes?: string
}> = [
  {
    name: 'init',
    argv: ['init', '--force', '--dry-run'],
    expected: (home) =>
      `Initialized global canonical config at ${join(home, '.agents/mcp.json')}`,
  },
  {
    name: 'sync',
    argv: ['sync', '--agents', 'vscode', '--dry-run'],
    expected: (home) => join(home, '.config', 'Code', 'User', 'mcp.json'),
  },
  {
    name: 'remove',
    argv: ['remove', 'gonly', '--dry-run'],
    expected: (home) => join(home, '.agents/mcp.json'),
  },
  {
    name: 'list',
    argv: ['list'],
    expected: () => 'gonly',
  },
  {
    name: 'import',
    argv: ['import', '--dry-run'],
    expected: (home) => join(home, '.agents/mcp.json'),
  },
  {
    name: 'add',
    argv: ['add', 'demo', '--command', 'npx', '--dry-run'],
    expected: (home) => join(home, '.agents/mcp.json'),
  },
  {
    name: 'doctor',
    argv: ['doctor', '--dry-run'],
    expected: () => 'doctor:',
    stderrExcludes: 'No canonical config',
  },
]

for (const placement of ['antes', 'depois'] as const) {
  describe(`-g/-y ${placement} do subcomando`, () => {
    for (const testCase of CASES) {
      it(`\`${testCase.name}\` opera no escopo global`, async () => {
        const sandbox = createSandbox()
        try {
          seedGlobalCanonicalConfig(sandbox.ctx)

          const argv =
            placement === 'antes'
              ? ['-g', '-y', ...testCase.argv]
              : [
                  testCase.argv[0] as string,
                  '-g',
                  '-y',
                  ...testCase.argv.slice(1),
                ]

          const result = await runCli(argv, sandbox)

          expect(result.exitCode).toBeUndefined()
          const output = [...result.stdout, ...result.stderr].join('\n')
          expect(output).toContain(testCase.expected(sandbox.ctx.homeDir))
          if (testCase.stderrExcludes) {
            expect(result.stderr.join('\n')).not.toContain(
              testCase.stderrExcludes,
            )
          }
        } finally {
          sandbox.cleanup()
        }
      })
    }
  })
}
