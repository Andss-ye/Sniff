# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sniff — PR review as a working session, not a report. Users paste a public GitHub PR URL, pick a reviewer personality (strict, mentor, troll), get a streaming code review, and then keep working with the same agent: ask for the corrected code, explore how a fix would affect other files, understand a teammate's PR before approving it. The agent has tools to explore the repo beyond the diff, and the full PR context persists across the conversation. Unlike CodeRabbit/Copilot which generate a report and stop, Sniff keeps the agent available for the actual work that follows the review.

Built for a Vercel/v0 hackathon. See `pr-reviewer-claude-code-spec.md` for the full spec and `TASKS.md` for the dev task split.

## Stack

- Next.js 15 (App Router, TypeScript)
- Vercel AI SDK (`ai`, `@ai-sdk/openai`) with `gpt-4o-mini` via Vercel AI Gateway
- shadcn/ui + Tailwind (UI generated with v0)
- GitHub REST API (unauthenticated, public repos only)
- Deploy on Vercel (Node.js runtime, not Edge)

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
```

## Architecture

```
app/page.tsx                  # Single page: form → collapses into chat window after submit
app/api/chat/route.ts         # POST endpoint — handles both initial review and follow-up chat turns
lib/github.ts                 # GitHub REST helpers: parseUrl, fetchPR, fetchDiff, fetchFileContent
lib/personas.ts               # 3 system prompts covering both review format and chat behavior
lib/tools.ts                  # 2 AI SDK tools: fetch_file_context, list_directory
lib/types.ts                  # Interfaces extraidas de github.ts: PRData, FileDiff, Persona, ReviewRequest
components/review-form.tsx    # URL input + personality selector (shown before first submit)
components/chat-window.tsx    # Message history + chat input (shown after first submit)
components/tool-indicator.tsx # Badge shown when agent is fetching files
```

**Data flow:** `useChat` sends `POST /api/chat` with `{ messages, prUrl, persona }` → on first turn, route fetches PR data and injects context into system prompt → `streamText()` with tools → `toDataStreamResponse()` → subsequent turns reuse same endpoint, context lives in message history.

**Key design:** The review and follow-up chat are the same mechanism (`useChat`). The first user message triggers the structured review; subsequent messages are open-ended. The PR context (owner, repo, headSha) is stored in the system prompt so tools work across all turns.

**AI tools:** `fetch_file_context` (read full file from PR branch) and `list_directory` (list directory contents). `maxSteps: 3`.

## Key Constraints

- No database, no cache, no auth — single API route + AI
- GitHub API unauthenticated: 60 req/h limit (sufficient for demo)
- Truncate to top 3 changed files to stay within context window
- File content from tools truncated to 200 lines
