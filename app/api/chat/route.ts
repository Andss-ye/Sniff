import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { chatRequestSchema } from '@/lib/types'
import { getPersona } from '@/lib/personas'
import { parseUrl, fetchPR, fetchDiff } from '@/lib/github'
import { tools, setPRContext, clearPRContext } from '@/lib/tools'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    // Parsear y validar el body
    const body = await req.json()
    const validation = chatRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Request inválido', details: validation.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const { messages, prUrl, persona = 'strict' } = validation.data
    
    // Determinar si es el primer turno (review inicial)
    const isFirstTurn = messages.length === 1 && prUrl
    
    let systemPrompt = getPersona(persona)
    
    // Si es el primer turno, inyectar contexto del PR
    if (isFirstTurn && prUrl) {
      try {
        // Parsear URL del PR
        const { owner, repo, prNumber } = parseUrl(prUrl)
        
        // Fetch datos del PR
        const prData = await fetchPR(owner, repo, prNumber)
        
        // Fetch diffs (top 3 archivos)
        const diffs = await fetchDiff(owner, repo, prNumber)
        
        // Establecer contexto para las tools
        setPRContext(owner, repo, prData.headSha)
        
        // Construir contexto del PR
        const prContext = `
# CONTEXTO DEL PULL REQUEST

**Repositorio:** ${owner}/${repo}
**PR #${prNumber}:** ${prData.title}
**Autor:** ${prData.author}
**Branch base:** ${prData.baseBranch}
**Head SHA:** ${prData.headSha}

## Descripción del PR
${prData.description || '(Sin descripción)'}

## Archivos Modificados (Top 3 por cantidad de cambios)

${diffs.map((diff, index) => `
### ${index + 1}. ${diff.filename}
**Cambios:** +${diff.additions} -${diff.deletions}

\`\`\`diff
${diff.patch}
\`\`\`
`).join('\n')}

${diffs.length === 0 ? '(No se encontraron diffs)' : ''}

---

Ahora realiza el review completo siguiendo tu protocolo.
`
        
        // Agregar contexto al system prompt
        systemPrompt = systemPrompt + '\n\n' + prContext
        
      } catch (error) {
        // Limpiar contexto en caso de error
        clearPRContext()
        
        return new Response(
          JSON.stringify({ 
            error: 'Error al obtener datos del PR', 
            details: error instanceof Error ? error.message : 'Error desconocido' 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
    
    // Streamear respuesta del modelo
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
      tools,
      maxToolRoundtrips: 3,
      temperature: 0.7,
      onFinish: () => {
        // Limpiar contexto después de completar
        if (isFirstTurn) {
          clearPRContext()
        }
      }
    })
    
    return result.toDataStreamResponse()
    
  } catch (error) {
    console.error('Error en /api/chat:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
