import { describe, expect, it } from 'vitest'
import { posix, win32 } from 'node:path'
import { createRuntimeContext, type RuntimeContext } from '$/src/core/context'
import { isPortablePath, toPortablePath } from '$/src/core/portable-path'

function ctxFor(
  platform: NodeJS.Platform,
  cwd: string,
  homeDir: string,
  env: Record<string, string | undefined> = {},
): RuntimeContext {
  return createRuntimeContext({
    cwd,
    homeDir,
    platform,
    env: env as NodeJS.ProcessEnv,
    isTTY: false,
  })
}

const projectCtx = ctxFor('linux', '/repo', '/home/alice', {
  XDG_CONFIG_HOME: '/home/alice/.config',
  APPDATA: undefined,
})

const linuxGlobalCtx = ctxFor('linux', '/repo', '/home/alice', {
  XDG_CONFIG_HOME: '/home/alice/.config',
  APPDATA: undefined,
})

const macGlobalCtx = ctxFor('darwin', '/repo', '/Users/alice', {
  XDG_CONFIG_HOME: undefined,
  APPDATA: undefined,
})

const windowsGlobalCtx = ctxFor('win32', 'C:\\repo', 'C:\\Users\\alice', {
  XDG_CONFIG_HOME: undefined,
  APPDATA: 'C:\\Users\\alice\\AppData\\Roaming',
})

describe('toPortablePath project scope', () => {
  const cases: Array<{ agent: string; native: string; expected: string }> = [
    {
      agent: 'claude-code',
      native: posix.join('/repo', '.mcp.json'),
      expected: '.mcp.json',
    },
    {
      agent: 'cursor',
      native: posix.join('/repo', '.cursor', 'mcp.json'),
      expected: '.cursor/mcp.json',
    },
    {
      agent: 'vscode',
      native: posix.join('/repo', '.vscode', 'mcp.json'),
      expected: '.vscode/mcp.json',
    },
    {
      agent: 'opencode',
      native: posix.join('/repo', 'opencode.json'),
      expected: 'opencode.json',
    },
    {
      agent: 'zed',
      native: posix.join('/repo', '.zed', 'settings.json'),
      expected: '.zed/settings.json',
    },
    {
      agent: 'antigravity',
      native: posix.join('/repo', '.agents', 'plugins'),
      expected: '.agents/plugins',
    },
  ]

  it.each(cases)('$agent -> $expected', ({ native, expected }) => {
    expect(toPortablePath(native, 'project', projectCtx)).toBe(expected)
  })
})

describe('toPortablePath global scope (Linux)', () => {
  const home = '/home/alice'
  const cases: Array<{ agent: string; native: string; expected: string }> = [
    {
      agent: 'claude-code',
      native: posix.join(home, '.claude.json'),
      expected: '~/.claude.json',
    },
    {
      agent: 'cursor',
      native: posix.join(home, '.cursor', 'mcp.json'),
      expected: '~/.cursor/mcp.json',
    },
    {
      agent: 'vscode',
      native: posix.join(home, '.config', 'Code', 'User', 'mcp.json'),
      expected: '~/.config/Code/User/mcp.json',
    },
    {
      agent: 'opencode',
      native: posix.join(home, '.config', 'opencode', 'opencode.json'),
      expected: '~/.config/opencode/opencode.json',
    },
    {
      agent: 'windsurf',
      native: posix.join(home, '.codeium', 'windsurf', 'mcp_config.json'),
      expected: '~/.codeium/windsurf/mcp_config.json',
    },
    {
      agent: 'zed',
      native: posix.join(home, '.config', 'zed', 'settings.json'),
      expected: '~/.config/zed/settings.json',
    },
    {
      agent: 'antigravity',
      native: posix.join(home, '.agents', 'plugins'),
      expected: '~/.agents/plugins',
    },
  ]

  it.each(cases)('$agent -> $expected', ({ native, expected }) => {
    expect(toPortablePath(native, 'global', linuxGlobalCtx)).toBe(expected)
  })
})

describe('toPortablePath global scope (macOS)', () => {
  const home = '/Users/alice'
  const cases: Array<{ agent: string; native: string; expected: string }> = [
    {
      agent: 'claude-code',
      native: posix.join(home, '.claude.json'),
      expected: '~/.claude.json',
    },
    {
      agent: 'cursor',
      native: posix.join(home, '.cursor', 'mcp.json'),
      expected: '~/.cursor/mcp.json',
    },
    {
      agent: 'vscode',
      native: posix.join(
        home,
        'Library',
        'Application Support',
        'Code',
        'User',
        'mcp.json',
      ),
      expected: '~/Library/Application Support/Code/User/mcp.json',
    },
    {
      agent: 'opencode',
      native: posix.join(home, '.config', 'opencode', 'opencode.json'),
      expected: '~/.config/opencode/opencode.json',
    },
    {
      agent: 'windsurf',
      native: posix.join(home, '.codeium', 'windsurf', 'mcp_config.json'),
      expected: '~/.codeium/windsurf/mcp_config.json',
    },
    {
      agent: 'zed',
      native: posix.join(home, '.config', 'zed', 'settings.json'),
      expected: '~/.config/zed/settings.json',
    },
    {
      agent: 'antigravity',
      native: posix.join(home, '.agents', 'plugins'),
      expected: '~/.agents/plugins',
    },
  ]

  it.each(cases)('$agent -> $expected', ({ native, expected }) => {
    expect(toPortablePath(native, 'global', macGlobalCtx)).toBe(expected)
  })
})

describe('toPortablePath global scope (Windows)', () => {
  const home = 'C:\\Users\\alice'
  const appData = 'C:\\Users\\alice\\AppData\\Roaming'
  const cases: Array<{ agent: string; native: string; expected: string }> = [
    {
      agent: 'claude-code',
      native: win32.join(home, '.claude.json'),
      expected: '~/.claude.json',
    },
    {
      agent: 'cursor',
      native: win32.join(home, '.cursor', 'mcp.json'),
      expected: '~/.cursor/mcp.json',
    },
    {
      agent: 'vscode',
      native: win32.join(appData, 'Code', 'User', 'mcp.json'),
      expected: '~/AppData/Roaming/Code/User/mcp.json',
    },
    {
      agent: 'opencode',
      native: win32.join(appData, 'opencode', 'opencode.json'),
      expected: '~/AppData/Roaming/opencode/opencode.json',
    },
    {
      agent: 'windsurf',
      native: win32.join(home, '.codeium', 'windsurf', 'mcp_config.json'),
      expected: '~/.codeium/windsurf/mcp_config.json',
    },
    {
      agent: 'zed',
      native: win32.join(appData, 'Zed', 'settings.json'),
      expected: '~/AppData/Roaming/Zed/settings.json',
    },
    {
      agent: 'antigravity',
      native: win32.join(home, '.agents', 'plugins'),
      expected: '~/.agents/plugins',
    },
  ]

  it.each(cases)('$agent -> $expected', ({ native, expected }) => {
    expect(toPortablePath(native, 'global', windowsGlobalCtx)).toBe(expected)
  })
})

describe('toPortablePath env roots outside home', () => {
  it('uses $XDG_CONFIG_HOME for an absolute root outside home', () => {
    const ctx = ctxFor('linux', '/repo', '/home/alice', {
      XDG_CONFIG_HOME: '/opt/xdg',
      APPDATA: undefined,
    })
    expect(
      toPortablePath(
        posix.join('/opt/xdg', 'opencode', 'opencode.json'),
        'global',
        ctx,
      ),
    ).toBe('$XDG_CONFIG_HOME/opencode/opencode.json')
  })

  it('uses $APPDATA for an absolute root outside home', () => {
    const ctx = ctxFor('win32', 'C:\\repo', 'C:\\Users\\alice', {
      XDG_CONFIG_HOME: undefined,
      APPDATA: 'D:\\AppData',
    })
    expect(
      toPortablePath(
        win32.join('D:\\AppData', 'Code', 'User', 'mcp.json'),
        'global',
        ctx,
      ),
    ).toBe('$APPDATA/Code/User/mcp.json')
  })
})

describe('toPortablePath idempotence', () => {
  const cases: Array<{
    scope: 'project' | 'global'
    ctx: RuntimeContext
    value: string
  }> = [
    { scope: 'project', ctx: projectCtx, value: '.mcp.json' },
    { scope: 'project', ctx: projectCtx, value: '.cursor/mcp.json' },
    { scope: 'project', ctx: projectCtx, value: '.agents/plugins' },
    { scope: 'global', ctx: linuxGlobalCtx, value: '~/.claude.json' },
    {
      scope: 'global',
      ctx: linuxGlobalCtx,
      value: '~/.config/Code/User/mcp.json',
    },
    {
      scope: 'global',
      ctx: windowsGlobalCtx,
      value: '~/AppData/Roaming/Code/User/mcp.json',
    },
  ]

  it.each(cases)('$value stays $value', ({ scope, ctx, value }) => {
    expect(toPortablePath(value, scope, ctx)).toBe(value)
  })

  it('strips a leading ./ from an already-portable path', () => {
    expect(toPortablePath('./.mcp.json', 'project', projectCtx)).toBe(
      '.mcp.json',
    )
    expect(toPortablePath('.\\cursor\\mcp.json', 'project', projectCtx)).toBe(
      'cursor/mcp.json',
    )
  })
})

describe('toPortablePath last resort', () => {
  it('returns the basename for a POSIX path outside all known roots', () => {
    expect(
      toPortablePath('/var/opt/weird/thing.json', 'project', projectCtx),
    ).toBe('thing.json')
  })

  it('returns the basename for a Windows path outside all known roots', () => {
    expect(
      toPortablePath('E:\\Other\\file.json', 'global', windowsGlobalCtx),
    ).toBe('file.json')
  })
})

describe('isPortablePath', () => {
  const accepted = [
    '.mcp.json',
    '.cursor/mcp.json',
    '.vscode/mcp.json',
    'opencode.json',
    '.zed/settings.json',
    '.agents/plugins',
    'a/b/c.json',
    '~/.claude.json',
    '~/AppData/Roaming/Code/User/mcp.json',
    '$XDG_CONFIG_HOME/opencode/opencode.json',
    '$APPDATA/Code/User/mcp.json',
    '$FOO/bar',
  ]

  it.each(accepted)('accepts %s', (value) => {
    expect(isPortablePath(value)).toBe(true)
  })

  const rejected = [
    '',
    '/abs/.mcp.json',
    'C:\\Users\\alice\\.mcp.json',
    'C:/Users/alice/.mcp.json',
    'C:foo',
    '\\\\server\\share\\x',
    '//server/share/x',
    'a\\b',
    '..',
    '../.mcp.json',
    'a/../b',
    '~',
    '~foo/x',
    '$',
    '$foo/x',
    '$FOO',
    '$XDG_CONFIG_HOME',
    './x',
    'a/./b',
    'a//b',
    'a/',
  ]

  it.each(rejected)('rejects %j', (value) => {
    expect(isPortablePath(value)).toBe(false)
  })
})
