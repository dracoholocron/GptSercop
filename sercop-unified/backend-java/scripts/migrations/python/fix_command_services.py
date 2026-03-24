#!/usr/bin/env python3
"""
Script para hacer la inyección de EventProducers opcional en CommandServices
"""
import re
import os
from pathlib import Path

# Servicios a modificar
services = [
    "MonedaCommandService",
    "CotizacionCommandService",
    "CuentaBancariaCommandService",
    "CatalogoPersonalizadoCommandService",
    "PlantillaCommandService",
    "PlantillaCorreoCommandService",
    "ReglaEventoCommandService",
    "FinancialInstitutionCommandService",
    "LetterOfCreditCommandService",
    "DocumentaryCollectionCommandService",
    "BankGuaranteeCommandService",
    "FinanciamientoCxCommandService",
    "LineaCreditoCommandService",
]

base_path = Path("src/main/java/com/globalcmx/api/service/command")

for service_name in services:
    file_path = base_path / f"{service_name}.java"

    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        continue

    print(f"Processing {service_name}...")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. Reemplazar @RequiredArgsConstructor por constructor explícito
    # Primero buscar el nombre del Producer
    producer_match = re.search(r'private final (\w+EventProducer) (\w+);', content)
    if not producer_match:
        print(f"  ⚠️  No producer found, skipping...")
        continue

    producer_type = producer_match.group(1)
    producer_field = producer_match.group(2)

    # Eliminar @RequiredArgsConstructor
    content = re.sub(r'import lombok\.RequiredArgsConstructor;\n', '', content)
    content = re.sub(r'@RequiredArgsConstructor\n', '', content)

    # Agregar import de Autowired si no existe
    if 'import org.springframework.beans.factory.annotation.Autowired;' not in content:
        content = content.replace(
            'import org.springframework.stereotype.Service;',
            'import org.springframework.beans.factory.annotation.Autowired;\nimport org.springframework.stereotype.Service;'
        )

    # 2. Cambiar el producer field a @Autowired(required = false)
    content = re.sub(
        rf'private final {producer_type} {producer_field};',
        f'@Autowired(required = false)\n    private {producer_type} {producer_field};',
        content
    )

    # 3. Extraer todos los campos final para el constructor
    # Buscar todos los private final excepto el producer
    fields_pattern = r'private final (\w+(?:<[\w<>,\s]+>)?)\s+(\w+);'
    fields = []
    for match in re.finditer(fields_pattern, content):
        field_type = match.group(1)
        field_name = match.group(2)
        if field_name != producer_field:
            fields.append((field_type, field_name))

    # 4. Crear constructor explícito
    class_match = re.search(rf'public class {service_name} {{\s*\n', content)
    if not class_match:
        print(f"  ⚠️  Class declaration not found")
        continue

    # Construir parámetros del constructor
    constructor_params = ',\n                                     '.join(
        [f"{ftype} {fname}" for ftype, fname in fields]
    )

    # Construir asignaciones del constructor
    constructor_assignments = '\n        '.join(
        [f"this.{fname} = {fname};" for ftype, fname in fields]
    )

    constructor = f"""
    public {service_name}({constructor_params}) {{
        {constructor_assignments}
    }}
"""

    # Insertar constructor después de los campos
    # Buscar el último campo antes del primer método (@Transactional)
    transactional_match = re.search(r'\n\s+@Transactional', content)
    if transactional_match:
        insert_pos = transactional_match.start()
        content = content[:insert_pos] + constructor + content[insert_pos:]

    # 5. Modificar el método que publica eventos para verificar si el producer está disponible
    # Buscar patrones como: eventProducer.sendXXX(kafkaEvent) o eventProducer.publishXXX(kafkaEvent)
    publish_pattern = rf'{producer_field}\.(send|publish)\w+\(([^)]+)\);'

    def add_null_check(match):
        method_call = match.group(0)
        full_statement = method_call

        # Buscar context alrededor para encontrar el método completo
        return f"""if ({producer_field} != null) {{
            {method_call}
        }} else {{
            log.debug("Kafka producer not available (GCP profile) - skipping event publication");
        }}"""

    # Reemplazar cada llamada al producer
    content = re.sub(publish_pattern, add_null_check, content)

    # Guardar cambios
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ {service_name} modified successfully")
    else:
        print(f"  ℹ️  No changes needed for {service_name}")

print("\n✅ All services processed")
