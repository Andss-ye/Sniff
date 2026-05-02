#!/bin/bash

# Ejemplos de requests curl para probar la API
# Asegúrate de que el servidor esté corriendo: npm run dev

echo "════════════════════════════════════════════════════════════════════════════════"
echo "EJEMPLOS DE REQUESTS CURL - API /api/chat"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Ejemplo 1: Review inicial con personalidad STRICT${NC}"
echo "────────────────────────────────────────────────────────────────────────────────"
echo ""
echo "curl -X POST http://localhost:3000/api/chat \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"messages\": [{\"role\": \"user\", \"content\": \"Haz el review completo de este PR.\"}],"
echo "    \"prUrl\": \"https://github.com/vercel/next.js/pull/73391\","
echo "    \"persona\": \"strict\""
echo "  }'"
echo ""
echo -e "${GREEN}Presiona Enter para ejecutar...${NC}"
read

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Haz el review completo de este PR."}],
    "prUrl": "https://github.com/vercel/next.js/pull/73391",
    "persona": "strict"
  }'

echo ""
echo ""

echo -e "${BLUE}Ejemplo 2: Review inicial con personalidad MENTOR${NC}"
echo "────────────────────────────────────────────────────────────────────────────────"
echo ""
echo "curl -X POST http://localhost:3000/api/chat \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"messages\": [{\"role\": \"user\", \"content\": \"Haz el review completo de este PR.\"}],"
echo "    \"prUrl\": \"https://github.com/vercel/next.js/pull/73391\","
echo "    \"persona\": \"mentor\""
echo "  }'"
echo ""
echo -e "${GREEN}Presiona Enter para ejecutar...${NC}"
read

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Haz el review completo de este PR."}],
    "prUrl": "https://github.com/vercel/next.js/pull/73391",
    "persona": "mentor"
  }'

echo ""
echo ""

echo -e "${BLUE}Ejemplo 3: Review inicial con personalidad TROLL${NC}"
echo "────────────────────────────────────────────────────────────────────────────────"
echo ""
echo "curl -X POST http://localhost:3000/api/chat \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"messages\": [{\"role\": \"user\", \"content\": \"Haz el review completo de este PR.\"}],"
echo "    \"prUrl\": \"https://github.com/vercel/next.js/pull/73391\","
echo "    \"persona\": \"troll\""
echo "  }'"
echo ""
echo -e "${GREEN}Presiona Enter para ejecutar...${NC}"
read

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Haz el review completo de este PR."}],
    "prUrl": "https://github.com/vercel/next.js/pull/73391",
    "persona": "troll"
  }'

echo ""
echo ""

echo -e "${BLUE}Ejemplo 4: Pregunta de seguimiento (segundo turno)${NC}"
echo "────────────────────────────────────────────────────────────────────────────────"
echo ""
echo "curl -X POST http://localhost:3000/api/chat \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"messages\": ["
echo "      {\"role\": \"user\", \"content\": \"Haz el review completo de este PR.\"},"
echo "      {\"role\": \"assistant\", \"content\": \"[Review anterior aquí]\"},"
echo "      {\"role\": \"user\", \"content\": \"¿Cuáles son los problemas más críticos?\"}"
echo "    ]"
echo "  }'"
echo ""
echo -e "${GREEN}Presiona Enter para ejecutar...${NC}"
read

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Haz el review completo de este PR."},
      {"role": "assistant", "content": "Review completado con varios problemas encontrados."},
      {"role": "user", "content": "¿Cuáles son los problemas más críticos?"}
    ]
  }'

echo ""
echo ""

echo -e "${BLUE}Ejemplo 5: Request sin prUrl (solo chat)${NC}"
echo "────────────────────────────────────────────────────────────────────────────────"
echo ""
echo "curl -X POST http://localhost:3000/api/chat \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"messages\": [{\"role\": \"user\", \"content\": \"¿Qué opinas del código anterior?\"}]"
echo "  }'"
echo ""
echo -e "${GREEN}Presiona Enter para ejecutar...${NC}"
read

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "¿Qué opinas del código anterior?"}]
  }'

echo ""
echo ""

echo -e "${RED}Ejemplo 6: Request inválido - URL malformada${NC}"
echo "────────────────────────────────────────────────────────────────────────────────"
echo ""
echo "curl -X POST http://localhost:3000/api/chat \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"messages\": [{\"role\": \"user\", \"content\": \"Review\"}],"
echo "    \"prUrl\": \"not-a-valid-url\","
echo "    \"persona\": \"strict\""
echo "  }'"
echo ""
echo -e "${GREEN}Presiona Enter para ejecutar...${NC}"
read

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Review"}],
    "prUrl": "not-a-valid-url",
    "persona": "strict"
  }'

echo ""
echo ""

echo -e "${RED}Ejemplo 7: Request inválido - Persona incorrecta${NC}"
echo "────────────────────────────────────────────────────────────────────────────────"
echo ""
echo "curl -X POST http://localhost:3000/api/chat \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"messages\": [{\"role\": \"user\", \"content\": \"Review\"}],"
echo "    \"prUrl\": \"https://github.com/vercel/next.js/pull/73391\","
echo "    \"persona\": \"invalid\""
echo "  }'"
echo ""
echo -e "${GREEN}Presiona Enter para ejecutar...${NC}"
read

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Review"}],
    "prUrl": "https://github.com/vercel/next.js/pull/73391",
    "persona": "invalid"
  }'

echo ""
echo ""

echo "════════════════════════════════════════════════════════════════════════════════"
echo "EJEMPLOS COMPLETADOS"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "Otros PRs públicos para probar:"
echo "  - https://github.com/facebook/react/pull/31500"
echo "  - https://github.com/microsoft/vscode/pull/230000"
echo "  - https://github.com/nodejs/node/pull/55000"
echo ""
