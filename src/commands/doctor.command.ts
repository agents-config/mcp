/**
 * `doctor` command (§11).
 *
 * Runs six checks in order (§14):
 *   1. Schema — canonical config validity + validateConfig() warnings
 *   2. Env — every placeholder in env/headers/args/url; missing required var = error
 *   3. Runtime — stdio binaries resolved in PATH (respecting PATHEXT on Windows);
 *      absolute paths must exist and be executable
 *   4. Drift — adapter.compile(server) vs parsed on-disk entry (deep equality)
 *   5. State — corrupt/unreadable state; targets pointing at unsupported scopes
 *   6. Hygiene — `.env` tracked by Git; placeholders without fallback that resolve
 *      nowhere
 *
 * Exit `1` if any error; `0` if only warnings; `--strict` makes warnings fatal.
 */

import { defineCommand } from 'citty'
import { execSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { parse } from 'jsonc-parser'
import { createUiAndCtx, configPath, isDryRun } from '$/src/commands/util'
import { resolveTargetsAsync, getAdapter } from '$/src/adapters/index'
import { loadValidatedConfig } from '$/src/core/store'
import { loadState } from '$/src/core/state'
import { parsePlaceholders } from '$/src/core/placeholder'
import { readDotenv, resolveVar } from '$/src/core/env'
import { readTextFile } from '$/src/core/fs-atomic'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
import type { CanonicalServer } from '$/src/core/schema'

export interface DoctorResult {
  code: string
  severity: 'error' | 'warning'
  message: string
  agent?: string
  server?: string
  field?: string
}

export interface DoctorSummary {
  errors: number
  warnings: number
  results: DoctorResult[]
}

export interface DoctorOptions {
  scope: ConfigScope
  ctx: RuntimeContext
  flag: readonly string[] | undefined
  dryRun: boolean
  strict: boolean
}

/** Run all six doctor checks and return structured results. */
export async function runDoctor(
  options: DoctorOptions,
): Promise<DoctorSummary> {
  const { scope, ctx, flag, dryRun, strict } = options
  const { ui } = createUiAndCtx({ yes: strict })

  const results: DoctorResult[] = []

  // 1. Schema check.
  const validated = loadValidatedConfig(scope, ctx)
  if (validated) {
    const { config, warnings: configWarnings } = validated
    for (const w of configWarnings) {
      results.push({
        code: 'SCHEMA',
        severity: 'warning',
        message: w,
      })
    }
    // Schema structure is valid by virtue of loadValidatedConfig parsing.
    const servers = config.servers

    // Resolve targets for drift/state checks.
    const stateResult = loadState(scope, ctx)
    const state = stateResult.state
    const targets = await resolveTargetsAsync({ flag, state, ctx })

    // 2. Env check — every placeholder in env/headers/args/url; missing required var = error.
    const dotenvVars = readDotenv(scope, ctx).vars
    for (const [name, server] of Object.entries(servers)) {
      for (const field of placeholderFields(server)) {
        const phs = parsePlaceholders(field.value)
        for (const ph of phs) {
          const resolved = resolveVar(ph.name, {
            dotenv: dotenvVars,
            processEnv: ctx.env,
          })
          if (resolved.source === 'unset' && ph.fallback === undefined) {
            results.push({
              code: 'ENV',
              severity: 'error',
              message: `Required env var \`${ph.name}\` is not set (no fallback) for server \`${name}\` field \`${field.name}\``,
              agent: name,
              server: name,
              field: field.name,
            })
          }
        }
      }
    }

    // 3. Runtime check — stdio binaries.
    for (const server of Object.values(servers)) {
      if (server.transport !== 'stdio') continue
      const cmd = server.command
      if (isAbsolutePath(cmd)) {
        if (!existsSync(cmd) || !isExecutable(cmd)) {
          results.push({
            code: 'RUNTIME',
            severity: 'error',
            message: `Binary \`${cmd}\` does not exist or is not executable`,
          })
        }
      } else {
        const resolved = which(cmd, ctx.env)
        if (!resolved) {
          results.push({
            code: 'RUNTIME',
            severity: 'error',
            message: `Binary \`${cmd}\` not found in PATH`,
          })
        }
      }
    }

    // 4. Drift check — compile per adapter vs parsed on-disk entry.
    for (const agentId of targets) {
      const adapter = getAdapter(agentId)
      const nativePath = adapter.getConfigPath(scope, ctx)
      if (nativePath === null) continue
      const existing = readTextFile(nativePath)

      for (const [name, server] of Object.entries(servers)) {
        if (server.disabled) continue
        if (server.targets && !server.targets.includes(agentId)) continue
        const { entry } = adapter.compile(server)
        if (existing === null) {
          results.push({
            code: 'DRIFT',
            severity: 'warning',
            message: `Managed server \`${name}\` missing from ${nativePath}`,
            agent: agentId,
            server: name,
          })
          continue
        }
        const parsed = parseNativeEntry(existing, name)
        if (parsed === null) {
          results.push({
            code: 'DRIFT',
            severity: 'warning',
            message: `Managed server \`${name}\` missing from ${nativePath}`,
            agent: agentId,
            server: name,
          })
          continue
        }
        if (!deepEqual(normalizeEntry(entry), normalizeEntry(parsed))) {
          results.push({
            code: 'DRIFT',
            severity: 'warning',
            message: `Managed server \`${name}\` drifted on disk for ${agentId}`,
            agent: agentId,
            server: name,
          })
        }
      }
    }

    // 5. State check — corrupt state; targets pointing at unsupported scopes.
    for (const w of stateResult.warnings) {
      results.push({
        code: 'STATE',
        severity: 'error',
        message: w,
      })
    }
    for (const agentId of targets) {
      const adapter = getAdapter(agentId)
      if (adapter.getConfigPath(scope, ctx) === null) {
        results.push({
          code: 'STATE',
          severity: 'warning',
          message: `Target \`${agentId}\` does not support ${scope} scope`,
          agent: agentId,
        })
      }
    }

    // 6. Hygiene — .env tracked by Git; placeholders without fallback that resolve nowhere.
    const envPath =
      scope === 'project' ? `${ctx.cwd}/.env` : `${ctx.homeDir}/.agents/.env`
    if (isGitTracked(envPath)) {
      results.push({
        code: 'HYGIENE',
        severity: 'warning',
        message: `.env is tracked by Git; run \`git rm --cached .env\` to stop tracking it`,
      })
    }
    for (const [name, server] of Object.entries(servers)) {
      for (const field of placeholderFields(server)) {
        const phs = parsePlaceholders(field.value)
        for (const ph of phs) {
          const resolved = resolveVar(ph.name, {
            dotenv: dotenvVars,
            processEnv: ctx.env,
          })
          if (resolved.source === 'unset' && ph.fallback === undefined) {
            results.push({
              code: 'HYGIENE',
              severity: 'warning',
              message: `Placeholder \`${ph.raw}\` resolves nowhere for server \`${name}\` field \`${field.name}\``,
              agent: name,
              server: name,
              field: field.name,
            })
          }
        }
      }
    }
  } else {
    results.push({
      code: 'SCHEMA',
      severity: 'error',
      message: `No canonical config at ${configPath(scope, ctx)}. Run 'agents-mcp init' first.`,
    })
  }

  renderResults(ui, results, strict)

  const errors = results.filter((r) => r.severity === 'error').length
  const warnings = results.filter((r) => r.severity === 'warning').length
  return { errors, warnings, results }
}

/** Render results through the UI. */
function renderResults(
  ui: ReturnType<typeof createUiAndCtx>['ui'],
  results: DoctorResult[],
  strict: boolean,
): void {
  if (results.length === 0) {
    ui.note('doctor: no issues found')
    return
  }
  for (const r of results) {
    const prefix = r.severity === 'error' ? 'error' : 'warn'
    const parts = [r.code]
    if (r.server) parts.push(`\`${r.server}\``)
    if (r.field) parts.push(`\`${r.field}\``)
    ui[prefix](`${parts.join(' ')}: ${r.message}`)
  }
  const errs = results.filter((r) => r.severity === 'error').length
  const warns = results.filter((r) => r.severity === 'warning').length
  ui.note(
    `doctor: ${errs} error(s), ${warns} warning(s)${strict ? ' (strict mode)' : ''}`,
  )
}

/** Check if a path is absolute. */
function isAbsolutePath(p: string): boolean {
  return (
    p.startsWith('/') ||
    (process.platform === 'win32' && /^[a-zA-Z]:[\\/]/.test(p))
  )
}

/** Check if a file is executable. */
function isExecutable(p: string): boolean {
  try {
    if (process.platform === 'win32') return true
    const stat = existsSync(p) ? statSync(p) : null
    return Boolean(stat?.isFile() && (stat.mode & 0o111) !== 0)
  } catch {
    return false
  }
}

/** Resolve a command in PATH (respecting PATHEXT on Windows). */
function which(cmd: string, env: NodeJS.ProcessEnv): string | null {
  const pathEnv = env.PATH || env.Path || env.path || ''
  const pathExt =
    process.platform === 'win32'
      ? env.PATHEXT || env.Pathext || env.pathext || '.exe;.cmd;.bat;.ps1'
      : ''
  const exts = pathExt.split(';').filter(Boolean)

  for (const dir of pathEnv
    .split(process.platform === 'win32' ? ';' : ':')
    .filter(Boolean)) {
    const candidates =
      exts.length > 0
        ? exts.map((e) => join(dir, `${cmd}${e}`))
        : [join(dir, cmd)]
    for (const cand of candidates) {
      try {
        if (
          existsSync(cand) &&
          (process.platform === 'win32' || isExecutable(cand))
        ) {
          return cand
        }
      } catch {
        // ignore
      }
    }
  }
  return null
}

/** Fields that can contain placeholders. */
function placeholderFields(
  server: CanonicalServer,
): Array<{ name: string; value: string }> {
  const fields: Array<{ name: string; value: string }> = []
  if (server.transport === 'stdio') {
    fields.push({ name: 'command', value: server.command })
    for (const [i, arg] of (server.args ?? []).entries()) {
      fields.push({ name: `args[${i}]`, value: arg })
    }
    if (server.env) {
      for (const [k, v] of Object.entries(server.env)) {
        fields.push({ name: `env.${k}`, value: v })
      }
    }
  } else {
    fields.push({ name: 'url', value: server.url })
    if (server.headers) {
      for (const [k, v] of Object.entries(server.headers)) {
        fields.push({ name: `headers.${k}`, value: v })
      }
    }
  }
  return fields
}

/** Parse a native file entry for a server name (best-effort JSONC). */
function parseNativeEntry(
  content: string,
  name: string,
): Record<string, unknown> | null {
  try {
    const errors: { error: number; offset: number; length: number }[] = []
    const parsed = parse(content, errors) as Record<string, unknown>
    if (errors.length > 0) return null
    for (const [rootKey, rootVal] of Object.entries(parsed)) {
      if (rootVal && typeof rootVal === 'object' && !Array.isArray(rootVal)) {
        const obj = rootVal as Record<string, unknown>
        if (
          obj[name] &&
          typeof obj[name] === 'object' &&
          !Array.isArray(obj[name])
        ) {
          return obj[name] as Record<string, unknown>
        }
      }
    }
    return null
  } catch {
    return null
  }
}

/** Normalize an entry for drift comparison (strip formatting differences). */
function normalizeEntry(entry: unknown): unknown {
  if (entry === null || entry === undefined) return entry
  if (Array.isArray(entry)) return entry.map(normalizeEntry)
  if (typeof entry === 'object') {
    const normalized: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(entry as Record<string, unknown>)) {
      normalized[k] = normalizeEntry(v)
    }
    return normalized
  }
  return entry
}

/** Deep equality check. */
function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeEntry(a)) === JSON.stringify(normalizeEntry(b))
}

/** Check if .env is tracked by Git. */
function isGitTracked(filePath: string): boolean {
  try {
    const dir = dirname(filePath)
    const base = basename(filePath)
    execSync(['git', 'ls-files', '--error-unmatch', '--', base].join(' '), {
      cwd: dir,
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}

export const doctorCommand = defineCommand({
  meta: {
    name: 'doctor',
    description: 'Audit schema validity, env vars, runtime binaries, and drift',
  },
  args: {
    strict: {
      type: 'boolean',
      alias: 's',
      description: 'Promote warnings to errors (exit 1)',
    },
  },
  run: async ({ args }) => {
    const { ctx, ui } = createUiAndCtx({ yes: args.strict === true })
    const scope = (args.global ? 'global' : 'project') as ConfigScope
    const dryRun = isDryRun(args)

    const summary = await runDoctor({
      scope,
      ctx,
      flag: args.agents ? String(args.agents).split(',') : undefined,
      dryRun,
      strict: args.strict === true,
    })

    if (summary.errors > 0 || (summary.warnings > 0 && args.strict === true)) {
      process.exit(1)
    }
  },
})
