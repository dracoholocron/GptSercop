#!/usr/bin/env python3
"""
Script para agregar columna approved_by a lc_amendment_readmodel
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

def add_approved_by(connection):
    """Agregar columna approved_by"""
    cursor = connection.cursor()

    print("\n" + "=" * 80)
    print("AGREGANDO COLUMNA approved_by")
    print("=" * 80 + "\n")

    try:
        print("Agregando columna: approved_by")
        cursor.execute("""
            ALTER TABLE lc_amendment_readmodel
            ADD COLUMN approved_by VARCHAR(100)
        """)
        connection.commit()
        print("  ✓ Completado")

    except Error as e:
        if "Duplicate column name" in str(e):
            print("  ⚠️  Columna approved_by ya existe")
        else:
            print(f"  ✗ Error: {e}")
            connection.rollback()

    cursor.close()
    print()

def main():
    connection = connect_to_db()
    if connection:
        try:
            add_approved_by(connection)
        finally:
            connection.close()
            print("Conexión cerrada")

if __name__ == "__main__":
    main()
