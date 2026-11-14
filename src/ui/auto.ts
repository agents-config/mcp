/**
 * Non-interactive UI implementation used for `--yes`, `CI=true`, and tests.
 *
 * Never blocks on input. Every prompt resolves from the supplied `defaults`
 * (or sensible fallbacks) and prints through `log`. Secrets are masked.
 */

import type { Option, PromptUi, Spinner } from '$/src/ui/prompts'

export interface AutoUiDefaults {
  confirm?: boolean
  select?: unknown
  multiselect?: unknown[]
  text?: string
  password?: string
}

export interface AutoUiLogger {
  info(message: string): void
  warn(message: string): void
  error(message: string): void
}

function maskSecret(value: string): string {
  if (!value) {
    return ''
  }
  return value.length > 4 ? `${value.slice(0, 2)}***` : '***'
}

/**
 * Build a non-interactive `PromptUi`. `defaults` supply answers for prompts;
 * `log` receives informational/warning/error output.
 */
export function createAutoUi({
  defaults = {},
  log,
}: {
  defaults?: AutoUiDefaults
  log?: AutoUiLogger
}): PromptUi {
  const info = log?.info ?? ((message: string) => console.log(message))
  const warn = log?.warn ?? ((message: string) => console.warn(message))
  const error = log?.error ?? ((message: string) => console.error(message))

  const noopSpinner: Spinner = {
    start() {},
    stop() {},
  }

  return {
    intro(message: string) {
      info(message)
    },
    outro(message: string) {
      info(message)
    },
    note(message: string, title?: string) {
      info(title ? `${title}: ${message}` : message)
    },
    warn(message: string) {
      warn(message)
    },
    error(message: string) {
      error(message)
    },
    confirm(opts: {
      message: string
      initialValue: boolean
    }): Promise<boolean> {
      info(`${opts.message} (${opts.initialValue ? 'Y/n' : 'y/N'})`)
      return Promise.resolve(defaults.confirm ?? opts.initialValue)
    },
    async select<T>(opts: {
      message: string
      options: Option<T>[]
      initialValue?: T
    }): Promise<T> {
      const chosen =
        defaults.select ?? opts.options[0]?.value ?? opts.initialValue
      info(`${opts.message} → ${String(chosen)}`)
      const option = opts.options.find((o) => o.value === chosen)
      if (option) {
        info(
          `  ${option.hint ? `${option.label} (${option.hint})` : option.label}`,
        )
      }
      return chosen as T
    },
    async multiselect<T>(opts: {
      message: string
      options: Option<T>[]
      initialValues?: T[]
    }): Promise<T[]> {
      const chosen = defaults.multiselect ?? opts.initialValues ?? []
      info(`${opts.message} → ${chosen.join(', ') || '(none)'}`)
      return chosen as T[]
    },
    async text(opts: {
      message: string
      placeholder?: string
      defaultValue?: string
      validate?: (v: string) => string | undefined
    }): Promise<string> {
      const chosen = defaults.text ?? opts.defaultValue ?? ''
      info(`${opts.message} → ${maskSecret(chosen)}`)
      return chosen
    },
    async password(opts: { message: string }): Promise<string> {
      const chosen = defaults.password ?? ''
      info(`${opts.message} → ***`)
      return chosen
    },
    spinner(): Spinner {
      return noopSpinner
    },
  }
}
