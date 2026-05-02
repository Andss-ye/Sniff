import { tool } from '@ai-sdk/provider-utils'
import { z } from 'zod'
import { fetchFileContent, listDirectory } from './github'

/**
 * Contexto del PR actual (se establece al inicio de cada review)
 */
let currentPRContext: {
  owner: string
  repo: string
  ref: string
} | null = null

/**
 * Establece el contexto del PR actual para las tools
 */
export function setPRContext(owner: string, repo: string, ref: string) {
  currentPRContext = { owner, repo, ref }
}

/**
 * Limpia el contexto del PR
 */
export function clearPRContext() {
  currentPRContext = null
}

/**
 * Tool para obtener el contenido completo de un archivo del repositorio
 */
export const fetchFileContextTool = tool({
  description: `Obtiene el contenido completo de un archivo del repositorio del PR.
Usa esta tool cuando necesites:
- Ver el contexto completo de una función o clase mencionada en el diff
- Verificar imports o dependencias de un archivo
- Entender cómo se usa una función en su contexto original
- Validar que un cambio es consistente con el resto del archivo

El contenido se trunca a 200 líneas para mantener el contexto manejable.`,
  parameters: z.object({
    path: z.string().describe('Ruta del archivo en el repositorio (ej: "src/components/Button.tsx")')
  }),
  execute: async ({ path }) => {
    if (!currentPRContext) {
      return { error: 'No hay contexto de PR disponible. Esta tool solo funciona durante un review activo.' }
    }
    
    try {
      const content = await fetchFileContent(
        currentPRContext.owner,
        currentPRContext.repo,
        path,
        currentPRContext.ref
      )
      
      return {
        path,
        content,
        message: `Contenido de ${path} (ref: ${currentPRContext.ref})`
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Error desconocido al obtener archivo'
      }
    }
  }
})

/**
 * Tool para listar archivos en un directorio del repositorio
 */
export const listDirectoryTool = tool({
  description: `Lista los archivos y subdirectorios en un directorio del repositorio del PR.
Usa esta tool cuando necesites:
- Explorar la estructura del proyecto
- Verificar qué archivos existen en un directorio
- Encontrar archivos relacionados (ej: tests, configs)
- Entender la organización del código`,
  parameters: z.object({
    path: z.string().describe('Ruta del directorio en el repositorio (ej: "src/components", usa "" para la raíz)')
  }),
  execute: async ({ path }) => {
    if (!currentPRContext) {
      return { error: 'No hay contexto de PR disponible. Esta tool solo funciona durante un review activo.' }
    }
    
    try {
      const files = await listDirectory(
        currentPRContext.owner,
        currentPRContext.repo,
        path,
        currentPRContext.ref
      )
      
      return {
        path: path || '/',
        files,
        count: files.length,
        message: `Encontrados ${files.length} items en ${path || '/'}`
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Error desconocido al listar directorio'
      }
    }
  }
})

/**
 * Objeto con todas las tools disponibles para el agente
 */
export const tools = {
  fetch_file_context: fetchFileContextTool,
  list_directory: listDirectoryTool
}
