import { z } from 'zod'
import { DEFAULT_SCHEMA_URL, SERVER_NAME_PATTERN } from '$/src/config'

export const AgentIdSchema = z.enum([
  'claude-code',
  'cursor',
  'vscode',
  'opencode',
  'windsurf',
  'zed',
])

const commonFields = {
  disabled: z.boolean().optional(),
  targets: z.array(AgentIdSchema).min(1).optional(),
}

export const StdioServerSchema = z.strictObject({
  transport: z.literal('stdio'),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  env: z.record(z.string(), z.string()).optional(),
  cwd: z.string().min(1).optional(),
  ...commonFields,
})

export const HttpServerSchema = z.strictObject({
  transport: z.literal('http'),
  url: z.url(),
  headers: z.record(z.string(), z.string()).optional(),
  ...commonFields,
})

export const CanonicalServerSchema = z.discriminatedUnion('transport', [
  StdioServerSchema,
  HttpServerSchema,
])

export const CanonicalMcpConfigSchema = z.strictObject({
  $schema: z.url(),
  servers: z.record(
    z.string().regex(SERVER_NAME_PATTERN),
    CanonicalServerSchema,
  ),
})

export type CanonicalMcpConfig = z.infer<typeof CanonicalMcpConfigSchema>
export type CanonicalServer = z.infer<typeof CanonicalServerSchema>

/**
 * Non-JSON-Schema checks that cannot be expressed in the generated Draft-07
 * document. Never fails; returns warnings only.
 */
export function validateConfig(config: unknown): { warnings: string[] } {
  const warnings: string[] = []

  if (typeof config === 'object' && config !== null && '$schema' in config) {
    const schemaUrl = (config as { $schema?: unknown }).$schema
    if (typeof schemaUrl !== 'string' || schemaUrl !== DEFAULT_SCHEMA_URL) {
      warnings.push(
        `$schema mismatch: expected ${DEFAULT_SCHEMA_URL}, got ${String(schemaUrl)}`,
      )
    }
  }

  return { warnings }
}
