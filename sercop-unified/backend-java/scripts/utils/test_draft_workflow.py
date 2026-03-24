#!/usr/bin/env python3
"""
Script para probar el flujo completo de creación y actualización de borradores
"""
import requests
import json
import time

API_BASE = "http://localhost:8080/api"

def test_draft_workflow():
    print("=" * 80)
    print("TEST: Flujo completo de borradores LC Import")
    print("=" * 80)

    # 1. Crear un borrador inicial
    print("\n📝 PASO 1: Creando borrador inicial...")
    draft_data = {
        "numeroOperacion": f"TEST-DRAFT-{int(time.time())}",
        "tipoLc": "IMPORTACION",
        "modalidad": "IRREVOCABLE",
        "formaPago": "A_LA_VISTA",
        "estado": "BORRADOR",
        "ordenanteId": 1,
        "beneficiarioId": 2,
        "bancoEmisorId": 1,
        "moneda": "USD",
        "monto": 50000.00,
        "fechaEmision": "2025-11-10",
        "fechaVencimiento": "2026-01-10",
        "lugarEmbarque": "Shanghai",
        "lugarDestino": "Los Angeles",
        "descripcionMercancia": "Productos de prueba",
        "usuarioCreacion": "test_user",
        "swiftOptionalFields": json.dumps({
            "lugarVencimiento": "New York, USA",
            "embarquesParciales": "ALLOWED",
            "transbordo": "NOT_ALLOWED"
        })
    }

    response = requests.post(f"{API_BASE}/foreign-trade/letters-of-credit/drafts",
                           json=draft_data,
                           headers={"Content-Type": "application/json"})

    if response.status_code == 200:
        draft = response.json()["data"]
        draft_id = draft["id"]
        aggregate_id = draft.get("aggregateId")
        numero_operacion = draft["numeroOperacion"]

        print(f"✅ Borrador creado exitosamente:")
        print(f"   - ID (read model): {draft_id}")
        print(f"   - Aggregate ID: {aggregate_id}")
        print(f"   - Número Operación: {numero_operacion}")

        # Verificar campos opcionales
        swift_fields = json.loads(draft.get("swiftOptionalFields", "{}"))
        print(f"   - Lugar Vencimiento: {swift_fields.get('lugarVencimiento', 'NO PRESENTE')}")

        # 2. Actualizar el borrador
        print(f"\n✏️  PASO 2: Actualizando borrador {draft_id}...")
        time.sleep(1)

        update_data = {
            "monto": 75000.00,
            "descripcionMercancia": "Productos de prueba ACTUALIZADOS",
            "usuarioCreacion": "test_user",
            "swiftOptionalFields": json.dumps({
                "lugarVencimiento": "London, UK",  # Cambiar lugar
                "embarquesParciales": "NOT_ALLOWED",  # Cambiar
                "transbordo": "ALLOWED",  # Cambiar
                "referenciaPreAviso": "REF-12345"  # Nuevo campo
            })
        }

        response = requests.put(f"{API_BASE}/foreign-trade/letters-of-credit/drafts/{draft_id}",
                              json=update_data,
                              headers={"Content-Type": "application/json"})

        if response.status_code == 200:
            updated_draft = response.json()["data"]
            updated_swift = json.loads(updated_draft.get("swiftOptionalFields", "{}"))

            print(f"✅ Borrador actualizado exitosamente:")
            print(f"   - ID: {updated_draft['id']}")
            print(f"   - Monto actualizado: ${updated_draft['monto']}")
            print(f"   - Lugar Vencimiento actualizado: {updated_swift.get('lugarVencimiento', 'NO PRESENTE')}")
            print(f"   - Referencia Pre-Aviso nueva: {updated_swift.get('referenciaPreAviso', 'NO PRESENTE')}")

            # 3. Verificar que no se creó un nuevo borrador
            print(f"\n🔍 PASO 3: Verificando que NO se creó un nuevo borrador...")
            response = requests.get(f"{API_BASE}/foreign-trade/letters-of-credit/drafts")

            if response.status_code == 200:
                drafts = response.json()["data"]
                print(f"   - Total de borradores: {len(drafts)}")

                if len(drafts) == 1:
                    print("✅ ÉXITO: Solo hay 1 borrador (actualización funcionó correctamente)")
                else:
                    print("❌ ERROR: Se crearon múltiples borradores")
                    for d in drafts:
                        print(f"      - ID {d['id']}: {d['numeroOperacion']}")

            print("\n" + "=" * 80)
            print("✅ TEST COMPLETADO EXITOSAMENTE")
            print("=" * 80)

        else:
            print(f"❌ Error al actualizar: {response.status_code}")
            print(f"   Response: {response.text}")
    else:
        print(f"❌ Error al crear borrador: {response.status_code}")
        print(f"   Response: {response.text}")

if __name__ == "__main__":
    try:
        test_draft_workflow()
    except Exception as e:
        print(f"❌ Error en el test: {e}")
        import traceback
        traceback.print_exc()
