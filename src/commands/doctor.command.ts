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
 *   6. Hygiene — `.env` tracked by Git; literal/plaintext secret findings
 *
 * Exit `1` if any error; `0` if only warnings; `--strict` makes warnings fatal.
 */

import { defineCommand } from 'citty'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'jsonc-parser'
import {
  createUiAndCtx,
  configPath,
  isDryRun,
  isGlobalFlag,
  isYesFlag,
  parseAgentsFlag,
} from '$/src/commands/util'
import { resolveTargetsAsync, getAdapter } from '$/src/adapters/index'
import { loadValidatedConfig, ConfigValidationError } from '$/src/core/store'
import type { LoadValidatedConfigResult } from '$/src/core/store'
import { loadState } from '$/src/core/state'
import { parsePlaceholders, SECRET_KEY_RE } from '$/src/core/placeholder'
import { readDotenv, resolveVar } from '$/src/core/env'
import { readTextFile } from '$/src/core/fs-atomic'
import { isGitTracked } from '$/src/core/gitignore'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer } from '$/src/core/schema'

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

  // 1. Schema check — wrap loadValidatedConfig in try/catch so an invalid
  //    .agents/mcp.json yields a structured SCHEMA error instead of crashing.
  let validated: LoadValidatedConfigResult | undefined
  try {
    const result = loadValidatedConfig(scope, ctx)
    if (result) {
      validated = result
    }
  } catch (err) {
    if (err instanceof ConfigValidationError) {
      results.push({
        code: 'SCHEMA',
        severity: 'error',
        message: `Invalid canonical config at ${configPath(scope, ctx)}: ${err.issues
          .map((i) => `${i.path || 'root'} — ${i.message}`)
          .join('; ')}`,
      })
      renderResults(ui, results, strict)
      const errors = results.filter((r) => r.severity === 'error').length
      const warnings = results.filter((r) => r.severity === 'warning').length
      return { errors, warnings, results }
    }
    throw err
  }

  if (!validated) {
    results.push({
      code: 'SCHEMA',
      severity: 'error',
      message: `No canonical config at ${configPath(scope, ctx)}. Run 'agents-mcp init' first.`,
    })
    renderResults(ui, results, strict)
    const errors = results.filter((r) => r.severity === 'error').length
    const warnings = results.filter((r) => r.severity === 'warning').length
    return { errors, warnings, results }
  }

  const { config, warnings: configWarnings } = validated
  for (const w of configWarnings) {
    results.push({
      code: 'SCHEMA',
      severity: 'warning',
      message: w,
    })
  }
  // Schema structure is valid by virtue of loadValidatedConfig parsing.
  const servers = config.mcpServers

  // Resolve targets for drift/state checks.
  const stateResult = loadState(scope, ctx)
  const state = stateResult.state
  const targets = await resolveTargetsAsync({ flag, state, ctx })

  // 2. Env check — every placeholder in env/headers/args/url; missing required
  //    var without fallback = error, reported once under ENV (not duplicated
  //    under HYGIENE). Never assign server name to result.agent.
  const dotenvVars = readDotenv(scope, ctx).vars
  const reportedEnvVars = new Set<string>()
  for (const [name, server] of Object.entries(servers)) {
    for (const field of placeholderFields(server)) {
      const phs = parsePlaceholders(field.value)
      for (const ph of phs) {
        const resolved = resolveVar(ph.name, {
          dotenv: dotenvVars,
          processEnv: ctx.env,
        })
        if (resolved.source === 'unset' && ph.fallback === undefined) {
          const key = `${name}::${field.name}::${ph.name}`
          if (reportedEnvVars.has(key)) continue
          reportedEnvVars.add(key)
          results.push({
            code: 'ENV',
            severity: 'error',
            message: `Required env var \`${ph.name}\` is not set (no fallback) for server \`${name}\` field \`${field.name}\``,
            server: name,
            field: field.name,
          })
        }
      }
    }
  }

  // 3. Runtime check — stdio binaries.
  for (const server of Object.values(servers)) {
    if (!isStdioServer(server)) continue
    const cmd = server.command
    if (isAbsolutePath(cmd, ctx.platform)) {
      if (!existsSync(cmd) || !isExecutable(cmd, ctx.platform)) {
        results.push({
          code: 'RUNTIME',
          severity: 'error',
          message: `Binary \`${cmd}\` does not exist or is not executable`,
        })
      }
    } else {
      const resolved = which(cmd, ctx.env, ctx.platform)
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

    // (a) Extra/orphan managed server names on disk in native files.
    const onDiskNames = new Set<string>()
    if (existing !== null) {
      const parsed = parseNativeEntryWhole(
        existing,
        adapter.capabilities.rootKey,
      )
      if (parsed !== null) {
        for (const name of Object.keys(parsed)) {
          onDiskNames.add(name)
        }
      }
    }
    const canonicalNames = new Set(Object.keys(servers))
    for (const diskName of onDiskNames) {
      if (!canonicalNames.has(diskName)) {
        results.push({
          code: 'DRIFT',
          severity: 'warning',
          message: `Orphan server \`${diskName}\` on disk in ${nativePath} but not in canonical config`,
          agent: agentId,
          server: diskName,
        })
      }
    }

    for (const [name, server] of Object.entries(servers)) {
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
      const parsed = parseNativeEntry(
        existing,
        name,
        adapter.capabilities.rootKey,
      )
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

    // (b) Plugin files in .agents/plugins/<name>/ for canonical servers.
    const base = scope === 'project' ? ctx.cwd : ctx.homeDir
    const pluginsDir = join(base, '.agents', 'plugins')
    const includeAntigravity =
      adapter.capabilities.layout === 'per-plugin' || agentId === 'antigravity'
    for (const name of canonicalNames) {
      const pluginDir = join(pluginsDir, name)
      const pluginJson = join(pluginDir, 'plugin.json')
      const mcpJson = join(pluginDir, 'mcp.json')
      const mcpConfigJson = join(pluginDir, 'mcp_config.json')

      let missing: string[] = []
      if (!existsSync(pluginJson)) missing.push('plugin.json')
      if (!existsSync(mcpJson)) missing.push('mcp.json')
      if (includeAntigravity && !existsSync(mcpConfigJson)) {
        missing.push('mcp_config.json')
      }

      if (missing.length > 0) {
        results.push({
          code: 'DRIFT',
          severity: 'warning',
          message: `Plugin \`${name}\` missing ${missing.join(', ')} in ${pluginDir}`,
          agent: agentId,
          server: name,
        })
      }
    }
  }

  // 5. State check — corrupt state; targets pointing at unsupported scopes.
  //    Gate on `adapter.capabilities.scopes.includes(scope)` so antigravity
  //    (per-plugin layout, no single config path) is not a false positive.
  for (const w of stateResult.warnings) {
    results.push({
      code: 'STATE',
      severity: 'error',
      message: w,
    })
  }
  for (const agentId of targets) {
    const adapter = getAdapter(agentId)
    if (!adapter.capabilities.scopes.includes(scope)) {
      results.push({
        code: 'STATE',
        severity: 'warning',
        message: `Target \`${agentId}\` does not support ${scope} scope`,
        agent: agentId,
      })
    }
  }

  // 6. Hygiene — .env tracked by Git; literal/plaintext secret findings.
  //    Missing env vars are reported only under ENV (check #2), never here.
  if (isGitTracked(ctx.cwd, '.env')) {
    results.push({
      code: 'HYGIENE',
      severity: 'warning',
      message: `.env is tracked by Git; run \`git rm --cached .env\` to stop tracking it`,
    })
  }
  for (const [name, server] of Object.entries(servers)) {
    for (const field of placeholderFields(server)) {
      const phs = parsePlaceholders(field.value)
      // A literal (non-placeholder) value under a secret-like key is a
      // plaintext secret finding: it should use \`${VAR}\` instead.
      if (phs.length === 0 && SECRET_KEY_RE.test(field.name)) {
        results.push({
          code: 'HYGIENE',
          severity: 'warning',
          message: `Plaintext secret in server \`${name}\` field \`${field.name}\`: use \${VAR} instead of a literal value`,
          server: name,
          field: field.name,
        })
      }
    }
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
function isAbsolutePath(p: string, platform: NodeJS.Platform): boolean {
  return (
    p.startsWith('/') || (platform === 'win32' && /^[a-zA-Z]:[\\/]/.test(p))
  )
}

/** Check if a file is executable. */
function isExecutable(p: string, platform: NodeJS.Platform): boolean {
  try {
    if (platform === 'win32') return true
    const stat = existsSync(p) ? statSync(p) : null
    return Boolean(stat?.isFile() && (stat.mode & 0o111) !== 0)
  } catch {
    return false
  }
}

/** Resolve a command in PATH (respecting PATHEXT on Windows). */
function which(
  cmd: string,
  env: NodeJS.ProcessEnv,
  platform: NodeJS.Platform,
): string | null {
  const pathEnv = env.PATH || env.Path || env.path || ''
  const pathExt =
    platform === 'win32'
      ? env.PATHEXT || env.Pathext || env.pathext || '.exe;.cmd;.bat;.ps1'
      : ''
  const exts = pathExt.split(';').filter(Boolean)

  for (const dir of pathEnv
    .split(platform === 'win32' ? ';' : ':')
    .filter(Boolean)) {
    const candidates =
      exts.length > 0
        ? exts.map((e) => join(dir, `${cmd}${e}`))
        : [join(dir, cmd)]
    for (const cand of candidates) {
      try {
        if (
          existsSync(cand) &&
          (platform === 'win32' || isExecutable(cand, platform))
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
  if (isStdioServer(server)) {
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

/** Parse the whole native file object under `rootKey` (best-effort JSONC). */
function parseNativeEntryWhole(
  content: string,
  rootKey: string | undefined,
): Record<string, unknown> | null {
  if (!rootKey) return null
  try {
    const errors: { error: number; offset: number; length: number }[] = []
    const parsed = parse(content, errors) as Record<string, unknown>
    if (errors.length > 0) return null
    const rootVal = parsed[rootKey]
    if (rootVal && typeof rootVal === 'object' && !Array.isArray(rootVal)) {
      return rootVal as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}

/** Parse a native file entry for a server name under `rootKey` only. */
function parseNativeEntry(
  content: string,
  name: string,
  rootKey: string | undefined,
): Record<string, unknown> | null {
  if (!rootKey) return null
  const whole = parseNativeEntryWhole(content, rootKey)
  if (!whole) return null
  const entry = whole[name]
  if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
    return entry as Record<string, unknown>
  }
  return null
}

/** Normalize an entry for drift comparison (strip formatting differences, sort keys). */
function normalizeEntry(entry: unknown): unknown {
  if (entry === null || entry === undefined) return entry
  if (Array.isArray(entry)) return entry.map(normalizeEntry)
  if (typeof entry === 'object') {
    const normalized: Record<string, unknown> = {}
    const keys = Object.keys(entry as Record<string, unknown>).sort()
    for (const k of keys) {
      normalized[k] = normalizeEntry((entry as Record<string, unknown>)[k])
    }
    return normalized
  }
  return entry
}

/** Deep equality check (key-order invariant via sorted-key normalization). */
function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeEntry(a)) === JSON.stringify(normalizeEntry(b))
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
    global: {
      type: 'boolean',
      alias: 'g',
      description: 'Operate on the global agent configuration',
    },
    agents: {
      type: 'string',
      description:
        'Comma-separated target agents (e.g. claude-code,antigravity)',
    },
  },
  run: async ({ args, rawArgs }) => {
    const { ctx, ui } = createUiAndCtx({ yes: isYesFlag(args) })
    const scope = (isGlobalFlag(args) ? 'global' : 'project') as ConfigScope
    const dryRun = isDryRun(args)
    const flag = parseAgentsFlag(args as Record<string, unknown>, rawArgs)

    const summary = await runDoctor({
      scope,
      ctx,
      flag,
      dryRun,
      strict: args.strict === true,
    })

    if (summary.errors > 0 || (summary.warnings > 0 && args.strict === true)) {
      process.exit(1)
    }
  },
})
