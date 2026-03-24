#!/usr/bin/env python3
"""
SWIFT PDF Specification Parser

Parsea los PDFs oficiales de SWIFT (Category 4 y Category 7) para extraer
las especificaciones de campos y generar migraciones SQL para corregir
display_order y content_options en swift_field_config_readmodel.

Requiere: poppler (pdftotext)
    brew install poppler  (macOS)
    apt-get install poppler-utils  (Linux)

Uso:
    # Generar migración SQL desde los PDFs oficiales:
    python swift_pdf_parser.py --pdf-base /path/to/especificacionSwift/pdf/partes --output fix_swift_fields.sql

    # Solo mostrar los campos parseados (sin generar SQL):
    python swift_pdf_parser.py --pdf-base /path/to/especificacionSwift/pdf/partes --dry-run

    # Generar para una versión específica:
    python swift_pdf_parser.py --pdf-base /path/to/especificacionSwift/pdf/partes --version 2024 --output fix_2024.sql

    # Exportar como JSON:
    python swift_pdf_parser.py --pdf-base /path/to/especificacionSwift/pdf/partes --json --output fields.json

Autor: GlobalCMX
"""

import os
import re
import json
import argparse
import subprocess
import tempfile
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from pathlib import Path


# ===========================================================================
# Official SWIFT field lists per message type
# Source: SWIFT Standards Release Guide (SRG) - November 2025
# Only fields listed here are valid for each message type.
# Used to validate parsed fields and reject phantom/extra fields.
# ===========================================================================
VALID_FIELDS_BY_MT = {
    'MT700': {
        '27', '40A', '20', '23', '31C', '40E', '31D', '51a', '50', '59',
        '32B', '39A', '39C', '41a', '42C', '42a', '42M', '42P', '43P',
        '43T', '44A', '44E', '44F', '44B', '44C', '44D', '45A', '46A',
        '47A', '49G', '49H', '71D', '48', '49', '58a', '53a', '78', '57a',
        '72Z',
    },
    'MT701': {
        '27', '20', '45A', '46A', '47A',
    },
    'MT705': {
        '27', '40A', '20', '31C', '40E', '31D', '50', '59', '32B', '39A',
        '39C', '72Z',
    },
    'MT707': {
        '20', '21', '23', '52a', '31C', '30', '26E', '59', '31E', '32B',
        '33B', '34B', '39A', '39C', '41a', '42C', '42a', '42M', '42P',
        '43P', '43T', '44A', '44E', '44F', '44B', '44C', '44D', '45A',
        '46A', '47A', '49G', '49H', '71D', '48', '49', '58a', '53a', '78',
        '57a', '72Z',
    },
    'MT710': {
        '27', '40A', '20', '21', '23', '31C', '40E', '31D', '52a', '50',
        '59', '32B', '39A', '39C', '41a', '42C', '42a', '42M', '42P',
        '43P', '43T', '44A', '44E', '44F', '44B', '44C', '44D', '45A',
        '46A', '47A', '49G', '49H', '71D', '48', '49', '58a', '53a', '78',
        '57a', '72Z',
    },
    'MT711': {
        '27', '20', '45A', '46A', '47A',
    },
    'MT720': {
        '27', '40A', '20', '21', '23', '31C', '40E', '31D', '52a', '50',
        '59', '32B', '39A', '39C', '41a', '42C', '42a', '42M', '42P',
        '43P', '43T', '44A', '44E', '44F', '44B', '44C', '44D', '45A',
        '46A', '47A', '49G', '49H', '71D', '48', '49', '58a', '53a', '78',
        '57a', '72Z',
    },
    'MT721': {
        '27', '20', '45A', '46A', '47A',
    },
    'MT730': {
        '20', '21', '25', '30', '32B', '71B', '72Z',
    },
    'MT732': {
        '20', '21', '30', '59', '32B', '71B', '72Z',
    },
    'MT734': {
        '20', '21', '30', '32a', '73S', '77J', '72Z',
    },
    'MT740': {
        '20', '25', '21', '52a', '59', '32B', '41a', '71D', '72Z',
    },
    'MT742': {
        '20', '21', '52a', '32B', '71B', '72Z',
    },
    'MT747': {
        '20', '21', '32B', '71D', '72Z',
    },
    'MT750': {
        '20', '21', '30', '32B', '77C', '72Z',
    },
    'MT752': {
        '20', '21', '30', '32B', '71B', '72Z',
    },
    'MT754': {
        '20', '21', '30', '32B', '73S', '77J', '72Z',
    },
    'MT756': {
        '20', '21', '30', '32B', '33B', '71B', '73S', '72Z',
    },
    'MT760': {
        '27', '20', '23', '22D', '23B', '23X', '30', '22K', '40C', '23S',
        '22Y', '40F', '31E', '35G', '50', '51a', '52a', '59', '56a',
        '32B', '77U', '45L', '24D', '24G', '77L', '22G', '22H', '36',
        '23F', '58a', '22D', '22E', '78', '72Z',
    },
    'MT767': {
        '20', '21', '23', '22D', '52a', '30', '22K', '23S', '31E', '35G',
        '50', '59', '56a', '32B', '77U', '45L', '24D', '24G', '77L',
        '22G', '22H', '36', '23F', '58a', '22D', '22E', '78', '72Z',
    },
    'MT768': {
        '20', '21', '25', '32B', '71B', '72Z',
    },
    'MT769': {
        '20', '21', '32B', '71B', '77C', '72Z',
    },
    # Category 4 - Collections
    'MT400': {
        '20', '21', '25', '32a', '33a', '71A', '71B', '72', '77A',
    },
    'MT405': {
        '20', '21', '32a', '71A', '77C', '72',
    },
    'MT410': {
        '20', '21', '32a', '58a', '72',
    },
    'MT412': {
        '20', '21', '32a', '72',
    },
    'MT416': {
        '20', '21', '32a', '71A', '77C', '72',
    },
    'MT420': {
        '20', '21', '32a', '59', '53a', '79', '72',
    },
    'MT422': {
        '20', '21', '53a', '59', '72',
    },
    'MT430': {
        '20', '21', '32a', '72',
    },
    'MT450': {
        '20', '21', '23E', '30', '51a', '50', '59', '32B', '72',
    },
    'MT456': {
        '20', '21', '52a', '59', '32B', '71B', '33B', '72',
    },
    'MT490': {
        '20', '21', '59', '32B', '71A', '77A', '72',
    },
    'MT491': {
        '20', '21', '59', '32B', '71A', '77A', '72',
    },
    'MT492': {
        '20', '21', '77C', '72',
    },
    'MT495': {
        '20', '21', '77C', '72',
    },
    'MT499': {
        '20', '21', '79', '72',
    },
}

# ===========================================================================
# Known field type overrides
# Some fields have formats that are ambiguous or commonly misclassified.
# This dictionary forces the correct type for known problematic fields.
# Key: field_code (e.g., ':39C:'), Value: (field_type, component_type)
# ===========================================================================
FIELD_TYPE_OVERRIDES = {
    # :39C: is "Additional Amounts Covered" - narrative text, NOT decimal
    ':39C:': ('TEXT', 'TEXTAREA'),
    # :32B: is Currency + Amount (composite field)
    ':32B:': ('CURRENCY_AMOUNT', 'CURRENCY_AMOUNT_INPUT'),
    # :33B: is Currency + Amount (composite field)
    ':33B:': ('CURRENCY_AMOUNT', 'CURRENCY_AMOUNT_INPUT'),
    # :34B: is Currency + Amount
    ':34B:': ('CURRENCY_AMOUNT', 'CURRENCY_AMOUNT_INPUT'),
    # :39A: is Percentage Tolerance (numeric, not text)
    ':39A:': ('TEXT', 'TEXT_INPUT'),
    # :40A: is code list (Form of Documentary Credit)
    ':40A:': ('SELECT', 'SELECT'),
    # :40E: is code + narrative (Applicable Rules)
    ':40E:': ('TEXT', 'TEXT_INPUT'),
    # :43P: is code (Partial Shipments)
    ':43P:': ('SELECT', 'SELECT'),
    # :43T: is code (Transhipment)
    ':43T:': ('SELECT', 'SELECT'),
    # :71A: is code (Charges)
    ':71A:': ('SELECT', 'SELECT'),
    # :49: is code (Confirmation Instructions)
    ':49:': ('SELECT', 'SELECT'),
    # Party/institution fields
    ':50:': ('TEXT', 'TEXTAREA'),
    ':59:': ('TEXT', 'TEXTAREA'),
    ':51a:': ('INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR'),
    ':52a:': ('INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR'),
    ':53a:': ('INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR'),
    ':56a:': ('INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR'),
    ':57a:': ('INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR'),
    ':58a:': ('INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR'),
    ':41a:': ('INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR'),
    ':42a:': ('INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR'),
}


@dataclass
class SwiftFieldSpec:
    """Especificación de un campo SWIFT extraída del PDF oficial"""
    message_type: str       # e.g., "MT700"
    display_order: int      # El número de orden del PDF (columna "No.")
    status: str             # "M" or "O"
    tag: str                # e.g., "27", "40A", "51a"
    field_name: str         # e.g., "Form of Documentary Credit"
    content_options: str    # e.g., "24x", "A or D", "4*35x"
    field_code: str = ""    # e.g., ":40A:" - derived from tag
    spec_version: str = ""  # e.g., "2024"

    def __post_init__(self):
        # Build field_code from tag
        tag_clean = self.tag.strip()
        if tag_clean and not tag_clean.startswith(':'):
            self.field_code = f":{tag_clean}:"


def pdf_to_text(pdf_path: str) -> str:
    """Convert a PDF file to text using pdftotext (poppler)"""
    try:
        result = subprocess.run(
            ['pdftotext', pdf_path, '-'],
            capture_output=True, text=True, timeout=60
        )
        return result.stdout
    except FileNotFoundError:
        print("ERROR: pdftotext not found. Install poppler:")
        print("  macOS:  brew install poppler")
        print("  Linux:  apt-get install poppler-utils")
        raise
    except subprocess.TimeoutExpired:
        print(f"WARNING: Timeout converting {pdf_path}")
        return ""


def convert_pdfs_to_text(pdf_base: str, category: str, version: str) -> str:
    """Convert all PDF parts for a category/version to a single text string"""
    # Try different directory patterns
    patterns = [
        os.path.join(pdf_base, f"categoria {category}", str(version)),
        os.path.join(pdf_base, f"categoria {category}"),
    ]

    all_text = ""
    for base_dir in patterns:
        if not os.path.exists(base_dir):
            continue

        pdf_files = sorted([
            f for f in os.listdir(base_dir)
            if f.endswith('.pdf') and str(version) in f
        ])

        if not pdf_files:
            continue

        print(f"  Found {len(pdf_files)} PDF parts in {base_dir}")
        for pdf_file in pdf_files:
            pdf_path = os.path.join(base_dir, pdf_file)
            text = pdf_to_text(pdf_path)
            all_text += text + "\n"

        if all_text:
            break

    return all_text


def parse_format_spec_section(text: str, mt_type: str, section_start: int, section_end: int) -> List[SwiftFieldSpec]:
    """Parse a single MT Format Specifications table section"""
    section = text[section_start:section_end]
    lines = section.split('\n')

    # Skip header lines (MT XXX Format Specifications, MT XXX Title, date, column headers)
    # Find where the actual data starts by looking for the first Status indicator (M or O)
    fields = []
    non_empty_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped:
            non_empty_lines.append(stripped)

    # Skip initial headers: "MT XXX Format Specifications", "MT XXX Title", date,
    # "Status", "Tag", "Field Name", "Content/Options", "No."
    # Then parse groups of 5 non-empty lines: Status, Tag, FieldName, Content/Options, No.

    # Find the first "M" or "O" that starts a field row
    data_start = 0
    for i, line in enumerate(non_empty_lines):
        if line in ('M', 'O') and i > 4:  # Skip headers
            data_start = i
            break

    if data_start == 0:
        return fields

    i = data_start
    while i < len(non_empty_lines):
        line = non_empty_lines[i]

        # Check if this is a Status line (M or O)
        if line not in ('M', 'O'):
            # Could be a page header/footer or section break
            # Skip known noise patterns
            if any(skip in line for skip in [
                'Category 7', 'Category 4', 'For Standards MT',
                'Message Reference Guide', 'Status', 'Content/Options',
                'M = Mandatory', '19 July', '18 July', '17 July',
                'Field Name', 'No.', 'Tag'
            ]):
                i += 1
                continue
            # Also skip date patterns like "19 July 2024", page numbers
            if re.match(r'^\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$', line):
                i += 1
                continue
            if re.match(r'^\d+$', line) and int(line) > 100:  # Page number
                i += 1
                continue
            i += 1
            continue

        status = line  # M or O

        # Next non-empty line should be the Tag
        if i + 1 >= len(non_empty_lines):
            break
        tag_line = non_empty_lines[i + 1]

        # Handle case where tag and field name are on the same line
        # e.g., "42M Mixed Payment Details" or "49G Special Payment Conditions"
        tag_with_name_match = re.match(r'^(\d{2}[A-Za-z]?)\s+(.+)$', tag_line)
        if tag_with_name_match:
            tag = tag_with_name_match.group(1)
            inline_field_name = tag_with_name_match.group(2).strip()
        else:
            tag = tag_line
            inline_field_name = None

        # Validate tag looks like a SWIFT tag (number with optional letter suffix)
        if not re.match(r'^\d{2}[A-Za-z]?$', tag):
            i += 1
            continue

        # Next should be Field Name - may span multiple lines before Content/Options
        if i + 2 >= len(non_empty_lines):
            break

        # Collect field name lines until we hit Content/Options pattern
        field_name_parts = []
        if inline_field_name:
            field_name_parts.append(inline_field_name)
        j = i + 2
        content_options = ""
        display_order = ""

        while j < len(non_empty_lines):
            candidate = non_empty_lines[j]

            # Check if this looks like Content/Options (format spec)
            if is_content_options(candidate):
                content_options = candidate
                j += 1
                break
            # Check if this is a noise line to skip
            if is_noise_line(candidate):
                j += 1
                continue
            field_name_parts.append(candidate)
            j += 1

        if not content_options:
            i += 1
            continue

        field_name = ' '.join(field_name_parts)

        # Next should be the display order number
        while j < len(non_empty_lines):
            candidate = non_empty_lines[j]
            if re.match(r'^\d{1,3}$', candidate) and int(candidate) <= 200:
                display_order = candidate
                j += 1
                break
            if is_noise_line(candidate):
                j += 1
                continue
            # If we hit another M/O, we missed the number
            if candidate in ('M', 'O'):
                break
            j += 1

        if not display_order:
            i += 1
            continue

        field = SwiftFieldSpec(
            message_type=mt_type,
            display_order=int(display_order),
            status=status,
            tag=tag,
            field_name=field_name.strip(),
            content_options=content_options.strip()
        )
        fields.append(field)
        i = j  # Continue from after the display order

    return fields


def is_content_options(text: str) -> bool:
    """Check if a line looks like SWIFT Content/Options format"""
    text = text.strip()
    # Common SWIFT format patterns
    # SWIFT format chars: a=alpha, c=alphanumeric, n=numeric, x=any, d=decimal, z=SWIFT-Z, e=space
    patterns = [
        r'^\d+[!*]?\d*[anxdzcehg]',       # "16x", "4*35x", "6!n", "3!a15d", "4!c"
        r'^[A-Z](\s+or\s+[A-Z])+',        # "A or D", "A, B, or D"
        r'^[A-Z],\s+[A-Z]',               # "A, B"
        r'^[A-Z],\s+[A-Z],\s+or\s+[A-Z]', # "A, B, or D"
        r'^\[/',                            # "[/34x]"
        r'^ISIN',                           # ISIN format
        r'^No letter option',              # "No letter option" for some fields
        r'^F\s+or\s+G',                   # "F or G"
    ]
    for p in patterns:
        if re.match(p, text, re.IGNORECASE):
            return True
    # Additional checks for multi-part formats
    if text in ('ISIN1!e12!c', 'ISIN1 !e12!c'):
        return True
    # "Empty field" is a valid content_options for sequence markers like 15A, 15B
    if text.lower() == 'empty field':
        return True
    return False


def is_noise_line(text: str) -> bool:
    """Check if a line is a page header/footer or other noise"""
    text = text.strip()
    noise_patterns = [
        r'^Category [47]',
        r'^For Standards MT',
        r'^Message Reference Guide',
        r'^MT \d{3}',
        r'^\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$',
        r'^Status$',
        r'^Tag$',
        r'^Field Name$',
        r'^Content/Options$',
        r'^No\.$',
        r'^M = Mandatory',
        r'^\d{3,}$',  # Large page numbers
        r'^(Mandatory|Optional)\s+Sequence\s+[A-Z]',  # Sequence headers
        r'^End of Sequence\s+[A-Z]',                   # Sequence footers
    ]
    for p in noise_patterns:
        if re.match(p, text):
            return True
    return False


def parse_all_mt_specs(text: str) -> List[SwiftFieldSpec]:
    """Parse all MT Format Specification sections from the full text"""
    all_fields = []

    # Find all "MT XXX Format Specifications" sections (skip TOC entries with dots)
    pattern = r'MT (\d{3}) Format Specifications\n'
    matches = list(re.finditer(pattern, text))

    # Filter out TOC entries (they have dots or page numbers right after)
    real_sections = []
    for m in matches:
        # Check if this is a TOC entry (has dots leading to page number)
        line_start = text.rfind('\n', 0, m.start()) + 1
        line = text[line_start:m.end() + 100]
        if '...' in line or '.....' in line:
            continue
        real_sections.append(m)

    print(f"  Found {len(real_sections)} MT format specification sections")

    for idx, match in enumerate(real_sections):
        mt_type = f"MT{match.group(1)}"
        section_start = match.start()

        # Section ends at the next "Network Validated Rules" or next "Format Specifications"
        end_pattern = f"MT {match.group(1)} Network Validated Rules"
        section_end = text.find(end_pattern, section_start + 10)
        if section_end == -1:
            # Try next section
            if idx + 1 < len(real_sections):
                section_end = real_sections[idx + 1].start()
            else:
                section_end = len(text)

        fields = parse_format_spec_section(text, mt_type, section_start, section_end)
        if fields:
            print(f"    {mt_type}: {len(fields)} fields parsed")
            all_fields.extend(fields)
        else:
            print(f"    {mt_type}: WARNING - no fields parsed!")

    return all_fields


def generate_fix_migration(fields: List[SwiftFieldSpec], version: str) -> str:
    """Generate SQL migration to fix display_order and swift_format"""

    # Group by message type
    by_mt: Dict[str, List[SwiftFieldSpec]] = {}
    for f in fields:
        if f.message_type not in by_mt:
            by_mt[f.message_type] = []
        by_mt[f.message_type].append(f)

    sql_lines = []
    sql_lines.append(f"-- ==================================================")
    sql_lines.append(f"-- Migration: Fix SWIFT field display_order and swift_format")
    sql_lines.append(f"-- Source: Official SWIFT PDF Specifications {version}")
    sql_lines.append(f"-- Generated: {datetime.now().isoformat()}")
    sql_lines.append(f"-- ==================================================")
    sql_lines.append("")
    sql_lines.append("-- This migration corrects display_order to match the official")
    sql_lines.append("-- SWIFT PDF specification numbering (column 'No.' in Format Specifications)")
    sql_lines.append("-- and updates swift_format with the official Content/Options from the PDF.")
    sql_lines.append("")

    total_updates = 0
    for mt, mt_fields in sorted(by_mt.items()):
        mt_fields.sort(key=lambda f: f.display_order)
        sql_lines.append(f"-- {mt} ({len(mt_fields)} fields)")
        sql_lines.append(f"-- {'=' * 60}")

        for f in mt_fields:
            content_opts = f.content_options.replace("'", "''")

            sql_lines.append(f"""
UPDATE swift_field_config_readmodel
SET display_order = {f.display_order},
    swift_format = '{content_opts}',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = '{f.message_type}'
  AND field_code = '{f.field_code}'
  AND spec_version = '{version}';""")
            total_updates += 1

        sql_lines.append("")

    sql_lines.append(f"-- Total updates: {total_updates}")
    return '\n'.join(sql_lines)


def validate_fields(fields: List[SwiftFieldSpec]) -> Tuple[List[SwiftFieldSpec], List[SwiftFieldSpec]]:
    """Validate parsed fields against the official SWIFT spec.

    Returns:
        (valid_fields, rejected_fields) — rejected fields are those not in the official spec.
    """
    valid = []
    rejected = []

    for f in fields:
        mt = f.message_type
        tag = f.tag

        if mt not in VALID_FIELDS_BY_MT:
            # Unknown message type — keep but warn
            print(f"    WARNING: Unknown message type {mt}, keeping field {tag}")
            valid.append(f)
            continue

        allowed_tags = VALID_FIELDS_BY_MT[mt]

        # Check if tag is in the allowed list (try exact match and lowercase variant)
        if tag in allowed_tags:
            valid.append(f)
        elif tag.lower() in {t.lower() for t in allowed_tags}:
            # Case-insensitive match — fix the tag to match the spec
            for allowed in allowed_tags:
                if allowed.lower() == tag.lower():
                    f.tag = allowed
                    f.field_code = f":{allowed}:"
                    valid.append(f)
                    break
        else:
            rejected.append(f)
            print(f"    REJECTED: {mt} field :{tag}: — NOT in official spec for {mt}")

    return valid, rejected


def generate_full_insert_migration(fields: List[SwiftFieldSpec], version: str, effective_date: str) -> str:
    """Generate full INSERT migration for swift_field_config_readmodel.

    Validates fields against the official spec before generating SQL.
    """

    # Validate first
    valid_fields, rejected_fields = validate_fields(fields)

    if rejected_fields:
        print(f"\n  === VALIDATION: {len(rejected_fields)} fields REJECTED (not in official spec) ===")
        for f in rejected_fields:
            print(f"    {f.message_type} :{f.tag}: — {f.field_name}")

    by_mt: Dict[str, List[SwiftFieldSpec]] = {}
    for f in valid_fields:
        if f.message_type not in by_mt:
            by_mt[f.message_type] = []
        by_mt[f.message_type].append(f)

    sql_lines = []
    sql_lines.append(f"-- ==================================================")
    sql_lines.append(f"-- Migration: SWIFT Fields from Official PDF - Version {version}")
    sql_lines.append(f"-- Source: Official SWIFT PDF Specifications")
    sql_lines.append(f"-- Generated: {datetime.now().isoformat()}")
    sql_lines.append(f"-- Effective Date: {effective_date}")
    sql_lines.append(f"-- ==================================================")
    sql_lines.append("")

    if rejected_fields:
        sql_lines.append(f"-- WARNING: {len(rejected_fields)} fields were rejected (not in official spec):")
        for f in rejected_fields:
            sql_lines.append(f"--   {f.message_type} :{f.tag}: — {f.field_name}")
        sql_lines.append("")

    for mt, mt_fields in sorted(by_mt.items()):
        mt_fields.sort(key=lambda f: f.display_order)
        sql_lines.append(f"-- {mt} ({len(mt_fields)} fields)")
        sql_lines.append(f"-- {'=' * 60}")

        for f in mt_fields:
            content_opts = f.content_options.replace("'", "''")
            tag_clean = f.tag.lower()

            # Check overrides first, then determine from format
            if f.field_code in FIELD_TYPE_OVERRIDES:
                field_type, component_type = FIELD_TYPE_OVERRIDES[f.field_code]
            else:
                field_type = determine_field_type(f.content_options, f.field_code)
                component_type = determine_component_type(field_type)

            sql_lines.append(f"""
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name_key, description_key, message_type, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), '{f.field_code}', 'swift.{f.message_type.lower()}.{tag_clean}.fieldName',
    'swift.{f.message_type.lower()}.{tag_clean}.description',
    '{f.message_type}', 'GENERAL', {f.display_order},
    {1 if f.status == 'M' else 0}, 1,
    '{field_type}', '{component_type}', '{content_opts}', '{f.status}',
    '{version}', '{effective_date}', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = '{f.field_code}'
    AND message_type = '{f.message_type}'
    AND spec_version = '{version}'
);""")

        sql_lines.append("")

    return '\n'.join(sql_lines)


def determine_field_type(content_options: str, field_code: str) -> str:
    """Determine field type from Content/Options.

    SWIFT format notation:
        a = alphabetic, c = alphanumeric, n = numeric, x = any char (SWIFT X set),
        d = decimal (with comma), z = SWIFT Z character set (includes CR/LF),
        e = space, h = hex, ! = fixed length, * = repetition (multi-line)
        [] = optional

    Priority order matters — check overrides first, then specific patterns.
    """
    # 1. Check known overrides first (handles misclassified fields like :39C:)
    if field_code in FIELD_TYPE_OVERRIDES:
        return FIELD_TYPE_OVERRIDES[field_code][0]

    co = content_options.strip()
    co_lower = co.lower()

    # 2. Date fields — "6!n" alone or known date field codes
    if co_lower == '6!n' or field_code in [':31C:', ':31D:', ':31E:', ':44C:', ':29A:']:
        return 'DATE'

    # 3. Fields with letter options (A or D, A, B, or D, etc.)
    #    These represent multi-option fields (institution selector, etc.)
    if re.match(r'^[A-Z](\s+or\s+[A-Z])+$', co) or \
       re.match(r'^[A-Z],\s+[A-Z]', co):
        return 'TEXT'

    # 4. Multi-line text (contains * = repetition indicator)
    #    e.g., "4*35x", "6*65x", "100*65z"
    #    MUST check BEFORE decimal, since "4*35z" contains no decimal
    if '*' in co:
        return 'TEXTAREA'

    # 5. Currency+Amount composite fields — pattern like "3!a15d" (currency code + amount)
    if re.match(r'^\d+!?a\d+!?d$', co_lower):
        return 'CURRENCY_AMOUNT'

    # 6. Pure decimal fields — only if format is SOLELY decimal notation
    #    e.g., "15d" (amount), NOT "3!a15d" (currency+amount, handled above)
    if re.match(r'^\d+!?d$', co_lower):
        return 'DECIMAL'

    # 7. Pure numeric — e.g., "3!n", "2n"
    if re.match(r'^\d+!?n$', co_lower):
        return 'NUMBER'

    # 8. Fraction/sequence format — e.g., "1!n/1!n" (field :27:)
    if re.match(r'^\d+!?n/\d+!?n$', co_lower):
        return 'TEXT'

    return 'TEXT'


def determine_component_type(field_type: str) -> str:
    """Determine UI component type from field type"""
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
    }
    return mapping.get(field_type, 'TEXT_INPUT')


def main():
    parser = argparse.ArgumentParser(
        description='Parse SWIFT official PDFs and generate SQL migrations for swift_field_config_readmodel'
    )
    parser.add_argument('--pdf-base', required=True,
                        help='Base path to PDF parts (e.g., /path/to/especificacionSwift/pdf/partes)')
    parser.add_argument('--version', choices=['2024', '2025', 'all'], default='all',
                        help='SWIFT version to process (default: all)')
    parser.add_argument('--output', '-o', default='fix_swift_display_order.sql',
                        help='Output file path')
    parser.add_argument('--mode', choices=['fix', 'insert'], default='fix',
                        help='fix: UPDATE display_order/content_options; insert: full INSERT migration')
    parser.add_argument('--dry-run', action='store_true',
                        help='Print parsed fields without generating SQL')
    parser.add_argument('--json', action='store_true',
                        help='Export as JSON instead of SQL')

    args = parser.parse_args()

    # Version to effective date mapping
    effective_dates = {
        '2024': '2024-11-17',
        '2025': '2025-11-16',
        '2026': '2026-11-15'
    }

    versions = ['2024', '2025'] if args.version == 'all' else [args.version]
    categories = [('7', 'Documentary Credits'), ('4', 'Collections')]

    all_fields: List[SwiftFieldSpec] = []

    for version in versions:
        print(f"\n{'=' * 60}")
        print(f"Processing version {version}")
        print(f"{'=' * 60}")

        for cat_num, cat_name in categories:
            print(f"\nCategory {cat_num} - {cat_name}:")
            text = convert_pdfs_to_text(args.pdf_base, cat_num, version)
            if not text:
                print(f"  WARNING: No text extracted for Category {cat_num} version {version}")
                continue

            fields = parse_all_mt_specs(text)
            for f in fields:
                f.spec_version = version
            all_fields.extend(fields)

    # Summary
    print(f"\n{'=' * 60}")
    print(f"SUMMARY")
    print(f"{'=' * 60}")
    print(f"Total fields parsed: {len(all_fields)}")

    by_mt: Dict[str, int] = {}
    for f in all_fields:
        key = f"{f.message_type} (v{f.spec_version})"
        by_mt[key] = by_mt.get(key, 0) + 1

    for mt, count in sorted(by_mt.items()):
        print(f"  {mt}: {count} fields")

    if args.dry_run:
        print("\n--- DRY RUN: Fields parsed ---")
        for f in all_fields:
            print(f"  {f.message_type} v{f.spec_version} | #{f.display_order:2d} | {f.status} | {f.field_code:6s} | {f.field_name[:40]:40s} | {f.content_options}")
        return

    if args.json:
        output_file = args.output.replace('.sql', '.json') if args.output.endswith('.sql') else args.output
        output_data = [asdict(f) for f in all_fields]
        with open(output_file, 'w') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        print(f"\nJSON output written to: {output_file}")
        return

    # Generate SQL
    if args.mode == 'fix':
        for version in versions:
            version_fields = [f for f in all_fields if f.spec_version == version]
            if not version_fields:
                continue
            sql = generate_fix_migration(version_fields, version)
            if len(versions) > 1:
                output_file = args.output.replace('.sql', f'_{version}.sql')
            else:
                output_file = args.output
            with open(output_file, 'w') as f:
                f.write(sql)
            print(f"SQL fix migration written to: {output_file}")
    else:
        for version in versions:
            version_fields = [f for f in all_fields if f.spec_version == version]
            if not version_fields:
                continue
            effective_date = effective_dates.get(version, '2024-11-17')
            sql = generate_full_insert_migration(version_fields, version, effective_date)
            if len(versions) > 1:
                output_file = args.output.replace('.sql', f'_{version}.sql')
            else:
                output_file = args.output
            with open(output_file, 'w') as f:
                f.write(sql)
            print(f"SQL insert migration written to: {output_file}")


if __name__ == '__main__':
    main()
