import mysql.connector
import json
import sys

try:
    # Connect to the database
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='admin',
        database='globalcmx_db'
    )

    cursor = conn.cursor()

    # Query the specific draft
    cursor.execute("""
        SELECT id, numero_operacion, swift_optional_fields
        FROM letter_of_credit_draft_readmodel
        WHERE numero_operacion = 'DRAFT-LC-IMP-1762534854793'
    """)

    row = cursor.fetchone()

    if row:
        print(f"ID: {row[0]}")
        print(f"Número Operación: {row[1]}")
        print(f"\nSWIFT Optional Fields (raw): {row[2]}")

        if row[2]:
            try:
                parsed = json.loads(row[2])
                print(f"\nSWIFT Optional Fields (parsed):")
                print(json.dumps(parsed, indent=2, ensure_ascii=False))

                if 'lugarVencimiento' in parsed:
                    print(f"\n✓ lugarVencimiento FOUND: {parsed['lugarVencimiento']}")
                else:
                    print(f"\n✗ lugarVencimiento NOT FOUND in swift_optional_fields")
            except json.JSONDecodeError as e:
                print(f"\nError parsing JSON: {e}")
        else:
            print("\n✗ swift_optional_fields is NULL or empty")
    else:
        print("Draft not found")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
