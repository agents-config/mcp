import { homedir, platform } from 'node:os'

export type ConfigScope = 'project' | 'global'

export interface RuntimeContext {
  readonly cwd: string
  readonly homeDir: string
  readonly platform: NodeJS.Platform
  readonly env: NodeJS.ProcessEnv
  readonly isTTY: boolean
}

/**
 * Build a `RuntimeContext`. All path/TTY reads happen here (once, at creation),
 * never at module import time and never inside adapters. This makes Windows
 * path behavior testable on Linux CI by overriding `platform`/`homeDir`.
 */
export function createRuntimeContext(
  overrides?: Partial<RuntimeContext>,
): RuntimeContext {
  return {
    cwd: overrides?.cwd ?? process.cwd(),
    homeDir: overrides?.homeDir ?? homedir(),
    platform: overrides?.platform ?? platform(),
    env: overrides?.env ?? process.env,
    isTTY: overrides?.isTTY ?? Boolean(process.stdout?.isTTY),
  }
}
