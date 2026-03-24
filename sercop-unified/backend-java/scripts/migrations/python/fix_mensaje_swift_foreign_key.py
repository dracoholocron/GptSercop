#!/usr/bin/env python3
"""
Script para eliminar foreign key y columna mensaje_relacionado_id
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

def fix_foreign_key(connection):
    """Eliminar foreign key y columna en español"""
    cursor = connection.cursor()

    print("\n" + "=" * 80)
    print("ELIMINANDO FOREIGN KEY Y COLUMNA mensaje_relacionado_id")
    print("=" * 80 + "\n")

    fk_name = 'FKcqbp4d6iwckkgr76w31n2lsn4'
    column_name = 'mensaje_relacionado_id'

    try:
        # Eliminar foreign key
        print(f"Eliminando foreign key: {fk_name}")
        cursor.execute(f"""
            ALTER TABLE mensaje_swift_readmodel
            DROP FOREIGN KEY {fk_name}
        """)
        connection.commit()
        print(f"  ✓ Foreign key eliminada")

        # Eliminar columna
        print(f"Eliminando columna: {column_name}")
        cursor.execute(f"""
            ALTER TABLE mensaje_swift_readmodel
            DROP COLUMN {column_name}
        """)
        connection.commit()
        print(f"  ✓ Columna eliminada\n")

    except Error as e:
        if "Can't DROP" in str(e) and "check that column/key exists" in str(e):
            print(f"  ⚠️  Foreign key {fk_name} no existe, intentando eliminar solo la columna...")
            try:
                cursor.execute(f"""
                    ALTER TABLE mensaje_swift_readmodel
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
            fix_foreign_key(connection)
        finally:
            connection.close()
            print("Conexión cerrada")

if __name__ == "__main__":
    main()
