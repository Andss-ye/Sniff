# Sniff

PR review as a working session, not a report. Paste a public GitHub PR URL, pick a reviewer personality, get a streaming code review — then keep working with the same agent: ask for the fixed code, explore how a change affects other files, understand a teammate's PR before approving it.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Vercel AI SDK** + **Groq** (`llama-3` or compatible model)
- **GitHub REST API** — unauthenticated, public repos only (60 req/h)
- Deploy on Vercel (Node.js runtime)

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/sniff.git
cd sniff
npm install
```

### 2. Set environment variables

Create a `.env.local` file in the project root:

```env
# Required — get yours at https://console.groq.com
GROQ_API_KEY=gsk_...

# Optional — raises GitHub API rate limit from 60 to 5000 req/h
# Get one at https://github.com/settings/tokens (no scopes needed for public repos)
GITHUB_TOKEN=ghp_...
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

1. Paste a **public** GitHub PR URL, e.g. `https://github.com/vercel/next.js/pull/12345`
2. Pick a reviewer personality:
   - **Strict Senior** — direct, zero tolerance, no sugarcoating
   - **Friendly Mentor** — pedagogical, explains the why, guides you to the answer
   - **Code Troll** — sarcastic but technically brilliant, humor about the code not the author
3. Hit **Review** — the agent streams a structured review (summary, issues by severity, verdict)
4. Keep chatting: ask for the corrected code, explore side effects, clarify anything

---

## Commands

```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

---

## Constraints

- Public GitHub repos only (no auth, no private repo support)
- GitHub API: 60 req/h unauthenticated, 5000 req/h with `GITHUB_TOKEN`
- Reviews are stateless — no database, no history between sessions
- Diff is truncated to the top 3 changed files to stay within context window
