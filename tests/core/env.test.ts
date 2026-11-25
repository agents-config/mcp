import { describe, expect, it } from 'vitest'
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import {
  appendToDotenv,
  applySecretExtraction,
  isSecretValue,
  parseDotenv,
  planSecretExtraction,
  readDotenv,
  resolveVar,
  syncEnvExample,
} from '$/src/core/env'
import { collectRequiredVars } from '$/src/core/placeholder'
import { createSandbox } from '$/tests/helpers/sandbox'
import type {
  CanonicalServer,
  StdioServer,
  StreamableHttpServer,
} from '$/src/core/schema'

describe('env.parseDotenv', () => {
  it('parses KEY=VALUE, quotes, comments, and export prefix', () => {
    const content = `# comment\nFOO=bar\nBAZ="quoted value"\nQUX='single'\nexport EMPTY=\nDUP=first\nDUP=second\n`
    const { vars } = parseDotenv(content)
    expect(vars).toEqual({
      FOO: 'bar',
      BAZ: 'quoted value',
      QUX: 'single',
      EMPTY: '',
      DUP: 'second',
    })
  })

  it('skips lines without equals and blank lines', () => {
    const { vars } = parseDotenv('\n\n# only comment\njustatext\n')
    expect(vars).toEqual({})
  })
})

describe('env.readDotenv', () => {
  it('returns empty vars for a missing file, no warning', () => {
    const { ctx, cleanup } = createSandbox()
    try {
      const result = readDotenv('project', ctx)
      expect(result.vars).toEqual({})
      expect(result.raw).toBeNull()
    } finally {
      cleanup()
    }
  })

  it('parses an existing project .env', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.env`
    try {
      mkdirSync(ctx.cwd, { recursive: true })
      writeFileSync(path, 'API_TOKEN=abc123\nNODE_ENV=production\n', 'utf8')
      const result = readDotenv('project', ctx)
      expect(result.vars).toEqual({
        API_TOKEN: 'abc123',
        NODE_ENV: 'production',
      })
    } finally {
      cleanup()
    }
  })

  it('parses an existing global .env under <homeDir>/.agents', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.homeDir}/.agents/.env`
    try {
      mkdirSync(`${ctx.homeDir}/.agents`, { recursive: true })
      writeFileSync(path, 'GLOBAL_KEY=val\n', 'utf8')
      const result = readDotenv('global', ctx)
      expect(result.vars).toEqual({ GLOBAL_KEY: 'val' })
    } finally {
      cleanup()
    }
  })
})

describe('env.resolveVar', () => {
  const dotenv = { API_TOKEN: 'from-dotenv', EMPTY: '' }
  const processEnv = { API_TOKEN: 'from-process', OTHER: 'env-var' }

  it('dotenv wins over process.env', () => {
    const result = resolveVar('API_TOKEN', { dotenv, processEnv })
    expect(result.value).toBe('from-dotenv')
    expect(result.source).toBe('dotenv')
  })

  it('falls back to process.env when dotenv lacks the key', () => {
    const result = resolveVar('OTHER', { dotenv, processEnv })
    expect(result.value).toBe('env-var')
    expect(result.source).toBe('processEnv')
  })

  it('uses fallback when neither source has the key', () => {
    const result = resolveVar('MISSING', { dotenv, processEnv, fallback: 'fb' })
    expect(result.value).toBe('fb')
    expect(result.source).toBe('fallback')
  })

  it('treats an empty dotenv value as unset and falls through', () => {
    const result = resolveVar('EMPTY', { dotenv, processEnv, fallback: 'fb' })
    expect(result.value).toBe('fb')
    expect(result.source).toBe('fallback')
  })

  it('returns unset when nothing resolves', () => {
    const result = resolveVar('MISSING', { dotenv, processEnv })
    expect(result.value).toBeUndefined()
    expect(result.source).toBe('unset')
  })
})

describe('env.isSecretValue', () => {
  it('detects known prefixes at start of string', () => {
    expect(isSecretValue('ghp_1234567890abcdef')).toBe(true)
    expect(isSecretValue('sk-1234567890abcdef1234')).toBe(true)
    expect(isSecretValue('xoxb-1234567890')).toBe(true)
    expect(isSecretValue('AIzaSyAbcdef1234567890')).toBe(true)
    expect(isSecretValue('AKIAIOSFODNN7EXAMPLE')).toBe(true)
  })

  it('detects known prefixes after Bearer / Basic / Token', () => {
    expect(isSecretValue('Bearer sk-1234567890abcdef1234')).toBe(true)
    expect(isSecretValue('Token ghp_1234567890abcdef')).toBe(true)
    // Low-entropy token after Bearer is not a secret value by itself.
    expect(isSecretValue('Bearer production')).toBe(false)
  })

  it('detects URL credentials', () => {
    expect(isSecretValue('https://user:pass@api.example.com/mcp')).toBe(true)
  })

  it('detects high-entropy strings (≥ 20 chars, ≥ 3 char classes)', () => {
    expect(isSecretValue('Abcdef1234567890!@#$')).toBe(true)
  })

  it('rejects non-secrets: plain values, URLs, paths, short strings', () => {
    expect(isSecretValue('production')).toBe(false)
    expect(isSecretValue('NODE_ENV')).toBe(false)
    expect(isSecretValue('https://api.example.com/mcp')).toBe(false)
    expect(isSecretValue('/usr/local/bin/server')).toBe(false)
    expect(isSecretValue('C:\\Windows\\system32')).toBe(false)
    expect(isSecretValue('short')).toBe(false)
  })
})

describe('env.planSecretExtraction', () => {
  const stdioServer: CanonicalServer = {
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@scope/pkg'],
    env: {
      API_TOKEN: 'ghp_1234567890abcdef',
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://user:pass@host/db',
    },
  }

  const httpServer: CanonicalServer = {
    type: 'streamable-http',
    url: 'https://api.example.com/mcp',
    headers: { Authorization: 'sk-live_1234567890abcdef' },
  }

  it('derives env var names from serverName (not command)', () => {
    const result = planSecretExtraction('github', stdioServer, {
      policy: 'extract',
    })
    const keys = result.writes.map((w) => w.key)
    expect(keys).toContain('GITHUB_API_TOKEN')
    expect(keys).not.toContain('NPX_API_TOKEN')
  })

  it('does not flag non-secret values such as NODE_ENV=production', () => {
    const result = planSecretExtraction('github', stdioServer, {
      policy: 'extract',
    })
    const keys = result.writes.map((w) => w.key)
    expect(keys).not.toContain('GITHUB_NODE_ENV')
    expect(result.writes.length).toBeGreaterThan(0)
  })

  it('flags secret key patterns regardless of value', () => {
    const result = planSecretExtraction('github', stdioServer, {
      policy: 'extract',
    })
    const keys = result.writes.map((w) => w.key)
    expect(keys).toContain('GITHUB_API_TOKEN')
  })

  it('flags secret value prefixes and URL credentials', () => {
    const httpServerWithCreds: CanonicalServer = {
      type: 'streamable-http',
      url: 'https://user:pass@api.example.com/mcp',
      headers: { Authorization: 'sk-live_1234567890abcdef' },
    }
    const result = planSecretExtraction('linear', httpServerWithCreds, {
      policy: 'extract',
    })
    const keys = result.writes.map((w) => w.key)
    expect(keys).toContain('LINEAR_AUTHORIZATION')
    expect(keys).toContain('LINEAR_URL')
  })

  it('does not flag a plain URL without embedded credentials', () => {
    const result = planSecretExtraction('linear', httpServer, {
      policy: 'extract',
    })
    const keys = result.writes.map((w) => w.key)
    expect(keys).toContain('LINEAR_AUTHORIZATION')
    expect(keys).not.toContain('LINEAR_URL')
  })

  it('warn policy produces warnings but no writes', () => {
    const result = planSecretExtraction('github', stdioServer, {
      policy: 'warn',
    })
    expect(result.writes).toEqual([])
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('extract policy produces writes', () => {
    const result = planSecretExtraction('github', stdioServer, {
      policy: 'extract',
    })
    expect(result.writes.length).toBeGreaterThan(0)
    for (const w of result.writes) {
      expect(w.key).toBeDefined()
      expect(w.value).toBeDefined()
    }
  })

  it('never flags values already wrapped in ${...}', () => {
    const symbolic: CanonicalServer = {
      type: 'streamable-http',
      url: 'https://x/mcp',
      headers: { Authorization: 'Bearer ${API_TOKEN}' },
    }
    const result = planSecretExtraction('linear', symbolic, {
      policy: 'extract',
    })
    expect(result.writes).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it('handles SSE servers for secret extraction', () => {
    const sseServer: CanonicalServer = {
      type: 'sse',
      url: 'https://api.example.com/sse',
      headers: { Authorization: 'sk-live_sse1234567890abcdef' },
    }
    const result = planSecretExtraction('linear', sseServer, {
      policy: 'extract',
    })
    const keys = result.writes.map((w) => w.key)
    expect(keys).toContain('LINEAR_AUTHORIZATION')
    expect(keys).not.toContain('LINEAR_URL')
  })

  it('detects Authorization Bearer token with structured replacement metadata', () => {
    const server: CanonicalServer = {
      type: 'streamable-http',
      url: 'https://api.example.com/mcp',
      headers: { Authorization: 'Bearer sk-1234567890abcdef1234' },
    }
    const result = planSecretExtraction('linear', server, {
      policy: 'extract',
    })
    const authWrite = result.writes.find(
      (w) => w.key === 'LINEAR_AUTHORIZATION',
    )
    expect(authWrite).toBeDefined()
    expect(authWrite!.value).toBe('sk-1234567890abcdef1234')

    const rep = result.replacements.find((r) => r.location === 'headers')
    expect(rep).toBeDefined()
    expect(rep!.fieldKey).toBe('Authorization')
    expect(rep!.match).toBe('sk-1234567890abcdef1234')
    expect(rep!.envKey).toBe('LINEAR_AUTHORIZATION')
    expect(rep!.secretValue).toBe('sk-1234567890abcdef1234')
  })

  it('detects high-entropy tokens (≥ 20 chars, 3 char classes)', () => {
    const server: CanonicalServer = {
      type: 'stdio',
      command: 'mcp-server',
      args: [],
      env: { API_TOKEN: 'Abcdef1234567890!@#$' },
    }
    const result = planSecretExtraction('entropy', server, {
      policy: 'extract',
    })
    const keys = result.writes.map((w) => w.key)
    expect(keys).toContain('ENTROPY_API_TOKEN')
  })

  it('does not flag high-entropy false positives (plain URLs, paths, short values)', () => {
    const server: CanonicalServer = {
      type: 'streamable-http',
      url: 'https://api.example.com/v1/mcp',
      headers: { 'X-Nonce': 'nonce123' },
    }
    const result = planSecretExtraction('entropy', server, {
      policy: 'extract',
    })
    expect(result.writes).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it('detects positional secret in args with argIndex', () => {
    const server: CanonicalServer = {
      type: 'stdio',
      command: 'mcp-server',
      args: ['--token', 'ghp_1234567890abcdef'],
      env: {},
    }
    const result = planSecretExtraction('cli', server, {
      policy: 'extract',
    })
    const keys = result.writes.map((w) => w.key)
    expect(keys).toContain('CLI_ARGS')
    const rep = result.replacements.find((r) => r.location === 'args')
    expect(rep).toBeDefined()
    expect(rep!.argIndex).toBe(1)
    expect(rep!.match).toBe('ghp_1234567890abcdef')
    expect(rep!.envKey).toBe('CLI_ARGS')
  })

  it('URL credentials replacement keeps the @ and host', () => {
    const server: CanonicalServer = {
      type: 'streamable-http',
      url: 'https://user:pass@api.example.com/mcp',
    }
    const result = planSecretExtraction('db', server, {
      policy: 'extract',
    })
    const rep = result.replacements.find((r) => r.location === 'url')
    expect(rep).toBeDefined()
    expect(rep!.fieldKey).toBe('url')
    expect(rep!.match).toBe('user:pass')
    expect(rep!.secretValue).toBe('user:pass')
  })

  it('avoids cross-server collisions: same field key, different server names', () => {
    const a = planSecretExtraction('alpha', stdioServer, {
      policy: 'extract',
    })
    const b = planSecretExtraction('beta', stdioServer, {
      policy: 'extract',
    })
    const aKeys = a.writes.map((w) => w.key)
    const bKeys = b.writes.map((w) => w.key)
    expect(aKeys).toContain('ALPHA_API_TOKEN')
    expect(bKeys).toContain('BETA_API_TOKEN')
    expect(aKeys).not.toContain('BETA_API_TOKEN')
    expect(bKeys).not.toContain('ALPHA_API_TOKEN')
  })
})

describe('env.applySecretExtraction', () => {
  it('replaces Authorization Bearer token preserving the Bearer prefix', () => {
    const server: CanonicalServer = {
      type: 'streamable-http',
      url: 'https://api.example.com/mcp',
      headers: { Authorization: 'Bearer sk-1234567890abcdef1234' },
    }
    const plan = planSecretExtraction('linear', server, {
      policy: 'extract',
    })
    const result = applySecretExtraction(server, plan) as StreamableHttpServer
    expect(result.headers).toEqual({
      Authorization: 'Bearer ${LINEAR_AUTHORIZATION}',
    })
    expect(result.url).toBe('https://api.example.com/mcp')
  })

  it('replaces positional secret in args', () => {
    const server: CanonicalServer = {
      type: 'stdio',
      command: 'mcp-server',
      args: ['--token', 'ghp_1234567890abcdef'],
      env: {},
    }
    const plan = planSecretExtraction('cli', server, { policy: 'extract' })
    const result = applySecretExtraction(server, plan) as StdioServer
    expect(result.args).toEqual(['--token', '${CLI_ARGS}'])
  })

  it('replaces URL credentials keeping scheme, @ and host', () => {
    const server: CanonicalServer = {
      type: 'streamable-http',
      url: 'https://user:pass@api.example.com/mcp',
    }
    const plan = planSecretExtraction('db', server, { policy: 'extract' })
    const result = applySecretExtraction(server, plan) as StreamableHttpServer
    expect(result.url).toBe('https://${DB_URL}@api.example.com/mcp')
  })

  it('replaces env secrets by field key', () => {
    const server: CanonicalServer = {
      type: 'stdio',
      command: 'mcp-server',
      args: [],
      env: { API_TOKEN: 'ghp_1234567890abcdef', NODE_ENV: 'production' },
    }
    const plan = planSecretExtraction('cli', server, { policy: 'extract' })
    const result = applySecretExtraction(server, plan) as StdioServer
    expect(result.env).toEqual({
      API_TOKEN: '${CLI_API_TOKEN}',
      NODE_ENV: 'production',
    })
  })

  it('does not mutate the input server (pure)', () => {
    const server: CanonicalServer = {
      type: 'stdio',
      command: 'mcp-server',
      args: ['--token', 'ghp_1234567890abcdef'],
      env: { API_TOKEN: 'ghp_1234567890abcdef' },
    }
    const plan = planSecretExtraction('cli', server, { policy: 'extract' })
    const result = applySecretExtraction(server, plan) as StdioServer
    // Input untouched.
    expect(server.args).toEqual(['--token', 'ghp_1234567890abcdef'])
    expect(server.env).toEqual({ API_TOKEN: 'ghp_1234567890abcdef' })
    // Output replaced.
    expect(result.args).toEqual(['--token', '${CLI_ARGS}'])
    expect(result.env).toEqual({ API_TOKEN: '${CLI_API_TOKEN}' })
  })

  it('returns an equivalent server when there are no replacements', () => {
    const server: CanonicalServer = {
      type: 'streamable-http',
      url: 'https://api.example.com/mcp',
      headers: { 'X-Nonce': 'abc' },
    }
    const plan = planSecretExtraction('safe', server, { policy: 'extract' })
    const result = applySecretExtraction(server, plan)
    expect(result).toEqual(server)
  })
})

describe('env.appendToDotenv', () => {
  it('creates a new .env with mode 0600 on POSIX', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.env`
    try {
      const result = appendToDotenv(path, [{ key: 'API_TOKEN', value: 'abc' }])
      expect(result.added).toEqual(['API_TOKEN'])
      expect(readFileSync(path, 'utf8')).toBe('API_TOKEN=abc\n')
      if (process.platform !== 'win32') {
        expect(statSync(path).mode & 0o777).toBe(0o600)
      }
    } finally {
      cleanup()
    }
  })

  it('never overwrites an existing key; warns on differing value', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.env`
    try {
      mkdirSync(ctx.cwd, { recursive: true })
      writeFileSync(path, 'API_TOKEN=original\n', 'utf8')
      const result = appendToDotenv(path, [
        { key: 'API_TOKEN', value: 'new' },
        { key: 'NEW_KEY', value: 'val' },
      ])
      expect(result.added).toEqual(['NEW_KEY'])
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(readFileSync(path, 'utf8')).toContain('API_TOKEN=original')
      expect(readFileSync(path, 'utf8')).toContain('NEW_KEY=val')
    } finally {
      cleanup()
    }
  })

  it('does not rewrite when nothing to add', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.env`
    try {
      mkdirSync(ctx.cwd, { recursive: true })
      writeFileSync(path, 'API_TOKEN=original\n', 'utf8')
      const before = readFileSync(path, 'utf8')
      const result = appendToDotenv(path, [{ key: 'API_TOKEN', value: 'x' }])
      expect(result.added).toEqual([])
      expect(readFileSync(path, 'utf8')).toBe(before)
    } finally {
      cleanup()
    }
  })
})

describe('env.syncEnvExample', () => {
  it('appends missing KEY= entries only, never values', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.env.example`
    try {
      mkdirSync(ctx.cwd, { recursive: true })
      writeFileSync(path, '# header\nEXISTING=old\n', 'utf8')
      const result = syncEnvExample(path, ['EXISTING', 'NEW_KEY', 'ANOTHER'])
      expect(result.added).toEqual(['NEW_KEY', 'ANOTHER'])
      const content = readFileSync(path, 'utf8')
      expect(content).toContain('EXISTING=old')
      expect(content).toContain('NEW_KEY=')
      expect(content).toContain('ANOTHER=')
      expect(content).not.toContain('=old-value')
    } finally {
      cleanup()
    }
  })

  it('preserves order and comments', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.env.example`
    try {
      mkdirSync(ctx.cwd, { recursive: true })
      writeFileSync(path, '# first\nA=1\n# second\nB=2\n', 'utf8')
      syncEnvExample(path, ['A', 'C'])
      const content = readFileSync(path, 'utf8')
      const lines = content.split(/\r?\n/)
      // Drop the single trailing '' artifact from the final newline.
      if (lines[lines.length - 1] === '') lines.pop()
      expect(lines).toEqual(['# first', 'A=1', '# second', 'B=2', 'C='])
    } finally {
      cleanup()
    }
  })

  it('creates .env.example when missing', () => {
    const { ctx, cleanup } = createSandbox()
    const path = `${ctx.cwd}/.env.example`
    try {
      mkdirSync(ctx.cwd, { recursive: true })
      const result = syncEnvExample(path, ['KEY_ONE'])
      expect(result.added).toEqual(['KEY_ONE'])
      expect(readFileSync(path, 'utf8')).toBe('KEY_ONE=\n')
    } finally {
      cleanup()
    }
  })
})

describe('env.collectRequiredVarsForServer', () => {
  it('collects placeholder names from env, headers, args, and url', () => {
    const server: CanonicalServer = {
      type: 'streamable-http',
      url: 'https://api.example.com/${PATH}',
      headers: { Authorization: 'Bearer ${TOKEN}' },
    }
    // http servers don't have args/env, but url and headers are scanned.
    const result = collectRequiredVars(server)
    const names = result.map((v) => v.name)
    expect(names).toContain('PATH')
    expect(names).toContain('TOKEN')
  })

  it('collects from SSE servers', () => {
    const server: CanonicalServer = {
      type: 'sse',
      url: 'https://api.example.com/${PATH}',
      headers: { Authorization: 'Bearer ${TOKEN}' },
    }
    const result = collectRequiredVars(server)
    const names = result.map((v) => v.name)
    expect(names).toContain('PATH')
    expect(names).toContain('TOKEN')
  })

  it('derives isSecret from the secret key pattern', () => {
    const server: CanonicalServer = {
      type: 'stdio',
      command: 'npx',
      args: [],
      env: { API_TOKEN: '${T}', NODE_ENV: '${E}' },
    }
    const result = collectRequiredVars(server)
    const byName = Object.fromEntries(result.map((v) => [v.name, v.isSecret]))
    expect(byName['T']).toBe(true)
    expect(byName['E']).toBe(false)
  })
})
