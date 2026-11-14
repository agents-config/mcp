import { describe, expect, it } from 'vitest'
import {
  mkdtempSync,
  rmSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readTextFile, writeFileAtomic, backupFile } from '$/src/core/fs-atomic'

function makeSandbox(): string {
  return mkdtempSync(join(tmpdir(), 'agents-mcp-fs-atomic-'))
}

describe('fs-atomic', () => {
  it('readTextFile returns null for missing files', () => {
    const dir = makeSandbox()
    try {
      expect(readTextFile(join(dir, 'does-not-exist.txt'))).toBeNull()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('readTextFile throws on other errors', () => {
    const dir = makeSandbox()
    try {
      // A directory cannot be read as a text file.
      expect(() => readTextFile(dir)).toThrow()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('writeFileAtomic round-trips content byte-stable', () => {
    const dir = makeSandbox()
    const path = join(dir, 'config.json')
    try {
      const content = '{"servers":{}}\n'
      writeFileAtomic(path, content)
      expect(readTextFile(path)).toBe(content)

      // Second write must be byte-identical.
      writeFileAtomic(path, content)
      expect(readTextFile(path)).toBe(content)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('writeFileAtomic overwrites existing content', () => {
    const dir = makeSandbox()
    const path = join(dir, 'config.json')
    try {
      writeFileAtomic(path, 'first\n')
      writeFileAtomic(path, 'second\n')
      expect(readTextFile(path)).toBe('second\n')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('writeFileAtomic respects mode option', () => {
    const dir = makeSandbox()
    const path = join(dir, '.env')
    try {
      writeFileAtomic(path, 'KEY=value\n', { mode: 0o600 })
      const content = readTextFile(path)
      expect(content).toBe('KEY=value\n')
      // On POSIX the file must be created with mode 0o600 (§8.1, .env).
      if (process.platform !== 'win32') {
        expect(statSync(path).mode & 0o777).toBe(0o600)
      }
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('writeFileAtomic puts temp file in the target directory (not in cwd)', () => {
    const dir = makeSandbox()
    const targetDir = join(dir, 'project', '.agents')
    const winPath = join(targetDir, 'mcp.json')
    try {
      writeFileAtomic(winPath, '{"servers":{}}\n')
      expect(readTextFile(winPath)).toBe('{"servers":{}}\n')
      // No temp file may leak into the sandbox root or the process cwd.
      const rootEntries = readdirSync(dir)
      expect(rootEntries.some((e) => e.startsWith('.agents-mcp-tmp-'))).toBe(
        false,
      )
      // The target directory itself must not retain a temp file after rename.
      const targetEntries = readdirSync(targetDir)
      expect(targetEntries.some((e) => e.startsWith('.agents-mcp-tmp-'))).toBe(
        false,
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('backupFile returns null when source missing', () => {
    const dir = makeSandbox()
    try {
      expect(backupFile(join(dir, 'missing.txt'))).toBeNull()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('backupFile creates a timestamped copy', () => {
    const dir = makeSandbox()
    const path = join(dir, 'config.json')
    try {
      writeFileSync(path, 'original\n')
      const backup = backupFile(path)
      expect(backup).toBeTruthy()
      expect(backup!.includes('.bak.')).toBe(true)
      expect(readTextFile(backup!)).toBe('original\n')
      // Original is untouched.
      expect(readTextFile(path)).toBe('original\n')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('concurrent writes do not collide', () => {
    const dir = makeSandbox()
    const path = join(dir, 'shared.json')
    try {
      const contents = Array.from({ length: 20 }, (_, i) => `write ${i}\n`)
      contents.forEach((c) => writeFileAtomic(path, c))
      // The last written content should be intact (no partial/corrupt file).
      const final = readTextFile(path)
      expect(final).toMatch(/^write \d+\n$/)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
