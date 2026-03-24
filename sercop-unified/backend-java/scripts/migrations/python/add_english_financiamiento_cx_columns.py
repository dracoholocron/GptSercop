#!/usr/bin/env python3
"""
Script para agregar columnas en inglés a financiamiento_cx_readmodel
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

def add_english_columns(connection):
    """Agregar columnas en inglés"""
    cursor = connection.cursor()

    print("\n" + "=" * 80)
    print("AGREGANDO COLUMNAS EN INGLÉS A financiamiento_cx_readmodel")
    print("=" * 80 + "\n")

    columns_to_add = [
        ("operation_number", "VARCHAR(50) UNIQUE NOT NULL"),
        ("type", "ENUM('PREFINANCIAMIENTO_EXPORTACION','POSTFINANCIAMIENTO_EXPORTACION','FINANCIAMIENTO_IMPORTACION','FORFAITING','FACTORING_INTERNACIONAL','DESCUENTO_LC') NOT NULL"),
        ("linked_operation_type", "VARCHAR(50)"),
        ("linked_operation_id", "BIGINT"),
        ("client_id", "BIGINT NOT NULL"),
        ("credit_line_id", "BIGINT"),
        ("currency", "VARCHAR(3) NOT NULL"),
        ("requested_amount", "DECIMAL(18,2) NOT NULL"),
        ("approved_amount", "DECIMAL(18,2)"),
        ("disbursed_amount", "DECIMAL(18,2)"),
        ("term_days", "INT"),
        ("interest_rate", "DECIMAL(8,4)"),
        ("penalty_rate", "DECIMAL(8,4)"),
        ("opening_commission", "DECIMAL(18,2)"),
        ("disbursement_date", "DATE"),
        ("maturity_date", "DATE"),
        ("guarantee_type", "VARCHAR(100)"),
        ("guarantee_description", "TEXT"),
        ("status", "ENUM('SOLICITADO','APROBADO','DESEMBOLSADO','VIGENTE','PAGADO','VENCIDO','CASTIGADO') NOT NULL"),
    ]

    for column_name, column_type in columns_to_add:
        try:
            print(f"Agregando columna: {column_name}")
            cursor.execute(f"""
                ALTER TABLE financiamiento_cx_readmodel
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
            add_english_columns(connection)
        finally:
            connection.close()
            print("Conexión cerrada")

if __name__ == "__main__":
    main()
