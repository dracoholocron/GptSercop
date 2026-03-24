#!/usr/bin/env python3
"""
Script para importar datos de GLE (General Ledger Entries) desde XML a MySQL
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

def create_table(cursor):
    """Crea la tabla gle_read_model si no existe"""
    print("Creando tabla gle_read_model...")

    create_table_sql = """
    DROP TABLE IF EXISTS gle_read_model;

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
    COMMENT='General Ledger Entries - Read Model para consultas de contabilidad';
    """

    # Ejecutar cada statement por separado
    for statement in create_table_sql.split(';'):
        if statement.strip():
            cursor.execute(statement)

    print("✓ Tabla creada exitosamente")

def parse_datetime(date_str):
    """Parsea fecha del formato XML a datetime"""
    if not date_str or date_str.strip() == '':
        return None
    try:
        # Formato: 2023-03-09 00:00:00.000
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
        return child.text.strip()
    return None

def import_data(cursor):
    """Importa los datos del archivo XML"""
    print(f"\nImportando datos desde: {XML_FILE}")

    # Parsear el archivo XML
    try:
        tree = ET.parse(XML_FILE)
        root = tree.getroot()
    except Exception as e:
        print(f"✗ Error al parsear el archivo XML: {e}")
        return 0

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

    # Contar filas e importar
    rows = root.findall('ROW')
    total_rows = len(rows)
    imported = 0
    errors = 0

    print(f"Total de registros a importar: {total_rows}")

    for i, row in enumerate(rows, 1):
        try:
            # Extraer datos de cada campo
            data = (
                get_text(row, 'INR'),
                get_text(row, 'OBJTYP'),
                get_text(row, 'OBJINR'),
                get_text(row, 'TRNINR'),
                get_text(row, 'ACT'),
                get_text(row, 'DBTCDT'),
                get_text(row, 'CUR'),
                parse_decimal(get_text(row, 'AMT')),
                get_text(row, 'SYSCUR'),
                parse_decimal(get_text(row, 'SYSAMT')),
                parse_datetime(get_text(row, 'VALDAT')),
                parse_datetime(get_text(row, 'BUCDAT')),
                get_text(row, 'TXT1'),
                get_text(row, 'TXT2'),
                get_text(row, 'TXT3'),
                get_text(row, 'PRN'),
                get_text(row, 'EXPSES'),
                get_text(row, 'TSYREF'),
                get_text(row, 'EXPFLG'),
                get_text(row, 'ACTTYP')
            )

            cursor.execute(insert_sql, data)
            imported += 1

            # Mostrar progreso cada 100 registros
            if i % 100 == 0:
                print(f"  Procesados: {i}/{total_rows} ({(i/total_rows)*100:.1f}%)")

        except Exception as e:
            errors += 1
            print(f"  ✗ Error en registro {i}: {e}")
            if errors > 10:
                print("  Demasiados errores, abortando...")
                return imported

    print(f"\n✓ Importación completada:")
    print(f"  - Registros importados: {imported}")
    print(f"  - Errores: {errors}")

    return imported

def main():
    """Función principal"""
    print("=" * 60)
    print("Importador de Datos GLE (General Ledger Entries)")
    print("=" * 60)

    connection = None
    cursor = None

    try:
        # Conectar a la base de datos
        print("\nConectando a la base de datos...")
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        print("✓ Conexión exitosa")

        # Crear la tabla
        create_table(cursor)
        connection.commit()

        # Importar los datos
        imported = import_data(cursor)
        connection.commit()

        # Verificar el resultado
        cursor.execute("SELECT COUNT(*) FROM gle_read_model")
        count = cursor.fetchone()[0]
        print(f"\n✓ Total de registros en la tabla: {count}")

        print("\n" + "=" * 60)
        print("Importación finalizada exitosamente")
        print("=" * 60)

    except mysql.connector.Error as e:
        print(f"\n✗ Error de MySQL: {e}")
        if connection:
            connection.rollback()
        sys.exit(1)

    except Exception as e:
        print(f"\n✗ Error inesperado: {e}")
        if connection:
            connection.rollback()
        sys.exit(1)

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
            print("\n✓ Conexión cerrada")

if __name__ == '__main__':
    main()
