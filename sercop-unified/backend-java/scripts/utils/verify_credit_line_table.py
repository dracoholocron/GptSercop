#!/usr/bin/env python3
"""
Script para verificar que la tabla credit_line_readmodel existe
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

def verify_table(connection):
    """Verificar que la tabla existe con el nuevo nombre"""
    cursor = connection.cursor()

    print("\n" + "=" * 80)
    print("VERIFICANDO TABLA credit_line_readmodel")
    print("=" * 80 + "\n")

    # Verificar tabla nueva
    cursor.execute("""
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = 'globalcmx_read'
        AND TABLE_NAME = 'credit_line_readmodel'
    """)

    result = cursor.fetchone()
    if result and result[0] > 0:
        print("✓ Tabla credit_line_readmodel existe")
    else:
        print("✗ Tabla credit_line_readmodel NO existe")

    # Verificar tabla vieja
    cursor.execute("""
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = 'globalcmx_read'
        AND TABLE_NAME = 'linea_credito_readmodel'
    """)

    result = cursor.fetchone()
    if result and result[0] > 0:
        print("⚠️  Tabla linea_credito_readmodel todavía existe (no debería)")
    else:
        print("✓ Tabla linea_credito_readmodel NO existe (correcto)")

    cursor.close()

    print("\n" + "=" * 80)
    print("VERIFICACIÓN COMPLETADA")
    print("=" * 80 + "\n")

def main():
    connection = connect_to_db()
    if connection:
        try:
            verify_table(connection)
        finally:
            connection.close()

if __name__ == "__main__":
    main()
