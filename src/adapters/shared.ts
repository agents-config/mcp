/**
 * Shared helpers for the adapter layer.
 *
 * Implements BLUEPRINT §9.2/§9.3: one JSONC batch edit via a single
 * `jsonc-parser.modify` call on the `rootKey` (avoiding the multi-edit
 * offset footgun), tolerant entry reader, and warning factory. Preserves
 * CRLF/BOM/comments outside the replaced `rootKey`; aborts on parse error.
 */

import { modify, applyEdits, parse, type ParseError } from 'jsonc-parser'
import type { WarningCode } from '$/src/adapters/types'
import { makeWarning } from '$/src/adapters/types'
import type { AgentId, CompileResult, Warning } from '$/src/adapters/types'

export interface ApplyServerEntriesOptions {
  /** Names being produced in this sync (the managed set). */
  readonly managed: string[]
  /** Previously managed names (from sync state) to prune when no longer produced. */
  readonly previous: ReadonlySet<string>
  readonly format: 'json' | 'jsonc'
}

/**
 * Apply managed entries to `rootKey` in an existing JSONC document, never
 * touching sibling keys or manual entries.
 *
 * Strategy: compute the desired `rootKey` object (manual entries that are not
 * in `previous`, overlaid by the current managed entries) and replace the
 * whole `rootKey` node in a single `modify` call. This preserves everything
 * outside `rootKey` byte-for-byte (comments, unrelated keys, `inputs`, etc.)
 * while keeping the edit atomic and offset-safe.
 *
 * - Creates `rootKey` only when needed.
 * - Deletes names in `previous` that are no longer produced.
 * - Aborts (throws) on parse error; the file is left byte-identical.
 */
export function applyServerEntries(
  existing: string | null,
  rootKey: string,
  entries: Record<string, unknown>,
  opts: ApplyServerEntriesOptions,
): {
  content: string
  edits: Array<{ offset: number; length: number; content: string }>
} {
  const { managed, previous, format } = opts

  if (existing === null || existing.trim() === '') {
    if (Object.keys(entries).length === 0) {
      return { content: '', edits: [] }
    }
    const document = { [rootKey]: entries }
    const content = JSON.stringify(document, null, 2) + '\n'
    return { content, edits: [] }
  }

  // Validate the existing document before touching it.
  const errors: ParseError[] = []
  parse(existing, errors, { allowTrailingComma: true, allowEmptyContent: true })
  if (errors.length > 0) {
    const first = errors[0]!
    throw new Error(
      `Invalid JSONC at offset ${first.offset}: unable to edit safely`,
    )
  }

  const formattingOptions =
    format === 'jsonc' ? { tabSize: 2, insertSpaces: true } : undefined

  // Read the current rootKey object (or {} if absent).
  let currentRoot: Record<string, unknown> = {}
  try {
    const parsed = parse(existing) as Record<string, unknown>
    const existingRoot = parsed[rootKey]
    if (
      existingRoot &&
      typeof existingRoot === 'object' &&
      !Array.isArray(existingRoot)
    ) {
      currentRoot = existingRoot as Record<string, unknown>
    }
  } catch {
    // If we can't read the rootKey, treat it as empty.
    currentRoot = {}
  }

  // Manual entries: keys present in the file that are NOT in `previous`
  // (i.e. not previously managed by the compiler) are preserved.
  const manualEntries: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(currentRoot)) {
    if (!previous.has(key)) {
      manualEntries[key] = value
    }
  }

  // Managed entries overlay manual ones; previously managed names no longer
  // produced are simply absent from `entries`, hence dropped.
  const newRoot: Record<string, unknown> = { ...manualEntries, ...entries }

  // Nothing to do if rootKey absent and nothing to write.
  const rootExists = Object.prototype.hasOwnProperty.call(
    parse(existing) as Record<string, unknown>,
    rootKey,
  )
  if (!rootExists && Object.keys(newRoot).length === 0) {
    return { content: existing, edits: [] }
  }

  const edits = modify(existing, [rootKey], newRoot, {
    formattingOptions,
  })

  const content = applyEdits(existing, edits)
  return { content, edits }
}

/**
 * Tolerant nested lookup: `readEntry(parsed, ['context_servers', 'x', 'command', 'path'])`.
 * Returns `undefined` when any segment is missing.
 */
export function readEntry(parsed: unknown, path: readonly string[]): unknown {
  let current: unknown = parsed
  for (const segment of path) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object' ||
      Array.isArray(current)
    ) {
      return undefined
    }
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

/**
 * Build a `Warning`. Thin re-export friendly wrapper around `makeWarning`.
 */
export function buildWarning(
  agent: AgentId,
  code: WarningCode,
  message: string,
  meta?: { server?: string; field?: string },
): Warning {
  return makeWarning(agent, code, message, meta)
}
