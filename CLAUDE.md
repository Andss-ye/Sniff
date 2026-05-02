# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sniff — AI-powered PR reviewer web app. Users paste a public GitHub PR URL, pick a reviewer personality (strict, mentor, troll), and get a streaming code review. The AI agent has tools to autonomously explore repo context beyond the diff.

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
app/page.tsx                  # Single page: form + streaming output
app/api/review/route.ts       # POST endpoint — validates input, fetches PR data, streams AI review
lib/github.ts                 # GitHub REST helpers: parseUrl, fetchPR, fetchDiff, fetchFileContent
lib/personas.ts               # 3 system prompts (strict, mentor, troll)
lib/tools.ts                  # 2 AI SDK tools: fetch_file_context, list_directory
lib/types.ts                  # Interfaces extraidas de github.ts: PRData, FileDiff, Persona, ReviewRequest
components/review-form.tsx    # URL input + personality selector
components/review-stream.tsx  # Markdown renderer for streamed output
components/tool-indicator.tsx # Shows when agent is using a tool
```

**Data flow:** Frontend calls `POST /api/review` with `{ prUrl, persona }` → route fetches PR metadata + diffs from GitHub → passes to `streamText()` with persona system prompt and tools → streams response back via `toDataStreamResponse()` → frontend renders with `useCompletion` + `react-markdown`.

**AI tools:** The agent can call `fetch_file_context` (read full file from PR branch) and `list_directory` (list files in a directory) to explore beyond the diff. `maxSteps: 3`.

## Key Constraints

- No database, no cache, no auth — single API route + AI
- GitHub API unauthenticated: 60 req/h limit (sufficient for demo)
- Truncate to top 3 changed files to stay within context window
- File content from tools truncated to 200 lines
