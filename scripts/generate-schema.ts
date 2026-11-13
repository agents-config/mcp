import { writeFileSync, readFileSync } from 'node:fs'
import { z } from 'zod'
import { CanonicalMcpConfigSchema } from '$/src/core/schema'
import { DEFAULT_SCHEMA_URL } from '$/src/config'

const generated = z.toJSONSchema(CanonicalMcpConfigSchema, {
  target: 'draft-7',
  io: 'input',
})

const document = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: DEFAULT_SCHEMA_URL,
  title: 'Unified Agents MCP Configuration',
  description: 'Canonical MCP server configuration for AI coding agents.',
  ...generated,
}

const expected = JSON.stringify(document, null, 2) + '\n'
const target = 'spec/mcp.schema.json'

if (process.argv.includes('--check')) {
  let current = ''
  try {
    current = readFileSync(target, 'utf8')
  } catch {
    current = ''
  }
  if (current === expected) {
    console.log(`✅ ${target} is up to date`)
    process.exit(0)
  }
  console.error(`❌ ${target} drift; run "npm run schema:gen" to regenerate it`)
  process.exit(1)
}

writeFileSync(target, expected)
console.log(`✅ ${target} written ($id: ${DEFAULT_SCHEMA_URL})`)
