# PR Reviewer Agent — Spec de implementación

> Proyecto para hackathon de v0/Vercel. Tiempo objetivo: 3 horas. Build y deploy en Vercel.

## Objetivo

Construir una web app donde un usuario pegue la URL de un Pull Request público de GitHub, seleccione una personalidad de revisor, y reciba un code review streaming generado por un agente de AI con tool use real (no un wrapper).

## Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **UI:** Tailwind + shadcn/ui (generar base con v0)
- **AI SDK:** `ai` package de Vercel (`streamText` con `tools`)
- **Modelo:** `claude-sonnet-4-5` vía `@ai-sdk/anthropic` (preferido) o `gpt-4o` como fallback
- **Cache:** Vercel KV (Redis) para resultados por URL de PR
- **Deploy:** Vercel, runtime Node.js (no Edge — el AI SDK con tools es más estable en Node)
- **GitHub API:** REST sin auth para repos públicos (Octokit opcional, fetch directo es suficiente)

## Arquitectura

```
app/
├── page.tsx                    # Landing con input + selector de personalidad
├── api/
│   └── review/
│       └── route.ts            # POST endpoint que streamea el review
├── lib/
│   ├── github.ts               # Helpers: parseUrl, fetchPR, fetchDiff, fetchFile
│   ├── personas.ts             # System prompts por personalidad
│   ├── tools.ts                # Tools del agente (fetch_file_context, etc.)
│   └── kv.ts                   # Wrapper de Vercel KV con TTL
└── components/
    ├── ReviewForm.tsx          # Input + selector
    └── ReviewStream.tsx        # Renderiza el stream con markdown
```

## Endpoint principal

`POST /api/review`

**Body:** `{ prUrl: string, persona: 'strict' | 'mentor' | 'troll' }`

**Lógica:**

1. Parse `prUrl` → extraer `{ owner, repo, prNumber }`. Validar formato.
2. Check Vercel KV con key `review:{owner}/{repo}/{prNumber}:{persona}`. Si existe, stream desde cache.
3. Fetch del PR vía GitHub REST:
   - `GET /repos/{owner}/{repo}/pulls/{pr_number}` → metadata
   - `GET /repos/{owner}/{repo}/pulls/{pr_number}/files` → archivos modificados con `patch`
4. Truncar a los 5 archivos con más cambios (`additions + deletions` desc).
5. Llamar `streamText` con:
   - `model: anthropic('claude-sonnet-4-5')`
   - `system`: prompt de la persona elegida
   - `messages`: incluir metadata del PR + diffs truncados
   - `tools`: las 3 tools de abajo
   - `maxSteps: 5` (permitir varias iteraciones de tool calls)
6. Stream con `toDataStreamResponse()` al cliente.
7. Al terminar (callback `onFinish`), guardar texto final en KV con TTL 24h.

## Tools del agente

Definir con el helper `tool()` del AI SDK. Estas tools son lo que diferencia esto de un prompt simple — el modelo decide cuándo llamarlas.

### `fetch_file_context`
- **Input:** `{ path: string }`
- **Output:** Contenido completo del archivo en la rama del PR.
- **Uso esperado:** Cuando el agente necesita ver más allá de las líneas del diff (ej: entender la función completa que está modificando).
- **Implementación:** `GET /repos/{owner}/{repo}/contents/{path}?ref={pr_head_sha}`

### `fetch_related_files`
- **Input:** `{ path: string }`
- **Output:** Array de paths candidatos: tests del archivo (`.test.ts`, `__tests__/`), archivos en el mismo directorio.
- **Uso esperado:** El agente quiere verificar si hay tests o cómo se usa el código.
- **Implementación:** Heurística simple — listar el directorio padre y buscar archivos con nombres relacionados.

### `search_repo`
- **Input:** `{ query: string }`
- **Output:** Top 5 resultados de GitHub code search en el repo.
- **Uso esperado:** Verificar convenciones existentes ("¿este repo ya usa este patrón?").
- **Implementación:** `GET /search/code?q={query}+repo:{owner}/{repo}`

> Nota: GitHub code search sin auth es limitado. Si tira 403, fallar silenciosamente y devolver array vacío — no romper el flujo.

## Personalidades

Tres system prompts en `lib/personas.ts`. Estructura común:

```
Eres un code reviewer experto. Recibirás:
1. Metadata del PR (título, descripción, autor)
2. Diffs de los archivos modificados
3. Acceso a tools para fetchear más contexto

Tu output debe estructurarse en markdown con estas secciones:
## Resumen
## Problemas encontrados (con líneas específicas)
## Sugerencias
## Veredicto final: [approve | request changes | needs discussion]

Personalidad: {personality_specific_block}
```

**Bloques específicos:**

- **strict:** Senior con 15 años de experiencia. Directo, sin endulzar. Pregunta por trade-offs. Cita principios concretos (SOLID, DRY, etc.) solo si aplican. No tolera código sin tests.
- **mentor:** Senior amable enfocado en enseñar. Explica el "por qué" de cada sugerencia. Valida lo bueno antes de criticar. Sugiere recursos para profundizar.
- **troll:** Sarcástico pero técnicamente correcto. Hace bromas sobre patrones malos sin ser ofensivo personal. Estilo "Linus en sus mejores días, sin los insultos".

## Frontend

### Página principal (`app/page.tsx`)

- Hero con input grande para URL del PR.
- Selector de personalidad (3 cards con descripción corta).
- Botón "Review this PR".
- Al submit, llamar al endpoint con `useChat` o `useCompletion` del AI SDK (`@ai-sdk/react`) y mostrar el stream debajo.

### Render del stream

- Markdown renderer (react-markdown + remark-gfm).
- Code blocks con syntax highlighting (shiki o prism).
- Indicador visual cuando el agente está usando una tool ("🔧 Fetching context for `src/foo.ts`...").

## Manejo de errores

- URL inválida → 400 con mensaje claro.
- PR privado / repo no encontrado → 404, sugerir que sea público.
- Rate limit de GitHub (403 con `X-RateLimit-Remaining: 0`) → mostrar mensaje + tiempo de reset.
- Timeout del modelo → reintentar 1 vez, luego fallar con mensaje.

## Variables de entorno

```
ANTHROPIC_API_KEY=
KV_REST_API_URL=
KV_REST_API_TOKEN=
GITHUB_TOKEN=          # opcional, sube rate limit de 60 a 5000/h
```

## Plan de las 3 horas

| Tiempo | Tarea |
|---|---|
| 0:00–0:30 | Bootstrap Next.js, instalar deps, generar UI base con v0, deploy inicial vacío en Vercel. |
| 0:30–1:00 | `lib/github.ts` + parsing de URL + fetch de PR y diffs. Probar con un PR real. |
| 1:00–2:00 | Endpoint `/api/review` con `streamText`, definir tools, conectar al frontend con streaming visible. |
| 2:00–2:30 | Personas (mínimo 1 pulida, las otras 2 funcionales), cache en KV. |
| 2:30–3:00 | Pulido visual, manejo de errores básico, deploy final, grabar demo. |

## Decisiones explícitas para mantener el scope

- **NO** auth de GitHub (queda para v2).
- **NO** histórico ni cuentas de usuario.
- **NO** comentarios in-line estilo GitHub UI — solo markdown plano.
- **NO** soporte multi-lenguaje explícito — el modelo maneja lo que entienda.
- **SÍ** tool use real desde el día 1 (es el diferenciador del demo).
- **SÍ** streaming visible (impacta el "wow" en el demo).

## Checklist de demo

- [ ] Deploy público en Vercel funcionando.
- [ ] Pegar URL de un PR conocido (ej: uno de Next.js o React) y obtener review en <30s.
- [ ] Tool calls visibles en la UI (mostrar al jurado que el agente decide qué leer).
- [ ] Las 3 personalidades seleccionables, mínimo 1 muy pulida.
- [ ] README con explicación del proyecto y cómo correrlo local.

## Stretch goals (solo si sobra tiempo)

1. Compartir review como link público (`/review/{hash}`).
2. "Roast battle": dos personalidades opuestas debaten sobre el mismo PR.
3. Galería de reviews destacados en home.
