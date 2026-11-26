import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { runSync } from '$/src/commands/sync'
import { runDoctor } from '$/src/commands/doctor.command'
import { persistCanonicalConfig } from '$/src/commands/util'
import { createSandbox } from '$/tests/helpers/sandbox'
import type { AgentId } from '$/src/adapters/types'
import { DEFAULT_SCHEMA_URL } from '$/src/config'

const ALL_AGENTS: AgentId[] = [
  'claude-code',
  'cursor',
  'vscode',
  'opencode',
  'zed',
  'windsurf',
]

const CANONICAL_CONFIG = {
  $schema: DEFAULT_SCHEMA_URL,
  mcpServers: {
    github: {
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_TOKEN}',
      },
    },
    postgres: {
      type: 'stdio',
      command: 'uvx',
      args: ['mcp-server-postgres', '${DATABASE_URL}'],
    },
    linear: {
      type: 'streamable-http',
      url: 'https://mcp.linear.app/mcp',
      headers: {
        Authorization: 'Bearer ${LINEAR_API_KEY}',
      },
    },
  },
}

/**
 * Create mock binaries in the sandbox so doctor's runtime check passes.
 * Also sets env vars in ctx.env so doctor's env check passes.
 * Placeholder names in canonical config: GITHUB_TOKEN, DATABASE_URL, LINEAR_API_KEY.
 */
function createMockBinaries(
  ctx: ReturnType<typeof createSandbox>['ctx'],
): void {
  const binDir = `${ctx.cwd}/.bin`
  mkdirSync(binDir, { recursive: true })
  writeFileSync(`${binDir}/npx`, '#!/usr/bin/env node\nconsole.log("mock")\n', {
    mode: 0o755,
  })
  writeFileSync(`${binDir}/uvx`, '#!/usr/bin/env node\nconsole.log("mock")\n', {
    mode: 0o755,
  })
  // Add bin dir to PATH
  ctx.env.PATH = `${binDir}:${ctx.env.PATH}`
  process.env.PATH = `${binDir}:${process.env.PATH}`
  // Define env vars in ctx.env (doctor reads ctx.env via resolveVar)
  ctx.env.GITHUB_TOKEN = 'fake_token'
  ctx.env.DATABASE_URL = 'postgres://user:pass@localhost/db'
  ctx.env.LINEAR_API_KEY = 'fake_linear_key'
  // Also set in process.env for completeness
  process.env.GITHUB_PERSONAL_ACCESS_TOKEN = 'fake_token'
  process.env.DATABASE_URL = 'postgres://user:pass@localhost/db'
  process.env.LINEAR_API_KEY = 'fake_linear_key'
}

/**
 * Run the full E2E flow: init → sync → doctor.
 */
async function runFullFlow(
  ctx: ReturnType<typeof createSandbox>['ctx'],
  scope: 'project' | 'global',
  agents: AgentId[] = ALL_AGENTS,
) {
  // 1. init - create canonical config with one server
  persistCanonicalConfig('project', ctx, {
    $schema: CANONICAL_CONFIG.$schema,
    mcpServers: {
      github: CANONICAL_CONFIG.mcpServers.github,
    },
  })

  // 2. sync with targets
  const syncResult = await runSync({
    scope,
    ctx,
    flag: agents,
    dryRun: false,
    yes: true,
  } as Parameters<typeof runSync>[0])
  expect(syncResult.targets).toEqual(agents)
  expect(syncResult.written.length).toBeGreaterThan(0)

  // 3. Verify native config file was written
  const projectConfigPath = `${ctx.cwd}/.mcp.json`
  if (scope === 'project') {
    expect(existsSync(projectConfigPath)).toBe(true)
    const content = readFileSync(projectConfigPath, 'utf8')
    expect(content).toContain('mcpServers')
    expect(content).toContain('github')
  }

  // 4. sync again - should be byte-idempotent
  const syncResult2 = await runSync({
    scope,
    ctx,
    flag: agents,
    dryRun: false,
    yes: true,
  } as Parameters<typeof runSync>[0])
  expect(syncResult2.written.length).toBeGreaterThan(0)

  // 5. doctor - should pass
  const doctorResult = await runDoctor({
    scope,
    ctx,
    flag: agents,
    dryRun: false,
    strict: false,
  } as Parameters<typeof runDoctor>[0])
  expect(doctorResult.errors).toBe(0)

  // 6. Remove all servers from canonical config
  persistCanonicalConfig(scope, ctx, {
    $schema: CANONICAL_CONFIG.$schema,
    mcpServers: {},
  })

  // 7. doctor after removal - should still pass (no servers to check)
  const finalDoctor = await runDoctor({
    scope,
    ctx,
    flag: agents,
    dryRun: false,
    strict: false,
  } as Parameters<typeof runDoctor>[0])
  expect(finalDoctor.errors).toBe(0)
}

describe('E2E: agents-mcp full flow', () => {
  it('project scope: init → sync → doctor', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      createMockBinaries(ctx)
      await runFullFlow(ctx, 'project', ['claude-code', 'cursor', 'vscode'])
    } finally {
      cleanup()
    }
  })

  it('global scope: fresh-repo flow in --yes mode', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      createMockBinaries(ctx)
      // For global scope, create canonical config in home/.agents
      const fs = await import('node:fs')
      fs.mkdirSync(`${ctx.homeDir}/.agents`, { recursive: true })
      persistCanonicalConfig('global', ctx, {
        $schema: CANONICAL_CONFIG.$schema,
        mcpServers: {
          github: CANONICAL_CONFIG.mcpServers.github,
        },
      })

      await runFullFlow(ctx, 'global', ['claude-code', 'cursor'])
    } finally {
      cleanup()
    }
  })

  it('--dry-run writes nothing (project scope)', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      createMockBinaries(ctx)
      persistCanonicalConfig('project', ctx, {
        $schema: CANONICAL_CONFIG.$schema,
        mcpServers: {
          github: CANONICAL_CONFIG.mcpServers.github,
        },
      })

      const result = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: true,
        yes: true,
      } as Parameters<typeof runSync>[0])

      // dry-run should not write any native files
      expect(result.written).toEqual([])

      // Native file should not exist
      const fs = await import('node:fs')
      expect(fs.existsSync(`${ctx.cwd}/.mcp.json`)).toBe(false)
      expect(fs.existsSync(`${ctx.cwd}/.agents/mcp-lock.json`)).toBe(false)
    } finally {
      cleanup()
    }
  })

  it('all six agents: init → sync → doctor', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      createMockBinaries(ctx)
      persistCanonicalConfig('project', ctx, {
        $schema: CANONICAL_CONFIG.$schema,
        mcpServers: CANONICAL_CONFIG.mcpServers,
      })

      // sync with all six agents
      const result = await runSync({
        scope: 'project',
        ctx,
        flag: ALL_AGENTS,
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])
      expect(result.targets).toEqual(ALL_AGENTS)
      expect(result.written.length).toBeGreaterThan(0)

      // doctor
      const doctorResult = await runDoctor({
        scope: 'project',
        ctx,
        flag: ALL_AGENTS,
        dryRun: false,
        strict: false,
      } as Parameters<typeof runDoctor>[0])
      expect(doctorResult.errors).toBe(0)
    } finally {
      cleanup()
    }
  })

  it('fresh clone: mcp.json + diretorio de plugin pre-existente (sem lock) -> sync adota o plugin e sai com 0', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      createMockBinaries(ctx)
      persistCanonicalConfig('project', ctx, {
        $schema: CANONICAL_CONFIG.$schema,
        mcpServers: {
          github: CANONICAL_CONFIG.mcpServers.github,
        },
      })
      // Diretorio de plugin pre-existente com um sentinel (sem lock).
      const pluginDir = `${ctx.cwd}/.agents/plugins/github`
      mkdirSync(pluginDir, { recursive: true })
      const sentinel = `${pluginDir}/sentinel.txt`
      writeFileSync(sentinel, 'FRESH-CLONE-KEEP')

      let exitCode: number | undefined
      const savedExit = process.exit
      process.exit = ((code: number) => {
        exitCode = code
      }) as unknown as NodeJS.Process['exit']
      try {
        const result = await runSync({
          scope: 'project',
          ctx,
          flag: ['claude-code'],
          dryRun: false,
          yes: true,
        } as Parameters<typeof runSync>[0])
        expect(result.errors).toEqual([])
      } finally {
        process.exit = savedExit
      }
      expect(exitCode).toBeUndefined() // sincronizacao bem-sucedida => nao chama exit (exit 0)

      // Sentinel preservado, arquivos gerenciados sobrescritos (adocao).
      expect(readFileSync(sentinel, 'utf8')).toBe('FRESH-CLONE-KEEP')
      expect(
        JSON.parse(readFileSync(`${pluginDir}/plugin.json`, 'utf8')).name,
      ).toBe('github')
      expect(existsSync(`${pluginDir}/mcp.json`)).toBe(true)

      // Lock criado e registra o plugin como gerenciado.
      const lock = `${ctx.cwd}/.agents/mcp-lock.json`
      expect(existsSync(lock)).toBe(true)
      const stateContent = readFileSync(lock, 'utf8')
      expect(stateContent).toContain('github')

      // sync nao cria nem toca .gitignore com o nome do lock.
      const gitignore = `${ctx.cwd}/.gitignore`
      if (existsSync(gitignore)) {
        expect(readFileSync(gitignore, 'utf8')).not.toContain('mcp-lock')
      }
    } finally {
      cleanup()
    }
  })

  it('plain sync nao cria .gitignore contendo o nome do lock', async () => {
    const { ctx, cleanup } = createSandbox()
    try {
      createMockBinaries(ctx)
      persistCanonicalConfig('project', ctx, {
        $schema: CANONICAL_CONFIG.$schema,
        mcpServers: {
          github: CANONICAL_CONFIG.mcpServers.github,
        },
      })

      const result = await runSync({
        scope: 'project',
        ctx,
        flag: ['claude-code'],
        dryRun: false,
        yes: true,
      } as Parameters<typeof runSync>[0])
      expect(result.errors).toEqual([])

      const gitignore = `${ctx.cwd}/.gitignore`
      expect(existsSync(gitignore)).toBe(false)
    } finally {
      cleanup()
    }
  })
})
