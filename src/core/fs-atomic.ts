import {
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  renameSync,
  unlinkSync,
  writeSync as fsWriteSync,
  fsyncSync as fsFsyncSync,
  readFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * Read a text file, returning `null` when it does not exist (ENOENT).
 * Any other error propagates.
 */
export function readTextFile(path: string): string | null {
  try {
    return readFileSync(path, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw err
  }
}

/**
 * Atomic write: write to a temp file in the **same directory**, fsync, then
 * rename over the target. On Windows, `rename` over an existing file can fail,
 * so fall back to `copyFile` + `unlink` without removing the target first.
 *
 * The temp file is created with `O_EXCL` plus a random suffix to avoid
 * symlink surprises and collisions between concurrent writers.
 *
 * `mode` applies to the temp file (e.g. `0o600` for `.env`); after rename the
 * platform's umask may adjust the final mode, so callers requiring an exact
 * mode should `chmod` the target afterwards.
 */
export interface WriteFileAtomicOptions {
  mode?: number
}

export function writeFileAtomic(
  path: string,
  content: string,
  options: WriteFileAtomicOptions = {},
): void {
  const dir = dirname(path)
  // Ensure the parent directory exists so callers don't have to pre-create it.
  mkdirSync(dir, { recursive: true })
  const temp = createTempPath(dir)
  const fd = openSync(temp, 'wx', options.mode ?? 0o644)
  try {
    fsWriteSync(fd, Buffer.from(content, 'utf8'))
    fsFsyncSync(fd)
    closeSync(fd)
  } catch (err) {
    try {
      closeSync(fd)
    } catch {
      // ignore
    }
    try {
      unlinkSync(temp)
    } catch {
      // ignore
    }
    throw err
  }

  try {
    renameSync(temp, path)
  } catch (renameErr) {
    // Windows: rename over an existing file may fail. Fall back to
    // copyFile + unlink so we never clobber the target before the copy is safe.
    if (copyFileOverExisting(temp, path)) {
      try {
        unlinkSync(temp)
      } catch {
        // ignore
      }
      return
    }
    // Clean up the orphaned temp and rethrow the original rename error.
    try {
      unlinkSync(temp)
    } catch {
      // ignore
    }
    throw renameErr
  }
}

function createTempPath(dir: string): string {
  const random = Math.random().toString(36).slice(2, 14)
  const timestamp = Date.now().toString(36)
  return join(dir, `.agents-mcp-tmp-${timestamp}-${random}`)
}

function copyFileOverExisting(src: string, dest: string): boolean {
  try {
    copyFileSync(src, dest)
    return true
  } catch {
    return false
  }
}

/**
 * Copy `path` to `<path>.bak.<ISO timestamp>` before a `--force` operation.
 * Returns the backup path, or `null` when the source does not exist.
 */
export function backupFile(path: string): string | null {
  if (!existsSync(path)) {
    return null
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backup = `${path}.bak.${timestamp}`
  copyFileSync(path, backup)
  return backup
}
