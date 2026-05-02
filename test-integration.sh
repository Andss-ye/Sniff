#!/bin/bash

echo "=================================="
echo "TEST DE INTEGRACIÓN - BACKEND"
echo "=================================="
echo ""

# Verificar que el servidor está corriendo
echo "⚠️  PREREQUISITO: El servidor debe estar corriendo en http://localhost:3000"
echo "   Ejecuta en otra terminal: npm run dev"
echo ""
read -p "¿El servidor está corriendo? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Inicia el servidor primero con: npm run dev"
    exit 1
fi

echo ""
echo "=================================="
echo "TEST 1: Review inicial (primer turno)"
echo "=================================="
echo ""

# Test con un PR real de ejemplo
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Haz el review completo de este PR."
      }
    ],
    "prUrl": "https://github.com/vercel/next.js/pull/1",
    "persona": "strict"
  }' \
  --no-buffer

echo ""
echo ""
echo "=================================="
echo "TEST 2: Pregunta de seguimiento (segundo turno)"
echo "=================================="
echo ""

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Haz el review completo de este PR."
      },
      {
        "role": "assistant",
        "content": "## Resumen\nEste PR agrega autenticación...\n\n## Problemas\n1. **[CRÍTICO]** SQL Injection..."
      },
      {
        "role": "user",
        "content": "¿Cómo debería arreglar el problema de SQL injection?"
      }
    ]
  }' \
  --no-buffer

echo ""
echo ""
echo "=================================="
echo "TESTS COMPLETADOS"
echo "=================================="
echo ""
echo "Verifica que:"
echo "  ✓ El primer turno devuelve un review estructurado"
echo "  ✓ El segundo turno responde la pregunta manteniendo contexto"
echo "  ✓ Las personalidades generan respuestas distintas"
echo ""
