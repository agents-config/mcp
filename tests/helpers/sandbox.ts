import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRuntimeContext, type RuntimeContext } from '$/src/core/context'

/**
 * Create a temp sandbox with `cwd`, `homeDir`, and `XDG_CONFIG_HOME`/`APPDATA`
 * overridden so no test ever touches real user configuration.
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
  const projectDir = join(dir, 'project')
  const homeDir = join(dir, 'home')
  const env = {
    ...process.env,
    XDG_CONFIG_HOME: join(homeDir, '.config'),
    APPDATA: join(homeDir, 'AppData', 'Roaming'),
  }
  const ctx = createRuntimeContext({
    cwd: projectDir,
    homeDir,
    env,
    isTTY: false,
  })
  return {
    dir,
    ctx,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  }
}
