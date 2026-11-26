import { posix, win32 } from 'node:path'
import type { RuntimeContext, ConfigScope } from '$/src/core/context'

/**
 * True when `value` is rooted in a way that must not be persisted verbatim:
 * POSIX absolute (`/...`), a Windows drive (`C:...`), or a UNC prefix
 * (`//server/share`, including the backslash form after separator
 * normalization).
 */
function isRooted(value: string): boolean {
  return (
    value.startsWith('/') || /^[A-Za-z]:/.test(value) || value.startsWith('//')
  )
}

function stripLeadingDotSlash(value: string): string {
  return value.replace(/^(?:\.\/)+/, '')
}

function normalizeSeparators(value: string): string {
  return value.replace(/\\/g, '/')
}

/**
 * Convert an absolute native path (or an already-portable path) into the form
 * persisted in `.agents/mcp-lock.json`.
 *
 * Portable forms:
 * - project scope: relative to `ctx.cwd` (e.g. `.cursor/mcp.json`);
 * - any scope: `~/...` under `ctx.homeDir`;
 * - any scope: `$XDG_CONFIG_HOME/...` when the env root is absolute and the
 *   path is inside it;
 * - any scope: `$APPDATA/...` when the env root is absolute and the path is
 *   inside it.
 *
 * Already-portable input is returned normalized (separators converted to `/`
 * and a leading `./` stripped) so the function is idempotent. When no root
 * matches, the basename is returned so an exotic path never leaks an absolute
 * machine path. The persisted path is metadata only; no I/O uses it.
 */
export function toPortablePath(
  absoluteOrPortablePath: string,
  scope: ConfigScope,
  ctx: RuntimeContext,
): string {
  const p = ctx.platform === 'win32' ? win32 : posix
  const normalizedInput = normalizeSeparators(absoluteOrPortablePath)

  if (normalizedInput !== '' && !isRooted(normalizedInput)) {
    return stripLeadingDotSlash(normalizedInput)
  }

  const candidates: Array<{ base: string; prefix: string }> = []
  if (scope === 'project') {
    candidates.push({ base: ctx.cwd, prefix: '' })
  }
  candidates.push({ base: ctx.homeDir, prefix: '~/' })

  const xdgConfigHome = ctx.env.XDG_CONFIG_HOME
  if (
    xdgConfigHome &&
    p.isAbsolute(p.normalize(normalizeSeparators(xdgConfigHome)))
  ) {
    candidates.push({ base: xdgConfigHome, prefix: '$XDG_CONFIG_HOME/' })
  }

  const appData = ctx.env.APPDATA
  if (appData && p.isAbsolute(p.normalize(normalizeSeparators(appData)))) {
    candidates.push({ base: appData, prefix: '$APPDATA/' })
  }

  for (const { base, prefix } of candidates) {
    const relative = p.relative(
      p.normalize(normalizeSeparators(base)),
      p.normalize(normalizedInput),
    )
    if (
      relative !== '' &&
      relative !== '..' &&
      !relative.startsWith(`..${p.sep}`) &&
      !p.isAbsolute(relative)
    ) {
      return prefix + relative.split(p.sep).join('/')
    }
  }

  return p.basename(normalizedInput)
}

/**
 * Validate a persisted agent path. Accepts relative paths and the `~/`,
 * `$XDG_CONFIG_HOME/`, and `$APPDATA/` forms; rejects absolute paths, drive
 * letters, UNC prefixes, backslashes, `..` segments, malformed `~`/`$NAME`
 * tokens, and empty or `.` segments.
 */
export function isPortablePath(value: string): boolean {
  if (value === '') {
    return false
  }
  if (value.includes('\\')) {
    return false
  }
  if (isRooted(value)) {
    return false
  }
  if (value.startsWith('~') && !value.startsWith('~/')) {
    return false
  }
  if (value.startsWith('$') && !/^\$[A-Z_][A-Z0-9_]*\//.test(value)) {
    return false
  }

  for (const segment of value.split('/')) {
    if (segment === '' || segment === '.' || segment === '..') {
      return false
    }
  }

  return true
}
