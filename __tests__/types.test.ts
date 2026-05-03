import { describe, it, expect } from 'vitest'
import { chatRequestSchema } from '../lib/types'

describe('chatRequestSchema', () => {
  it('accepts valid request with all fields', () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: 'user', content: 'hola' }],
      prUrl: 'https://github.com/vercel/next.js/pull/1',
      persona: 'strict',
    })
    expect(result.success).toBe(true)
  })

  it('accepts request with only messages (follow-up turn)', () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: 'user', content: 'hola' }, { role: 'assistant', content: 'review' }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing messages field', () => {
    const result = chatRequestSchema.safeParse({ prUrl: 'https://github.com/a/b/pull/1' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid prUrl', () => {
    const result = chatRequestSchema.safeParse({
      messages: [],
      prUrl: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('rejects unknown persona', () => {
    const result = chatRequestSchema.safeParse({
      messages: [],
      persona: 'aggressive',
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid persona values', () => {
    for (const persona of ['strict', 'mentor', 'troll'] as const) {
      const result = chatRequestSchema.safeParse({ messages: [], persona })
      expect(result.success).toBe(true)
    }
  })

  it('defaults persona to undefined when not provided', () => {
    const result = chatRequestSchema.safeParse({ messages: [] })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.persona).toBeUndefined()
  })
})
