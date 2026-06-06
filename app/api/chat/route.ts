import { createGroq } from '@ai-sdk/groq'

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
import { convertToModelMessages, stepCountIs, streamText } from 'ai'
import { chatRequestSchema } from '@/lib/types'
import { getPersona } from '@/lib/personas'
import { parseUrl, fetchPR, fetchDiff } from '@/lib/github'
import { createTools } from '@/lib/tools'
import { checkRateLimit } from '@/lib/ratelimit'

export const maxDuration = 30

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const { allowed, retryAfterMs } = checkRateLimit(ip)
  if (!allowed) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Window': '60s',
        },
      }
    )
  }

  const body = await req.json()
  const validation = chatRequestSchema.safeParse(body)

  if (!validation.success) {
    return Response.json(
      { error: 'Request inválido' },
      { status: 400 }
    )
  }

  const { messages, prUrl, persona = 'strict' } = validation.data
  const isFirstTurn = messages.length === 1 && !!prUrl

  let systemPrompt = getPersona(persona)
  let tools = {}

  if (prUrl) {
    try {
      const { owner, repo, prNumber } = parseUrl(prUrl)

      // Fetch PR metadata on every turn so tools have the correct headSha
      const prData = await fetchPR(owner, repo, prNumber)
      tools = createTools(owner, repo, prData.headSha)

      if (isFirstTurn) {
        const diffs = await fetchDiff(owner, repo, prNumber)

        const diffsBlock = diffs.length > 0
          ? diffs.map((diff, i) =>
              `### ${i + 1}. ${diff.filename}\n**Cambios:** +${diff.additions} -${diff.deletions}\n\n\`\`\`diff\n${diff.patch}\n\`\`\``
            ).join('\n\n')
          : '(No se encontraron diffs)'

        systemPrompt += `\n\n# CONTEXTO DEL PULL REQUEST

**Repositorio:** ${owner}/${repo}
**PR #${prNumber}:** ${prData.title}
**Autor:** ${prData.author}
**Branch base:** ${prData.baseBranch}
**Head SHA:** ${prData.headSha}

## Descripción
${prData.description || '(Sin descripción)'}

## Archivos Modificados (Top 3 por volumen de cambios)

${diffsBlock}

---

Ahora realiza el review completo siguiendo tu protocolo.`
      }
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : 'Error al obtener datos del PR' },
        { status: 400 }
      )
    }
  }

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: systemPrompt,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: await convertToModelMessages(messages as any),
    tools,
    stopWhen: stepCountIs(3),
  })

  return result.toUIMessageStreamResponse()
}
