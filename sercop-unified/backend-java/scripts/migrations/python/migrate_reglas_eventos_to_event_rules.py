#!/usr/bin/env python3
"""
Script to migrate reglas_eventos_readmodel table to event_rules_read_model with English column names.
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
    print("Migrating reglas_eventos_readmodel to event_rules_read_model...")
    print("="*80)

    conn = None
    try:
        conn = connect_mysql()
        cursor = conn.cursor()

        # Step 1: Create new table
        print("\n1. Creating event_rules_read_model table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS event_rules_read_model (
                id BIGINT NOT NULL PRIMARY KEY,
                code VARCHAR(255) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                description VARCHAR(1000),
                operation_type VARCHAR(100) NOT NULL,
                trigger_event VARCHAR(100) NOT NULL,
                conditions_drl TEXT,
                actions_json TEXT,
                priority INT,
                active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at DATETIME(6),
                updated_at DATETIME(6),
                created_by VARCHAR(255),
                updated_by VARCHAR(255),
                aggregate_id VARCHAR(255),
                version BIGINT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        print("   ✓ Table created")

        # Step 2: Copy data
        print("\n2. Copying data from reglas_eventos_readmodel to event_rules_read_model...")
        cursor.execute("""
            INSERT INTO event_rules_read_model (
                id, code, name, description, operation_type, trigger_event, conditions_drl,
                actions_json, priority, active, created_at, updated_at, created_by, updated_by,
                aggregate_id, version
            )
            SELECT
                id, codigo, nombre, descripcion, tipo_operacion, evento_trigger, condiciones_drl,
                acciones_json, prioridad, activo, created_at, updated_at, created_by, updated_by,
                aggregate_id, version
            FROM reglas_eventos_readmodel
        """)
        rows_copied = cursor.rowcount
        print(f"   ✓ Copied {rows_copied} rows")

        # Step 3: Verify
        print("\n3. Verifying data migration...")
        cursor.execute("SELECT COUNT(*) FROM reglas_eventos_readmodel")
        old_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM event_rules_read_model")
        new_count = cursor.fetchone()[0]

        print(f"   Old table (reglas_eventos_readmodel): {old_count} rows")
        print(f"   New table (event_rules_read_model): {new_count} rows")

        if old_count == new_count:
            print("   ✓ Data migration verified successfully!")
        else:
            print(f"   ✗ Warning: Row counts don't match!")
            conn.rollback()
            return

        # Step 4: Show sample data
        print("\n4. Sample data from new table:")
        cursor.execute("""
            SELECT id, code, name, operation_type, trigger_event, active
            FROM event_rules_read_model
            LIMIT 5
        """)
        for row in cursor.fetchall():
            print(f"   {row}")

        conn.commit()
        print("\n" + "="*80)
        print("Migration completed successfully!")
        print("="*80)
        print("\nNext steps:")
        print("1. Update ReglaEventoReadModel.java to use event_rules_read_model table")
        print("2. Restart backend to apply changes")
        print("3. After verification, run: DROP TABLE reglas_eventos_readmodel;")

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
