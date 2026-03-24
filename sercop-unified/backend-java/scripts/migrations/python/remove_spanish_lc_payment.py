#!/usr/bin/env python3
"""
Script para eliminar columnas en español de lc_payment_readmodel
"""

import mysql.connector
from mysql.connector import Error

# Columnas en español a eliminar
SPANISH_COLUMNS = [
    'banco_pagador_id',
    'comision_banco',
    'cuenta_credito',
    'cuenta_debito',
    'dias_plazo',
    'estado',
    'fecha_valor',
    'fecha_vencimiento_letra',
    'gastos_bancarios',
    'moneda',
    'monto',
    'monto_descuento',
    'monto_neto_pagado',
    'nombre_banco_pagador',
    'numero_operacion',
    'observaciones',
    'tasa_descuento',
    'tipo',
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
    """Eliminar columnas en español de lc_payment_readmodel"""
    cursor = connection.cursor()

    print("\n" + "=" * 80)
    print("ELIMINANDO COLUMNAS EN ESPAÑOL DE lc_payment_readmodel")
    print("=" * 80 + "\n")

    for column_name in SPANISH_COLUMNS:
        try:
            # Verificar si la columna existe
            cursor.execute(f"""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = 'globalcmx_read'
                AND TABLE_NAME = 'lc_payment_readmodel'
                AND COLUMN_NAME = '{column_name}'
            """)

            result = cursor.fetchone()

            if result and result[0] > 0:
                sql = f"ALTER TABLE lc_payment_readmodel DROP COLUMN {column_name}"
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
