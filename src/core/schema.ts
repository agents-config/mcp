import { z } from 'zod'
import { DEFAULT_SCHEMA_URL } from '$/src/config'

export const AgentIdSchema = z.enum([
  'claude-code',
  'cursor',
  'vscode',
  'opencode',
  'windsurf',
  'zed',
])

/** Chaves de variável de ambiente reservadas pelo Agent Plugins MCP 1.0.0. */
const RESERVED_ENV_KEYS = ['PLUGIN_ROOT', 'PLUGIN_DATA']

/** Padrão de `cwd` permitido pelo Agent Plugins MCP 1.0.0. */
const CWD_PATTERN =
  /^(?:\.\/|\$\{PLUGIN_ROOT\}(?:\/|$)|\$\{PLUGIN_DATA\}(?:\/|$))/

export const StdioServerSchema = z.strictObject({
  type: z.literal('stdio'),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  env: z
    .record(z.string(), z.string())
    .optional()
    .refine(
      (env) =>
        !env ||
        Object.keys(env).every((key) => !RESERVED_ENV_KEYS.includes(key)),
      {
        message: `Reserved environment variable keys are not allowed: ${RESERVED_ENV_KEYS.join(', ')}`,
      },
    ),
  cwd: z.string().regex(CWD_PATTERN).optional(),
})

export const StreamableHttpServerSchema = z.strictObject({
  type: z.literal('streamable-http'),
  url: z.string().min(1),
  headers: z.record(z.string(), z.string()).optional(),
})

export const SseServerSchema = z.strictObject({
  type: z.literal('sse'),
  url: z.string().min(1),
  headers: z.record(z.string(), z.string()).optional(),
})

export const CanonicalServerSchema = z.discriminatedUnion('type', [
  StdioServerSchema,
  StreamableHttpServerSchema,
  SseServerSchema,
])

export const CanonicalMcpConfigSchema = z.strictObject({
  $schema: z.literal(DEFAULT_SCHEMA_URL),
  mcpServers: z.record(z.string(), CanonicalServerSchema),
})

export type CanonicalMcpConfig = z.infer<typeof CanonicalMcpConfigSchema>
export type CanonicalServer = z.infer<typeof CanonicalServerSchema>

export type StdioServer = z.infer<typeof StdioServerSchema>
export type StreamableHttpServer = z.infer<typeof StreamableHttpServerSchema>
export type SseServer = z.infer<typeof SseServerSchema>

/**
 * Type guards over the canonical `type` discriminator.
 */
export function isStdioServer(server: CanonicalServer): server is StdioServer {
  return server.type === 'stdio'
}

export function isHttpServer(
  server: CanonicalServer,
): server is StreamableHttpServer | SseServer {
  return server.type === 'streamable-http' || server.type === 'sse'
}

/**
 * Non-JSON-Schema checks that cannot be expressed in the generated Draft 2020-12
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
  } else {
    warnings.push(`Missing required \$schema; expected ${DEFAULT_SCHEMA_URL}`)
  }

  return { warnings }
}
