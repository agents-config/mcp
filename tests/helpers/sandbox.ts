import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRuntimeContext, type RuntimeContext } from '$/src/core/context'

/**
 * Create a temp sandbox with `cwd`, `homeDir`, and `XDG_CONFIG_HOME` overridden
 * so no test ever touches real user configuration.
 *
 * Every path returned is under `os.tmpdir()`. Call `cleanup()` at the end of
 * each test (or in `afterEach`).
 */
export function createSandbox(): {
  dir: string
  ctx: RuntimeContext
  cleanup: () => void
} {
  const dir = mkdtempSync(join(tmpdir(), 'agents-mcp-sandbox-'))
  const ctx = createRuntimeContext({
    cwd: join(dir, 'project'),
    homeDir: join(dir, 'home'),
    isTTY: false,
  })
  return {
    dir,
    ctx,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  }
}
