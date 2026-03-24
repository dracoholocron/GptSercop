#!/usr/bin/env python3
"""
Script para eliminar TODAS las columnas en español duplicadas de letter_of_credit_readmodel
"""

import mysql.connector
from mysql.connector import Error

# Todas las columnas en español a eliminar (duplicados)
SPANISH_COLUMNS = [
    'modalidad',
    'banco_avisador_id',
    'banco_confirmador_id',
    'banco_emisor_id',
    'banco_pagador_id',
    'beneficiario_id',
    'descripcion_mercancia',
    'documentos_adicionales',
    'estado',
    'fecha_creacion',
    'fecha_modificacion',
    'fecha_ultimo_embarque',
    'monto_utilizado',
    'ordenante_id',
    'swift_mt700_emision',
    'swift_mt710_aviso',
    'swift_mt720_transferencia',
    'forma_pago',
    'numero_operacion',
    'tipo_lc',
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
    """Eliminar todas las columnas en español duplicadas"""
    cursor = connection.cursor()

    print("\n" + "=" * 80)
    print("ELIMINANDO COLUMNAS EN ESPAÑOL DUPLICADAS DE letter_of_credit_readmodel")
    print("=" * 80 + "\n")

    for column_name in SPANISH_COLUMNS:
        try:
            # Verificar si la columna existe
            cursor.execute(f"""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = 'globalcmx_read'
                AND TABLE_NAME = 'letter_of_credit_readmodel'
                AND COLUMN_NAME = '{column_name}'
            """)

            result = cursor.fetchone()

            if result and result[0] > 0:
                sql = f"ALTER TABLE letter_of_credit_readmodel DROP COLUMN {column_name}"
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
    print("ELIMINACIÓN DE COLUMNAS DUPLICADAS COMPLETADA")
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
