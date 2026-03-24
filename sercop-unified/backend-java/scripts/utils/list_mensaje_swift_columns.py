#!/usr/bin/env python3
"""
Script para listar todas las columnas de mensaje_swift_readmodel
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

def list_columns(connection):
    """Listar todas las columnas de mensaje_swift_readmodel"""
    cursor = connection.cursor()

    cursor.execute("""
        SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'globalcmx_read'
        AND TABLE_NAME = 'mensaje_swift_readmodel'
        ORDER BY ORDINAL_POSITION
    """)

    print("\n" + "=" * 80)
    print("COLUMNAS DE mensaje_swift_readmodel")
    print("=" * 80 + "\n")

    rows = cursor.fetchall()
    print(f"Total de columnas: {len(rows)}\n")

    for row in rows:
        column_name = row[0]
        column_type = row[1]
        is_nullable = row[2]
        column_default = row[3] if row[3] else ''
        print(f"{column_name:40} {column_type:30} {is_nullable:10} {column_default}")

    cursor.close()

def main():
    connection = connect_to_db()
    if connection:
        try:
            list_columns(connection)
        finally:
            connection.close()

if __name__ == "__main__":
    main()
