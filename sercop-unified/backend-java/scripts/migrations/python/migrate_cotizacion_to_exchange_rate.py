#!/usr/bin/env python3
"""
Script to migrate cotizacion_read_model table to exchange_rate_read_model with English column names.
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
    print("Migrating cotizacion_read_model to exchange_rate_read_model...")
    print("="*80)

    conn = None
    try:
        conn = connect_mysql()
        cursor = conn.cursor()

        # Step 1: Create new table
        print("\n1. Creating exchange_rate_read_model table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS exchange_rate_read_model (
                id BIGINT NOT NULL PRIMARY KEY,
                currency_code VARCHAR(3) NOT NULL,
                date DATE NOT NULL,
                buy_rate DECIMAL(19, 6) NOT NULL,
                sell_rate DECIMAL(19, 6) NOT NULL,
                created_at DATETIME(6),
                updated_at DATETIME(6),
                created_by VARCHAR(255),
                updated_by VARCHAR(255),
                version BIGINT NOT NULL,
                INDEX idx_exchange_rate_date (date),
                INDEX idx_exchange_rate_currency (currency_code),
                INDEX idx_exchange_rate_currency_date (currency_code, date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        print("   ✓ Table created")

        # Step 2: Copy data
        print("\n2. Copying data from cotizacion_read_model to exchange_rate_read_model...")
        cursor.execute("""
            INSERT INTO exchange_rate_read_model (
                id, currency_code, date, buy_rate, sell_rate,
                created_at, updated_at, created_by, updated_by, version
            )
            SELECT
                id, codigo_moneda, fecha, valor_compra, valor_venta,
                created_at, updated_at, created_by, updated_by, version
            FROM cotizacion_read_model
        """)
        rows_copied = cursor.rowcount
        print(f"   ✓ Copied {rows_copied} rows")

        # Step 3: Verify
        print("\n3. Verifying data migration...")
        cursor.execute("SELECT COUNT(*) FROM cotizacion_read_model")
        old_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM exchange_rate_read_model")
        new_count = cursor.fetchone()[0]

        print(f"   Old table (cotizacion_read_model): {old_count} rows")
        print(f"   New table (exchange_rate_read_model): {new_count} rows")

        if old_count == new_count:
            print("   ✓ Data migration verified successfully!")
        else:
            print(f"   ✗ Warning: Row counts don't match!")
            conn.rollback()
            return

        # Step 4: Show sample data
        print("\n4. Sample data from new table:")
        cursor.execute("""
            SELECT id, currency_code, date, buy_rate, sell_rate
            FROM exchange_rate_read_model
            ORDER BY date DESC
            LIMIT 5
        """)
        for row in cursor.fetchall():
            print(f"   {row}")

        conn.commit()
        print("\n" + "="*80)
        print("Migration completed successfully!")
        print("="*80)
        print("\nNext steps:")
        print("1. Update CotizacionReadModel.java to use exchange_rate_read_model table")
        print("2. Restart backend to apply changes")
        print("3. After verification, run: DROP TABLE cotizacion_read_model;")

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
