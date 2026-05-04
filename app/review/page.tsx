'use client'

import { useState } from 'react'
import { Persona } from '@/lib/types'
import ReviewForm from '@/components/review-form'
import ChatWindow from '@/components/chat-window'
import './review.css'

export default function ReviewPage() {
  const [session, setSession] = useState<{ prUrl: string; persona: Persona } | null>(null)

  return (
    <div className="review-page">
      {session ? (
        <ChatWindow
          prUrl={session.prUrl}
          persona={session.persona}
          onReset={() => setSession(null)}
        />
      ) : (
        <div className="review-scene">
          <nav>
            <div className="nav-inner">
              <a href="/" className="logo">Sniff</a>
              <ul className="nav-links">
                <li><a href="/">Home</a></li>
                <li><a href="/#features">Features</a></li>
                <li><a href="/#about">How it works</a></li>
              </ul>
              <a href="/review" className="btn-nav nav-active-pill">Trial</a>
            </div>
          </nav>

          <ReviewForm onSubmit={(prUrl, persona) => setSession({ prUrl, persona })} />
        </div>
      )}
    </div>
  )
}
