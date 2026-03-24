#!/usr/bin/env python3
"""
Script para agregar columnas de fecha faltantes (permitiendo NULL temporalmente)
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

def add_date_columns(connection):
    """Agregar columnas de fecha permitiendo NULL"""
    cursor = connection.cursor()

    print("\n" + "=" * 80)
    print("AGREGANDO COLUMNAS DE FECHA A linea_credito_readmodel")
    print("=" * 80 + "\n")

    columns_to_add = [
        ("authorization_date", "DATE"),
        ("expiry_date", "DATE"),
    ]

    for column_name, column_type in columns_to_add:
        try:
            # Verificar si la columna ya existe
            cursor.execute(f"""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = 'globalcmx_read'
                AND TABLE_NAME = 'linea_credito_readmodel'
                AND COLUMN_NAME = '{column_name}'
            """)

            result = cursor.fetchone()

            if result and result[0] == 0:
                print(f"Agregando columna: {column_name}")
                cursor.execute(f"""
                    ALTER TABLE linea_credito_readmodel
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
    print("COLUMNAS DE FECHA AGREGADAS")
    print("=" * 80 + "\n")

def main():
    connection = connect_to_db()
    if connection:
        try:
            add_date_columns(connection)
        finally:
            connection.close()
            print("Conexión cerrada")

if __name__ == "__main__":
    main()
