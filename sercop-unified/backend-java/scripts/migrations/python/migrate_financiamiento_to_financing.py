#!/usr/bin/env python3
"""
Script to migrate financiamiento_cx_readmodel table to financing_trade_read_model with English table name.
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
    print("Migrating financiamiento_cx_readmodel to financing_trade_read_model...")
    print("="*80)

    conn = None
    try:
        conn = connect_mysql()
        cursor = conn.cursor()

        # Step 1: Create new table
        print("\n1. Creating financing_trade_read_model table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS financing_trade_read_model (
                id BIGINT NOT NULL PRIMARY KEY,
                operation_number VARCHAR(50) NOT NULL DEFAULT '',
                type ENUM('PREFINANCIAMIENTO_EXPORTACION','POSTFINANCIAMIENTO_EXPORTACION','FINANCIAMIENTO_IMPORTACION','FORFAITING','FACTORING_INTERNACIONAL','DESCUENTO_LC') NOT NULL,
                linked_operation_type VARCHAR(50),
                linked_operation_id BIGINT,
                client_id BIGINT NOT NULL,
                credit_line_id BIGINT,
                currency VARCHAR(3) NOT NULL,
                requested_amount DECIMAL(18,2) NOT NULL,
                approved_amount DECIMAL(18,2),
                disbursed_amount DECIMAL(18,2),
                term_days INT,
                interest_rate DECIMAL(8,4),
                penalty_rate DECIMAL(8,4),
                opening_commission DECIMAL(18,2),
                disbursement_date DATE,
                maturity_date DATE,
                guarantee_type VARCHAR(100),
                guarantee_description TEXT,
                status ENUM('SOLICITADO','APROBADO','DESEMBOLSADO','VIGENTE','PAGADO','VENCIDO','CASTIGADO') NOT NULL,
                created_at DATETIME(6) NOT NULL,
                updated_at DATETIME(6) NOT NULL,
                aggregate_id VARCHAR(100),
                version BIGINT,
                INDEX idx_financing_operation_number (operation_number),
                INDEX idx_financing_type (type),
                INDEX idx_financing_client (client_id),
                INDEX idx_financing_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        print("   ✓ Table created")

        # Step 2: Copy data
        print("\n2. Copying data from financiamiento_cx_readmodel to financing_trade_read_model...")
        cursor.execute("""
            INSERT INTO financing_trade_read_model (
                id, operation_number, type, linked_operation_type, linked_operation_id,
                client_id, credit_line_id, currency, requested_amount, approved_amount,
                disbursed_amount, term_days, interest_rate, penalty_rate, opening_commission,
                disbursement_date, maturity_date, guarantee_type, guarantee_description,
                status, created_at, updated_at, aggregate_id, version
            )
            SELECT
                id, operation_number, type, linked_operation_type, linked_operation_id,
                client_id, credit_line_id, currency, requested_amount, approved_amount,
                disbursed_amount, term_days, interest_rate, penalty_rate, opening_commission,
                disbursement_date, maturity_date, guarantee_type, guarantee_description,
                status, created_at, updated_at, aggregate_id, version
            FROM financiamiento_cx_readmodel
        """)
        rows_copied = cursor.rowcount
        print(f"   ✓ Copied {rows_copied} rows")

        # Step 3: Verify
        print("\n3. Verifying data migration...")
        cursor.execute("SELECT COUNT(*) FROM financiamiento_cx_readmodel")
        old_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM financing_trade_read_model")
        new_count = cursor.fetchone()[0]

        print(f"   Old table (financiamiento_cx_readmodel): {old_count} rows")
        print(f"   New table (financing_trade_read_model): {new_count} rows")

        if old_count == new_count:
            print("   ✓ Data migration verified successfully!")
        else:
            print(f"   ✗ Warning: Row counts don't match!")
            conn.rollback()
            return

        # Step 4: Show sample data
        print("\n4. Sample data from new table:")
        cursor.execute("""
            SELECT id, operation_number, type, status
            FROM financing_trade_read_model
            LIMIT 5
        """)
        for row in cursor.fetchall():
            print(f"   {row}")

        conn.commit()
        print("\n" + "="*80)
        print("Migration completed successfully!")
        print("="*80)
        print("\nNext steps:")
        print("1. Update FinanciamientoCxReadModel.java to use financing_trade_read_model table")
        print("2. Restart backend to apply changes")
        print("3. After verification, run: DROP TABLE financiamiento_cx_readmodel;")

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
