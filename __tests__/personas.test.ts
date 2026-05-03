import { describe, it, expect } from 'vitest'
import { getPersona } from '../lib/personas'
import type { Persona } from '../lib/types'

describe('getPersona', () => {
  const personas: Persona[] = ['strict', 'mentor', 'troll']

  it('returns a non-empty string for each persona', () => {
    for (const p of personas) {
      const prompt = getPersona(p)
      expect(typeof prompt).toBe('string')
      expect(prompt.length).toBeGreaterThan(100)
    }
  })

  it('all prompts include the required review sections', () => {
    for (const p of personas) {
      const prompt = getPersona(p)
      expect(prompt).toContain('Resumen')
      expect(prompt).toContain('Problemas')
      expect(prompt).toContain('Lo bueno')
      expect(prompt).toContain('Veredicto')
    }
  })

  it('each persona generates a distinct prompt', () => {
    const prompts = personas.map(getPersona)
    const [strict, mentor, troll] = prompts
    expect(strict).not.toBe(mentor)
    expect(mentor).not.toBe(troll)
    expect(strict).not.toBe(troll)
  })

  it('strict prompt contains strictness indicators', () => {
    const prompt = getPersona('strict')
    expect(prompt.toLowerCase()).toMatch(/strict|riguroso|directo|sin rodeos/i)
  })

  it('mentor prompt contains mentoring indicators', () => {
    const prompt = getPersona('mentor')
    expect(prompt.toLowerCase()).toMatch(/mentor|explica|paso a paso|por qué/i)
  })

  it('troll prompt contains humor indicators', () => {
    const prompt = getPersona('troll')
    expect(prompt.toLowerCase()).toMatch(/troll|sarcas|iróni|humor/i)
  })

  it('no persona contains the unfilled template placeholder', () => {
    for (const p of personas) {
      expect(getPersona(p)).not.toContain('{bloque_personalidad}')
    }
  })

  it('all prompts mention available tools', () => {
    for (const p of personas) {
      const prompt = getPersona(p)
      expect(prompt).toMatch(/fetch_file_context|list_directory/i)
    }
  })
})
