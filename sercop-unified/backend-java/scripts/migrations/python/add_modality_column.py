#!/usr/bin/env python3
import mysql.connector
from mysql.connector import Error

def add_modality_column():
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

            # Add modality column to letter_of_credit_readmodel table
            print("Adding modality column to letter_of_credit_readmodel table...")

            cursor.execute("""
                ALTER TABLE letter_of_credit_readmodel
                ADD COLUMN modality VARCHAR(50) NOT NULL DEFAULT 'IRREVOCABLE'
                AFTER lc_type
            """)

            connection.commit()
            print("✓ Added modality column successfully")

            # Verify the column was added
            cursor.execute("""
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_TYPE
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = 'globalcmx_read'
                AND TABLE_NAME = 'letter_of_credit_readmodel'
                AND COLUMN_NAME = 'modality'
            """)

            result = cursor.fetchone()
            if result:
                print(f"\nColumn verification:")
                print(f"  Name: {result[0]}")
                print(f"  Type: {result[3]}")
                print(f"  Nullable: {result[2]}")

    except Error as e:
        print(f"Error: {e}")
        if connection:
            connection.rollback()
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    add_modality_column()
