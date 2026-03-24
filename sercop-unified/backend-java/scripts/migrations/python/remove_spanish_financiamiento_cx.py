#!/usr/bin/env python3
"""
Script para eliminar columnas en español de financiamiento_cx_readmodel
"""

import mysql.connector
from mysql.connector import Error

# Columnas en español a eliminar
SPANISH_COLUMNS = [
    'cliente_id',
    'comision_apertura',
    'descripcion_garantia',
    'estado',
    'fecha_desembolso',
    'fecha_vencimiento',
    'linea_credito_id',
    'moneda',
    'monto_aprobado',
    'monto_desembolsado',
    'monto_solicitado',
    'numero_operacion',
    'operacion_vinculada_id',
    'operacion_vinculada_tipo',
    'plazo_dias',
    'tasa_interes',
    'tasa_mora',
    'tipo',
    'tipo_garantia',
]

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

def drop_columns(connection):
    """Eliminar columnas en español de financiamiento_cx_readmodel"""
    cursor = connection.cursor()

    print("\n" + "=" * 80)
    print("ELIMINANDO COLUMNAS EN ESPAÑOL DE financiamiento_cx_readmodel")
    print("=" * 80 + "\n")

    for column_name in SPANISH_COLUMNS:
        try:
            # Verificar si la columna existe
            cursor.execute(f"""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = 'globalcmx_read'
                AND TABLE_NAME = 'financiamiento_cx_readmodel'
                AND COLUMN_NAME = '{column_name}'
            """)

            result = cursor.fetchone()

            if result and result[0] > 0:
                sql = f"ALTER TABLE financiamiento_cx_readmodel DROP COLUMN {column_name}"
                print(f"Eliminando columna: {column_name}")
                cursor.execute(sql)
                connection.commit()
                print(f"  ✓ Completado")
            else:
                print(f"  ⚠️  Columna {column_name} no encontrada (ya eliminada)")

        except Error as e:
            print(f"  ✗ Error eliminando {column_name}: {e}")
            connection.rollback()

    cursor.close()

    print("\n" + "=" * 80)
    print("ELIMINACIÓN DE COLUMNAS COMPLETADA")
    print("=" * 80 + "\n")

def main():
    connection = connect_to_db()
    if connection:
        try:
            drop_columns(connection)
        finally:
            connection.close()
            print("Conexión cerrada")

if __name__ == "__main__":
    main()
