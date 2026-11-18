/**
 * UI & prompts port (§11–§12).
 *
 * `PromptUi` is the single abstraction for all user interaction. Commands never
 * import `@clack/prompts` directly; they go through this port. Two
 * implementations exist:
 *
 * - `createClackUi()` — interactive TTY, backed by `@clack/prompts`.
 * - `createAutoUi()` — non-interactive (`--yes` / `CI=true` / tests), backed by
 *   supplied defaults.
 */

export interface Option<T> {
  label: string
  value: T
  hint?: string
}

export interface Spinner {
  start(): void
  stop(message?: string): void
}

export interface PromptUi {
  intro(message: string): void
  outro(message: string): void
  note(message: string, title?: string): void
  warn(message: string): void
  error(message: string): void
  confirm(opts: { message: string; initialValue: boolean }): Promise<boolean>
  select<T>(opts: {
    message: string
    options: Option<T>[]
    initialValue?: T
  }): Promise<T>
  multiselect<T>(opts: {
    message: string
    options: Option<T>[]
    initialValues?: T[]
  }): Promise<T[]>
  text(opts: {
    message: string
    placeholder?: string
    defaultValue?: string
    validate?: (v: string) => string | undefined
  }): Promise<string>
  password(opts: { message: string }): Promise<string>
  spinner(message: string): Spinner
}

/**
 * Interactive UI backed by `@clack/prompts`. Only used on a TTY.
 *
 * `import { createClackUi }` is intentionally lazy: the clack dependency is
 * only pulled in when this module is loaded, and commands never reference it
 * directly.
 */
/**
 * Shape of the dynamically loaded `@clack/prompts` module surface we touch.
 * Kept inline (not imported at module scope) so `@clack/prompts` stays off the
 * module graph for the non-interactive path.
 */
type ClackModule = {
  intro(message: string): void
  outro(message: string): void
  note(message: string, title?: string): void
  log: {
    warn(message: string): void
    error(message: string): void
  }
  isCancel(value: unknown): boolean
  confirm(opts: { message: string; initialValue?: boolean }): Promise<unknown>
  select(opts: {
    message: string
    options: Array<{ label: string; value: unknown; hint?: string }>
    initialValue?: unknown
  }): Promise<unknown>
  multiselect(opts: {
    message: string
    options: Array<{ label: string; value: unknown; hint?: string }>
    initialValues?: unknown[]
  }): Promise<unknown[]>
  text(opts: {
    message: string
    placeholder?: string
    defaultValue?: string
    validate?: (v: string) => string | undefined
  }): Promise<unknown>
  password(opts: { message: string }): Promise<unknown>
  spinner(message: string): { start(): void; stop(message?: string): void }
}

export function createClackUi(): PromptUi {
  // Dynamic import keeps `@clack/prompts` out of the module graph for the
  // non-interactive path and avoids loading clack in non-TTY contexts. We use
  // `await import()` (ESM) instead of `require()` because `dist/index.js` is an
  // ESM bundle and `require` is not defined in ES module scope.
  async function loadClack(): Promise<ClackModule> {
    return (await import('@clack/prompts')) as unknown as ClackModule
  }

  async function assertNotCancel<T>(result: T): Promise<T> {
    const clack = await loadClack()
    if (clack.isCancel(result)) {
      process.exit(130)
    }
    return result
  }

  // Preload clack once per UI instance. The `.catch` swallows import rejection
  // so we never leave an unhandled rejection. Write methods fall back to a
  // synchronous console write until (and unless) clack resolves, then use clack
  // — never both, never duplicated.
  let clack: ClackModule | null = null
  void loadClack()
    .then((c) => {
      clack = c
    })
    .catch(() => {})

  return {
    intro(message: string) {
      if (clack) {
        clack.intro(message)
      } else {
        console.log(message)
      }
    },
    outro(message: string) {
      if (clack) {
        clack.outro(message)
      } else {
        console.log(message)
      }
    },
    note(message: string, title?: string) {
      if (clack) {
        clack.note(message, title)
      } else {
        console.log(title ? `${title}: ${message}` : message)
      }
    },
    warn(message: string) {
      if (clack) {
        clack.log.warn(message)
      } else {
        console.warn(message)
      }
    },
    error(message: string) {
      if (clack) {
        clack.log.error(message)
      } else {
        console.error(message)
      }
    },
    confirm(opts: {
      message: string
      initialValue: boolean
    }): Promise<boolean> {
      return (async () => {
        const clack = await loadClack()
        const result = await clack.confirm({
          message: opts.message,
          initialValue: opts.initialValue,
        })
        return (await assertNotCancel(result as unknown)) as boolean
      })()
    },
    async select<T>(opts: {
      message: string
      options: Option<T>[]
      initialValue?: T
    }): Promise<T> {
      const clack = await loadClack()
      const result = await clack.select({
        message: opts.message,
        options: opts.options as unknown as Array<{
          label: string
          value: unknown
          hint?: string
        }>,
        initialValue: opts.initialValue as unknown,
      })
      return (await assertNotCancel(result as unknown)) as T
    },
    async multiselect<T>(opts: {
      message: string
      options: Option<T>[]
      initialValues?: T[]
    }): Promise<T[]> {
      const clack = await loadClack()
      const result = await clack.multiselect({
        message: opts.message,
        options: opts.options as unknown as Array<{
          label: string
          value: unknown
          hint?: string
        }>,
        initialValues: (opts.initialValues ?? []) as unknown[],
      })
      return (await assertNotCancel(result as unknown)) as T[]
    },
    async text(opts: {
      message: string
      placeholder?: string
      defaultValue?: string
      validate?: (v: string) => string | undefined
    }): Promise<string> {
      const clack = await loadClack()
      const result = await clack.text({
        message: opts.message,
        placeholder: opts.placeholder,
        defaultValue: opts.defaultValue,
        validate: opts.validate,
      })
      return (await assertNotCancel(result as unknown)) as string
    },
    async password(opts: { message: string }): Promise<string> {
      const clack = await loadClack()
      const result = await clack.password({ message: opts.message })
      return (await assertNotCancel(result as unknown)) as string
    },
    spinner(message: string): Spinner {
      let spin: { start(): void; stop(message?: string): void } | null = null
      let started = false
      let stopped = false
      return {
        start() {
          if (started) return
          started = true
          void loadClack().then((c) => {
            if (stopped) return // stop() already ran: do not start an orphan spinner
            spin = c.spinner(message)
            spin.start()
          })
        },
        stop(message?: string) {
          stopped = true
          if (clack && spin) {
            spin.stop(message)
            return
          }
          if (message !== undefined) {
            console.log(message)
          }
        },
      }
    },
  }
}
