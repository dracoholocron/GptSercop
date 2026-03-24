#!/usr/bin/env python3
"""
Script para refrescar la columna txt1 de la tabla gle_read_model
Lee el archivo XML y actualiza solo el campo txt1 usando INR como clave
"""

import xml.etree.ElementTree as ET
import mysql.connector
from datetime import datetime
import sys

# Configuración de la base de datos
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'globalcmx',
    'password': 'globalcmx123',
    'database': 'globalcmx_read'
}

# Ruta del archivo XML
XML_FILE = '/Users/admin/Documents/GitHub/globalcmx/backups/Contabilidad/gle.dbe'

# Tamaño del batch para updates
BATCH_SIZE = 500

def print_flush(message):
    """Print con flush inmediato"""
    print(message, flush=True)

def get_text(element, tag):
    """Obtiene el texto de un elemento hijo, retorna None si no existe"""
    child = element.find(tag)
    if child is not None and child.text:
        text = child.text.strip()
        # Limitar longitud de VARCHAR(255)
        if tag == 'TXT1':
            return text[:255] if len(text) > 255 else text
        return text
    return None

def refresh_txt1_column(cursor, connection):
    """Actualiza la columna txt1 usando datos del XML"""
    print_flush(f"\nActualizando columna txt1 desde: {XML_FILE}")
    print_flush("Parseando XML (esto puede tomar un momento para archivos grandes)...")

    # Parsear el archivo XML usando iterparse para mejor memoria
    context = ET.iterparse(XML_FILE, events=('end',))

    # Preparar el statement de UPDATE
    update_sql = """
    UPDATE gle_read_model
    SET txt1 = %s
    WHERE inr = %s
    """

    updated = 0
    errors = 0
    not_found = 0
    batch = []
    total_processed = 0

    try:
        for event, elem in context:
            if elem.tag == 'ROW':
                total_processed += 1

                try:
                    # Extraer INR (clave) y TXT1 (valor a actualizar)
                    inr = get_text(elem, 'INR')
                    txt1 = get_text(elem, 'TXT1')

                    if inr is None:
                        errors += 1
                        if errors <= 5:
                            print_flush(f"  ✗ Registro {total_processed}: INR es None, no se puede actualizar")
                        elem.clear()
                        continue

                    # Agregar al batch
                    batch.append((txt1, inr))

                    # Si el batch está lleno, hacer el update
                    if len(batch) >= BATCH_SIZE:
                        cursor.executemany(update_sql, batch)
                        connection.commit()

                        # Verificar cuántos registros fueron actualizados
                        rows_affected = cursor.rowcount
                        updated += rows_affected

                        # Si no se actualizaron todos, algunos INR no existen
                        if rows_affected < len(batch):
                            not_found += (len(batch) - rows_affected)

                        print_flush(f"  ✓ Actualizados: {updated} registros (procesados: {total_processed})")
                        batch = []

                except Exception as e:
                    errors += 1
                    if errors <= 5:
                        print_flush(f"  ✗ Error en registro {total_processed}: {e}")
                    if errors > 100:
                        print_flush("  ✗ Demasiados errores, abortando...")
                        break

                # Limpiar el elemento para liberar memoria
                elem.clear()

        # Procesar el último batch si quedó algo
        if batch and errors <= 100:
            cursor.executemany(update_sql, batch)
            connection.commit()

            rows_affected = cursor.rowcount
            updated += rows_affected

            if rows_affected < len(batch):
                not_found += (len(batch) - rows_affected)

            print_flush(f"  ✓ Actualizados: {updated} registros (procesados: {total_processed})")

    except ET.ParseError as e:
        print_flush(f"  ✗ Error parseando XML: {e}")
        return updated
    except Exception as e:
        print_flush(f"  ✗ Error inesperado durante actualización: {e}")
        return updated

    print_flush(f"\n✓ Actualización completada:")
    print_flush(f"  - Registros procesados: {total_processed}")
    print_flush(f"  - Registros actualizados: {updated}")
    print_flush(f"  - Registros no encontrados: {not_found}")
    print_flush(f"  - Errores: {errors}")

    return updated

def verify_update(cursor):
    """Verifica algunos registros para confirmar la actualización"""
    print_flush("\n✓ Verificando actualización...")

    # Contar registros con txt1 NULL vs NOT NULL
    cursor.execute("""
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN txt1 IS NULL THEN 1 ELSE 0 END) as txt1_null,
            SUM(CASE WHEN txt1 IS NOT NULL THEN 1 ELSE 0 END) as txt1_not_null,
            SUM(CASE WHEN txt1 = '' THEN 1 ELSE 0 END) as txt1_empty
        FROM gle_read_model
    """)

    result = cursor.fetchone()
    print_flush(f"  - Total registros: {result[0]}")
    print_flush(f"  - txt1 NULL: {result[1]}")
    print_flush(f"  - txt1 con valor: {result[2]}")
    print_flush(f"  - txt1 vacío: {result[3]}")

    # Mostrar algunos ejemplos
    cursor.execute("""
        SELECT inr, txt1
        FROM gle_read_model
        WHERE txt1 IS NOT NULL AND txt1 != ''
        LIMIT 5
    """)

    print_flush("\n  Ejemplos de registros actualizados:")
    for row in cursor.fetchall():
        txt1_preview = row[1][:50] + "..." if row[1] and len(row[1]) > 50 else row[1]
        print_flush(f"    INR: {row[0]} -> TXT1: {txt1_preview}")

def main():
    """Función principal"""
    print_flush("=" * 60)
    print_flush("Actualización de columna TXT1 en tabla GLE")
    print_flush("=" * 60)

    connection = None
    cursor = None

    try:
        # Conectar a la base de datos
        print_flush("\nConectando a la base de datos...")
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        print_flush("✓ Conexión exitosa")

        # Verificar que la tabla existe
        cursor.execute("SHOW TABLES LIKE 'gle_read_model'")
        if cursor.fetchone() is None:
            print_flush("\n✗ Error: La tabla gle_read_model no existe")
            sys.exit(1)

        # Verificar estado inicial
        cursor.execute("SELECT COUNT(*) FROM gle_read_model")
        total_records = cursor.fetchone()[0]
        print_flush(f"\n✓ Tabla encontrada con {total_records} registros")

        # Confirmar acción
        print_flush("\n⚠️  Esta operación actualizará la columna txt1 de TODOS los registros")
        print_flush("   usando los datos del archivo XML")

        # Actualizar la columna txt1
        updated = refresh_txt1_column(cursor, connection)

        # Verificar el resultado
        verify_update(cursor)

        print_flush("\n" + "=" * 60)
        print_flush("Actualización finalizada exitosamente")
        print_flush("=" * 60)

    except mysql.connector.Error as e:
        print_flush(f"\n✗ Error de MySQL: {e}")
        if connection:
            connection.rollback()
        sys.exit(1)

    except Exception as e:
        print_flush(f"\n✗ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        if connection:
            connection.rollback()
        sys.exit(1)

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
            print_flush("\n✓ Conexión cerrada")

if __name__ == '__main__':
    main()
