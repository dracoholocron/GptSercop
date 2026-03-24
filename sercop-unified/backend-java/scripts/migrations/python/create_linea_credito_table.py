#!/usr/bin/env python3
import mysql.connector
from mysql.connector import Error

def create_linea_credito_table():
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

            # Create linea_credito_readmodel table
            print("Creating linea_credito_readmodel table...")

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS linea_credito_readmodel (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    cliente_id BIGINT NOT NULL,
                    tipo VARCHAR(50) NOT NULL,
                    moneda VARCHAR(3) NOT NULL,
                    monto_autorizado DECIMAL(18,2) NOT NULL,
                    monto_utilizado DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                    monto_disponible DECIMAL(18,2) NOT NULL,
                    fecha_autorizacion DATE NOT NULL,
                    fecha_vencimiento DATE NOT NULL,
                    tasa_referencia VARCHAR(50),
                    spread DECIMAL(6,4),
                    estado VARCHAR(50) NOT NULL,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL,
                    INDEX idx_linea_cliente (cliente_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            connection.commit()
            print("✓ Created linea_credito_readmodel table successfully")

            # Verify the table was created
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = 'globalcmx_read'
                AND TABLE_NAME = 'linea_credito_readmodel'
            """)

            result = cursor.fetchone()
            if result and result[0] == 1:
                print(f"\nTable verification: ✓ Table exists")

                # Show columns
                cursor.execute("""
                    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = 'globalcmx_read'
                    AND TABLE_NAME = 'linea_credito_readmodel'
                    ORDER BY ORDINAL_POSITION
                """)

                columns = cursor.fetchall()
                print(f"\nCreated {len(columns)} columns:")
                for col in columns:
                    print(f"  - {col[0]:25s} {col[1]:20s} {'NULL' if col[2] == 'YES' else 'NOT NULL'}")

    except Error as e:
        print(f"Error: {e}")
        if connection:
            connection.rollback()
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    create_linea_credito_table()
