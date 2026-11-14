import { describe, expect, it } from 'vitest'
import {
  detectAgents,
  resolveTargets,
  resolveTargetsAsync,
  validateAgentFlag,
  adapters,
} from '$/src/adapters/index'
import type { AgentId } from '$/src/adapters/types'
import { createRuntimeContext } from '$/src/core/context'

const ctx = createRuntimeContext({
  cwd: '/tmp/proj',
  homeDir: '/tmp/home',
  env: {},
  isTTY: false,
})

describe('adapters index', () => {
  it('validateAgentFlag accepts valid ids', () => {
    expect(validateAgentFlag(['claude-code'])).toEqual(['claude-code'])
    expect(validateAgentFlag(['cursor', 'vscode'])).toEqual([
      'cursor',
      'vscode',
    ])
  })

  it('validateAgentFlag throws on unknown ids', () => {
    expect(() => validateAgentFlag(['not-an-agent'])).toThrow(
      'Unknown agent id(s) in --agents: not-an-agent',
    )
  })

  it('resolveTargets uses flag first', () => {
    const state = {
      version: 1 as const,
      scope: 'project' as const,
      targets: [],
      agents: {},
    }
    expect(resolveTargets({ flag: ['cursor'], state, ctx })).toEqual(['cursor'])
  })

  it('resolveTargets falls back to state targets', () => {
    const state = {
      version: 1 as const,
      scope: 'project' as const,
      targets: ['vscode'] as AgentId[],
      agents: {},
    }
    expect(resolveTargets({ flag: undefined, state, ctx })).toEqual(['vscode'])
  })

  it('resolveTargets returns empty when nothing resolvable', () => {
    const state = {
      version: 1 as const,
      scope: 'project' as const,
      targets: [],
      agents: {},
    }
    expect(resolveTargets({ flag: undefined, state, ctx })).toEqual([])
  })

  it('resolveTargetsAsync falls back to detection', async () => {
    const state = {
      version: 1 as const,
      scope: 'project' as const,
      targets: [],
      agents: {},
    }
    const result = await resolveTargetsAsync({
      flag: undefined,
      state,
      ctx,
    })
    expect(Array.isArray(result)).toBe(true)
  })

  it('adapters has all six agents', () => {
    expect(adapters).toHaveLength(6)
    expect(adapters.map((a) => a.id)).toEqual([
      'claude-code',
      'cursor',
      'vscode',
      'opencode',
      'zed',
      'windsurf',
    ])
  })
})
