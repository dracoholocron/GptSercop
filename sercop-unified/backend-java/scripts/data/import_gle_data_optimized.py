#!/usr/bin/env python3
"""
Script optimizado para importar datos de GLE (General Ledger Entries) desde XML a MySQL
Usa batch inserts para mejor performance
"""

import xml.etree.ElementTree as ET
import mysql.connector
from datetime import datetime
from decimal import Decimal
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

# Tamaño del batch para inserts
BATCH_SIZE = 500

def print_flush(message):
    """Print con flush inmediato"""
    print(message, flush=True)

def create_table(cursor):
    """Crea la tabla gle_read_model si no existe"""
    print_flush("Creando tabla gle_read_model...")

    cursor.execute("DROP TABLE IF EXISTS gle_read_model")
    print_flush("✓ Tabla anterior eliminada (si existía)")

    create_table_sql = """
    CREATE TABLE gle_read_model (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        inr VARCHAR(20) NOT NULL COMMENT 'Internal Number',
        objtyp VARCHAR(10) COMMENT 'Object Type',
        objinr VARCHAR(20) COMMENT 'Object Internal Number',
        trninr VARCHAR(20) COMMENT 'Transaction Internal Number',
        act VARCHAR(50) COMMENT 'Account Number',
        dbtcdt CHAR(1) COMMENT 'Debit/Credit Indicator (D/C)',
        cur VARCHAR(3) COMMENT 'Currency Code',
        amt DECIMAL(18, 3) COMMENT 'Amount',
        syscur VARCHAR(3) COMMENT 'System Currency',
        sysamt DECIMAL(18, 3) COMMENT 'System Amount',
        valdat DATETIME COMMENT 'Value Date',
        bucdat DATETIME COMMENT 'Booking Date',
        txt1 VARCHAR(255) COMMENT 'Text Line 1',
        txt2 VARCHAR(255) COMMENT 'Text Line 2',
        txt3 VARCHAR(255) COMMENT 'Text Line 3',
        prn VARCHAR(50) COMMENT 'Print Reference Number',
        expses VARCHAR(50) COMMENT 'Export Session',
        tsyref VARCHAR(50) COMMENT 'System Reference',
        expflg VARCHAR(10) COMMENT 'Export Flag',
        acttyp VARCHAR(10) COMMENT 'Account Type',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_inr (inr),
        INDEX idx_act (act),
        INDEX idx_valdat (valdat),
        INDEX idx_bucdat (bucdat),
        INDEX idx_cur (cur),
        INDEX idx_trninr (trninr)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    COMMENT='General Ledger Entries - Read Model para consultas de contabilidad'
    """

    cursor.execute(create_table_sql)
    print_flush("✓ Tabla creada exitosamente")

def parse_datetime(date_str):
    """Parsea fecha del formato XML a datetime"""
    if not date_str or date_str.strip() == '':
        return None
    try:
        return datetime.strptime(date_str.strip(), '%Y-%m-%d %H:%M:%S.%f')
    except ValueError:
        try:
            return datetime.strptime(date_str.strip(), '%Y-%m-%d %H:%M:%S')
        except ValueError:
            return None

def parse_decimal(value_str):
    """Parsea un string a Decimal"""
    if not value_str or value_str.strip() == '':
        return None
    try:
        return Decimal(value_str.strip())
    except:
        return None

def get_text(element, tag):
    """Obtiene el texto de un elemento hijo, retorna None si no existe"""
    child = element.find(tag)
    if child is not None and child.text:
        text = child.text.strip()
        # Limitar longitud de VARCHAR
        if tag in ['TXT1', 'TXT2', 'TXT3']:
            return text[:255] if len(text) > 255 else text
        return text
    return None

def import_data_batch(cursor, connection):
    """Importa los datos del archivo XML usando batch inserts"""
    print_flush(f"\nImportando datos desde: {XML_FILE}")
    print_flush("Parseando XML (esto puede tomar un momento para archivos grandes)...")

    # Parsear el archivo XML usando iterparse para mejor memoria
    context = ET.iterparse(XML_FILE, events=('end',))

    # Preparar el statement de INSERT
    insert_sql = """
    INSERT INTO gle_read_model (
        inr, objtyp, objinr, trninr, act, dbtcdt, cur, amt,
        syscur, sysamt, valdat, bucdat, txt1, txt2, txt3,
        prn, expses, tsyref, expflg, acttyp
    ) VALUES (
        %s, %s, %s, %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s
    )
    """

    imported = 0
    errors = 0
    batch = []
    total_processed = 0

    try:
        for event, elem in context:
            if elem.tag == 'ROW':
                total_processed += 1

                try:
                    # Extraer datos de cada campo
                    data = (
                        get_text(elem, 'INR'),
                        get_text(elem, 'OBJTYP'),
                        get_text(elem, 'OBJINR'),
                        get_text(elem, 'TRNINR'),
                        get_text(elem, 'ACT'),
                        get_text(elem, 'DBTCDT'),
                        get_text(elem, 'CUR'),
                        parse_decimal(get_text(elem, 'AMT')),
                        get_text(elem, 'SYSCUR'),
                        parse_decimal(get_text(elem, 'SYSAMT')),
                        parse_datetime(get_text(elem, 'VALDAT')),
                        parse_datetime(get_text(elem, 'BUCDAT')),
                        get_text(elem, 'TXT1'),
                        get_text(elem, 'TXT2'),
                        get_text(elem, 'TXT3'),
                        get_text(elem, 'PRN'),
                        get_text(elem, 'EXPSES'),
                        get_text(elem, 'TSYREF'),
                        get_text(elem, 'EXPFLG'),
                        get_text(elem, 'ACTTYP')
                    )

                    batch.append(data)

                    # Si el batch está lleno, hacer el insert
                    if len(batch) >= BATCH_SIZE:
                        cursor.executemany(insert_sql, batch)
                        connection.commit()
                        imported += len(batch)
                        print_flush(f"  ✓ Importados: {imported} registros (procesados: {total_processed})")
                        batch = []

                except Exception as e:
                    errors += 1
                    if errors <= 5:  # Solo mostrar los primeros 5 errores
                        print_flush(f"  ✗ Error en registro {total_processed}: {e}")
                    if errors > 100:
                        print_flush("  ✗ Demasiados errores, abortando...")
                        break

                # Limpiar el elemento para liberar memoria
                elem.clear()

        # Insertar el último batch si quedó algo
        if batch and errors <= 100:
            cursor.executemany(insert_sql, batch)
            connection.commit()
            imported += len(batch)
            print_flush(f"  ✓ Importados: {imported} registros (procesados: {total_processed})")

    except ET.ParseError as e:
        print_flush(f"  ✗ Error parseando XML: {e}")
        return imported
    except Exception as e:
        print_flush(f"  ✗ Error inesperado durante importación: {e}")
        return imported

    print_flush(f"\n✓ Importación completada:")
    print_flush(f"  - Registros procesados: {total_processed}")
    print_flush(f"  - Registros importados: {imported}")
    print_flush(f"  - Errores: {errors}")

    return imported

def main():
    """Función principal"""
    print_flush("=" * 60)
    print_flush("Importador Optimizado de Datos GLE (General Ledger Entries)")
    print_flush("=" * 60)

    connection = None
    cursor = None

    try:
        # Conectar a la base de datos
        print_flush("\nConectando a la base de datos...")
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        print_flush("✓ Conexión exitosa")

        # Crear la tabla
        create_table(cursor)
        connection.commit()

        # Importar los datos
        imported = import_data_batch(cursor, connection)

        # Verificar el resultado
        cursor.execute("SELECT COUNT(*) FROM gle_read_model")
        count = cursor.fetchone()[0]
        print_flush(f"\n✓ Total de registros en la tabla: {count}")

        # Mostrar estadísticas
        cursor.execute("""
            SELECT
                COUNT(*) as total,
                COUNT(DISTINCT cur) as currencies,
                MIN(valdat) as fecha_min,
                MAX(valdat) as fecha_max,
                SUM(CASE WHEN dbtcdt = 'D' THEN 1 ELSE 0 END) as debits,
                SUM(CASE WHEN dbtcdt = 'C' THEN 1 ELSE 0 END) as credits
            FROM gle_read_model
        """)
        stats = cursor.fetchone()
        print_flush(f"\nEstadísticas:")
        print_flush(f"  - Total registros: {stats[0]}")
        print_flush(f"  - Monedas distintas: {stats[1]}")
        print_flush(f"  - Fecha mínima: {stats[2]}")
        print_flush(f"  - Fecha máxima: {stats[3]}")
        print_flush(f"  - Débitos: {stats[4]}")
        print_flush(f"  - Créditos: {stats[5]}")

        print_flush("\n" + "=" * 60)
        print_flush("Importación finalizada exitosamente")
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
