export const AGENT_PLUGINS_MCP_SCHEMA_URL =
  'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'
export const AGENT_PLUGINS_MCP_SPEC_URL =
  'https://agent-plugins.org/plugin-authors/mcp-servers'
export const DEFAULT_SCHEMA_URL = AGENT_PLUGINS_MCP_SCHEMA_URL
export const SCHEMA_DRAFT = 'draft-2020-12'

export const AGENTS_DIR = '.agents'
export const CONFIG_FILE = 'mcp.json'
export const STATE_FILE = 'mcp-lock.json'
export const STATE_VERSION = 2
export const ENV_FILE = '.env'
export const ENV_EXAMPLE_FILE = '.env.example'

export const SERVER_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/

/** Deterministic order for conflict resolution and reporting. */
export const AGENT_ORDER = [
  'claude-code',
  'cursor',
  'vscode',
  'opencode',
  'zed',
  'windsurf',
  'antigravity',
] as const
