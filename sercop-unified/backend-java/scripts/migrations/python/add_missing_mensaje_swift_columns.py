#!/usr/bin/env python3
"""
Script para agregar columnas faltantes en inglés en mensaje_swift_readmodel
"""

import mysql.connector
from mysql.connector import Error

def connect_to_db():
    """Conectar a la base de datos MySQL"""
    try:
        connection = mysql.connector.connect(
            host='localhost',
            port=3306,
            database='globalcmx_read',
            user='globalcmx',
            password='globalcmx123'
        )
        return connection
    except Error as e:
        print(f"Error conectando a MySQL: {e}")
        return None

def add_missing_columns(connection):
    """Agregar columnas faltantes en inglés"""
    cursor = connection.cursor()

    print("\n" + "=" * 80)
    print("AGREGANDO COLUMNAS FALTANTES A mensaje_swift_readmodel")
    print("=" * 80 + "\n")

    columns_to_add = [
        ("operation_type", "VARCHAR(50)"),
        ("operation_id", "BIGINT"),
        ("message_type", "VARCHAR(10) NOT NULL"),
        ("direction", "VARCHAR(20) NOT NULL"),
        ("reference", "VARCHAR(50)"),
        ("swift_content", "TEXT NOT NULL"),
        ("send_date", "DATETIME(6)"),
        ("reception_date", "DATETIME(6)"),
        ("status", "VARCHAR(20) NOT NULL"),
        ("related_message_id", "BIGINT"),
    ]

    for column_name, column_type in columns_to_add:
        try:
            # Verificar si la columna ya existe
            cursor.execute(f"""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = 'globalcmx_read'
                AND TABLE_NAME = 'mensaje_swift_readmodel'
                AND COLUMN_NAME = '{column_name}'
            """)

            result = cursor.fetchone()

            if result and result[0] == 0:
                print(f"Agregando columna: {column_name}")
                cursor.execute(f"""
                    ALTER TABLE mensaje_swift_readmodel
                    ADD COLUMN {column_name} {column_type}
                """)
                connection.commit()
                print(f"  ✓ Completado")
            else:
                print(f"  ⚠️  Columna {column_name} ya existe")

        except Error as e:
            print(f"  ✗ Error agregando {column_name}: {e}")
            connection.rollback()

    cursor.close()

    print("\n" + "=" * 80)
    print("COLUMNAS AGREGADAS")
    print("=" * 80 + "\n")

def main():
    connection = connect_to_db()
    if connection:
        try:
            add_missing_columns(connection)
        finally:
            connection.close()
            print("Conexión cerrada")

if __name__ == "__main__":
    main()
