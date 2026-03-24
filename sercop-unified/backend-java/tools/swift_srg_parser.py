#!/usr/bin/env python3
"""
SWIFT Standards Release Guide (SRG) Parser

Este script parsea los archivos HTML del SRG de SWIFT para extraer
las especificaciones de campos y generar migraciones SQL.

Uso:
    python swift_srg_parser.py --srg-path /path/to/srg2024 --version 2024 --output migrations.sql
    python swift_srg_parser.py --all --output all_migrations.sql

Autor: GlobalCMX
"""

import os
import re
import json
import argparse
from html.parser import HTMLParser
from datetime import datetime
from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field, asdict
from pathlib import Path

# Import shared field validation data from pdf parser
# Both scripts share the same official SWIFT field lists and type overrides
try:
    from swift_pdf_parser import VALID_FIELDS_BY_MT, FIELD_TYPE_OVERRIDES
except ImportError:
    # Inline minimal version if import fails (standalone execution)
    VALID_FIELDS_BY_MT = {}
    FIELD_TYPE_OVERRIDES = {}


@dataclass
class FieldSpec:
    """Especificación de un campo SWIFT"""
    field_code: str  # e.g., ":20:", ":50:", ":51a:"
    field_name: str  # e.g., "Documentary Credit Number"
    field_number: int  # Display order
    message_type: str  # e.g., "MT700"
    format_spec: str  # e.g., "16x", "4*35x"
    presence: str  # "M" or "O"
    definition: str
    network_rules: str = ""
    usage_notes: str = ""
    options: List[str] = field(default_factory=list)  # ["A", "D"] for multi-option fields
    is_sequence: bool = False
    sequence_name: str = ""
    is_deleted: bool = False
    successor_field: str = ""


class SRGHTMLParser(HTMLParser):
    """Parser para archivos HTML del SRG"""

    def __init__(self):
        super().__init__()
        self.current_tag = ""
        self.current_class = ""
        self.in_title = False
        self.in_format = False
        self.in_presence = False
        self.in_definition = False
        self.in_network_rules = False
        self.in_table = False
        self.in_td = False
        self.in_h2 = False
        self.in_h3 = False
        self.in_h4 = False
        self.in_p = False

        self.title = ""
        self.field_name = ""
        self.field_number = 0
        self.format_lines = []
        self.presence = ""
        self.definition_lines = []
        self.network_rules_lines = []
        self.current_section = ""
        self.message_type = ""
        self.is_deleted = False

    def handle_starttag(self, tag, attrs):
        self.current_tag = tag
        attrs_dict = dict(attrs)
        self.current_class = attrs_dict.get('class', '')

        if tag == 'title':
            self.in_title = True
        elif tag == 'h2':
            self.in_h2 = True
        elif tag == 'h3':
            self.in_h3 = True
        elif tag == 'h4':
            self.in_h4 = True
            if 'fldfmt' in self.current_class:
                self.in_format = True
                self.current_section = 'format'
            elif 'fldprsnc' in self.current_class:
                self.in_presence = True
                self.current_section = 'presence'
            elif 'flddef' in self.current_class:
                self.in_definition = True
                self.current_section = 'definition'
            elif 'fldvalrls' in self.current_class:
                self.in_network_rules = True
                self.current_section = 'network_rules'
        elif tag == 'table':
            self.in_table = True
        elif tag == 'td':
            self.in_td = True
        elif tag == 'p':
            self.in_p = True

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        elif tag == 'h2':
            self.in_h2 = False
        elif tag == 'h3':
            self.in_h3 = False
        elif tag == 'h4':
            self.in_h4 = False
            if self.in_format:
                self.in_format = False
            elif self.in_presence:
                self.in_presence = False
            elif self.in_definition:
                self.in_definition = False
            elif self.in_network_rules:
                self.in_network_rules = False
        elif tag == 'table':
            self.in_table = False
        elif tag == 'td':
            self.in_td = False
        elif tag == 'p':
            self.in_p = False

    def handle_data(self, data):
        data = data.strip()
        if not data:
            return

        if self.in_title:
            self.title = data
            # Extract message type from title
            mt_match = re.search(r'MT\s*(\d{3})', data)
            if mt_match:
                self.message_type = f"MT{mt_match.group(1)}"
            # Extract field info
            field_match = re.search(r'Field\s+(\d+[a-z]?):\s*(.+)', data, re.IGNORECASE)
            if field_match:
                self.field_number = int(re.match(r'\d+', field_match.group(1)).group())
                self.field_name = field_match.group(2).strip()
                if 'DELETED' in self.field_name.upper():
                    self.is_deleted = True
                    self.field_name = re.sub(r'\s*-?\s*DELETED\s*', '', self.field_name, flags=re.IGNORECASE)

        elif self.in_h3:
            # Field header like "8. Field 51a: Applicant Bank"
            field_match = re.search(r'(\d+)\.\s*Field\s+(\d+[a-z]?):\s*(.+)', data, re.IGNORECASE)
            if field_match:
                self.field_number = int(field_match.group(1))
                self.field_name = field_match.group(3).strip()
                if 'DELETED' in data.upper():
                    self.is_deleted = True
                    self.field_name = re.sub(r'\s*-?\s*DELETED\s*', '', self.field_name, flags=re.IGNORECASE)

        elif self.current_section == 'format' and self.in_table and self.in_td:
            # Format specification in table
            self.format_lines.append(data)

        elif self.current_section == 'presence' and self.in_p:
            self.presence = 'M' if 'mandatory' in data.lower() else 'O'

        elif self.current_section == 'definition' and self.in_p:
            self.definition_lines.append(data)

        elif self.current_section == 'network_rules' and self.in_p:
            self.network_rules_lines.append(data)


def parse_srg_file(filepath: str) -> Optional[FieldSpec]:
    """Parsea un archivo HTML del SRG y retorna la especificación del campo"""
    try:
        with open(filepath, 'r', encoding='iso-8859-1') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None

    parser = SRGHTMLParser()
    try:
        parser.feed(content)
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
        return None

    if not parser.message_type or not parser.field_name:
        return None

    # Extract field code from title or field name
    field_code_match = re.search(r'Field\s+(\d+[a-z]?):', parser.title, re.IGNORECASE)
    if not field_code_match:
        field_code_match = re.search(r'(\d+[a-z]?):', parser.field_name)

    if field_code_match:
        field_code = f":{field_code_match.group(1)}:"
    else:
        # Try to extract from field number
        field_code = f":{parser.field_number}:"

    # Parse format to extract SWIFT format spec
    format_spec = ""
    options = []
    for line in parser.format_lines:
        # Look for format patterns like "16x", "4*35x", "6!n", etc.
        fmt_match = re.search(r'(\d+[*!]?\d*[anxdz])', line, re.IGNORECASE)
        if fmt_match and not format_spec:
            format_spec = fmt_match.group(1)
        # Look for options
        opt_match = re.search(r'Option\s+([A-Z])', line, re.IGNORECASE)
        if opt_match:
            options.append(opt_match.group(1))

    definition = ' '.join(parser.definition_lines)
    network_rules = ' '.join(parser.network_rules_lines)

    return FieldSpec(
        field_code=field_code,
        field_name=parser.field_name,
        field_number=parser.field_number,
        message_type=parser.message_type,
        format_spec=format_spec,
        presence=parser.presence or 'O',
        definition=definition[:500] if definition else "",  # Truncate long definitions
        network_rules=network_rules[:500] if network_rules else "",
        options=options,
        is_deleted=parser.is_deleted
    )


def find_message_files(srg_path: str, category: str = 'us7m') -> Dict[str, List[str]]:
    """
    Encuentra todos los archivos de campos para cada tipo de mensaje.

    Returns: Dict mapping message type to list of field files
    """
    category_path = os.path.join(srg_path, 'books', category)
    if not os.path.exists(category_path):
        print(f"Category path not found: {category_path}")
        return {}

    message_files: Dict[str, List[str]] = {}

    for filename in os.listdir(category_path):
        if not filename.endswith('.htm'):
            continue

        filepath = os.path.join(category_path, filename)

        try:
            with open(filepath, 'r', encoding='iso-8859-1') as f:
                content = f.read(2000)  # Read first 2000 chars to get title
        except:
            continue

        # Find message type in title
        mt_match = re.search(r'MT\s*(\d{3})', content)
        if mt_match:
            mt = f"MT{mt_match.group(1)}"

            # Check if this is a field specification file
            if re.search(r'Field\s+\d+[a-z]?:', content, re.IGNORECASE):
                if mt not in message_files:
                    message_files[mt] = []
                message_files[mt].append(filepath)

    return message_files


def parse_all_fields(srg_path: str, version: str, categories: List[str] = None) -> List[FieldSpec]:
    """Parsea todos los campos de todas las categorías"""
    if categories is None:
        categories = ['us7m', 'us4m']  # Cat 7 (Documentary Credits) and Cat 4 (Collections)

    all_fields = []

    for category in categories:
        print(f"\nProcessing category: {category}")
        message_files = find_message_files(srg_path, category)

        for mt, files in sorted(message_files.items()):
            print(f"  {mt}: {len(files)} field files")

            for filepath in files:
                field_spec = parse_srg_file(filepath)
                if field_spec:
                    all_fields.append(field_spec)

    return all_fields


def validate_fields(fields: List[FieldSpec]) -> Tuple[List[FieldSpec], List[FieldSpec]]:
    """Validate parsed fields against the official SWIFT spec.

    Returns:
        (valid_fields, rejected_fields)
    """
    if not VALID_FIELDS_BY_MT:
        print("  WARNING: VALID_FIELDS_BY_MT not loaded, skipping validation")
        return fields, []

    valid = []
    rejected = []

    for f in fields:
        mt = f.message_type
        # Extract tag from field_code (e.g., ":51a:" -> "51a")
        tag = f.field_code.strip(':')

        if mt not in VALID_FIELDS_BY_MT:
            print(f"    WARNING: Unknown message type {mt}, keeping field {tag}")
            valid.append(f)
            continue

        allowed_tags = VALID_FIELDS_BY_MT[mt]

        if tag in allowed_tags or tag in {t.lower() for t in allowed_tags}:
            valid.append(f)
        else:
            rejected.append(f)
            print(f"    REJECTED: {mt} field :{tag}: — NOT in official spec")

    return valid, rejected


def generate_sql_migration(fields: List[FieldSpec], version: str, effective_date: str) -> str:
    """Genera el script SQL de migración con validación contra spec oficial"""

    # Validate first
    valid_fields, rejected_fields = validate_fields(fields)

    if rejected_fields:
        print(f"\n  === VALIDATION: {len(rejected_fields)} fields REJECTED ===")
        for f in rejected_fields:
            print(f"    {f.message_type} {f.field_code} — {f.field_name}")

    # Group fields by message type
    by_message: Dict[str, List[FieldSpec]] = {}
    for field in valid_fields:
        if field.message_type not in by_message:
            by_message[field.message_type] = []
        by_message[field.message_type].append(field)

    sql_lines = []
    sql_lines.append(f"-- ==================================================")
    sql_lines.append(f"-- Migration: SWIFT Fields for Version {version}")
    sql_lines.append(f"-- Generated: {datetime.now().isoformat()}")
    sql_lines.append(f"-- Effective Date: {effective_date}")
    sql_lines.append(f"-- ==================================================")
    sql_lines.append("")

    for mt, mt_fields in sorted(by_message.items()):
        sql_lines.append(f"-- {mt} Fields ({len(mt_fields)} fields)")
        sql_lines.append(f"-- {'=' * 50}")

        # Sort by field number
        mt_fields.sort(key=lambda f: f.field_number)

        for field in mt_fields:
            # Escape single quotes in strings
            field_name = field.field_name.replace("'", "''")[:100]
            definition = field.definition.replace("'", "''")
            network_rules = field.network_rules.replace("'", "''")
            format_spec = field.format_spec.replace("'", "''")[:100]

            # Determine field type based on format
            field_type = determine_field_type(field.format_spec, field.field_code)
            component_type = determine_component_type(field_type)

            # Status comment for deleted fields
            status_comment = " -- DELETED in this version" if field.is_deleted else ""

            # Generate for Spanish (es)
            sql_lines.append(f"""
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), '{field.field_code}', '{field_name}', '{definition[:500]}',
    '{field.message_type}', 'es', 'GENERAL', {field.field_number},
    {1 if field.presence == 'M' else 0}, {0 if field.is_deleted else 1},
    '{field_type}', '{component_type}', '{format_spec}', '{field.presence}',
    '{definition}', '{version}', '{effective_date}', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = '{field.field_code}'
    AND message_type = '{field.message_type}'
    AND language = 'es'
    AND spec_version = '{version}'
);{status_comment}""")

            # Generate for English (en)
            sql_lines.append(f"""
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), '{field.field_code}', '{field_name}', '{definition[:500]}',
    '{field.message_type}', 'en', 'GENERAL', {field.field_number},
    {1 if field.presence == 'M' else 0}, {0 if field.is_deleted else 1},
    '{field_type}', '{component_type}', '{format_spec}', '{field.presence}',
    '{definition}', '{version}', '{effective_date}', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = '{field.field_code}'
    AND message_type = '{field.message_type}'
    AND language = 'en'
    AND spec_version = '{version}'
);""")

        sql_lines.append("")

    return '\n'.join(sql_lines)


def determine_field_type(format_spec: str, field_code: str) -> str:
    """Determina el tipo de campo basado en el formato SWIFT.

    SWIFT format notation:
        a = alphabetic, c = alphanumeric, n = numeric, x = any char,
        d = decimal (with comma), z = SWIFT Z character set,
        e = space, ! = fixed length, * = repetition (multi-line)
        [] = optional

    Priority: overrides > date > options > multi-line > currency+amount > decimal > numeric > text
    """
    # 1. Check known overrides first
    if field_code in FIELD_TYPE_OVERRIDES:
        return FIELD_TYPE_OVERRIDES[field_code][0]

    format_lower = format_spec.lower().strip()

    # 2. Date fields
    if format_lower == '6!n' or field_code in [':31C:', ':31D:', ':31E:', ':44C:', ':29A:']:
        return 'DATE'

    # 3. Multi-line text fields (contains * = repetition)
    #    MUST check BEFORE decimal, since "4*35z" is text, not decimal
    if '*' in format_spec:
        return 'TEXTAREA'

    # 4. Currency+Amount composite — "3!a15d" (currency code + amount)
    if re.match(r'^\d+!?a\d+!?d$', format_lower):
        return 'CURRENCY_AMOUNT'

    # 5. Pure decimal — only "15d" or similar (not part of composite)
    if re.match(r'^\d+!?d$', format_lower):
        return 'DECIMAL'

    # 6. Pure numeric — "3!n", "2n"
    if re.match(r'^\d+!?n$', format_lower):
        return 'NUMBER'

    # 7. Fraction/sequence format — "1!n/1!n" (field :27:)
    if re.match(r'^\d+!?n/\d+!?n$', format_lower):
        return 'TEXT'

    # Default to TEXT
    return 'TEXT'


def determine_component_type(field_type: str) -> str:
    """Determina el tipo de componente UI basado en el tipo de campo"""
    mapping = {
        'TEXT': 'TEXT_INPUT',
        'NUMBER': 'TEXT_INPUT',
        'DECIMAL': 'TEXT_INPUT',
        'DATE': 'DATE_PICKER',
        'TEXTAREA': 'TEXTAREA',
        'SWIFT_PARTY': 'SWIFT_PARTY_INPUT',
        'SELECT': 'SELECT',
        'CURRENCY_AMOUNT': 'CURRENCY_AMOUNT_INPUT',
        'INSTITUTION': 'FINANCIAL_INSTITUTION_SELECTOR',
        'COUNTRY': 'COUNTRY_SELECTOR',
        'CURRENCY': 'CURRENCY_SELECTOR',
    }
    return mapping.get(field_type, 'TEXT_INPUT')


def main():
    parser = argparse.ArgumentParser(description='Parse SWIFT SRG HTML files and generate SQL migrations')
    parser.add_argument('--srg-path', help='Path to SRG folder (e.g., /path/to/srg2024)')
    parser.add_argument('--version', help='SWIFT version (e.g., 2024, 2025, 2026)')
    parser.add_argument('--effective-date', help='Effective date (YYYY-MM-DD)')
    parser.add_argument('--output', '-o', help='Output SQL file', default='swift_migration.sql')
    parser.add_argument('--all', action='store_true', help='Process all SRG folders')
    parser.add_argument('--srg-base', help='Base path containing srg2024, srg2025, srg2026 folders',
                        default='/Users/cesaralvarez/Downloads')
    parser.add_argument('--json', action='store_true', help='Output as JSON instead of SQL')
    parser.add_argument('--categories', nargs='+', default=['us7m', 'us4m'],
                        help='Categories to process (default: us7m us4m)')

    args = parser.parse_args()

    # Version to effective date mapping
    effective_dates = {
        '2024': '2024-11-17',
        '2025': '2025-11-16',
        '2026': '2026-11-15'
    }

    all_fields = []

    if args.all:
        # Process all versions
        for version in ['2024', '2025', '2026']:
            srg_path = os.path.join(args.srg_base, f'srg{version}')
            if os.path.exists(srg_path):
                print(f"\n{'='*60}")
                print(f"Processing SRG {version}")
                print(f"{'='*60}")
                fields = parse_all_fields(srg_path, version, args.categories)
                for f in fields:
                    f.spec_version = version
                all_fields.extend(fields)
            else:
                print(f"Warning: SRG path not found: {srg_path}")
    else:
        if not args.srg_path or not args.version:
            parser.error("--srg-path and --version are required unless using --all")

        fields = parse_all_fields(args.srg_path, args.version, args.categories)
        all_fields.extend(fields)

    print(f"\n{'='*60}")
    print(f"Total fields parsed: {len(all_fields)}")
    print(f"{'='*60}")

    # Group by message type for summary
    by_mt = {}
    for f in all_fields:
        if f.message_type not in by_mt:
            by_mt[f.message_type] = 0
        by_mt[f.message_type] += 1

    print("\nFields by message type:")
    for mt, count in sorted(by_mt.items()):
        print(f"  {mt}: {count} fields")

    if args.json:
        # Output as JSON
        output_data = [asdict(f) for f in all_fields]
        with open(args.output.replace('.sql', '.json'), 'w') as f:
            json.dump(output_data, f, indent=2)
        print(f"\nJSON output written to: {args.output.replace('.sql', '.json')}")
    else:
        # Generate SQL for each version
        if args.all:
            for version in ['2024', '2025', '2026']:
                version_fields = [f for f in all_fields if hasattr(f, 'spec_version') and f.spec_version == version]
                if version_fields:
                    sql = generate_sql_migration(version_fields, version, effective_dates[version])
                    output_file = args.output.replace('.sql', f'_{version}.sql')
                    with open(output_file, 'w') as f:
                        f.write(sql)
                    print(f"SQL migration written to: {output_file}")
        else:
            effective_date = args.effective_date or effective_dates.get(args.version, '2024-11-17')
            sql = generate_sql_migration(all_fields, args.version, effective_date)
            with open(args.output, 'w') as f:
                f.write(sql)
            print(f"\nSQL migration written to: {args.output}")


if __name__ == '__main__':
    main()
