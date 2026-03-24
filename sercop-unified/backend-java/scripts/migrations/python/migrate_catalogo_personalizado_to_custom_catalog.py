#!/usr/bin/env python3
"""
Script to migrate catalogo_personalizado_read_model table to custom_catalog_read_model with English column names.
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
    print("Migrating catalogo_personalizado_read_model to custom_catalog_read_model...")
    print("="*80)

    conn = None
    try:
        conn = connect_mysql()
        cursor = conn.cursor()

        # Step 1: Create new table
        print("\n1. Creating custom_catalog_read_model table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS custom_catalog_read_model (
                id BIGINT NOT NULL PRIMARY KEY,
                code VARCHAR(255) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                description VARCHAR(500),
                level INT NOT NULL,
                parent_catalog_id BIGINT,
                parent_catalog_code VARCHAR(255),
                parent_catalog_name VARCHAR(255),
                active BOOLEAN NOT NULL,
                display_order INT NOT NULL,
                created_at DATETIME(6),
                updated_at DATETIME(6),
                created_by VARCHAR(255),
                updated_by VARCHAR(255),
                INDEX idx_custom_catalog_code (code),
                INDEX idx_custom_catalog_level (level),
                INDEX idx_custom_catalog_parent (parent_catalog_id),
                INDEX idx_custom_catalog_active (active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        print("   ✓ Table created")

        # Step 2: Copy data
        print("\n2. Copying data from catalogo_personalizado_read_model to custom_catalog_read_model...")
        cursor.execute("""
            INSERT INTO custom_catalog_read_model (
                id, code, name, description, level, parent_catalog_id, parent_catalog_code,
                parent_catalog_name, active, display_order, created_at, updated_at, created_by, updated_by
            )
            SELECT
                id, codigo, nombre, descripcion, nivel, catalogo_padre_id, codigo_catalogo_padre,
                nombre_catalogo_padre, activo, orden, created_at, updated_at, created_by, updated_by
            FROM catalogo_personalizado_read_model
        """)
        rows_copied = cursor.rowcount
        print(f"   ✓ Copied {rows_copied} rows")

        # Step 3: Verify
        print("\n3. Verifying data migration...")
        cursor.execute("SELECT COUNT(*) FROM catalogo_personalizado_read_model")
        old_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM custom_catalog_read_model")
        new_count = cursor.fetchone()[0]

        print(f"   Old table (catalogo_personalizado_read_model): {old_count} rows")
        print(f"   New table (custom_catalog_read_model): {new_count} rows")

        if old_count == new_count:
            print("   ✓ Data migration verified successfully!")
        else:
            print(f"   ✗ Warning: Row counts don't match!")
            conn.rollback()
            return

        # Step 4: Show sample data
        print("\n4. Sample data from new table:")
        cursor.execute("""
            SELECT id, code, name, level, active
            FROM custom_catalog_read_model
            LIMIT 5
        """)
        for row in cursor.fetchall():
            print(f"   {row}")

        conn.commit()
        print("\n" + "="*80)
        print("Migration completed successfully!")
        print("="*80)
        print("\nNext steps:")
        print("1. Update CatalogoPersonalizadoReadModel.java to use custom_catalog_read_model table")
        print("2. Restart backend to apply changes")
        print("3. After verification, run: DROP TABLE catalogo_personalizado_read_model;")

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
