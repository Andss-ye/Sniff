import { z } from 'zod'

/**
 * Tipo de personalidad del code reviewer
 */
export type Persona = 'strict' | 'mentor' | 'troll'

/**
 * Datos básicos de un Pull Request
 */
export interface PRData {
  title: string
  description: string
  author: string
  headSha: string
  baseBranch: string
}

/**
 * Información de un archivo modificado en el PR
 */
export interface FileDiff {
  filename: string
  patch: string
  additions: number
  deletions: number
}

/**
 * Request body para el endpoint de chat
 * Usa any[] para messages ya que los tipos de Message de 'ai' son complejos de validar en runtime
 */
export interface ChatRequest {
  messages: any[]
  prUrl?: string
  persona?: Persona
}

/**
 * Schema Zod para validar el request body del chat
 */
export const chatRequestSchema = z.object({
  messages: z.array(z.any()),
  prUrl: z.string().url().optional(),
  persona: z.enum(['strict', 'mentor', 'troll']).optional(),
})
