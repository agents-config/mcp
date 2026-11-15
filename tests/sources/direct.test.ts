import { describe, expect, it } from 'vitest'
import { resolveDirect } from '$/src/sources/direct'
import type { CanonicalServer } from '$/src/core/schema'
import { isStdioServer, isHttpServer } from '$/src/core/schema'

function asStdio(server: CanonicalServer) {
  return server as Extract<CanonicalServer, { type: 'stdio' }>
}

function asHttp(server: CanonicalServer) {
  return server as Extract<
    CanonicalServer,
    { type: 'streamable-http' } | { type: 'sse' }
  >
}

describe('sources direct', () => {
  it('parses --command with --arg', () => {
    const result = resolveDirect({
      command: 'npx',
      arg: ['-y', '@scope/pkg'],
    })
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', '@scope/pkg'])
  })

  it('parses --command with whitespace tokenization', () => {
    const result = resolveDirect({
      command: 'npx -y @scope/pkg',
    })
    const s = asStdio(result.definition)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', '@scope/pkg'])
  })

  it('parses --http as streamable-http', () => {
    const result = resolveDirect({
      http: 'https://mcp.linear.app/mcp',
    })
    const s = asHttp(result.definition)
    expect(isHttpServer(s)).toBe(true)
    expect(s.type).toBe('streamable-http')
    expect(s.url).toBe('https://mcp.linear.app/mcp')
  })

  it('parses --sse as sse', () => {
    const result = resolveDirect({
      sse: 'https://mcp.linear.app/sse',
    })
    const s = asHttp(result.definition)
    expect(isHttpServer(s)).toBe(true)
    expect(s.type).toBe('sse')
    expect(s.url).toBe('https://mcp.linear.app/sse')
  })

  it('parses --env KEY=VALUE', () => {
    const result = resolveDirect({
      command: 'npx',
      env: ['GITHUB_TOKEN=${GITHUB_TOKEN}'],
    })
    const s = asStdio(result.definition)
    expect(isStdioServer(s)).toBe(true)
    expect(s.env).toEqual({ GITHUB_TOKEN: '${GITHUB_TOKEN}' })
    expect(result.requiredEnv.map((v) => v.name)).toContain('GITHUB_TOKEN')
  })

  it('parses --header', () => {
    const result = resolveDirect({
      http: 'https://api.example.com/mcp',
      header: ['Authorization: Bearer token'],
    })
    const s = asHttp(result.definition)
    expect(isHttpServer(s)).toBe(true)
    expect(s.headers).toEqual({
      Authorization: 'Bearer token',
    })
  })

  it('suggests name from URL', () => {
    const result = resolveDirect({
      http: 'https://mcp.linear.app/mcp',
    })
    expect(result.suggestedName).toContain('linear')
  })

  it('suggests name from command', () => {
    const result = resolveDirect({
      command: 'npx -y @scope/pkg',
    })
    expect(result.suggestedName).toBe('npx')
  })
})
