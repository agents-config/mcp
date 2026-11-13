import { describe, expect, it } from 'vitest'
import pkg from '$/package.json' with { type: 'json' }

describe('smoke test', () => {
  it('resolves root alias and package manifest', () => {
    expect(pkg.name).toBe('agents-mcp')
    expect(pkg.type).toBe('module')
  })
})
