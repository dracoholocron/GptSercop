#!/usr/bin/env python3
"""
Script para renombrar tabla linea_credito_readmodel a credit_line_readmodel
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

def rename_table(connection):
    """Renombrar tabla a inglés"""
    cursor = connection.cursor()

    print("\n" + "=" * 80)
    print("RENOMBRANDO TABLA linea_credito_readmodel A credit_line_readmodel")
    print("=" * 80 + "\n")

    try:
        sql = "RENAME TABLE linea_credito_readmodel TO credit_line_readmodel"
        print(f"Ejecutando: {sql}")
        cursor.execute(sql)
        connection.commit()
        print("  ✓ Tabla renombrada exitosamente")

    except Error as e:
        print(f"  ✗ Error renombrando tabla: {e}")
        connection.rollback()

    cursor.close()

    print("\n" + "=" * 80)
    print("PROCESO COMPLETADO")
    print("=" * 80 + "\n")

def main():
    connection = connect_to_db()
    if connection:
        try:
            rename_table(connection)
        finally:
            connection.close()
            print("Conexión cerrada")

if __name__ == "__main__":
    main()
