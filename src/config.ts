import pkg from '$/package.json' with { type: 'json' }

export const SPEC_SITE_URL = 'https://agents-mcp.dev'
export const SPEC_VERSION = pkg.version // e.g. "0.0.0"
export const SPEC_VERSION_TAG = `v${SPEC_VERSION}` // e.g. "v0.0.0"
export const DEFAULT_SCHEMA_URL = `${SPEC_SITE_URL}/schema/${SPEC_VERSION_TAG}/mcp.schema.json`
export const SCHEMA_DRAFT = 'draft-07'

export const AGENTS_DIR = '.agents'
export const CONFIG_FILE = 'mcp.json'
export const STATE_FILE = '.mcp-sync-state.json'
export const STATE_VERSION = 1
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
] as const
