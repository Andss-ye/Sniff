# Testing Sniff API

Guía para probar el servidor con el endpoint `/api/chat`.

## Inicio Rápido

```bash
npm run dev
# El servidor corre en http://localhost:3000
```

---

## POST /api/chat

**Propósito:** Manejar tanto la revisión inicial de un PR como los turnos de chat posteriores.

**Base URL:** `http://localhost:3000`

### Request Schema

```typescript
interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  prUrl: string  // URL de un PR público de GitHub (ej: https://github.com/owner/repo/pull/123)
  persona?: 'strict' | 'mentor' | 'troll'  // Default: 'strict'
}
```

### Ejemplo: Primer turno (revisión inicial)

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
       "parts": [{ "type": "text", "text": "Revisa este PR" }]
      }
    ],
    "prUrl": "https://github.com/facebook/react/pull/29999",
    "persona": "strict"
  }'
```

**Respuesta:** Stream de contenido del review (content-type: `text/event-stream`)

---

### Ejemplo: Segundo turno (follow-up)

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Revisa este PR"
      },
      {
        "role": "assistant",
        "content": "# Review\n\n## Observaciones...[content from first turn]"
      },
      {
        "role": "user",
        "content": "¿Cómo afectaría cambiar esto a otros archivos?"
      }
    ],
    "prUrl": "https://github.com/facebook/react/pull/29999",
    "persona": "strict"
  }'
```

---

## Testing con JavaScript/Fetch

### Setup básico

```javascript
const apiUrl = 'http://localhost:3000/api/chat'

const chatRequest = {
  messages: [
    { role: 'user', content: 'Revisa este PR' }
  ],
  prUrl: 'https://github.com/facebook/react/pull/29999',
  persona: 'strict'
}

fetch(apiUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(chatRequest)
})
  .then(res => res.text())
  .then(console.log)
```

### Streaming (recomendado)

```javascript
async function streamChat(chatRequest) {
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chatRequest)
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    console.log(chunk) // Procesa línea a línea
  }
}

// Uso
streamChat({
  messages: [{ role: 'user', content: 'Revisa este PR' }],
  prUrl: 'https://github.com/facebook/react/pull/29999',
  persona: 'mentor'
})
```

---

## Casos de Prueba

### ✅ Happy Path: Revisión básica

```json
{
  "messages": [
    { "role": "user", "content": "Revisa este PR por favor" }
  ],
  "prUrl": "https://github.com/vercel/next.js/pull/60000",
  "persona": "strict"
}
```

**Esperado:** Stream de review estructurado

---

### ✅ Follow-up: Pregunta adicional

```json
{
  "messages": [
    { "role": "user", "content": "Revisa este PR" },
    { "role": "assistant", "content": "[contenido del review anterior]" },
    { "role": "user", "content": "¿Hay vulnerabilidades de seguridad?" }
  ],
  "prUrl": "https://github.com/vercel/next.js/pull/60000",
  "persona": "strict"
}
```

**Esperado:** Análisis enfocado en seguridad, manteniendo contexto del PR

---

### ✅ Personalidades

#### Strict
```json
{
  "messages": [{ "role": "user", "content": "Revisa" }],
  "prUrl": "https://github.com/vercel/next.js/pull/60000",
  "persona": "strict"
}
```
**Tono:** Crítico, directo, encontrando issues

#### Mentor
```json
{
  "messages": [{ "role": "user", "content": "Revisa" }],
  "prUrl": "https://github.com/vercel/next.js/pull/60000",
  "persona": "mentor"
}
```
**Tono:** Educativo, sugerencias constructivas

#### Troll
```json
{
  "messages": [{ "role": "user", "content": "Revisa" }],
  "prUrl": "https://github.com/vercel/next.js/pull/60000",
  "persona": "troll"
}
```
**Tono:** Sarcástico, exagerado (para diversión)

---

### ❌ Error: URL inválida

```json
{
  "messages": [{ "role": "user", "content": "Revisa" }],
  "prUrl": "https://github.com/notexist/nope/pull/1",
  "persona": "strict"
}
```

**Respuesta:** 400 con mensaje de error de GitHub API

---

### ❌ Error: Request inválido

```json
{
  "messages": [],
  "prUrl": "invalid-url"
}
```

**Respuesta:** 400 con detalles de validación de Zod

---

## Herramientas del Agente

El endpoint tiene acceso a 2 herramientas durante el review:

1. **`fetch_file_context`** — Leer archivo completo desde la rama del PR
2. **`list_directory`** — Listar contenido de un directorio

El agente puede usar estas hasta 3 pasos (`maxSteps: 3`).

---

## Variables de Entorno Requeridas

```env
GROQ_API_KEY=gsk_...  # API key de Groq
```

Obtener en: https://console.groq.com/

---

## Monitoreo

### Logs del servidor

```bash
npm run dev
# Verás logs de Groq en la consola
```

### DevTools del navegador

1. Abre http://localhost:3000
2. Copia un PR URL (ej: `https://github.com/facebook/react/pull/29999`)
3. Selecciona personalidad
4. Abre DevTools → Network → filtra por `chat`
5. Inspecciona request/response en tiempo real

---

## Tips

- **Repos pequeños:** Los reviews son más rápidos en repos con PRs simples
- **Contexto persistente:** Cada mensaje nuevo incluye todo el historial
- **Rate limiting:** GitHub permite 60 req/h sin autenticación
- **Timeouts:** El endpoint tiene `maxDuration: 30s` en Vercel

---

## Troubleshooting

### "Error al obtener datos del PR"
- Verifica que la URL sea correcta y pública
- Chequea que el PR aún exista

### "Invalid request"
- Valida el schema de ChatRequest
- Asegúrate de enviar al menos 1 mensaje

### Stream vacío
- Chequea `GROQ_API_KEY` en `.env.local`
- Verifica que Groq tenga saldo de API
