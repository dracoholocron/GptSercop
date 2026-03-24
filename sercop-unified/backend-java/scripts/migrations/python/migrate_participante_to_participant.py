#!/usr/bin/env python3
"""
Script to migrate participante_read_model table to participant_read_model with English column names.
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
    print("Migrating participante_read_model to participant_read_model...")
    print("="*80)

    conn = None
    try:
        conn = connect_mysql()
        cursor = conn.cursor()

        # Step 1: Create new table
        print("\n1. Creating participant_read_model table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS participant_read_model (
                id BIGINT NOT NULL PRIMARY KEY,
                identification VARCHAR(255) NOT NULL,
                type VARCHAR(255) NOT NULL,
                reference_type VARCHAR(255),
                first_names VARCHAR(255) NOT NULL,
                last_names VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(255),
                address VARCHAR(255),
                agency VARCHAR(255),
                assigned_executive VARCHAR(255),
                executive_id VARCHAR(255),
                executive_email VARCHAR(255),
                authenticator VARCHAR(255),
                created_at DATETIME(6),
                updated_at DATETIME(6),
                created_by VARCHAR(255),
                updated_by VARCHAR(255),
                INDEX idx_participant_identification (identification),
                INDEX idx_participant_type (type),
                INDEX idx_participant_email (email),
                INDEX idx_participant_agency (agency)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        print("   ✓ Table created")

        # Step 2: Copy data
        print("\n2. Copying data from participante_read_model to participant_read_model...")
        cursor.execute("""
            INSERT INTO participant_read_model (
                id, identification, type, reference_type, first_names, last_names, email,
                phone, address, agency, assigned_executive, executive_id, executive_email,
                authenticator, created_at, updated_at, created_by, updated_by
            )
            SELECT
                id, identificacion, tipo, tipo_referencia, nombres, apellidos, email,
                telefono, direccion, agencia, ejecutivo_asignado, ejecutivo_id, correo_ejecutivo,
                autenticador, created_at, updated_at, created_by, updated_by
            FROM participante_read_model
        """)
        rows_copied = cursor.rowcount
        print(f"   ✓ Copied {rows_copied} rows")

        # Step 3: Verify
        print("\n3. Verifying data migration...")
        cursor.execute("SELECT COUNT(*) FROM participante_read_model")
        old_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM participant_read_model")
        new_count = cursor.fetchone()[0]

        print(f"   Old table (participante_read_model): {old_count} rows")
        print(f"   New table (participant_read_model): {new_count} rows")

        if old_count == new_count:
            print("   ✓ Data migration verified successfully!")
        else:
            print(f"   ✗ Warning: Row counts don't match!")
            conn.rollback()
            return

        # Step 4: Show sample data
        print("\n4. Sample data from new table:")
        cursor.execute("""
            SELECT id, identification, type, first_names, last_names, email
            FROM participant_read_model
            LIMIT 5
        """)
        for row in cursor.fetchall():
            print(f"   {row}")

        conn.commit()
        print("\n" + "="*80)
        print("Migration completed successfully!")
        print("="*80)
        print("\nNext steps:")
        print("1. Update ParticipanteReadModel.java to use participant_read_model table")
        print("2. Restart backend to apply changes")
        print("3. After verification, run: DROP TABLE participante_read_model;")

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
