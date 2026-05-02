# Division de tareas — Sniff

> 2 devs, 3 horas. Backend en paralelo primero, frontend juntos al final.

---

## Ownership de archivos (backend)

| Archivo | Owner |
|---------|-------|
| `lib/github.ts` | Andrew |
| `lib/tools.ts` | Andrew |
| `app/api/review/route.ts` | Andrew |
| `lib/personas.ts` | Julidev |
| `lib/types.ts` | Julidev |
| `components/*` | Ambos (fase frontend) |
| `app/page.tsx` | Ambos (fase frontend) |

---

## Fase 0 — Setup conjunto (0:00–0:10)

> Ambos juntos.

- [ ] Andrew: `create-next-app` con TypeScript + Tailwind + App Router
- [ ] Andrew: `npm install ai @ai-sdk/openai zod react-markdown remark-gfm`
- [ ] Andrew: push inicial a GitHub + deploy vacio en Vercel
- [ ] Andrew: configurar Vercel AI Gateway en dashboard (o `OPENAI_API_KEY` en `.env.local`)
- [ ] Julidev: clonar repo, verificar que corre en local
- [ ] Julidev: `npx shadcn@latest init` + `npx shadcn@latest add button card input badge`
- [ ] Julidev: push del setup de shadcn

**Acordar antes de separarse:**
```
POST /api/review
Body: { prUrl: string, persona: "strict" | "mentor" | "troll" }
Response: Data stream (Vercel AI SDK format)
```

---

## Fase 1 — Backend en paralelo (0:10–1:20)

### Andrew — GitHub API + Tools + Route

> Archivos: `lib/github.ts`, `lib/tools.ts`, `app/api/review/route.ts`

#### 0:10–0:40 — GitHub lib

- [ ] `lib/github.ts` — `parseUrl(url): { owner, repo, prNumber }`
  - Regex para `github.com/{owner}/{repo}/pull/{number}`
  - Throw si formato invalido
- [ ] `lib/github.ts` — `fetchPR(owner, repo, prNumber): PRData`
  - `GET https://api.github.com/repos/{owner}/{repo}/pulls/{prNumber}`
  - Extraer: titulo, descripcion, autor, head SHA, base branch
- [ ] `lib/github.ts` — `fetchDiff(owner, repo, prNumber): FileDiff[]`
  - `GET /repos/{owner}/{repo}/pulls/{prNumber}/files`
  - Ordenar por `additions + deletions` desc, tomar top 3
  - Devolver `{ filename, patch, additions, deletions }`
- [ ] `lib/github.ts` — `fetchFileContent(owner, repo, path, ref): string`
  - `GET /repos/{owner}/{repo}/contents/{path}?ref={ref}`
  - Decodificar base64, truncar a 200 lineas
- [ ] Probar con un PR real (`npx tsx lib/github.ts` o script rapido)

#### 0:40–1:00 — Tools del agente

- [ ] `lib/tools.ts` — `fetch_file_context` tool
  - Llama a `fetchFileContent()` internamente
  - Descripcion clara para que el modelo sepa cuando usarla
- [ ] `lib/tools.ts` — `list_directory` tool
  - `GET /repos/{owner}/{repo}/contents/{path}?ref={ref}`
  - Devuelve array de nombres de archivo

#### 1:00–1:20 — API route

- [ ] `app/api/review/route.ts`:
  - Validar body con zod (`prUrl` string, `persona` enum)
  - Llamar `parseUrl()` → `fetchPR()` + `fetchDiff()`
  - Importar persona de `getPersona()` de Julidev
  - `streamText()` con modelo, system prompt, messages (metadata + diffs), tools, `maxSteps: 3`
  - Devolver `toDataStreamResponse()`
- [ ] Probar con curl que el stream funcione

---

### Julidev — Personas + Tipos + Validaciones

> Archivos: `lib/personas.ts`, `lib/types.ts`

#### 0:10–0:40 — Tipos compartidos

- [ ] `lib/types.ts` — definir interfaces:
  ```ts
  type Persona = 'strict' | 'mentor' | 'troll'
  interface PRData { title, description, author, headSha, baseBranch }
  interface FileDiff { filename, patch, additions, deletions }
  interface ReviewRequest { prUrl: string, persona: Persona }
  ```
- [ ] Schema zod para validar el request body (Andrew lo importa en la route)

#### 0:40–1:20 — Personalidades (lo mas importante)

- [ ] `lib/personas.ts` — estructura comun:
  ```
  Eres un code reviewer experto. Vas a recibir:
  1. Metadata del PR (titulo, descripcion, autor)
  2. Diffs de archivos modificados
  3. Tools para explorar mas contexto — USALAS cuando necesites entender algo

  Estructura tu review:
  ## Resumen (2-3 oraciones)
  ## Problemas (paths y lineas especificas)
  ## Lo bueno
  ## Veredicto: approve | request_changes | needs_discussion

  {bloque_personalidad}
  ```
- [ ] Persona `strict` — Senior con 15 anos, directo, cita SOLID/DRY solo si aplica, no tolera PR sin tests
- [ ] Persona `mentor` — Senior amable, explica el "por que", valida lo bueno primero, sugiere recursos
- [ ] Persona `troll` — Sarcastico pero tecnico, bromas sobre patrones malos, estilo senior de bar
- [ ] Probar cada prompt en ChatGPT/playground con un diff real para verificar tono y formato
- [ ] `getPersona(persona: Persona): string` — export para que Andrew lo use en la route

---

## Fase 2 — Integracion backend (1:20–1:40)

> Ambos juntos.

- [ ] Conectar route de Andrew con personas de Julidev
- [ ] Probar `POST /api/review` con curl o Postman con un PR real
- [ ] Verificar que las 3 personalidades generan reviews distintos
- [ ] Verificar que las tools se ejecutan (el agente llama a `fetch_file_context`)
- [ ] Fix rapido de cualquier bug de integracion

**Hito:** A las 1:40 el backend DEBE funcionar completo. Curl devuelve stream con review.

---

## Fase 3 — Frontend juntos (1:40–2:30)

> Ambos juntos. Uno genera UI, otro conecta logica.

### Julidev — UI con v0 + componentes (1:40–2:10)

- [ ] Generar UI en v0.dev con prompt:
  > "A single-page app for reviewing GitHub PRs with AI. Large URL input, 3 selectable personality cards (Strict Senior red, Friendly Mentor green, Code Troll purple), Review button, and a streaming markdown output area below. Dark theme, shadcn/ui."
- [ ] Adaptar output de v0 al proyecto
- [ ] `components/review-form.tsx` — input + cards + boton
- [ ] `components/review-stream.tsx` — render markdown con `react-markdown` + `remark-gfm`
- [ ] `components/tool-indicator.tsx` — badge "Investigando {file}..."
- [ ] Estilos para headings, code blocks, listas en el markdown

### Andrew — Logica del frontend + conexion (1:40–2:10)

- [ ] `app/page.tsx` — conectar con `useCompletion`:
  ```tsx
  const { completion, isLoading, complete } = useCompletion({
    api: '/api/review',
  });
  ```
- [ ] State: `prUrl`, `persona`, pasar a `review-form`
- [ ] Validacion basica del input (que parezca URL de GitHub)
- [ ] Deshabilitar boton si no hay URL o persona
- [ ] Auto-scroll mientras streamea
- [ ] Manejar errores del backend:
  - URL invalida → mensaje claro
  - PR no encontrado → sugerir repo publico
  - Rate limit → mostrar tiempo de reset

### Juntos (2:10–2:30) — Integrar y probar

- [ ] Conectar componentes de Julidev con logica de Andrew
- [ ] Probar flujo completo: URL → seleccionar persona → click → stream visible
- [ ] Probar las 3 personalidades
- [ ] Verificar que tool calls se muestran en la UI
- [ ] Fix de bugs visuales o de conexion

**Hito:** A las 2:30 la app DEBE funcionar end-to-end en localhost.

---

## Fase 4 — Pulido y deploy (2:30–3:00)

> Ambos juntos.

| Tarea | Quien |
|-------|-------|
| Deploy en Vercel, probar en produccion | Andrew |
| Responsive + estados (loading, error, vacio) | Julidev |
| Favicon + titulo pagina | Julidev |
| Probar con 2-3 PRs reales en produccion | Andrew |
| README basico | Quien termine primero |

**2:50 — Freeze de codigo. Solo fixes criticos. Grabar demo.**

---

## Puntos de sincronizacion

| Momento | Que pasa |
|---------|----------|
| 0:00–0:10 | **Juntos:** Setup, acordar contrato, push inicial |
| 0:10–1:20 | **Separados:** Andrew (github+tools+route), Julidev (tipos+personas) |
| 1:20–1:40 | **Juntos:** Integrar backend, probar con curl |
| 1:40–2:30 | **Juntos:** Frontend (Julidev UI, Andrew logica, luego integran) |
| 2:30–3:00 | **Juntos:** Deploy, pulido, demo |

## Regla de oro

> Si a las 2:00h no funciona el flujo completo, **dejar todo y hacer que funcione.** Features extra no valen nada si el demo no corre.
