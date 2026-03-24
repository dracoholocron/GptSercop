#!/usr/bin/env python3
"""
Script para eliminar foreign keys en columnas españolas y luego eliminar las columnas
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

def fix_foreign_keys(connection):
    """Eliminar foreign keys y luego las columnas en español"""
    cursor = connection.cursor()

    print("\n" + "=" * 80)
    print("ELIMINANDO FOREIGN KEYS Y COLUMNAS EN ESPAÑOL")
    print("=" * 80 + "\n")

    # Foreign keys a eliminar (constraint_name, column_name)
    foreign_keys = [
        ('FKb0tcp7us0s8rubwgo21aiaoic', 'banco_avisador_id'),
        ('FK2sf1egoqqtii7jh63c61w81l2', 'banco_confirmador_id'),
        ('FKp1wq2r9jm4ahv3k1acl5wtute', 'banco_emisor_id'),
        ('FKfwx8fefapdev0ftlhyuqalck6', 'banco_pagador_id'),
    ]

    for fk_name, column_name in foreign_keys:
        try:
            # Eliminar foreign key
            print(f"Eliminando foreign key: {fk_name}")
            cursor.execute(f"""
                ALTER TABLE letter_of_credit_readmodel
                DROP FOREIGN KEY {fk_name}
            """)
            connection.commit()
            print(f"  ✓ Foreign key eliminada")

            # Eliminar columna
            print(f"Eliminando columna: {column_name}")
            cursor.execute(f"""
                ALTER TABLE letter_of_credit_readmodel
                DROP COLUMN {column_name}
            """)
            connection.commit()
            print(f"  ✓ Columna eliminada\n")

        except Error as e:
            if "Can't DROP" in str(e) and "check that column/key exists" in str(e):
                print(f"  ⚠️  Foreign key {fk_name} no existe, intentando eliminar solo la columna...")
                try:
                    cursor.execute(f"""
                        ALTER TABLE letter_of_credit_readmodel
                        DROP COLUMN {column_name}
                    """)
                    connection.commit()
                    print(f"  ✓ Columna {column_name} eliminada\n")
                except Error as e2:
                    print(f"  ✗ Error eliminando columna: {e2}\n")
            else:
                print(f"  ✗ Error: {e}\n")
            connection.rollback()

    cursor.close()

    print("=" * 80)
    print("PROCESO COMPLETADO")
    print("=" * 80 + "\n")

def main():
    connection = connect_to_db()
    if connection:
        try:
            fix_foreign_keys(connection)
        finally:
            connection.close()
            print("Conexión cerrada")

if __name__ == "__main__":
    main()
