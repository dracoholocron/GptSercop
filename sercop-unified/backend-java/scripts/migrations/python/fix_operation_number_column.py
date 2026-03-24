#!/usr/bin/env python3
"""
Script para agregar la columna operation_number sin restricción UNIQUE
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

def add_operation_number(connection):
    """Agregar columna operation_number"""
    cursor = connection.cursor()

    print("\n" + "=" * 80)
    print("AGREGANDO COLUMNA operation_number")
    print("=" * 80 + "\n")

    try:
        print("Agregando columna: operation_number (sin UNIQUE)")
        cursor.execute("""
            ALTER TABLE financiamiento_cx_readmodel
            ADD COLUMN operation_number VARCHAR(50) NOT NULL DEFAULT ''
        """)
        connection.commit()
        print("  ✓ Completado")

    except Error as e:
        if "Duplicate column name" in str(e):
            print("  ⚠️  Columna operation_number ya existe")
        else:
            print(f"  ✗ Error: {e}")
            connection.rollback()

    cursor.close()
    print()

def main():
    connection = connect_to_db()
    if connection:
        try:
            add_operation_number(connection)
        finally:
            connection.close()
            print("Conexión cerrada")

if __name__ == "__main__":
    main()
