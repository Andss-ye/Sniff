import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseUrl, fetchPR, fetchDiff, fetchFileContent, listDirectory } from '../lib/github'

// ── parseUrl (pure function, no mocks needed) ────────────────────────────────

describe('parseUrl', () => {
  it('parses a valid PR URL', () => {
    const result = parseUrl('https://github.com/vercel/next.js/pull/123')
    expect(result).toEqual({ owner: 'vercel', repo: 'next.js', prNumber: 123 })
  })

  it('parses URL with trailing slash', () => {
    const result = parseUrl('https://github.com/owner/repo/pull/42/')
    expect(result).toEqual({ owner: 'owner', repo: 'repo', prNumber: 42 })
  })

  it('throws on invalid URL', () => {
    expect(() => parseUrl('https://github.com/owner/repo')).toThrow('URL de PR inválida')
    expect(() => parseUrl('not-a-url')).toThrow('URL de PR inválida')
    expect(() => parseUrl('')).toThrow('URL de PR inválida')
  })

  it('throws when PR number is missing', () => {
    expect(() => parseUrl('https://github.com/owner/repo/issues/1')).toThrow('URL de PR inválida')
  })
})

// ── fetch-based functions (mocked fetch) ─────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  })
}

function mockError(status: number, statusText = 'Error') {
  mockFetch.mockResolvedValueOnce({ ok: false, status, statusText })
}

beforeEach(() => mockFetch.mockReset())

// ── fetchPR ──────────────────────────────────────────────────────────────────

describe('fetchPR', () => {
  it('returns PRData from GitHub API response', async () => {
    mockOk({
      title: 'Fix auth bug',
      body: 'Closes #10',
      user: { login: 'dev1' },
      head: { sha: 'abc123' },
      base: { ref: 'main' },
    })

    const pr = await fetchPR('owner', 'repo', 5)
    expect(pr).toEqual({
      title: 'Fix auth bug',
      description: 'Closes #10',
      author: 'dev1',
      headSha: 'abc123',
      baseBranch: 'main',
    })
  })

  it('uses empty strings for missing fields', async () => {
    mockOk({ title: 'Minimal PR' })
    const pr = await fetchPR('o', 'r', 1)
    expect(pr.author).toBe('unknown')
    expect(pr.headSha).toBe('')
    expect(pr.baseBranch).toBe('main')
    expect(pr.description).toBe('')
  })

  it('throws on 404', async () => {
    mockError(404, 'Not Found')
    await expect(fetchPR('owner', 'repo', 999)).rejects.toThrow('no encontrado')
  })

  it('throws on other HTTP errors', async () => {
    mockError(403, 'Forbidden')
    await expect(fetchPR('owner', 'repo', 1)).rejects.toThrow('403')
  })
})

// ── fetchDiff ────────────────────────────────────────────────────────────────

describe('fetchDiff', () => {
  const files = [
    { filename: 'a.ts', patch: '+1', additions: 10, deletions: 2 },
    { filename: 'b.ts', patch: '+2', additions: 5, deletions: 5 },
    { filename: 'c.ts', patch: '+3', additions: 20, deletions: 0 },
    { filename: 'd.ts', patch: '+4', additions: 1, deletions: 1 },
  ]

  it('returns top 3 files sorted by total changes', async () => {
    mockOk(files)
    const diffs = await fetchDiff('owner', 'repo', 1)
    expect(diffs).toHaveLength(3)
    expect(diffs[0].filename).toBe('c.ts') // 20 changes
    expect(diffs[1].filename).toBe('a.ts') // 12 changes
    expect(diffs[2].filename).toBe('b.ts') // 10 changes
  })

  it('returns all files when fewer than 3', async () => {
    mockOk([files[0], files[1]])
    const diffs = await fetchDiff('owner', 'repo', 1)
    expect(diffs).toHaveLength(2)
  })

  it('handles missing patch field gracefully', async () => {
    mockOk([{ filename: 'x.ts', additions: 1, deletions: 0 }])
    const diffs = await fetchDiff('owner', 'repo', 1)
    expect(diffs[0].patch).toBe('')
  })

  it('throws on API error', async () => {
    mockError(500, 'Internal Server Error')
    await expect(fetchDiff('owner', 'repo', 1)).rejects.toThrow('500')
  })
})

// ── fetchFileContent ──────────────────────────────────────────────────────────

describe('fetchFileContent', () => {
  it('decodes base64 content', async () => {
    const original = 'const x = 1;\nconst y = 2;'
    const encoded = Buffer.from(original).toString('base64')
    mockOk({ type: 'file', content: encoded })
    const result = await fetchFileContent('owner', 'repo', 'src/x.ts', 'abc')
    expect(result).toBe(original)
  })

  it('truncates files longer than 200 lines', async () => {
    const lines = Array.from({ length: 250 }, (_, i) => `line ${i + 1}`)
    const encoded = Buffer.from(lines.join('\n')).toString('base64')
    mockOk({ type: 'file', content: encoded })
    const result = await fetchFileContent('o', 'r', 'big.ts', 'ref')
    const resultLines = result.split('\n')
    // First 200 lines + truncation notice
    expect(resultLines[0]).toBe('line 1')
    expect(result).toContain('truncado')
  })

  it('throws on 404', async () => {
    mockError(404)
    await expect(fetchFileContent('o', 'r', 'missing.ts', 'ref')).rejects.toThrow('no encontrado')
  })

  it('throws when path is a directory', async () => {
    mockOk({ type: 'dir' })
    await expect(fetchFileContent('o', 'r', 'src', 'ref')).rejects.toThrow('no es un archivo')
  })
})

// ── listDirectory ─────────────────────────────────────────────────────────────

describe('listDirectory', () => {
  it('returns file names from directory listing', async () => {
    mockOk([
      { name: 'index.ts', type: 'file' },
      { name: 'utils', type: 'dir' },
    ])
    const result = await listDirectory('owner', 'repo', 'src', 'main')
    expect(result).toEqual(['index.ts', 'utils'])
  })

  it('throws when path is a file, not a directory', async () => {
    mockOk({ type: 'file', name: 'index.ts' })
    await expect(listDirectory('o', 'r', 'src/index.ts', 'main')).rejects.toThrow('no es un directorio')
  })

  it('throws on 404', async () => {
    mockError(404)
    await expect(listDirectory('o', 'r', 'nonexistent', 'main')).rejects.toThrow('no encontrado')
  })
})
