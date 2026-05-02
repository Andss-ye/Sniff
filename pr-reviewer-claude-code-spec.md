# Sniff — PR Reviewer con Personalidad + Chat

> Hackathon v0/Vercel. Tiempo: 3 horas. Todo en el ecosistema Vercel.

## Idea

Pegas la URL de un PR publico de GitHub, eliges una personalidad, y en vez de recibir un reporte estatico que lees y cierras — arrancas una sesion de trabajo con un senior dev simulado que conoce tu codigo.

El review inicial es solo la entrada. Lo diferente es lo que pasa despues: el agente recuerda todo el contexto del PR y puedes preguntarle "como quedaria el codigo corregido?", "por que esto rompe en concurrencia?", "que pasa si uso X en vez de Y?". El agente puede explorar el repo para responder — no solo el diff, sino los archivos completos, los tests, el directorio.

**Por que esto no lo hace ningun otro PR reviewer:**
- CodeRabbit, Copilot, Reviewpad — todos generan un reporte y se van. Ningun permite continuar trabajando sobre los hallazgos.
- ChatGPT con el diff pegado — no tiene acceso al repo para explorar contexto extra, y pierdes el thread si cambias de pestana.
- Sniff mantiene al agente "dentro" del PR durante toda la sesion.

**Las personalidades no son un chiste de UX — cambian el tipo de sesion:**
- `strict`: te obliga a justificar cada decision antes de aprobar. Util si quieres un pre-review antes de pedir review real.
- `mentor`: te lleva paso a paso al fix. Util si eres junior o llegaste a codigo que no escribiste.
- `troll`: brutal pero correcto. Util para darte cuenta rapido de los problemas obvios que no quieres ver.

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

Los $20 de creditos de Vercel se pueden usar con el **AI Gateway** de Vercel:

```ts
import { openai } from '@ai-sdk/openai';
const model = openai('gpt-4o-mini'); // ~$0.15/1M input tokens
```

**Configuracion en Vercel Dashboard:** Settings → AI → habilitar AI Gateway. Sin `OPENAI_API_KEY` externa.

> **Decision:** `gpt-4o-mini` via Vercel AI Gateway. Costo estimado para el demo: <$0.50.

---

## Arquitectura (minima)

```
app/
├── page.tsx                    # Landing: input + selector + chat completo
├── api/
│   └── chat/
│       └── route.ts            # POST — maneja tanto el review inicial como el chat de seguimiento
├── lib/
│   ├── github.ts               # parseUrl(), fetchPR(), fetchDiff(), fetchFileContent()
│   ├── personas.ts             # 3 system prompts
│   ├── tools.ts                # 2 tools del agente
│   └── types.ts                # Interfaces extraidas de github.ts una vez que existe
└── components/
    ├── review-form.tsx         # Input URL + selector personalidad
    ├── chat-window.tsx         # Historial de mensajes + input de chat
    └── tool-indicator.tsx      # Muestra cuando el agente usa una tool
```

**Solo 8 archivos de codigo.** El cambio clave: un solo endpoint `/api/chat` maneja todo — el review inicial y el chat posterior son el mismo mecanismo (`useChat`), la diferencia es el primer mensaje.

> `lib/types.ts` se extrae de `lib/github.ts` una vez que las funciones existen. No definir tipos en el vacio antes de tener la implementacion.

---

## Flujo completo

### Primera interaccion — el review

El frontend envia el primer mensaje automaticamente al confirmar el PR:

```
[sistema] Contexto del PR: {metadata + diffs}
[usuario] Haz el review completo de este PR.
```

El agente responde con el review estructurado, usando tools si necesita ver archivos completos.

### Interacciones siguientes — sesion de trabajo

El usuario no "hace preguntas al chatbot" — trabaja sobre los hallazgos:

```
[usuario] Muéstrame como quedaria auth.ts con el fix que sugeriste.
[usuario] Si cambio esa funcion, que otros archivos del repo se rompen?
[usuario] Este PR es de un companero, quiero entender que hace antes de aprobarlo.
[usuario] Dame una version del review que pueda copiar como comentario de GitHub.
```

El agente puede llamar tools en cualquier turno — si para responder necesita ver un archivo que no estaba en el diff, lo busca.

---

## Endpoint

`POST /api/chat`

**Body:** `{ messages: Message[], prUrl?: string, persona?: Persona }`

- `prUrl` y `persona` solo se envian en el primer mensaje (el frontend los inyecta)
- A partir del segundo mensaje, `messages` contiene el historial completo

**Logica:**

1. Si es el primer mensaje (el array tiene 1 mensaje y hay `prUrl`):
   - Parsear URL, fetch PR + diffs de GitHub
   - Inyectar contexto del PR en el system prompt
   - Guardar `owner`, `repo`, `headSha` en el primer mensaje (via metadata) para que las tools funcionen en turns siguientes
2. `streamText()` con:
   - `model: openai('gpt-4o-mini')`
   - `system`: prompt de la persona + contexto del PR
   - `messages`: historial completo
   - `tools`: las 2 tools
   - `maxSteps: 3`
3. Devolver `toDataStreamResponse()`

---

## Tools del agente (solo 2)

### `fetch_file_context`

- **Input:** `{ path: string }`
- **Output:** Contenido completo del archivo (truncado a 200 lineas), rama del PR
- **Implementacion:** `GET /repos/{owner}/{repo}/contents/{path}?ref={head_sha}`

### `list_directory`

- **Input:** `{ path: string }`
- **Output:** Array de nombres de archivo en el directorio
- **Implementacion:** `GET /repos/{owner}/{repo}/contents/{path}?ref={head_sha}`

> `search_repo` eliminado — la API de code search de GitHub necesita auth y es inestable.

---

## Personalidades

`lib/personas.ts` — system prompt base comun para review Y chat:

```
Eres un code reviewer experto. Tienes el contexto completo de un PR de GitHub:
su metadata, los diffs de los archivos modificados, y herramientas para explorar
el repo cuando necesites mas contexto.

Tu primera respuesta siempre es el review estructurado:
## Resumen
## Problemas (paths y lineas especificas)
## Lo bueno
## Veredicto: approve | request_changes | needs_discussion

En los mensajes siguientes, responde las preguntas del usuario sobre el PR
manteniendo tu personalidad y usando las tools si hace falta.

{bloque_personalidad}
```

| Persona | Bloque |
|---------|--------|
| `strict` | Senior con 15 anos. Directo, sin rodeos. Cita principios (SOLID, DRY) solo si aplican. No tolera PR sin tests. En el chat, no suaviza las criticas. |
| `mentor` | Senior amable. Explica el "por que". Valida lo bueno primero. En el chat, guia paso a paso hacia la solucion. |
| `troll` | Sarcastico pero tecnico. Bromas sobre patrones malos. En el chat, sigue siendo ironico pero da respuestas utiles. |

---

## Frontend

### Generar con v0

Prompt sugerido:

> "A single-page GitHub PR reviewer with AI chat. Top section: URL input and 3 personality cards (Strict Senior, Friendly Mentor, Code Troll). Main section: a chat window showing the AI review and subsequent messages, with a text input at the bottom to ask follow-up questions. A small badge appears when the AI is fetching files from the repo. Dark theme, minimal, shadcn/ui."

### Conexion al backend

```tsx
'use client';
import { useChat } from '@ai-sdk/react';

const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  body: { prUrl, persona }, // se adjunta en cada request, el backend lo usa solo en el primero
});

// Para disparar el review inicial:
append({ role: 'user', content: 'Haz el review completo de este PR.' });
```

`useChat` maneja el historial automaticamente — no hay que gestionar estado de mensajes a mano.

### Estructura visual

1. **Antes de submit:** Form con input de URL + selector de personalidad
2. **Despues de submit:** El form se oculta (o colapsa arriba) y aparece el chat window
3. **Chat window:** Burbujas de mensajes, el review inicial del agente aparece como el primer mensaje, debajo un input simple para preguntar

---

## Variables de entorno

```
# Solo si NO usas Vercel AI Gateway:
OPENAI_API_KEY=

# Opcional — sube rate limit de GitHub de 60 a 5000 req/h:
GITHUB_TOKEN=
```

---

## Plan de 3 horas

| Tiempo | Que hacer | Entregable |
|--------|-----------|------------|
| 0:00–0:10 | Setup, deploy vacio en Vercel, acordar contrato de API | Repo en Vercel |
| 0:10–0:50 | `lib/github.ts` — parsear URL, fetch PR + diffs + file content | GitHub data funcionando |
| 0:50–1:30 | `api/chat/route.ts` — `streamText` con tools, inyeccion de contexto del PR | **Review inicial funcionando con curl** |
| 1:30–1:50 | `lib/personas.ts` — 3 prompts que funcionen bien en review Y en chat | Personalidades listas |
| 1:50–2:30 | Frontend con v0 + `useChat` + chat window | **Flujo completo en el browser** |
| 2:30–2:50 | Errores basicos, pulido visual, responsive | App robusta |
| 2:50–3:00 | Deploy final, probar con 2-3 PRs reales, grabar demo | **Listo** |

**Hito critico:** A las 1:50 el review inicial DEBE funcionar con curl. El chat de seguimiento es el mismo mecanismo — si el review funciona, el chat funciona.

---

## Lo que NO hacemos

| Eliminado | Razon |
|-----------|-------|
| Vercel KV / cache | El chat es efimero por sesion, no necesita persistencia. |
| `search_repo` tool | Necesita auth de GitHub, API inestable. |
| Auth de usuario | No aporta al demo. |
| Historial entre sesiones | Scope creep, mismo riesgo que KV. |
| Multiples modelos / fallback | Un modelo bien configurado es suficiente. |
| Chat general sin contexto de PR | No tendria valor diferencial — hay miles de chatbots. |

---

## Checklist de demo

- [ ] Deploy publico en Vercel
- [ ] Pegar URL → review en streaming en <20s
- [ ] Pedir al agente que muestre el codigo corregido de un problema que encontro
- [ ] Pregunta que fuerza tool use en el segundo turno (ej: "hay tests para este archivo?")
- [ ] Misma URL con `strict` vs `mentor` — mostrar que la sesion es radicalmente distinta
- [ ] README con que es y como correrlo

## Stretch goals (solo si sobran >15 min)

1. Boton "Nueva sesion" que resetea el chat y permite revisar otro PR
2. Syntax highlighting en code blocks (`rehype-highlight`)
3. Mostrar rate limit restante de GitHub
