'use client'

import { useState, FormEvent } from 'react'
import { Persona } from '@/lib/types'

interface ReviewFormProps {
  onSubmit: (prUrl: string, persona: Persona) => void
}

const PERSONAS: { id: Persona; label: string; desc: string; color: string }[] = [
  {
    id: 'strict',
    label: 'Strict Senior',
    desc: 'Zero tolerance, production-grade standards',
    color: 'persona-pink',
  },
  {
    id: 'mentor',
    label: 'Friendly Mentor',
    desc: 'Guides with patience and explains the why',
    color: 'persona-yellow',
  },
  {
    id: 'troll',
    label: 'Code Troll',
    desc: 'Brutal honesty with sarcastic flair',
    color: 'persona-green',
  },
]

export default function ReviewForm({ onSubmit }: ReviewFormProps) {
  const [prUrl, setPrUrl] = useState('')
  const [persona, setPersona] = useState<Persona>('strict')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = prUrl.trim()
    if (!trimmed) {
      setError('Please paste a GitHub PR URL.')
      return
    }
    if (!/^https:\/\/github\.com\/.+\/.+\/pull\/\d+/.test(trimmed)) {
      setError('Must be a valid GitHub PR URL — e.g. https://github.com/owner/repo/pull/123')
      return
    }
    setError('')
    onSubmit(trimmed, persona)
  }

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>
      <div className="section-badge review-badge">
        <span className="badge-dot" />
        PR Review
      </div>

      <h1 className="review-headline animate-fade-rise">
        Paste a PR, get an{' '}
        <span className="accent-italic">instant review.</span>
      </h1>

      <p className="review-sub animate-fade-rise-delay">
        Sniff reads your diff, understands the context, and hands you a full
        code review — then stays online for all the follow-up.
      </p>

      <div className="review-url-wrap animate-fade-rise-delay">
        <label className="review-label" htmlFor="pr-url">
          GitHub Pull Request URL
        </label>
        <input
          id="pr-url"
          className={`review-input${error ? ' review-input-error' : ''}`}
          type="url"
          placeholder="https://github.com/owner/repo/pull/123"
          value={prUrl}
          onChange={(e) => { setPrUrl(e.target.value); setError('') }}
          autoComplete="off"
          spellCheck={false}
        />
        {error && <p className="review-error">{error}</p>}
      </div>

      <div className="review-persona-wrap animate-fade-rise-delay-2">
        <p className="review-label">Choose your reviewer</p>
        <div className="persona-grid">
          {PERSONAS.map(({ id, label, desc, color }) => (
            <button
              key={id}
              type="button"
              className={`persona-card ${color}${persona === id ? ' persona-active' : ''}`}
              onClick={() => setPersona(id)}
            >
              <span className="persona-name">{label}</span>
              <span className="persona-desc">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      <button type="submit" className="btn-review animate-fade-rise-delay-2">
        Start review →
      </button>

      <div className="hero-rule animate-fade-rise-delay-2">
        <span className="r1" />
        <span className="r2" />
        <span className="r3" />
        <span className="r4" />
      </div>
    </form>
  )
}
