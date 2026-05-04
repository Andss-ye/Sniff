'use client'

import { useEffect, useRef, useState, FormEvent } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isTextUIPart, isToolUIPart, getToolName } from 'ai'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Persona } from '@/lib/types'
import ToolIndicator from './tool-indicator'

interface ChatWindowProps {
  prUrl: string
  persona: Persona
  onReset: () => void
}

export default function ChatWindow({ prUrl, persona, onReset }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const didSendRef = useRef(false)
  const [input, setInput] = useState('')

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { prUrl, persona },
    }),
  })

  useEffect(() => {
    if (didSendRef.current) return
    didSendRef.current = true
    sendMessage({ text: 'Review this PR' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isStreaming = status === 'streaming' || status === 'submitted'

  function submitMessage(e: FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    setInput('')
    sendMessage({ text: trimmed })
  }

  const repoLabel = (() => {
    try {
      const url = new URL(prUrl)
      const parts = url.pathname.split('/').filter(Boolean)
      return `${parts[0]}/${parts[1]} #${parts[3]}`
    } catch {
      return prUrl
    }
  })()

  const personaLabel: Record<Persona, string> = {
    strict: 'Strict Senior',
    mentor: 'Friendly Mentor',
    troll: 'Code Troll',
  }

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <a href="/" className="logo">Sniff</a>

        <div className="sidebar-section">
          <p className="sidebar-label">Pull Request</p>
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-pr-link"
          >
            {repoLabel}
          </a>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">Reviewer</p>
          <span className="sidebar-persona">{personaLabel[persona]}</span>
        </div>

        <button type="button" className="btn-new-review" onClick={onReset}>
          ← New review
        </button>
      </aside>

      {/* Main chat area */}
      <div className="chat-main">
        <div className="chat-messages">
          {messages.map((msg) => {
            if (msg.role === 'user') {
              const text = msg.parts.filter(isTextUIPart).map(p => p.text).join('')
              if (!text || text === 'Review this PR') return null
              return (
                <div key={msg.id} className="chat-msg chat-msg--user">
                  <div className="chat-bubble-user">{text}</div>
                </div>
              )
            }

            return (
              <div key={msg.id} className="chat-msg">
                <div className="chat-msg-inner">
                  {msg.parts.map((part, i) => {
                    if (isTextUIPart(part)) {
                      return (
                        <div key={i} className="chat-markdown">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {part.text}
                          </ReactMarkdown>
                        </div>
                      )
                    }
                    if (
                      isToolUIPart(part) &&
                      (part.state === 'input-streaming' || part.state === 'input-available')
                    ) {
                      return (
                        <ToolIndicator
                          key={i}
                          toolName={getToolName(part)}
                        />
                      )
                    }
                    return null
                  })}
                </div>
              </div>
            )
          })}

          {isStreaming && (messages.length === 0 || messages[messages.length - 1]?.role !== 'assistant') && (
            <div className="chat-msg">
              <div className="chat-msg-inner">
                <span className="chat-thinking">
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Chat input */}
        <form className="chat-input-bar" onSubmit={submitMessage}>
          <input
            className="chat-input"
            type="text"
            placeholder="Ask anything about this PR…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
          />
          <button
            type="submit"
            className="btn-send"
            disabled={isStreaming || !input.trim()}
          >
            Send →
          </button>
        </form>
      </div>
    </div>
  )
}
