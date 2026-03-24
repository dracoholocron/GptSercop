#!/usr/bin/env python3
"""
Script para agregar columnas faltantes en lc_negotiation_readmodel
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
    print("AGREGANDO COLUMNAS FALTANTES A lc_negotiation_readmodel")
    print("=" * 80 + "\n")

    columns_to_add = [
        ("commercial_invoice", "TEXT"),
        ("bill_of_lading", "TEXT"),
        ("certificate_of_origin", "TEXT"),
        ("insurance_certificate", "TEXT"),
    ]

    for column_name, column_type in columns_to_add:
        try:
            print(f"Agregando columna: {column_name}")
            cursor.execute(f"""
                ALTER TABLE lc_negotiation_readmodel
                ADD COLUMN {column_name} {column_type}
            """)
            connection.commit()
            print(f"  ✓ Completado")
        except Error as e:
            if "Duplicate column name" in str(e):
                print(f"  ⚠️  Columna {column_name} ya existe")
            else:
                print(f"  ✗ Error: {e}")
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
