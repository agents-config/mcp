/**
 * Minimal, lazy `.gitignore` management for tool-owned secrets and state.
 *
 * Implements BLUEPRINT §8.6: adds a managed block only for `.env` and the sync
 * state file, lazily (only when something is about to be written), never
 * touching agent configuration files, never duplicating entries.
 */

import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { readTextFile, writeFileAtomic } from '$/src/core/fs-atomic'
import { ENV_FILE } from '$/src/config'

const MANAGED_BLOCK_HEADER = '# agents-mcp local (managed)'
const MANAGED_BLOCK_FOOTER = '# end agents-mcp local (managed)'

export interface EnsureIgnoredResult {
  added: string[]
  warnings: string[]
}

/**
 * Ensure `entries` are covered by `.gitignore` at `rootDir`. Adds a managed
 * block only when at least one entry is not already covered. Entries already
 * covered by another pattern are not duplicated.
 */
export function ensureIgnored(
  rootDir: string,
  entries: string[],
): EnsureIgnoredResult {
  const added: string[] = []
  const warnings: string[] = []

  const gitignorePath = join(rootDir, '.gitignore')
  const raw = readTextFile(gitignorePath)
  const existingLines = raw !== null ? raw.split(/\r?\n/) : []

  const alreadyCovered = (entry: string): boolean => {
    for (const line of existingLines) {
      const trimmed = line.trim()
      if (trimmed === '' || trimmed.startsWith('#')) continue
      // Exact match or the entry is a prefix-anchored pattern already present.
      if (trimmed === entry) return true
      // A trailing-slash directory pattern covers contained files.
      if (trimmed === entry + '/') return true
      // Only match directory prefixes (require '/' boundary after the prefix)
      // so `.env` does not false-positive match `.env.example`.
      if (trimmed.endsWith('/') && entry.startsWith(trimmed)) return true
    }
    return false
  }

  const uncovered = entries.filter((e) => !alreadyCovered(e))

  if (uncovered.length === 0) {
    // Check git-tracked status for `.env` specifically without duplicating.
    if (entries.includes(ENV_FILE) && isGitTracked(rootDir, ENV_FILE)) {
      warnings.push(
        `.env is tracked by Git; run \`git rm --cached .env\` to stop tracking it (values are still safe from new commits)`,
      )
    }
    return { added, warnings }
  }

  // A trailing newline leaves a final empty element; drop it so rejoining
  // never accumulates blank lines across repeated calls.
  if (
    existingLines.length > 0 &&
    existingLines[existingLines.length - 1] === ''
  ) {
    existingLines.pop()
  }

  const headerIdx = existingLines.findIndex(
    (l) => l.trim() === MANAGED_BLOCK_HEADER,
  )
  const footerIdx = existingLines.findIndex(
    (l) => l.trim() === MANAGED_BLOCK_FOOTER,
  )

  const nextLines = [...existingLines]

  if (headerIdx !== -1 && footerIdx !== -1) {
    // Block complete: insert uncovered entries right before the footer.
    nextLines.splice(footerIdx, 0, ...uncovered)
  } else if (headerIdx !== -1) {
    // Header only (corrupted/partial block): append entries and close it.
    nextLines.push(...uncovered, MANAGED_BLOCK_FOOTER)
  } else {
    // No managed block yet: create header -> entries -> footer.
    nextLines.push('', MANAGED_BLOCK_HEADER, ...uncovered, MANAGED_BLOCK_FOOTER)
  }

  const next = nextLines.join('\n') + '\n'
  writeFileAtomic(gitignorePath, next)
  added.push(...uncovered)

  if (uncovered.includes(ENV_FILE) && isGitTracked(rootDir, ENV_FILE)) {
    warnings.push(
      `.env is tracked by Git; run \`git rm --cached .env\` to stop tracking it (values are still safe from new commits)`,
    )
  }

  return { added, warnings }
}

/**
 * Return `true` when `entry` is tracked by Git in `rootDir`. Any error (not a
 * git repo, git unavailable, entry not tracked) yields `false` so the caller
 * can proceed without git.
 */
export function isGitTracked(rootDir: string, entry: string): boolean {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', '--', entry], {
      cwd: rootDir,
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}
