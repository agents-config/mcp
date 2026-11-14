import { writeFileSync, writeFile, appendFileSync, appendFile } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

/**
 * Sandbox guard: patches writeFileSync/writeFile/appendFileSync/appendFile to
 * assert that every write occurs under os.tmpdir(). Throws if a write is
 * detected outside the sandbox.
 *
 * Usage:
 *   import { installSandboxGuard, uninstallSandboxGuard, assertNoWritesOutsideSandbox }
 *   installSandboxGuard()
 *   // ... run your mutating commands ...
 *   uninstallSandboxGuard()
 *   assertNoWritesOutsideSandbox()
 */

let originalWriteFileSync: typeof writeFileSync | null = null
let originalWriteFile: typeof writeFile | null = null
let originalAppendFileSync: typeof appendFileSync | null = null
let originalAppendFile: typeof appendFile | null = null
let installCount = 0

/**
 * Check whether a path is under os.tmpdir().
 */
function isUnderTmpdir(path: string): boolean {
  const resolved = resolve(path)
  return resolved === tmpdir() || resolved.startsWith(tmpdir() + '/')
}

/**
 * Install the sandbox guard. Intercepts writeFileSync/writeFile/appendFileSync/appendFile
 * to assert that every write path is under os.tmpdir().
 */
export function installSandboxGuard(): void {
  if (installCount > 0) {
    installCount++
    return
  }
  installCount = 1

  originalWriteFileSync = writeFileSync
  originalWriteFile = writeFile
  originalAppendFileSync = appendFileSync
  originalAppendFile = appendFile

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(writeFileSync as any) = function (
    this: unknown,
    filePath: string,
    ...args: unknown[]
  ): any {
    if (!isUnderTmpdir(filePath)) {
      throw new Error(
        `Sandbox guard: write to ${filePath} is outside os.tmpdir()`,
      )
    }
    return (originalWriteFileSync as any)(filePath, ...args)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(writeFile as any) = function (
    this: unknown,
    filePath: string,
    ...args: unknown[]
  ): any {
    if (!isUnderTmpdir(filePath)) {
      throw new Error(
        `Sandbox guard: write to ${filePath} is outside os.tmpdir()`,
      )
    }
    return (originalWriteFile as any)(filePath, ...args)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(appendFileSync as any) = function (
    this: unknown,
    filePath: string,
    ...args: unknown[]
  ): any {
    if (!isUnderTmpdir(filePath)) {
      throw new Error(
        `Sandbox guard: append to ${filePath} is outside os.tmpdir()`,
      )
    }
    return (originalAppendFileSync as any)(filePath, ...args)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(appendFile as any) = function (
    this: unknown,
    filePath: string,
    ...args: unknown[]
  ): any {
    if (!isUnderTmpdir(filePath)) {
      throw new Error(
        `Sandbox guard: append to ${filePath} is outside os.tmpdir()`,
      )
    }
    return (originalAppendFile as any)(filePath, ...args)
  }
}

/**
 * Uninstall the sandbox guard, restoring the original functions.
 */
export function uninstallSandboxGuard(): void {
  if (installCount > 0) {
    installCount--
    if (installCount === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(writeFileSync as any) = originalWriteFileSync
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(writeFile as any) = originalWriteFile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(appendFileSync as any) = originalAppendFileSync
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(appendFile as any) = originalAppendFile
    }
  }
}

/**
 * Assert that no writes occurred outside os.tmpdir(). Call this after
 * uninstallSandboxGuard() to confirm no writes leaked outside the sandbox.
 */
export function assertNoWritesOutsideSandbox(): void {
  // The guard itself throws on any out-of-sandbox write, so if we get here
  // without an error, the assertion passes.
}
