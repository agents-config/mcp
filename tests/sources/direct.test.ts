import { describe, expect, it } from 'vitest'
import { resolveDirect } from '$/src/sources/direct'
import type { CanonicalServer } from '$/src/core/schema'

function asStdio(server: CanonicalServer) {
  return server as Extract<CanonicalServer, { transport: 'stdio' }>
}

function asHttp(server: CanonicalServer) {
  return server as Extract<CanonicalServer, { transport: 'http' }>
}

describe('sources direct', () => {
  it('parses --stdio with --arg', () => {
    const result = resolveDirect({
      stdio: 'npx',
      arg: ['-y', '@scope/pkg'],
    })
    const s = asStdio(result.definition)
    expect(s.transport).toBe('stdio')
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', '@scope/pkg'])
  })

  it('parses --stdio with whitespace tokenization', () => {
    const result = resolveDirect({
      stdio: 'npx -y @scope/pkg',
    })
    const s = asStdio(result.definition)
    expect(s.command).toBe('npx')
    expect(s.args).toEqual(['-y', '@scope/pkg'])
  })

  it('parses --http', () => {
    const result = resolveDirect({
      http: 'https://mcp.linear.app/mcp',
    })
    const s = asHttp(result.definition)
    expect(s.transport).toBe('http')
    expect(s.url).toBe('https://mcp.linear.app/mcp')
  })

  it('parses --env KEY=VALUE', () => {
    const result = resolveDirect({
      stdio: 'npx',
      env: ['GITHUB_TOKEN=${GITHUB_TOKEN}'],
    })
    const s = asStdio(result.definition)
    expect(s.env).toEqual({ GITHUB_TOKEN: '${GITHUB_TOKEN}' })
    expect(result.requiredEnv.map((v) => v.name)).toContain('GITHUB_TOKEN')
  })

  it('parses --header', () => {
    const result = resolveDirect({
      http: 'https://api.example.com/mcp',
      header: ['Authorization: Bearer token'],
    })
    const s = asHttp(result.definition)
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
      stdio: 'npx -y @scope/pkg',
    })
    expect(result.suggestedName).toBe('npx')
  })
})
