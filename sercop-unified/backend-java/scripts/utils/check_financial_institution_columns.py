#!/usr/bin/env python3
import mysql.connector
from mysql.connector import Error

def check_columns():
    connection = None
    try:
        connection = mysql.connector.connect(
            host='localhost',
            port=3306,
            database='globalcmx_read',
            user='globalcmx',
            password='globalcmx123'
        )

        if connection.is_connected():
            cursor = connection.cursor()

            # Get all columns from the table
            cursor.execute("""
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_TYPE
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = 'globalcmx_read'
                AND TABLE_NAME = 'financial_institution_readmodel'
                ORDER BY ORDINAL_POSITION
            """)

            columns = cursor.fetchall()

            print("Columns in financial_institution_readmodel table:")
            print("=" * 80)
            for col in columns:
                print(f"{col[0]:30s} {col[1]:15s} {col[2]:10s} {col[3]}")
            print("=" * 80)

    except Error as e:
        print(f"Error: {e}")
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    check_columns()
