#!/bin/bash

# Script para probar el API de comisiones SWIFT

API_BASE="http://localhost:8080/api/comisiones"

echo "========================================="
echo "Testing Comisiones SWIFT API"
echo "========================================="
echo ""

# Test 1: Health Check
echo "1. Health Check"
curl -s -X GET "${API_BASE}/health" | jq '.'
echo -e "\n"

# Test 2: Carta de Crédito pequeña (MT700)
echo "2. Carta de Crédito - Monto pequeño (MT700)"
curl -s -X POST "${API_BASE}/calcular" \
  -H "Content-Type: application/json" \
  -d '{
    "tipoMensaje": "MT700",
    "evento": "EMISION",
    "monto": 50000,
    "moneda": "USD",
    "paisOrigen": "MX",
    "paisDestino": "US"
  }' | jq '.'
echo -e "\n"

# Test 3: Carta de Crédito mediana (MT700)
echo "3. Carta de Crédito - Monto mediano (MT700)"
curl -s -X POST "${API_BASE}/calcular" \
  -H "Content-Type: application/json" \
  -d '{
    "tipoMensaje": "MT700",
    "evento": "EMISION",
    "monto": 250000,
    "moneda": "USD",
    "paisOrigen": "MX",
    "paisDestino": "US"
  }' | jq '.'
echo -e "\n"

# Test 4: Carta de Crédito grande (MT700)
echo "4. Carta de Crédito - Monto grande (MT700)"
curl -s -X POST "${API_BASE}/calcular" \
  -H "Content-Type: application/json" \
  -d '{
    "tipoMensaje": "MT700",
    "evento": "EMISION",
    "monto": 750000,
    "moneda": "USD",
    "paisOrigen": "MX",
    "paisDestino": "US"
  }' | jq '.'
echo -e "\n"

# Test 5: Garantía Bancaria pequeña (MT760)
echo "5. Garantía Bancaria - Monto pequeño (MT760)"
curl -s -X POST "${API_BASE}/calcular" \
  -H "Content-Type: application/json" \
  -d '{
    "tipoMensaje": "MT760",
    "evento": "EMISION",
    "monto": 100000,
    "moneda": "USD",
    "paisOrigen": "MX",
    "paisDestino": "US"
  }' | jq '.'
echo -e "\n"

# Test 6: Garantía Bancaria grande (MT760)
echo "6. Garantía Bancaria - Monto grande (MT760)"
curl -s -X POST "${API_BASE}/calcular" \
  -H "Content-Type: application/json" \
  -d '{
    "tipoMensaje": "MT760",
    "evento": "EMISION",
    "monto": 2000000,
    "moneda": "USD",
    "paisOrigen": "MX",
    "paisDestino": "US"
  }' | jq '.'
echo -e "\n"

# Test 7: Cobranza Documentaria (MT400)
echo "7. Cobranza Documentaria (MT400)"
curl -s -X POST "${API_BASE}/calcular" \
  -H "Content-Type: application/json" \
  -d '{
    "tipoMensaje": "MT400",
    "evento": "EMISION",
    "monto": 30000,
    "moneda": "USD",
    "paisOrigen": "MX",
    "paisDestino": "US"
  }' | jq '.'
echo -e "\n"

# Test 8: Modificación de Carta de Crédito (MT707)
echo "8. Modificación de Carta de Crédito (MT707)"
curl -s -X POST "${API_BASE}/calcular" \
  -H "Content-Type: application/json" \
  -d '{
    "tipoMensaje": "MT707",
    "evento": "MODIFICACION",
    "monto": 100000,
    "moneda": "USD",
    "paisOrigen": "MX",
    "paisDestino": "US"
  }' | jq '.'
echo -e "\n"

# Test 9: Pago bajo Carta de Crédito (MT754)
echo "9. Pago bajo Carta de Crédito (MT754)"
curl -s -X POST "${API_BASE}/calcular" \
  -H "Content-Type: application/json" \
  -d '{
    "tipoMensaje": "MT754",
    "evento": "PAGO",
    "monto": 75000,
    "moneda": "USD",
    "paisOrigen": "MX",
    "paisDestino": "US"
  }' | jq '.'
echo -e "\n"

# Test 10: Operación en EUR
echo "10. Carta de Crédito en EUR (MT700)"
curl -s -X POST "${API_BASE}/calcular" \
  -H "Content-Type: application/json" \
  -d '{
    "tipoMensaje": "MT700",
    "evento": "EMISION",
    "monto": 80000,
    "moneda": "EUR",
    "paisOrigen": "MX",
    "paisDestino": "ES"
  }' | jq '.'
echo -e "\n"

echo "========================================="
echo "Tests completados"
echo "========================================="
