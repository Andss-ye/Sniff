import { PRData, FileDiff } from './types'

/**
 * Parsea una URL de GitHub PR y extrae owner, repo y número de PR
 */
export function parseUrl(url: string): { owner: string; repo: string; prNumber: number } {
  const regex = /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/
  const match = url.match(regex)
  
  if (!match) {
    throw new Error('URL de PR inválida. Formato esperado: https://github.com/{owner}/{repo}/pull/{number}')
  }
  
  return {
    owner: match[1],
    repo: match[2],
    prNumber: parseInt(match[3], 10)
  }
}

/**
 * Obtiene los datos básicos de un Pull Request
 */
export async function fetchPR(owner: string, repo: string, prNumber: number): Promise<PRData> {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Sniff-PR-Reviewer',
      ...(process.env.GITHUB_TOKEN && {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
      })
    }
  })
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`PR #${prNumber} no encontrado en ${owner}/${repo}`)
    }
    throw new Error(`Error al obtener PR: ${response.status} ${response.statusText}`)
  }
  
  const data = await response.json()
  
  return {
    title: data.title || '',
    description: data.body || '',
    author: data.user?.login || 'unknown',
    headSha: data.head?.sha || '',
    baseBranch: data.base?.ref || 'main'
  }
}

/**
 * Obtiene los archivos modificados en un PR (top 3 por cambios)
 */
export async function fetchDiff(owner: string, repo: string, prNumber: number): Promise<FileDiff[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Sniff-PR-Reviewer',
      ...(process.env.GITHUB_TOKEN && {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
      })
    }
  })
  
  if (!response.ok) {
    throw new Error(`Error al obtener diff: ${response.status} ${response.statusText}`)
  }
  
  const files = await response.json()
  
  // Ordenar por cantidad de cambios (additions + deletions) descendente
  const sortedFiles = files
    .map((file: any) => ({
      filename: file.filename,
      patch: file.patch || '',
      additions: file.additions || 0,
      deletions: file.deletions || 0
    }))
    .sort((a: FileDiff, b: FileDiff) => 
      (b.additions + b.deletions) - (a.additions + a.deletions)
    )
  
  // Tomar top 3
  return sortedFiles.slice(0, 3)
}

/**
 * Obtiene el contenido completo de un archivo del repositorio
 */
export async function fetchFileContent(
  owner: string, 
  repo: string, 
  path: string, 
  ref: string
): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Sniff-PR-Reviewer',
      ...(process.env.GITHUB_TOKEN && {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
      })
    }
  })
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Archivo no encontrado: ${path}`)
    }
    throw new Error(`Error al obtener archivo: ${response.status} ${response.statusText}`)
  }
  
  const data = await response.json()
  
  if (data.type !== 'file') {
    throw new Error(`${path} no es un archivo`)
  }
  
  // Decodificar base64
  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  
  // Truncar a 200 líneas
  const lines = content.split('\n')
  if (lines.length > 200) {
    return lines.slice(0, 200).join('\n') + '\n\n... (truncado, archivo tiene ' + lines.length + ' líneas)'
  }
  
  return content
}

/**
 * Lista archivos en un directorio del repositorio
 */
export async function listDirectory(
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<string[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Sniff-PR-Reviewer',
      ...(process.env.GITHUB_TOKEN && {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
      })
    }
  })
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Directorio no encontrado: ${path}`)
    }
    throw new Error(`Error al listar directorio: ${response.status} ${response.statusText}`)
  }
  
  const data = await response.json()
  
  if (!Array.isArray(data)) {
    throw new Error(`${path} no es un directorio`)
  }
  
  return data.map((item: any) => item.name)
}
