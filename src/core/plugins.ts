/**
 * Plugin compiler + writer (`B3`).
 *
 * Generates the standard Agent Plugins layout under
 * `<scopeBase>/.agents/plugins/<name>/`:
 *   - `plugin.json`            — plugin manifest (name, version, description)
 *   - `mcp.json`               — Agent Plugins MCP 1.0.0 document
 *   - `mcp_config.json`        — Antigravity config (only when `antigravity` targeted)
 *
 * All compile functions are pure; `syncPluginFiles` owns filesystem I/O and
 * returns a structured result so the command layer can report partial failures
 * without printing a false full-success message.
 */

import { join } from 'node:path'
import { existsSync, readdirSync, rmdirSync, unlinkSync } from 'node:fs'
import { writeFileAtomic, readTextFile } from '$/src/core/fs-atomic'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'
import { DEFAULT_SCHEMA_URL, AGENTS_DIR } from '$/src/config'
import type { ConfigScope, RuntimeContext } from '$/src/core/context'

/** Plugin directory for a given server name under the scope base. */
export function getPluginDir(
  scope: ConfigScope,
  ctx: RuntimeContext,
  name: string,
): string {
  const base = scope === 'project' ? ctx.cwd : ctx.homeDir
  return join(base, AGENTS_DIR, 'plugins', name)
}

/** `plugin.json` manifest (Agent Plugins 1.0.0). */
export function compilePluginManifest(name: string): Record<string, unknown> {
  return {
    name,
    version: '1.0.0',
    description: `MCP server plugin \`${name}\` managed by agents-mcp`,
  }
}

/** `mcp.json` — Agent Plugins MCP 1.0.0 document. */
export function compilePluginMcpConfig(
  name: string,
  server: CanonicalServer,
): Record<string, unknown> {
  return {
    $schema: DEFAULT_SCHEMA_URL,
    mcpServers: {
      [name]: server,
    },
  }
}

/**
 * `mcp_config.json` for Antigravity.
 *
 * - stdio  → `{ command, args?, env? }`
 * - streamable-http / sse → `{ serverUrl, headers? }`
 */
export function compileAntigravityMcpConfig(
  name: string,
  server: CanonicalServer,
): Record<string, unknown> {
  if (isStdioServer(server)) {
    const entry: Record<string, unknown> = {
      command: server.command,
    }
    if (server.args && server.args.length > 0) {
      entry.args = [...server.args]
    }
    if (server.env && Object.keys(server.env).length > 0) {
      entry.env = { ...server.env }
    }
    return { mcpServers: { [name]: entry } }
  }

  // HTTP/SSE transports use `serverUrl` per Antigravity's mcp_config.json format.
  const entry: Record<string, unknown> = {
    serverUrl: server.url,
  }
  if (server.headers && Object.keys(server.headers).length > 0) {
    entry.headers = { ...server.headers }
  }
  return { mcpServers: { [name]: entry } }
}

/** Resultado estruturado da gravação de arquivos de plugin. */
export interface PluginWriteResult {
  ok: boolean
  /** Caminhos gravados com sucesso. */
  written: string[]
  /** Mensagens de erro (um por falha). */
  errors: string[]
}

/**
 * Verifica colisão com plugin não gerenciado: o diretório já existe em disco
 * e o nome **não** está registrado como gerenciado no `SyncState`.
 */
export function isUnmanagedPluginCollision(
  scope: ConfigScope,
  ctx: RuntimeContext,
  name: string,
  managedPlugins: readonly string[],
): boolean {
  if (managedPlugins.includes(name)) {
    return false
  }
  return existsSync(getPluginDir(scope, ctx, name))
}

/**
 * Escreve (ou reescreve, quando já gerenciado) os arquivos de plugin para um
 * servidor. Retorna `PluginWriteResult` com `ok: false` quando alguma gravação
 * falha; nunca lança exceção (erros de I/O são capturados e reportados).
 *
 * Respeita `--dry-run`: não cria nem modifica nada quando `dryRun === true`.
 */
export function syncPluginFiles({
  name,
  server,
  scope,
  ctx,
  includeAntigravity,
  dryRun,
}: {
  name: string
  server: CanonicalServer
  scope: ConfigScope
  ctx: RuntimeContext
  includeAntigravity: boolean
  dryRun: boolean
}): PluginWriteResult {
  const result: PluginWriteResult = { ok: true, written: [], errors: [] }

  const dir = getPluginDir(scope, ctx, name)
  const files: Array<{ path: string; content: string }> = [
    {
      path: join(dir, 'plugin.json'),
      content: JSON.stringify(compilePluginManifest(name), null, 2) + '\n',
    },
    {
      path: join(dir, 'mcp.json'),
      content:
        JSON.stringify(compilePluginMcpConfig(name, server), null, 2) + '\n',
    },
  ]

  if (includeAntigravity) {
    files.push({
      path: join(dir, 'mcp_config.json'),
      content:
        JSON.stringify(compileAntigravityMcpConfig(name, server), null, 2) +
        '\n',
    })
  }

  if (dryRun) {
    result.written = files.map((f) => f.path)
    return result
  }

  for (const file of files) {
    try {
      writeFileAtomic(file.path, file.content)
      result.written.push(file.path)
    } catch (err) {
      result.ok = false
      result.errors.push(
        `Falha ao gravar ${file.path}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      )
    }
  }

  return result
}

/**
 * Resultado de remocao de arquivos de plugin gerenciados.
 */
export interface PluginRemovalResult {
  ok: boolean
  /** Caminhos de arquivos removidos (ou que seriam removidos em dry-run). */
  removed: string[]
  /** Mensagens de erro (um por falha de I/O). */
  errors: string[]
}

/** Arquivos de plugin gerenciados pela CLI, os unicos passiveis de remocao. */
export const MANAGED_PLUGIN_FILES = [
  'plugin.json',
  'mcp.json',
  'mcp_config.json',
] as const

/**
 * Remove apenas os arquivos de plugin gerenciados (`plugin.json`, `mcp.json`,
 * `mcp_config.json`) existentes no diretorio do plugin, protegendo nomes que
 * nao estao registrados em `managedPlugins` (no-op absoluto sem tocar no disco).
 *
 * Depois de remover os arquivos alvo, remove o diretorio somente se ficar vazio
 * (`rmdirSync` nao recursivo). Arquivos extras ou subdiretorios preservam o
 * diretorio. Arquivos ausentes sao ignorados (idempotencia).
 *
 * Respeita `--dry-run`: nenhum I/O de escrita/remocao; `removed` lista apenas
 * caminhos existentes que seriam removidos.
 *
 * Erros de I/O sao capturados por arquivo, acumulados em `errors` no formato
 * `Falha ao remover <caminho>: <mensagem>` e sinalizados com `ok: false`;
 * nunca lança excecao.
 */
export function removeManagedPlugin({
  scope,
  ctx,
  name,
  managedPlugins,
  dryRun,
}: {
  scope: ConfigScope
  ctx: RuntimeContext
  name: string
  managedPlugins: readonly string[]
  dryRun: boolean
}): PluginRemovalResult {
  const result: PluginRemovalResult = { ok: true, removed: [], errors: [] }

  // Protecao absoluta: plugins nao gerenciados nunca sao tocados.
  if (!managedPlugins.includes(name)) {
    return result
  }

  const dir = getPluginDir(scope, ctx, name)

  for (const file of MANAGED_PLUGIN_FILES) {
    const path = join(dir, file)
    if (!existsSync(path)) {
      continue
    }
    if (dryRun) {
      result.removed.push(path)
      continue
    }
    try {
      unlinkSync(path)
      result.removed.push(path)
    } catch (err) {
      result.ok = false
      result.errors.push(
        `Falha ao remover ${path}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      )
    }
  }

  if (!dryRun && existsSync(dir)) {
    try {
      if (readdirSync(dir).length === 0) {
        rmdirSync(dir)
      }
    } catch (err) {
      result.ok = false
      result.errors.push(
        `Falha ao remover ${dir}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      )
    }
  }

  return result
}

/**
 * Remove apenas o `mcp_config.json` (Antigravity) de um plugin gerenciado,
 * sem nunca remover `plugin.json`/`mcp.json` nem o diretorio. Mesma semântica
 * de propriedade e erro de `removeManagedPlugin`.
 */
export function removeAntigravityPluginConfig({
  scope,
  ctx,
  name,
  managedPlugins,
  dryRun,
}: {
  scope: ConfigScope
  ctx: RuntimeContext
  name: string
  managedPlugins: readonly string[]
  dryRun: boolean
}): PluginRemovalResult {
  const result: PluginRemovalResult = { ok: true, removed: [], errors: [] }

  // Protecao absoluta: plugins nao gerenciados nunca sao tocados.
  if (!managedPlugins.includes(name)) {
    return result
  }

  const path = join(getPluginDir(scope, ctx, name), 'mcp_config.json')
  if (!existsSync(path)) {
    return result
  }

  if (dryRun) {
    result.removed.push(path)
    return result
  }

  try {
    unlinkSync(path)
    result.removed.push(path)
  } catch (err) {
    result.ok = false
    result.errors.push(
      `Falha ao remover ${path}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    )
  }

  return result
}

/** Lê o conteúdo existente de `plugin.json` (null quando ausente). */
export function readPluginManifest(
  scope: ConfigScope,
  ctx: RuntimeContext,
  name: string,
): string | null {
  return readTextFile(join(getPluginDir(scope, ctx, name), 'plugin.json'))
}
