#!/usr/bin/env python3
"""
Script para agregar columnas faltantes en financial_institution_readmodel
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
    """Agregar columnas faltantes"""
    cursor = connection.cursor()

    print("\n" + "=" * 80)
    print("AGREGANDO COLUMNAS FALTANTES A financial_institution_readmodel")
    print("=" * 80 + "\n")

    try:
        # Agregar columna active
        print("Agregando columna: active")
        cursor.execute("""
            ALTER TABLE financial_institution_readmodel
            ADD COLUMN active bit(1) DEFAULT NULL
        """)
        connection.commit()
        print("  ✓ Completado")

        # Agregar columna is_correspondent
        print("\nAgregando columna: is_correspondent")
        cursor.execute("""
            ALTER TABLE financial_institution_readmodel
            ADD COLUMN is_correspondent bit(1) DEFAULT NULL
        """)
        connection.commit()
        print("  ✓ Completado")

        print("\n" + "=" * 80)
        print("COLUMNAS AGREGADAS EXITOSAMENTE")
        print("=" * 80)

    except Error as e:
        print(f"\n✗ Error: {e}")
        connection.rollback()

    cursor.close()

def main():
    connection = connect_to_db()
    if connection:
        try:
            add_missing_columns(connection)
        finally:
            connection.close()
            print("\nConexión cerrada")

if __name__ == "__main__":
    main()
