#!/usr/bin/env python3
"""
Script to migrate cuenta_bancaria_read_model table to bank_account_read_model with English column names.
"""

import mysql.connector

def connect_mysql():
    """Connect to MySQL read model database."""
    return mysql.connector.connect(
        host='localhost',
        port=3306,
        database='globalcmx_read',
        user='globalcmx',
        password='globalcmx123'
    )

def main():
    print("="*80)
    print("Migrating cuenta_bancaria_read_model to bank_account_read_model...")
    print("="*80)

    conn = None
    try:
        conn = connect_mysql()
        cursor = conn.cursor()

        # Step 1: Create new table
        print("\n1. Creating bank_account_read_model table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bank_account_read_model (
                id BIGINT NOT NULL PRIMARY KEY,
                participant_identification VARCHAR(255) NOT NULL,
                participant_first_names VARCHAR(255) NOT NULL,
                participant_last_names VARCHAR(255) NOT NULL,
                account_number VARCHAR(255) NOT NULL,
                account_identification VARCHAR(255) NOT NULL UNIQUE,
                type VARCHAR(255) NOT NULL,
                active BOOLEAN NOT NULL,
                created_at DATETIME(6),
                updated_at DATETIME(6),
                created_by VARCHAR(255),
                updated_by VARCHAR(255),
                INDEX idx_bank_account_identification (account_identification),
                INDEX idx_bank_account_number (account_number),
                INDEX idx_bank_account_participant (participant_identification),
                INDEX idx_bank_account_type (type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        print("   ✓ Table created")

        # Step 2: Copy data
        print("\n2. Copying data from cuenta_bancaria_read_model to bank_account_read_model...")
        cursor.execute("""
            INSERT INTO bank_account_read_model (
                id, participant_identification, participant_first_names, participant_last_names,
                account_number, account_identification, type, active, created_at, updated_at,
                created_by, updated_by
            )
            SELECT
                id, identificacion_participante, nombres_participante, apellidos_participante,
                numero_cuenta, identificacion_cuenta, tipo, activo, created_at, updated_at,
                created_by, updated_by
            FROM cuenta_bancaria_read_model
        """)
        rows_copied = cursor.rowcount
        print(f"   ✓ Copied {rows_copied} rows")

        # Step 3: Verify
        print("\n3. Verifying data migration...")
        cursor.execute("SELECT COUNT(*) FROM cuenta_bancaria_read_model")
        old_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM bank_account_read_model")
        new_count = cursor.fetchone()[0]

        print(f"   Old table (cuenta_bancaria_read_model): {old_count} rows")
        print(f"   New table (bank_account_read_model): {new_count} rows")

        if old_count == new_count:
            print("   ✓ Data migration verified successfully!")
        else:
            print(f"   ✗ Warning: Row counts don't match!")
            conn.rollback()
            return

        # Step 4: Show sample data
        print("\n4. Sample data from new table:")
        cursor.execute("""
            SELECT id, participant_identification, account_number, type, active
            FROM bank_account_read_model
            LIMIT 5
        """)
        for row in cursor.fetchall():
            print(f"   {row}")

        conn.commit()
        print("\n" + "="*80)
        print("Migration completed successfully!")
        print("="*80)
        print("\nNext steps:")
        print("1. Update CuentaBancariaReadModel.java to use bank_account_read_model table")
        print("2. Restart backend to apply changes")
        print("3. After verification, run: DROP TABLE cuenta_bancaria_read_model;")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    main()
