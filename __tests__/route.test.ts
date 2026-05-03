import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock AI SDK before importing route ───────────────────────────────────────

const mockStream = {
  toUIMessageStreamResponse: vi.fn(() => new Response('streamed', { status: 200 })),
}

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>()
  return {
    ...actual,
    streamText: vi.fn(() => mockStream),
    convertToModelMessages: vi.fn(async (msgs: unknown[]) => msgs),
    stepCountIs: vi.fn((n: number) => ({ type: 'stepCount', count: n })),
  }
})

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'mocked-model'),
}))

// ── Mock GitHub helpers ───────────────────────────────────────────────────────

vi.mock('../lib/github', () => ({
  parseUrl: vi.fn(() => ({ owner: 'vercel', repo: 'next.js', prNumber: 1 })),
  fetchPR: vi.fn(async () => ({
    title: 'Test PR',
    description: 'A description',
    author: 'dev',
    headSha: 'abc123',
    baseBranch: 'main',
  })),
  fetchDiff: vi.fn(async () => [
    { filename: 'index.ts', patch: '+const x = 1', additions: 1, deletions: 0 },
  ]),
}))

// ── Import route after mocks ──────────────────────────────────────────────────

import { POST } from '../app/api/chat/route'
import { streamText } from 'ai'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockStream.toUIMessageStreamResponse.mockReturnValue(new Response('streamed', { status: 200 }))
})

// ── Validation ────────────────────────────────────────────────────────────────

describe('POST /api/chat — validation', () => {
  it('returns 400 when messages field is missing', async () => {
    const res = await POST(makeRequest({ prUrl: 'https://github.com/a/b/pull/1' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/inválido/i)
  })

  it('returns 400 for invalid persona', async () => {
    const res = await POST(makeRequest({ messages: [], persona: 'rude' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON body edge case — non-array messages', async () => {
    const res = await POST(makeRequest({ messages: 'not-an-array' }))
    expect(res.status).toBe(400)
  })
})

// ── First turn ────────────────────────────────────────────────────────────────

describe('POST /api/chat — first turn', () => {
  const firstTurnBody = {
    messages: [{ role: 'user', parts: [{ type: 'text', text: 'Haz el review.' }] }],
    prUrl: 'https://github.com/vercel/next.js/pull/1',
    persona: 'strict',
  }

  it('responds 200 with stream on first turn', async () => {
    const res = await POST(makeRequest(firstTurnBody))
    expect(res.status).toBe(200)
  })

  it('calls streamText on first turn', async () => {
    await POST(makeRequest(firstTurnBody))
    expect(streamText).toHaveBeenCalledOnce()
  })

  it('injects PR context into system prompt on first turn', async () => {
    await POST(makeRequest(firstTurnBody))
    const call = vi.mocked(streamText).mock.calls[0][0]
    expect(call.system).toContain('CONTEXTO DEL PULL REQUEST')
    expect(call.system).toContain('Test PR')
    expect(call.system).toContain('vercel/next.js')
  })

  it('uses gpt-4o-mini model', async () => {
    await POST(makeRequest(firstTurnBody))
    const call = vi.mocked(streamText).mock.calls[0][0]
    const { openai } = await import('@ai-sdk/openai')
    expect(vi.mocked(openai)).toHaveBeenCalledWith('gpt-4o-mini')
  })

  it('includes tools on first turn', async () => {
    await POST(makeRequest(firstTurnBody))
    const call = vi.mocked(streamText).mock.calls[0][0]
    expect(call.tools).toHaveProperty('fetch_file_context')
    expect(call.tools).toHaveProperty('list_directory')
  })
})

// ── Follow-up turn ────────────────────────────────────────────────────────────

describe('POST /api/chat — follow-up turn', () => {
  const followUpBody = {
    messages: [
      { role: 'user', parts: [{ type: 'text', text: 'Haz el review.' }] },
      { role: 'assistant', parts: [{ type: 'text', text: '## Resumen...' }] },
      { role: 'user', parts: [{ type: 'text', text: '¿Cómo lo arreglo?' }] },
    ],
    prUrl: 'https://github.com/vercel/next.js/pull/1',
    persona: 'mentor',
  }

  it('does NOT inject PR context on follow-up turns', async () => {
    await POST(makeRequest(followUpBody))
    const call = vi.mocked(streamText).mock.calls[0][0]
    expect(call.system).not.toContain('CONTEXTO DEL PULL REQUEST')
  })

  it('still includes tools on follow-up turns', async () => {
    await POST(makeRequest(followUpBody))
    const call = vi.mocked(streamText).mock.calls[0][0]
    expect(call.tools).toHaveProperty('fetch_file_context')
  })

  it('uses mentor persona system prompt', async () => {
    await POST(makeRequest(followUpBody))
    const call = vi.mocked(streamText).mock.calls[0][0]
    expect(String(call.system).toLowerCase()).toMatch(/mentor/i)
  })
})

// ── No prUrl (no tools) ───────────────────────────────────────────────────────

describe('POST /api/chat — without prUrl', () => {
  it('works without prUrl and provides no tools', async () => {
    const res = await POST(makeRequest({
      messages: [{ role: 'user', parts: [{ type: 'text', text: 'Hola' }] }],
    }))
    expect(res.status).toBe(200)
    const call = vi.mocked(streamText).mock.calls[0][0]
    expect(call.tools).toEqual({})
  })
})
