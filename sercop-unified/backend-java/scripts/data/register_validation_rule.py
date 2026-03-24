#!/usr/bin/env python3
"""
Script para registrar la regla de validación de Carta de Crédito
en el sistema de Event Rules mediante la API REST.
"""

import requests
import json
import sys
from pathlib import Path

# Configuración
API_URL = "http://localhost:8080/api/event-rules/commands"
DRL_FILE_PATH = "src/main/resources/rules/letter-of-credit-validation.drl"

def read_drl_file():
    """Lee el contenido del archivo DRL"""
    drl_path = Path(__file__).parent / DRL_FILE_PATH

    if not drl_path.exists():
        print(f"❌ Error: No se encontró el archivo DRL en {drl_path}")
        sys.exit(1)

    with open(drl_path, 'r', encoding='utf-8') as f:
        return f.read()

def create_validation_rule():
    """Crea la regla de validación mediante la API"""

    # Leer el contenido del archivo DRL
    drl_content = read_drl_file()

    # Preparar el comando
    command = {
        "codigo": "LC_VALIDATION_PRE_CREATE",
        "nombre": "Validación de Carta de Crédito Pre-Creación",
        "descripcion": "Conjunto de 10 reglas de validación de negocio para Cartas de Crédito que se ejecutan ANTES de guardar el evento en el EventStore. Incluye validaciones de fechas, montos, porcentajes, bancos confirmadores, beneficiarios y participantes según estándares UCP 600.",
        "tipoOperacion": "LETTER_OF_CREDIT",
        "eventoTrigger": "PRE_CREATED",
        "condicionesDRL": drl_content,
        "accionesJson": json.dumps([
            {
                "type": "VALIDATE",
                "description": "Ejecutar validaciones de negocio con Drools",
                "onError": "REJECT_COMMAND"
            },
            {
                "type": "LOG",
                "level": "INFO",
                "message": "Validaciones de negocio ejecutadas correctamente"
            }
        ]),
        "prioridad": 100,
        "activo": True,
        "createdBy": "system"
    }

    # Hacer la petición POST
    try:
        print(f"📤 Enviando regla de validación a {API_URL}...")
        response = requests.post(
            API_URL,
            json=command,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        # Debug: mostrar respuesta
        print(f"   Status Code: {response.status_code}")
        print(f"   Response Text: {response.text[:500] if response.text else '(empty)'}...")

        # Procesar respuesta
        if response.status_code == 201:
            try:
                result = response.json()
                print(f"✅ Regla creada exitosamente!")
                print(f"   ID: {result['data']['id']}")
                print(f"   Código: {result['data']['codigo']}")
                print(f"   Nombre: {result['data']['nombre']}")
                print(f"   Tipo Operación: {result['data']['tipoOperacion']}")
                print(f"   Evento Trigger: {result['data']['eventoTrigger']}")
                print(f"   Prioridad: {result['data']['prioridad']}")
                print(f"   Activo: {result['data']['activo']}")
                return True
            except json.JSONDecodeError:
                print(f"❌ Error: Respuesta no es JSON válido")
                return False
        else:
            try:
                error_data = response.json()
                print(f"❌ Error al crear regla (HTTP {response.status_code}):")
                print(f"   {error_data.get('message', 'Error desconocido')}")
            except json.JSONDecodeError:
                print(f"❌ Error al crear regla (HTTP {response.status_code}):")
                print(f"   Respuesta: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        print(f"❌ Error: No se pudo conectar al servidor en {API_URL}")
        print(f"   Asegúrate de que el backend esté ejecutándose.")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ Error: Tiempo de espera agotado")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

if __name__ == "__main__":
    print("=" * 70)
    print("REGISTRO DE REGLA DE VALIDACIÓN DE CARTA DE CRÉDITO")
    print("=" * 70)
    print()

    success = create_validation_rule()

    print()
    print("=" * 70)

    sys.exit(0 if success else 1)
