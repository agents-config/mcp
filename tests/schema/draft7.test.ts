import { describe, expect, it } from 'vitest'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import pkg from '$/package.json' with { type: 'json' }
import { readFileSync } from 'node:fs'

const schemaDoc = JSON.parse(
  readFileSync('spec/mcp.schema.json', 'utf8'),
) as Record<string, unknown>

const ajv = new Ajv({ strict: false })
addFormats(ajv)
const validate = ajv.compile(schemaDoc)

const loadFixture = (name: string) =>
  JSON.parse(readFileSync(`tests/fixtures/schema/${name}.json`, 'utf8'))

describe('generated schema is Draft-07', () => {
  it('declares Draft-07 and additionalProperties: false at the top level', () => {
    expect(schemaDoc.$schema).toBe('http://json-schema.org/draft-07/schema#')
    expect(schemaDoc.additionalProperties).toBe(false)
  })

  it('$id version segment is derived from package.json', () => {
    expect(schemaDoc.$id).toBe(
      `https://agents-mcp.dev/schema/v${pkg.version}/mcp.schema.json`,
    )
    expect(schemaDoc.$id).not.toContain('/schema/v0.1.0/')
  })

  it('accepts a valid fixture', () => {
    const valid = loadFixture('valid')
    expect(validate(valid)).toBe(true)
    expect(validate.errors).toBeNull()
  })

  it('rejects an unknown top-level/server key', () => {
    expect(validate(loadFixture('invalid-unknown-key'))).toBe(false)
    expect(validate.errors!.length).toBeGreaterThan(0)
  })

  it('rejects an unsupported transport value', () => {
    expect(validate(loadFixture('invalid-transport'))).toBe(false)
    expect(validate.errors!.length).toBeGreaterThan(0)
  })

  it('rejects an invalid server name', () => {
    expect(validate(loadFixture('invalid-server-name'))).toBe(false)
    expect(validate.errors!.length).toBeGreaterThan(0)
  })

  it('rejects http without url', () => {
    expect(validate(loadFixture('invalid-missing-url'))).toBe(false)
    expect(validate.errors!.length).toBeGreaterThan(0)
  })

  it('rejects stdio without command', () => {
    expect(validate(loadFixture('invalid-missing-command'))).toBe(false)
    expect(validate.errors!.length).toBeGreaterThan(0)
  })
})
