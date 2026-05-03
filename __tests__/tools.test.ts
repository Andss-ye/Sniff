import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTools } from '../lib/tools'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => data })
}

function mockError(status: number) {
  mockFetch.mockResolvedValueOnce({ ok: false, status, statusText: 'Error' })
}

beforeEach(() => mockFetch.mockReset())

describe('createTools', () => {
  const tools = createTools('owner', 'repo', 'abc123')

  it('returns fetch_file_context and list_directory tools', () => {
    expect(tools).toHaveProperty('fetch_file_context')
    expect(tools).toHaveProperty('list_directory')
  })

  it('tools have description and inputSchema', () => {
    expect(tools.fetch_file_context.description).toBeTruthy()
    expect(tools.fetch_file_context.inputSchema).toBeDefined()
    expect(tools.list_directory.description).toBeTruthy()
    expect(tools.list_directory.inputSchema).toBeDefined()
  })
})

describe('fetch_file_context tool', () => {
  it('returns file content on success', async () => {
    const tools = createTools('owner', 'repo', 'sha1')
    const content = 'export const x = 1'
    const encoded = Buffer.from(content).toString('base64')
    mockOk({ type: 'file', content: encoded })

    const result = await tools.fetch_file_context.execute!({ path: 'src/x.ts' }, {} as any)
    expect(result).toMatchObject({ path: 'src/x.ts', content })
  })

  it('returns error object on failure', async () => {
    const tools = createTools('owner', 'repo', 'sha1')
    mockError(404)

    const result = await tools.fetch_file_context.execute!({ path: 'missing.ts' }, {} as any)
    expect(result).toHaveProperty('error')
  })
})

describe('list_directory tool', () => {
  it('returns file list on success', async () => {
    const tools = createTools('owner', 'repo', 'sha1')
    mockOk([{ name: 'index.ts' }, { name: 'utils.ts' }])

    const result = await tools.list_directory.execute!({ path: 'src' }, {} as any)
    expect(result).toMatchObject({ path: 'src', files: ['index.ts', 'utils.ts'] })
  })

  it('uses "/" as path when empty string given', async () => {
    const tools = createTools('owner', 'repo', 'sha1')
    mockOk([{ name: 'package.json' }])

    const result = await tools.list_directory.execute!({ path: '' }, {} as any)
    expect(result).toMatchObject({ path: '/' })
  })

  it('returns error object on failure', async () => {
    const tools = createTools('owner', 'repo', 'sha1')
    mockError(500)

    const result = await tools.list_directory.execute!({ path: 'bad' }, {} as any)
    expect(result).toHaveProperty('error')
  })

  it('different createTools calls use their own owner/repo/ref', async () => {
    const tools1 = createTools('org1', 'repo1', 'sha-a')
    const tools2 = createTools('org2', 'repo2', 'sha-b')

    mockOk([{ name: 'f1.ts' }])
    mockOk([{ name: 'f2.ts' }])

    await tools1.list_directory.execute!({ path: '' }, {} as any)
    await tools2.list_directory.execute!({ path: '' }, {} as any)

    const [call1, call2] = mockFetch.mock.calls
    expect(call1[0]).toContain('org1/repo1')
    expect(call1[0]).toContain('sha-a')
    expect(call2[0]).toContain('org2/repo2')
    expect(call2[0]).toContain('sha-b')
  })
})
