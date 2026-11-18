import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  getPluginDir,
  compilePluginManifest,
  compilePluginMcpConfig,
  compileAntigravityMcpConfig,
  isUnmanagedPluginCollision,
  syncPluginFiles,
  readPluginManifest,
} from '$/src/core/plugins'
import { createRuntimeContext } from '$/src/core/context'
import type { CanonicalServer } from '$/src/core/schema'

const ctx = createRuntimeContext({
  cwd: '/tmp/agents-mcp-test/project',
  homeDir: '/tmp/agents-mcp-test/home',
  isTTY: false,
})

const stdioServer: CanonicalServer = {
  type: 'stdio',
  command: 'npx',
  args: ['-y', '@mcp/server'],
  env: { API_KEY: '${API_KEY}' },
}

const httpServer: CanonicalServer = {
  type: 'streamable-http',
  url: 'https://example.com/mcp',
  headers: { Authorization: 'Bearer ${TOKEN}' },
}

const sseServer: CanonicalServer = {
  type: 'sse',
  url: 'https://example.com/sse',
}

describe('plugins.getPluginDir', () => {
  it('constroi o caminho do plugin em project scope', () => {
    expect(getPluginDir('project', ctx, 'github')).toBe(
      '/tmp/agents-mcp-test/project/.agents/plugins/github',
    )
  })

  it('constroi o caminho do plugin em global scope', () => {
    expect(getPluginDir('global', ctx, 'github')).toBe(
      '/tmp/agents-mcp-test/home/.agents/plugins/github',
    )
  })
})

describe('plugins.compilePluginManifest', () => {
  it('gera manifest com name, version e description', () => {
    const manifest = compilePluginManifest('github')
    expect(manifest).toEqual({
      name: 'github',
      version: '1.0.0',
      description: 'MCP server plugin `github` managed by agents-mcp',
    })
  })
})

describe('plugins.compilePluginMcpConfig', () => {
  it('gera mcp.json no formato Agent Plugins 1.0.0', () => {
    const config = compilePluginMcpConfig('github', stdioServer)
    expect(config.$schema).toBe(
      'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
    )
    expect(config.mcpServers).toEqual({ github: stdioServer })
  })
})

describe('plugins.compileAntigravityMcpConfig', () => {
  it('mapeia stdio para { command, args, env }', () => {
    const config = compileAntigravityMcpConfig('local', stdioServer)
    expect((config.mcpServers as Record<string, unknown>).local).toEqual({
      command: 'npx',
      args: ['-y', '@mcp/server'],
      env: { API_KEY: '${API_KEY}' },
    })
  })

  it('mapeia streamable-http para { serverUrl, headers }', () => {
    const config = compileAntigravityMcpConfig('remote', httpServer)
    expect((config.mcpServers as Record<string, unknown>).remote).toEqual({
      serverUrl: 'https://example.com/mcp',
      headers: { Authorization: 'Bearer ${TOKEN}' },
    })
  })

  it('mapeia sse para { serverUrl }', () => {
    const config = compileAntigravityMcpConfig('remote', sseServer)
    expect((config.mcpServers as Record<string, unknown>).remote).toEqual({
      serverUrl: 'https://example.com/sse',
    })
  })

  it('omite args/env quando vazios para stdio', () => {
    const minimal: CanonicalServer = {
      type: 'stdio',
      command: 'node',
      args: [],
    }
    const config = compileAntigravityMcpConfig('local', minimal)
    expect((config.mcpServers as Record<string, unknown>).local).toEqual({
      command: 'node',
    })
  })

  it('omite headers quando vazios para HTTP', () => {
    const noHeaders: CanonicalServer = {
      type: 'streamable-http',
      url: 'https://example.com/mcp',
    }
    const config = compileAntigravityMcpConfig('remote', noHeaders)
    expect((config.mcpServers as Record<string, unknown>).remote).toEqual({
      serverUrl: 'https://example.com/mcp',
    })
  })
})

describe('plugins.isUnmanagedPluginCollision', () => {
  it('retorna false quando o nome esta gerenciado (mesmo com dir existente)', () => {
    expect(
      isUnmanagedPluginCollision('project', ctx, 'managed', ['managed']),
    ).toBe(false)
  })

  it('retorna false quando o dir nao existe', () => {
    expect(isUnmanagedPluginCollision('project', ctx, 'nonexistent', [])).toBe(
      false,
    )
  })
})

describe('plugins.syncPluginFiles', () => {
  it('grava plugin.json e mcp.json (sem antigravity)', () => {
    const result = syncPluginFiles({
      name: 'github',
      server: stdioServer,
      scope: 'project',
      ctx,
      includeAntigravity: false,
      dryRun: false,
    })
    expect(result.ok).toBe(true)
    expect(result.written).toHaveLength(2)
    expect(result.errors).toEqual([])
  })

  it('grava tambem mcp_config.json quando includeAntigravity true', () => {
    const result = syncPluginFiles({
      name: 'remote',
      server: httpServer,
      scope: 'project',
      ctx,
      includeAntigravity: true,
      dryRun: false,
    })
    expect(result.ok).toBe(true)
    expect(result.written).toHaveLength(3)
    expect(result.written).toContain(
      '/tmp/agents-mcp-test/project/.agents/plugins/remote/mcp_config.json',
    )
  })

  it('nao grava nada em dry-run', () => {
    const result = syncPluginFiles({
      name: 'github',
      server: stdioServer,
      scope: 'project',
      ctx,
      includeAntigravity: false,
      dryRun: true,
    })
    expect(result.ok).toBe(true)
    expect(result.written).toHaveLength(2)
    expect(result.errors).toEqual([])
  })

  it('idempotente: regravacao produz o mesmo conteudo', () => {
    syncPluginFiles({
      name: 'idem',
      server: stdioServer,
      scope: 'project',
      ctx,
      includeAntigravity: false,
      dryRun: false,
    })
    const first = readPluginManifest('project', ctx, 'idem')
    syncPluginFiles({
      name: 'idem',
      server: stdioServer,
      scope: 'project',
      ctx,
      includeAntigravity: false,
      dryRun: false,
    })
    const second = readPluginManifest('project', ctx, 'idem')
    expect(first).toBe(second)
  })

  it('mcp.json contem $schema e mcpServers', () => {
    syncPluginFiles({
      name: 'schema-check',
      server: stdioServer,
      scope: 'project',
      ctx,
      includeAntigravity: false,
      dryRun: false,
    })
    const mcpPath = getPluginDir('project', ctx, 'schema-check') + '/mcp.json'
    const content = readFileSync(mcpPath, 'utf8')
    const parsed = JSON.parse(content)
    expect(parsed.$schema).toBe(
      'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
    )
    expect(parsed.mcpServers['schema-check']).toEqual(stdioServer)
  })
})
