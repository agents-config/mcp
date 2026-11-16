/**
 * Interactive `add` wizard (B2).
 *
 * Pure-UI-port module: all terminal interaction goes through `PromptUi`
 * (`src/ui/prompts.ts`); commands never import `@clack/prompts` directly.
 * Collects `DirectOptions` for a new MCP server so `add.command.ts` can reuse
 * the existing `resolveDirect()` + persistence + `runSync` pipeline.
 */

import parseArgv from 'string-argv'
import { SERVER_NAME_PATTERN } from '$/src/config'
import type { DirectOptions } from '$/src/sources/direct'
import type { PromptUi } from '$/src/ui/prompts'

/** Environment variable keys reserved by Agent Plugins MCP 1.0.0. */
const RESERVED_ENV_KEYS = ['PLUGIN_ROOT', 'PLUGIN_DATA']

const ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

/** Parse shell-like input without crashing on malformed quoting. */
function parseArgvSafe(value: string): string[] {
  try {
    return parseArgv(value)
  } catch {
    return []
  }
}

/** Validate a server name against `SERVER_NAME_PATTERN`. */
export function validateServerName(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Server name is required.'
  }
  if (!SERVER_NAME_PATTERN.test(trimmed)) {
    return 'Use lowercase letters, digits, dots, dashes or underscores, starting with a letter or digit.'
  }
  return undefined
}

/** Validate a required executable command (may include inline arguments). */
export function validateCommandInput(value: string): string | undefined {
  if (!value.trim()) {
    return 'Command is required.'
  }
  if (parseArgvSafe(value.trim()).length === 0) {
    return 'Command is invalid. Check the quoting and try again.'
  }
  return undefined
}

/** Validate a required `http:`/`https:` URL, allowing `${VAR}` placeholders. */
export function validateHttpUrl(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'URL is required.'
  }
  if (/\$\{[^}]+\}/.test(trimmed)) {
    return undefined
  }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return 'Enter a valid http:// or https:// URL.'
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'URL must start with http:// or https://.'
  }
  return undefined
}

/** Validate a `KEY=VALUE` entry or a `KEY` reference. */
export function validateEnvEntry(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Environment entry is required.'
  }
  const separator = trimmed.indexOf('=')
  const key = (separator === -1 ? trimmed : trimmed.slice(0, separator)).trim()
  if (!key) {
    return 'Environment variable name is required.'
  }
  if (!ENV_KEY_PATTERN.test(key)) {
    return 'Use a valid environment variable name (letters, digits and underscores, not starting with a digit).'
  }
  if (RESERVED_ENV_KEYS.includes(key)) {
    return `Reserved environment variable key: ${key}.`
  }
  return undefined
}

/** Validate a `Name: Value` HTTP header entry. */
export function validateHeaderEntry(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Header is required.'
  }
  const separator = trimmed.indexOf(':')
  if (separator === -1 || !trimmed.slice(0, separator).trim()) {
    return 'Use the format "Name: Value" with a non-empty header name.'
  }
  return undefined
}

export interface CollectInteractiveAddOptionsParams {
  ui: PromptUi
  /** Candidate name from `--name` or the positional argument. */
  initialName?: string
  /** Fail fast when the server already exists (called before field prompts). */
  checkConflict: (name: string) => void
}

export interface InteractiveAddResult {
  name: string
  options: DirectOptions
}

/**
 * Resolve the server name, failing back to an interactive text prompt when the
 * candidate is missing or invalid.
 */
async function resolveServerName({
  ui,
  initialName,
}: {
  ui: PromptUi
  initialName?: string
}): Promise<string> {
  const candidate = initialName?.trim() ?? ''
  if (candidate) {
    if (SERVER_NAME_PATTERN.test(candidate)) {
      return candidate
    }
    ui.warn(
      `Invalid server name \`${candidate}\`. Use lowercase letters, digits, dots, dashes or underscores.`,
    )
  }
  return ui.text({
    message: 'Server name',
    placeholder: 'e.g. github',
    validate: validateServerName,
  })
}

/** Loop collecting `Name: Value` HTTP headers. */
async function collectHeaders(ui: PromptUi): Promise<string[]> {
  const headers: string[] = []
  const wantsHeaders = await ui.confirm({
    message: 'Add HTTP headers?',
    initialValue: false,
  })
  if (!wantsHeaders) {
    return headers
  }
  let addAnother = true
  while (addAnother) {
    headers.push(
      await ui.text({
        message: 'Header (Name: Value)',
        placeholder: 'Authorization: Bearer <token>',
        validate: validateHeaderEntry,
      }),
    )
    addAnother = await ui.confirm({
      message: 'Add another header?',
      initialValue: false,
    })
  }
  return headers
}

/** Loop collecting `KEY=VALUE` / `KEY` environment entries. */
async function collectEnv(ui: PromptUi): Promise<string[]> {
  const env: string[] = []
  const wantsEnv = await ui.confirm({
    message: 'Add environment variables?',
    initialValue: false,
  })
  if (!wantsEnv) {
    return env
  }
  let addAnother = true
  while (addAnother) {
    env.push(
      await ui.text({
        message: 'Environment variable (KEY=VALUE or KEY)',
        placeholder: 'API_KEY=<value>',
        validate: validateEnvEntry,
      }),
    )
    addAnother = await ui.confirm({
      message: 'Add another environment variable?',
      initialValue: false,
    })
  }
  return env
}

/**
 * Run the interactive add wizard and return the resolved name plus the
 * `DirectOptions` to feed into `resolveDirect()`.
 */
export async function collectInteractiveAddOptions({
  ui,
  initialName,
  checkConflict,
}: CollectInteractiveAddOptionsParams): Promise<InteractiveAddResult> {
  ui.intro('Add MCP server')

  const name = await resolveServerName({ ui, initialName })
  checkConflict(name)

  const type = await ui.select<'command' | 'http'>({
    message: 'How does this MCP server connect?',
    options: [
      {
        label: 'Local command',
        value: 'command',
        hint: 'Run a local executable (e.g. npx, uvx, node)',
      },
      {
        label: 'HTTP',
        value: 'http',
        hint: 'Connect to a remote MCP server via URL',
      },
    ],
  })

  if (type === 'http') {
    const url = await ui.text({
      message: 'Server URL',
      placeholder: 'https://example.com/mcp',
      validate: validateHttpUrl,
    })
    const header = await collectHeaders(ui)
    return {
      name,
      options: { name, http: url.trim(), header },
    }
  }

  const commandInput = await ui.text({
    message: 'Command',
    placeholder: 'npx',
    validate: validateCommandInput,
  })
  const argsInput = await ui.text({
    message: 'Arguments (optional)',
    placeholder: '-y @scope/pkg',
    defaultValue: '',
  })
  const env = await collectEnv(ui)

  const [executable, ...inlineArgs] = parseArgvSafe(commandInput.trim())
  const extraArgs = parseArgvSafe(argsInput.trim())

  return {
    name,
    options: {
      name,
      command: executable,
      arg: [...inlineArgs, ...extraArgs],
      env,
    },
  }
}
