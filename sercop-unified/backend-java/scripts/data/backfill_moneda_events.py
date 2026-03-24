#!/usr/bin/env python3
"""
Script to backfill missing MONEDA_CREATED events in the event store.

This script reads all currencies from the read model (MySQL) and creates
synthetic MONEDA_CREATED events in the event store (PostgreSQL) for any
currencies that don't have events yet.
"""

import json
import uuid
from datetime import datetime, timezone
import mysql.connector
import psycopg2
from psycopg2.extras import execute_values

def connect_mysql():
    """Connect to MySQL read model database."""
    return mysql.connector.connect(
        host='localhost',
        port=3306,
        database='globalcmx_read',
        user='globalcmx',
        password='globalcmx123'
    )

def connect_postgresql():
    """Connect to PostgreSQL event store database."""
    return psycopg2.connect(
        host='localhost',
        port=5432,
        database='globalcmx_eventstore',
        user='postgres',
        password='postgres123'
    )

def get_all_currencies_from_readmodel(mysql_conn):
    """Get all currencies from the MySQL read model."""
    cursor = mysql_conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, code AS codigo, name AS nombre, symbol AS simbolo, active AS activo,
               created_by AS createdBy, created_at AS createdAt
        FROM currency_read_model
        ORDER BY id
    """)
    currencies = cursor.fetchall()
    cursor.close()
    return currencies

def get_existing_moneda_aggregates(pg_conn):
    """Get all MONEDA aggregate IDs that already have events."""
    cursor = pg_conn.cursor()
    cursor.execute("""
        SELECT DISTINCT aggregateid
        FROM event_store
        WHERE aggregatetype = 'MONEDA'
    """)
    aggregate_ids = {row[0] for row in cursor.fetchall()}
    cursor.close()
    return aggregate_ids

def create_moneda_created_event(currency):
    """Create a MONEDA_CREATED event JSON for a currency."""
    # Convert activo to boolean if it's an integer
    activo = bool(currency['activo']) if currency['activo'] is not None else True

    return {
        "eventId": None,
        "eventType": "MONEDA_CREATED",
        "timestamp": currency['createdAt'].isoformat() if currency['createdAt'] else datetime.now(timezone.utc).isoformat(),
        "performedBy": currency['createdBy'] if currency['createdBy'] else "system",
        "monedaId": currency['id'],
        "codigo": currency['codigo'],
        "nombre": currency['nombre'],
        "simbolo": currency['simbolo'] if currency['simbolo'] else "",
        "activo": activo
    }

def backfill_events(pg_conn, currency, event_data):
    """Insert a MONEDA_CREATED event into the event store."""
    aggregate_id = f"MONEDA-{currency['id']}"
    event_id = str(uuid.uuid4())
    event_json = json.dumps(event_data)
    timestamp = event_data['timestamp']
    performed_by = event_data['performedBy']

    cursor = pg_conn.cursor()
    cursor.execute("""
        INSERT INTO event_store (
            eventid, aggregateid, aggregatetype, eventtype, eventdata,
            timestamp, version, performedby, processed
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
    """, (
        event_id,
        aggregate_id,
        'MONEDA',
        'MONEDA_CREATED',
        event_json,
        timestamp,
        1,  # version 1 for creation event
        performed_by,
        True  # mark as processed since we're backfilling
    ))
    cursor.close()

def main():
    print("="*80)
    print("Backfilling MONEDA_CREATED events in event store...")
    print("="*80)

    mysql_conn = None
    pg_conn = None

    try:
        # Connect to databases
        print("\n1. Connecting to databases...")
        mysql_conn = connect_mysql()
        pg_conn = connect_postgresql()
        print("   ✓ Connected to MySQL and PostgreSQL")

        # Get all currencies from read model
        print("\n2. Reading currencies from read model...")
        currencies = get_all_currencies_from_readmodel(mysql_conn)
        print(f"   ✓ Found {len(currencies)} currencies in read model")

        # Get existing aggregates in event store
        print("\n3. Checking event store for existing aggregates...")
        existing_aggregates = get_existing_moneda_aggregates(pg_conn)
        print(f"   ✓ Found {len(existing_aggregates)} currencies with events")

        # Find currencies without events
        currencies_without_events = []
        for currency in currencies:
            aggregate_id = f"MONEDA-{currency['id']}"
            if aggregate_id not in existing_aggregates:
                currencies_without_events.append(currency)

        print(f"\n4. Found {len(currencies_without_events)} currencies missing events")

        if not currencies_without_events:
            print("   ✓ No backfilling needed - all currencies have events!")
            return

        # Backfill events
        print("\n5. Creating synthetic MONEDA_CREATED events...")
        for i, currency in enumerate(currencies_without_events, 1):
            event_data = create_moneda_created_event(currency)
            backfill_events(pg_conn, currency, event_data)
            print(f"   [{i}/{len(currencies_without_events)}] Created event for {currency['codigo']} - {currency['nombre']}")

        pg_conn.commit()
        print(f"\n   ✓ Successfully backfilled {len(currencies_without_events)} events")

        # Verify
        print("\n6. Verifying...")
        existing_aggregates_after = get_existing_moneda_aggregates(pg_conn)
        print(f"   ✓ Event store now has {len(existing_aggregates_after)} currencies with events")

        print("\n" + "="*80)
        print("Backfilling completed successfully!")
        print("="*80)

    except Exception as e:
        print(f"\n✗ Error: {e}")
        if pg_conn:
            pg_conn.rollback()
        raise
    finally:
        if mysql_conn:
            mysql_conn.close()
        if pg_conn:
            pg_conn.close()

if __name__ == "__main__":
    main()
