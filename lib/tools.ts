import { tool } from 'ai'
import { z } from 'zod'
import { fetchFileContent, listDirectory } from './github'

export function createTools(owner: string, repo: string, ref: string) {
  return {
    fetch_file_context: tool({
      description: `Obtiene el contenido completo de un archivo del repositorio del PR.
Usa esta tool cuando necesites ver el contexto completo de una función o clase mencionada en el diff, verificar imports o dependencias, o validar que un cambio es consistente con el resto del archivo.
El contenido se trunca a 200 líneas.`,
      inputSchema: z.object({
        path: z.string().describe('Ruta del archivo en el repositorio (ej: "src/components/Button.tsx")'),
      }),
      execute: async ({ path }) => {
        try {
          const content = await fetchFileContent(owner, repo, path, ref)
          return { path, content }
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Error al obtener archivo' }
        }
      },
    }),

    list_directory: tool({
      description: `Lista archivos y subdirectorios en un directorio del repositorio del PR.
Usa esta tool para explorar la estructura del proyecto, verificar qué archivos existen en un directorio, o encontrar archivos relacionados como tests o configs.`,
      inputSchema: z.object({
        path: z.string().describe('Ruta del directorio (ej: "src/components", usa "" para la raíz)'),
      }),
      execute: async ({ path }) => {
        try {
          const files = await listDirectory(owner, repo, path, ref)
          return { path: path || '/', files }
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Error al listar directorio' }
        }
      },
    }),
  }
}
