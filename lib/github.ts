import { PRData, FileDiff } from './types'

const GITHUB_API_TIMEOUT_MS = 8000

export function parseUrl(url: string): { owner: string; repo: string; prNumber: number } {
  let normalized = url.trim()
  // Strip query params and fragments
  normalized = normalized.split('?')[0].split('#')[0]

  const match = normalized.match(/^https:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/pull\/(\d+)\/?$/)
  if (!match) {
    throw new Error('URL de PR inválida. Formato esperado: https://github.com/{owner}/{repo}/pull/{number}')
  }
  return { owner: match[1], repo: match[2], prNumber: parseInt(match[3], 10) }
}

const ghHeaders = {
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'Sniff-PR-Reviewer',
  ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
}

function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), GITHUB_API_TIMEOUT_MS)
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  )
}

function mapGitHubError(status: number, context: string): Error {
  if (status === 403 || status === 429) return new Error('Límite de rate de GitHub alcanzado. Intenta de nuevo en unos minutos.')
  if (status === 404) return new Error(`${context} no encontrado.`)
  if (status === 401) return new Error('Token de GitHub inválido o expirado.')
  return new Error(`Error al conectar con GitHub (${status}).`)
}

export async function fetchPR(owner: string, repo: string, prNumber: number): Promise<PRData> {
  const res = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
    headers: ghHeaders,
  })
  if (!res.ok) {
    throw mapGitHubError(res.status, `PR #${prNumber} en ${owner}/${repo}`)
  }
  const data = await res.json()
  return {
    title: data.title ?? '',
    description: data.body ?? '',
    author: data.user?.login ?? 'unknown',
    headSha: data.head?.sha ?? '',
    baseBranch: data.base?.ref ?? 'main',
  }
}

export async function fetchDiff(owner: string, repo: string, prNumber: number): Promise<FileDiff[]> {
  const res = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`, {
    headers: ghHeaders,
  })
  if (!res.ok) throw mapGitHubError(res.status, 'Diff del PR')
  const files = await res.json()
  return (files as any[])
    .map((f) => ({
      filename: f.filename as string,
      patch: (f.patch as string) ?? '',
      additions: (f.additions as number) ?? 0,
      deletions: (f.deletions as number) ?? 0,
    }))
    .sort((a, b) => b.additions + b.deletions - (a.additions + a.deletions))
    .slice(0, 3)
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<string> {
  const res = await fetchWithTimeout(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
    { headers: ghHeaders }
  )
  if (!res.ok) throw mapGitHubError(res.status, `Archivo ${path}`)
  const data = await res.json()
  if (data.type !== 'file') throw new Error(`${path} no es un archivo`)
  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  const lines = content.split('\n')
  if (lines.length > 200) {
    return lines.slice(0, 200).join('\n') + `\n\n... (truncado, ${lines.length} líneas en total)`
  }
  return content
}

export async function listDirectory(
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<string[]> {
  const res = await fetchWithTimeout(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
    { headers: ghHeaders }
  )
  if (!res.ok) throw mapGitHubError(res.status, `Directorio ${path}`)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error(`${path} no es un directorio`)
  return (data as any[]).map((item) => item.name as string)
}
