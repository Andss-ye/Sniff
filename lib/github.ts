import { PRData, FileDiff } from './types'

export function parseUrl(url: string): { owner: string; repo: string; prNumber: number } {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
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

export async function fetchPR(owner: string, repo: string, prNumber: number): Promise<PRData> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
    headers: ghHeaders,
  })
  if (!res.ok) {
    if (res.status === 404) throw new Error(`PR #${prNumber} no encontrado en ${owner}/${repo}`)
    throw new Error(`Error al obtener PR: ${res.status} ${res.statusText}`)
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
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`, {
    headers: ghHeaders,
  })
  if (!res.ok) throw new Error(`Error al obtener diff: ${res.status} ${res.statusText}`)
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
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
    { headers: ghHeaders }
  )
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Archivo no encontrado: ${path}`)
    throw new Error(`Error al obtener archivo: ${res.status} ${res.statusText}`)
  }
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
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
    { headers: ghHeaders }
  )
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Directorio no encontrado: ${path}`)
    throw new Error(`Error al listar directorio: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error(`${path} no es un directorio`)
  return (data as any[]).map((item) => item.name as string)
}
