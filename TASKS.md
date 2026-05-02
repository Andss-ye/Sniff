# Division de tareas — Sniff

> 2 devs, 3 horas. Backend en paralelo primero, frontend juntos al final.

---

## Ownership de archivos (backend)

| Archivo | Owner |
|---------|-------|
| `lib/github.ts` | Andrew |
| `lib/tools.ts` | Andrew |
| `app/api/chat/route.ts` | Andrew |
| `lib/personas.ts` | Julidev |
| `lib/types.ts` | Julidev |
| `components/*` | Ambos (fase frontend) |
| `app/page.tsx` | Ambos (fase frontend) |

---

## Fase 0 — Setup conjunto (0:00–0:10)

> Ambos juntos.

- [x] Andrew: `create-next-app` con TypeScript + Tailwind + App Router
- [x] Andrew: `npm install ai @ai-sdk/openai zod react-markdown remark-gfm`
- [x] Andrew: push inicial a GitHub + deploy vacio en Vercel
- [x] Andrew: configurar Vercel AI Gateway en dashboard (o `OPENAI_API_KEY` en `.env.local`)
- [ ] Julidev: clonar repo, verificar que corre en local
- [ ] Julidev: `npx shadcn@latest init` + `npx shadcn@latest add button card input badge`
- [ ] Julidev: push del setup de shadcn

**Acordar antes de separarse:**
```
POST /api/chat
Body: { messages: Message[], prUrl?: string, persona?: "strict" | "mentor" | "troll" }
Response: Data stream (Vercel AI SDK useChat format)
```
- `prUrl` y `persona` solo se usan en el primer turno para inyectar contexto del PR en el system prompt
- Del segundo mensaje en adelante el backend los ignora — el historial ya tiene todo el contexto

---

## Fase 1 — Backend en paralelo (0:10–1:20)

### Andrew — GitHub API + Tools + Route

> Archivos: `lib/github.ts`, `lib/tools.ts`, `app/api/chat/route.ts`

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

#### 1:00–1:20 — API route con chat

- [ ] `app/api/chat/route.ts`:
  - Parsear body: `messages`, `prUrl?`, `persona?`
  - Si `messages.length === 1` y hay `prUrl`: fetch PR + diffs, inyectar contexto en el system prompt
  - Si es turno de seguimiento: usar el mismo system prompt (el contexto del PR esta en el primer mensaje del historial)
  - `streamText()` con modelo, system prompt de la persona, `messages`, tools, `maxSteps: 3`
  - Devolver `toDataStreamResponse()`
- [ ] Probar con curl:
  - Primer turno: `{ messages: [{role:"user", content:"Haz el review"}], prUrl: "...", persona: "strict" }`
  - Segundo turno: `{ messages: [...historial, {role:"user", content:"Como lo arreglarias?"}] }`

---

### Julidev — Personas + Tipos

> Archivos: `lib/personas.ts`, `lib/types.ts`

#### 0:10–0:40 — Tipos compartidos

- [ ] `lib/types.ts` — extraer interfaces una vez que Andrew tenga `github.ts` avanzado:
  ```ts
  type Persona = 'strict' | 'mentor' | 'troll'
  interface PRData { title: string, description: string, author: string, headSha: string, baseBranch: string }
  interface FileDiff { filename: string, patch: string, additions: number, deletions: number }
  interface ChatRequest { messages: Message[], prUrl?: string, persona?: Persona }
  ```
- [ ] Schema zod para validar el request body (Andrew lo importa en la route)

> Los tipos se alinean con lo que Andrew esta construyendo — coordinar si algo no encaja.

#### 0:40–1:20 — Personalidades para review Y chat

- [ ] `lib/personas.ts` — system prompt base que funciona para ambos contextos:
  ```
  Eres un code reviewer experto con acceso al contexto completo de un PR.
  Tu primera respuesta es siempre el review estructurado:
    ## Resumen, ## Problemas, ## Lo bueno, ## Veredicto
  En mensajes siguientes, responde las preguntas del usuario sobre el PR
  manteniendo tu personalidad. Usa las tools si necesitas explorar mas contexto.
  {bloque_personalidad}
  ```
- [ ] Persona `strict` — directo, sin rodeos, cita SOLID/DRY solo si aplica, no tolera PR sin tests, en el chat no suaviza las criticas
- [ ] Persona `mentor` — explica el "por que", valida lo bueno primero, en el chat guia hacia la solucion paso a paso
- [ ] Persona `troll` — sarcastico pero tecnico, en el chat sigue siendo ironico pero da respuestas utiles
- [ ] Probar cada prompt manualmente con un diff + una pregunta de seguimiento para verificar que ambas fases funcionan
- [ ] `getPersona(persona: Persona): string` — export para que Andrew lo use en la route

---

## Fase 2 — Integracion backend (1:20–1:40)

> Ambos juntos.

- [ ] Conectar route de Andrew con personas de Julidev
- [ ] Probar flujo de 2 turnos con curl:
  1. Primer turno con PR real → verifica que devuelve review estructurado
  2. Segundo turno con pregunta de seguimiento → verifica que el contexto se mantiene
- [ ] Verificar que las 3 personalidades generan reviews distintos
- [ ] Verificar que las tools se ejecutan en algun turno
- [ ] Fix rapido de cualquier bug de integracion

**Hito:** A las 1:40 el backend DEBE funcionar en 2 turnos. Curl devuelve review en turno 1 y respuesta contextualizada en turno 2.

---

## Fase 3 — Frontend juntos (1:40–2:30)

> Ambos juntos. Uno genera UI, otro conecta logica.

### Julidev — UI con v0 + componentes (1:40–2:10)

- [ ] Generar UI en v0.dev con prompt:
  > "A single-page GitHub PR reviewer with AI chat. Top section: URL input and 3 personality cards (Strict Senior, Friendly Mentor, Code Troll). After submitting, the top section collapses and a chat window appears: message bubbles showing AI review and conversation, a text input at the bottom to ask follow-up questions, a small badge when the AI is fetching files. Dark theme, shadcn/ui."
- [ ] Adaptar output de v0 al proyecto
- [ ] `components/review-form.tsx` — input + cards + boton (estado pre-submit)
- [ ] `components/chat-window.tsx` — historial de mensajes + input de chat (estado post-submit)
- [ ] `components/tool-indicator.tsx` — badge animado "Investigando {file}..."
- [ ] Distinguir visualmente mensajes de usuario vs agente

### Andrew — Logica del frontend + conexion (1:40–2:10)

- [ ] `app/page.tsx` — conectar con `useChat`:
  ```tsx
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat',
    body: { prUrl, persona }, // el backend los usa solo en el primer turno
  });

  // Disparar el review inicial al submit del form:
  append({ role: 'user', content: 'Haz el review completo de este PR.' });
  ```
- [ ] State: `prUrl`, `persona`, `hasStarted` (para alternar entre form y chat)
- [ ] Validacion basica del input URL antes de submit
- [ ] Auto-scroll al ultimo mensaje mientras streamea
- [ ] Manejar errores del backend: URL invalida, PR no encontrado, rate limit

### Juntos (2:10–2:30) — Integrar y probar

- [ ] Conectar componentes de Julidev con logica de Andrew en `page.tsx`
- [ ] Probar flujo completo: URL → persona → submit → review en chat → pregunta de seguimiento → respuesta
- [ ] Probar las 3 personalidades
- [ ] Verificar que tool calls se muestran en la UI
- [ ] Fix de bugs visuales o de conexion

**Hito:** A las 2:30 el flujo completo (review + chat de seguimiento) DEBE funcionar en localhost.

---

## Fase 4 — Pulido y deploy (2:30–3:00)

> Ambos juntos.

| Tarea | Quien |
|-------|-------|
| Deploy en Vercel, probar en produccion | Andrew |
| Responsive + estados (loading, error, vacio) | Julidev |
| Favicon + titulo de pagina | Julidev |
| Probar con 2-3 PRs reales + chat de seguimiento en prod | Andrew |
| README basico | Quien termine primero |

**2:50 — Freeze de codigo. Solo fixes criticos. Grabar demo.**

---

## Puntos de sincronizacion

| Momento | Que pasa |
|---------|----------|
| 0:00–0:10 | **Juntos:** Setup, acordar contrato, push inicial |
| 0:10–1:20 | **Separados:** Andrew (github+tools+route), Julidev (tipos+personas) |
| 1:20–1:40 | **Juntos:** Integrar backend, probar 2 turnos con curl |
| 1:40–2:30 | **Juntos:** Frontend (Julidev UI, Andrew logica, luego integran) |
| 2:30–3:00 | **Juntos:** Deploy, pulido, demo |

## Regla de oro

> Si a las 2:00h no funciona el review inicial end-to-end, dejar el chat para despues y enfocarse en que el primer turno funcione. El chat es el mismo mecanismo — si el review funciona, el chat es cuestion de no resetear el historial.
> 
