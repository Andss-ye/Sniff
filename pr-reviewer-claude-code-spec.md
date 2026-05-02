# Sniff — PR Reviewer con Personalidad

> Hackathon v0/Vercel. Tiempo: 3 horas. Todo en el ecosistema Vercel.

## Idea

Web app donde pegas la URL de un PR publico de GitHub, eliges una personalidad de reviewer (strict, mentor, troll), y recibes un code review en streaming generado por AI con tool use real — el agente decide cuando necesita leer mas contexto del repo.

**Diferenciador:** No es un wrapper de prompt. El agente tiene tools y decide autonomamente que archivos explorar para dar un review mas profundo. El usuario ve en tiempo real cuando el agente esta "investigando".

---

## Stack (todo Vercel)

| Capa | Tecnologia | Nota |
|------|-----------|------|
| Framework | Next.js 15 (App Router, TS) | Bootstrap con `create-next-app` |
| UI | shadcn/ui + Tailwind | Generar componentes base con **v0** |
| AI | `ai` SDK de Vercel + `@ai-sdk/openai` | Usar modelo via Vercel AI Gateway |
| Modelo | `gpt-4o-mini` via Vercel AI Gateway | Incluido en los creditos de Vercel ($20 da para ~miles de requests) |
| Deploy | Vercel | Runtime Node.js (no Edge) |
| GitHub API | `fetch` directo, sin libreria | REST API publica, sin auth |

### Sobre los creditos de Vercel y el modelo

Los $20 de creditos de Vercel se pueden usar con el **AI Gateway** de Vercel. Esto te da acceso a modelos sin necesitar API keys externas:

```ts
import { openai } from '@ai-sdk/openai';

// Vercel AI Gateway — usa tus creditos de Vercel directamente
const model = openai('gpt-4o-mini'); // ~$0.15/1M input tokens — tus $20 rinden mucho
```

**Configuracion en Vercel Dashboard:**
1. Ve a tu proyecto en Vercel → Settings → AI
2. Habilita el AI Gateway
3. No necesitas `OPENAI_API_KEY` — Vercel lo maneja con tus creditos

**Alternativa si quieres Claude:** Necesitarias una `ANTHROPIC_API_KEY` por separado (no esta cubierta por los creditos de Vercel). Para la hackathon, `gpt-4o-mini` es suficiente y mucho mas barato.

> **Decision:** Usar `gpt-4o-mini` via Vercel AI Gateway. Costo estimado para el demo: <$0.50.

---

## Arquitectura (minima)

```
app/
├── page.tsx                    # Landing: input + selector + stream de resultado
├── api/
│   └── review/
│       └── route.ts            # POST — streamea el review
├── lib/
│   ├── github.ts               # parseUrl(), fetchPR(), fetchDiff(), fetchFileContent()
│   ├── personas.ts             # 3 system prompts
│   └── tools.ts                # 1-2 tools del agente
└── components/
    ├── review-form.tsx         # Input URL + selector personalidad
    ├── review-stream.tsx       # Renderiza markdown en streaming
    └── tool-indicator.tsx      # Muestra cuando el agente usa una tool
```

**Solo 7 archivos de codigo.** Sin cache, sin base de datos, sin auth. Puro frontend + 1 API route + AI.

---

## Flujo del endpoint

`POST /api/review`

```json
{ "prUrl": "https://github.com/owner/repo/pull/123", "persona": "strict" }
```

1. Parsear URL → `{ owner, repo, prNumber }`. Si invalida, 400.
2. Fetch GitHub REST (sin auth, limite 60 req/h — suficiente para demo):
   - `GET /repos/{owner}/{repo}/pulls/{prNumber}` → titulo, descripcion, autor
   - `GET /repos/{owner}/{repo}/pulls/{prNumber}/files` → archivos + patches
3. Tomar los **3 archivos con mas cambios** (para no volar el context window).
4. `streamText()` con:
   - `model: openai('gpt-4o-mini')`
   - `system`: prompt de la persona
   - `messages`: metadata del PR + diffs
   - `tools`: definidas abajo
   - `maxSteps: 3`
5. Devolver `toDataStreamResponse()`.

---

## Tools del agente (solo 2)

Menos tools = menos complejidad = mas estable en 3 horas.

### `fetch_file_context`

```ts
tool({
  description: 'Fetch the full content of a file from the PR branch to understand context beyond the diff',
  parameters: z.object({
    path: z.string().describe('File path in the repo'),
  }),
  execute: async ({ path }) => {
    // GET /repos/{owner}/{repo}/contents/{path}?ref={head_sha}
    // Devolver contenido decodificado de base64, truncado a 200 lineas
  },
})
```

**Cuando lo usa el agente:** Cuando el diff muestra solo unas lineas y necesita ver la funcion completa o los imports.

### `list_directory`

```ts
tool({
  description: 'List files in a directory to find related files like tests or configs',
  parameters: z.object({
    path: z.string().describe('Directory path in the repo'),
  }),
  execute: async ({ path }) => {
    // GET /repos/{owner}/{repo}/contents/{path}?ref={head_sha}
    // Devolver array de nombres de archivo
  },
})
```

**Cuando lo usa el agente:** Para buscar si hay tests del archivo que esta revisando.

> Se elimino `search_repo` — la API de code search necesita auth y es inestable. No vale la complejidad para 3 horas.

---

## Personalidades

Archivo `lib/personas.ts` con 3 exports. Estructura comun:

```
Eres un code reviewer experto. Vas a recibir:
1. Metadata del PR (titulo, descripcion, autor)
2. Diffs de archivos modificados
3. Tools para explorar mas contexto del repo — USALAS cuando necesites entender algo mejor

Estructura tu review asi:
## Resumen (2-3 oraciones)
## Problemas (con paths y lineas especificas)
## Lo bueno (reconoce lo que esta bien)
## Veredicto: approve | request_changes | needs_discussion

{bloque_personalidad}
```

| Persona | Bloque |
|---------|--------|
| `strict` | Senior con 15 anos. Directo, sin rodeos. Cita principios (SOLID, DRY) solo si aplican. No tolera PR sin tests. |
| `mentor` | Senior amable. Explica el "por que" de cada sugerencia. Valida lo bueno primero. Sugiere recursos. |
| `troll` | Sarcastico pero tecnico. Hace bromas sobre patrones malos. Estilo "senior que te caeria bien en un bar". |

---

## Frontend

### Generar con v0

Prompt sugerido para v0:

> "A single-page app with a centered form: a large URL input for GitHub PR links, 3 selectable personality cards (Strict Senior, Friendly Mentor, Code Troll) with icons and short descriptions, a Review button, and below it a streaming markdown output area with a subtle indicator showing when the AI agent is fetching additional files. Dark theme, modern, minimal. Use shadcn/ui components."

Esto te genera el 80% del frontend. Solo conectas la logica.

### Conexion al backend

```tsx
'use client';
import { useCompletion } from '@ai-sdk/react';

const { completion, isLoading, complete } = useCompletion({
  api: '/api/review',
});

// En el submit:
await complete('', {
  body: { prUrl, persona },
});
```

### Indicador de tools

Cuando el stream incluye tool calls, mostrar un pequeno badge:

```
Investigando src/utils/auth.ts...
```

Esto es el "wow factor" para el jurado — demuestra que no es un prompt plano.

---

## Variables de entorno

```
# Solo si NO usas Vercel AI Gateway:
OPENAI_API_KEY=

# Opcional — sube rate limit de GitHub de 60 a 5000 req/h:
GITHUB_TOKEN=
```

Si usas Vercel AI Gateway con tus creditos, **no necesitas ninguna API key externa**.

---

## Plan de 3 horas

| Tiempo | Que hacer | Entregable |
|--------|-----------|------------|
| 0:00–0:20 | `create-next-app`, instalar `ai @ai-sdk/openai`, deploy inicial vacio en Vercel | URL de Vercel funcionando |
| 0:20–0:40 | Generar UI en v0, copiar componentes, ajustar layout | Frontend visual listo |
| 0:40–1:10 | `lib/github.ts` — parsear URL, fetch PR + diff. Probar con un PR real en consola | Datos de GitHub llegando |
| 1:10–2:00 | `api/review/route.ts` — streamText + tools + conectar al frontend | **Review funcionando end-to-end** |
| 2:00–2:20 | 3 personalidades pulidas, probar cada una | Selector funcional |
| 2:20–2:45 | Errores basicos (URL invalida, PR no encontrado), pulido visual | App robusta |
| 2:45–3:00 | Deploy final, probar con 2-3 PRs reales, grabar demo | **Listo** |

**Hito critico:** A las 2:00 DEBE funcionar el flujo completo (pegar URL → ver review en streaming). Todo despues es pulido.

---

## Lo que NO hacemos (y por que)

| Eliminado | Razon |
|-----------|-------|
| Vercel KV / cache | Agrega setup + codigo + tiempo. Para un demo no necesitas cache. |
| `search_repo` tool | Necesita auth de GitHub, API inestable. |
| Auth de usuario | No aporta al demo. |
| Historico de reviews | Scope creep. |
| Multiples modelos / fallback | Un modelo, bien configurado, es suficiente. |
| Syntax highlighting (shiki/prism) | `react-markdown` con CSS basico se ve bien. Agregar si sobra tiempo. |

---

## Checklist de demo

- [ ] Deploy publico en Vercel
- [ ] Pegar URL de PR conocido → review en streaming en <20s
- [ ] Tool calls visibles en la UI (el agente "investiga")
- [ ] 3 personalidades seleccionables y diferenciables
- [ ] README con que es y como correrlo

## Stretch goals (solo si sobran >15 min)

1. Syntax highlighting en code blocks (instalar `rehype-highlight`)
2. Boton "compartir review" que copia el markdown al clipboard
3. Rate limit visual de GitHub (mostrar requests restantes)
