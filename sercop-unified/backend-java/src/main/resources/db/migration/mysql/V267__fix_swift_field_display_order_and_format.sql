-- ==================================================
-- Migration: Fix SWIFT field display_order and swift_format
-- Source: Official SWIFT PDF Specifications 2024
-- Generated: 2026-02-18T09:36:52.152284
-- ==================================================

-- This migration corrects display_order to match the official
-- SWIFT PDF specification numbering (column 'No.' in Format Specifications)
-- and updates swift_format with the official Content/Options from the PDF.

-- MT400 (12 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A, B, or K',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':32a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':33A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':53a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':54a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':58a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':71B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':72:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':73:'
  AND spec_version = '2024';

-- MT410 (3 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT410'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT410'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A, B, or K',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT410'
  AND field_code = ':32a:'
  AND spec_version = '2024';

-- MT412 (3 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT412'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT412'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '6!n3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT412'
  AND field_code = ':32A:'
  AND spec_version = '2024';

-- MT416 (15 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '4!c[/30x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':23E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '[/1!a][/34x]<crlf>4!a2!a2!c[3!c]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':51A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'A or B',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':53a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':71F:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '20*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':77A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':21A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4!c[/30x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':23E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':21C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = 'A, B, or K',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':32a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '[/1!a][/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':50D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':59:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':71F:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = '20*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':77A:'
  AND spec_version = '2024';

-- MT420 (6 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT420'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT420'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A, B, or K',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT420'
  AND field_code = ':32a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT420'
  AND field_code = ':30:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT420'
  AND field_code = ':59:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT420'
  AND field_code = ':72:'
  AND spec_version = '2024';

-- MT422 (6 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT422'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT422'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A, B, or K',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT422'
  AND field_code = ':32a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT422'
  AND field_code = ':72:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT422'
  AND field_code = ':75:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT422'
  AND field_code = ':76:'
  AND spec_version = '2024';

-- MT430 (7 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT430'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT430'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A or K',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT430'
  AND field_code = ':32a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = 'A or K',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT430'
  AND field_code = ':33a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT430'
  AND field_code = ':59:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT430'
  AND field_code = ':72:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT430'
  AND field_code = ':74:'
  AND spec_version = '2024';

-- MT450 (7 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT450'
  AND field_code = ':25:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT450'
  AND field_code = ':72:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT450'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT450'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT450'
  AND field_code = ':30:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6!n3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT450'
  AND field_code = ':32A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT450'
  AND field_code = ':52a:'
  AND spec_version = '2024';

-- MT455 (8 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT455'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT455'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT455'
  AND field_code = ':25:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT455'
  AND field_code = ':30:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6!n3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT455'
  AND field_code = ':32A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'C or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT455'
  AND field_code = ':33a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT455'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '20*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT455'
  AND field_code = ':77A:'
  AND spec_version = '2024';

-- MT456 (11 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':25:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':72:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A or B',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':32a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6!n3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':33D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':71B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '20*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':77A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':77D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':72:'
  AND spec_version = '2024';

-- MT499 (2 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT499'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT499'
  AND field_code = ':21:'
  AND spec_version = '2024';

-- MT700 (39 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':27:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '24x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':40A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':23:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':31C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '30x[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':40E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6!n29x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':31D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':51a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':50:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':59:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '2n/2n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':39A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':39C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':41a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = '3*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':42C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':42a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':42M:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 18,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':42P:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 19,
    swift_format = '11x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':43P:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 20,
    swift_format = '11x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':43T:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 21,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':44A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 22,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':44E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 23,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':44F:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 24,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':44B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 25,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':44C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 26,
    swift_format = '6*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':44D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 27,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':45A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 28,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':46A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 29,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':47A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 30,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':49G:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 31,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':49H:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 32,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':71D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 33,
    swift_format = '3n[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':48:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 34,
    swift_format = '7!x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':49:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 35,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':58a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 36,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':53a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 37,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':78:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 38,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 39,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

-- MT701 (7 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT701'
  AND field_code = ':27:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT701'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT701'
  AND field_code = ':45A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT701'
  AND field_code = ':46A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT701'
  AND field_code = ':47A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT701'
  AND field_code = ':49G:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT701'
  AND field_code = ':49H:'
  AND spec_version = '2024';

-- MT705 (19 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '24x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':40A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '6!n29x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':31D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':50:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':59:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '2n/2n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':39A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':39C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':41a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':44A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':44E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':44F:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':44B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':44C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = '6*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':44D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':45A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 18,
    swift_format = '35*50z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':79Z:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 19,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

-- MT707 (47 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':27:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':23:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':50B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':31C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '3n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':26E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':30:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':22A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '6!a',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':23S:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '24x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':40A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '30x[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':40E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = '6!n29x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':31D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':50:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':59:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 18,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':33B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 19,
    swift_format = '2n/2n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':39A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 20,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':39C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 21,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':41a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 22,
    swift_format = '3*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':42C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 23,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':42a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 24,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':42M:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 25,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':42P:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 26,
    swift_format = '11x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':43P:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 27,
    swift_format = '11x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':43T:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 28,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':44A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 29,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':44E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 30,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':44F:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 31,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':44B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 32,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':44C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 33,
    swift_format = '6*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':44D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 34,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':45B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 35,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':46B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 36,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':47B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 37,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':49M:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 38,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':49N:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 39,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':71D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 40,
    swift_format = '4!c<crlf>[6*35z]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':71N:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 41,
    swift_format = '3n[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':48:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 42,
    swift_format = '7!x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':49:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 43,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':58a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 44,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':53a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 45,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':78:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 46,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 47,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

-- MT708 (11 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':27:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':23:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '3n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':26E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':30:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':45B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':46B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':47B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':49M:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':49N:'
  AND spec_version = '2024';

-- MT710 (43 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':27:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '24x<crlf>24x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':40B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':23:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':31C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '30x[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':40E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '6!n29x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':31D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':50B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':51a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':50:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':59:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = '2n/2n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':39A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':39C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':41a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 18,
    swift_format = '3*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':42C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 19,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':42a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 20,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':42M:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 21,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':42P:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 22,
    swift_format = '11x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':43P:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 23,
    swift_format = '11x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':43T:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 24,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':44A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 25,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':44E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 26,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':44F:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 27,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':44B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 28,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':44C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 29,
    swift_format = '6*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':44D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 30,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':45A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 31,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':46A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 32,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':47A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 33,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':49G:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 34,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':49H:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 35,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':71D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 36,
    swift_format = '3n[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':48:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 37,
    swift_format = '7!x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':49:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 38,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':58a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 39,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':53a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 40,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':78:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 41,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':78D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 42,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 43,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

-- MT711 (8 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT711'
  AND field_code = ':27:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT711'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT711'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT711'
  AND field_code = ':45A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT711'
  AND field_code = ':46A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT711'
  AND field_code = ':47A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT711'
  AND field_code = ':49G:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT711'
  AND field_code = ':49H:'
  AND spec_version = '2024';

-- MT720 (40 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':27:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '24x<crlf>24x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':40B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':31C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '30x[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':40E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6!n29x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':31D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':50B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':50:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':59:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '2n/2n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':39A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':39C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':41a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = '3*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':42C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':42a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 18,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':42M:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 19,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':42P:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 20,
    swift_format = '11x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':43P:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 21,
    swift_format = '11x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':43T:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 22,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':44A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 23,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':44E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 24,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':44F:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 25,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':44B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 26,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':44C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 27,
    swift_format = '6*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':44D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 28,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':45A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 29,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':46A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 30,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':47A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 31,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':49G:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 32,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':49H:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 33,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':71D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 34,
    swift_format = '3n[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':48:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 35,
    swift_format = '7!x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':49:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 36,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':58a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 37,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':78:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 38,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':78D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 39,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 40,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

-- MT721 (8 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT721'
  AND field_code = ':27:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT721'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT721'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT721'
  AND field_code = ':45A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT721'
  AND field_code = ':46A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT721'
  AND field_code = ':47A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT721'
  AND field_code = ':49G:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT721'
  AND field_code = ':49H:'
  AND spec_version = '2024';

-- MT730 (9 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':25:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':30:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'B or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':32a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':71D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '35*50z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':79Z:'
  AND spec_version = '2024';

-- MT732 (5 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT732'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT732'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT732'
  AND field_code = ':30:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT732'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT732'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

-- MT734 (9 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '6!n3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':32A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':73A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'A or B',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':33a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '70*50z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':77J:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '3*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':77B:'
  AND spec_version = '2024';

-- MT740 (17 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':25:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '30x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':40F:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n29x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':31D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':58a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':59:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '2n/2n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':39A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':39C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':41a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '3*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':42C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':42a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':42M:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':42P:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = '3!a',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':71A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':71D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

-- MT742 (11 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':31C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':33B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':71D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = 'A or B',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':34a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':58a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

-- MT744 (10 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':21A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':31C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A or B',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':34a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '4!c[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':73R:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '4!c[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':73S:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':71D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

-- MT747 (11 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':30:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':31E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':33B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':34B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '2n/2n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':39A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':39C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '20*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':77:'
  AND spec_version = '2024';

-- MT750 (10 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':33B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':71D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':73A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':34B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '70*50z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':77J:'
  AND spec_version = '2024';

-- MT752 (11 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':23:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':30:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':71D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = 'A or B',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':33a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':53a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':54a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '35*50z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':79Z:'
  AND spec_version = '2024';

-- MT754 (12 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A or B',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':32a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':33B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':71D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':73A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = 'A or B',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':34a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':53a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':58a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '20*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':77:'
  AND spec_version = '2024';

-- MT756 (8 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT756'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT756'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT756'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT756'
  AND field_code = ':33A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT756'
  AND field_code = ':53a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT756'
  AND field_code = ':54a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT756'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '35*50z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT756'
  AND field_code = ':79Z:'
  AND spec_version = '2024';

-- MT759 (9 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':27:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':22D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':23:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '8!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':23H:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':45D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':23X:'
  AND spec_version = '2024';

-- MT760 (69 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = 'Empty field',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':15A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':27:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':22A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':23X:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'Empty field',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':15B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':30:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':22D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '4!a[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':40C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':23B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':31E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':50:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':51:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = 'No letter option or A',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':59a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 18,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':56a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 19,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':23:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 20,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 21,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 22,
    swift_format = '12*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':39F:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 23,
    swift_format = 'F or G',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':41a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 24,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':71D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 25,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':45C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 26,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':77U:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 27,
    swift_format = '7!x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':49:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 28,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':58a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 29,
    swift_format = '2!a[/35x]<crlf><crlf>[/65x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':44J:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 30,
    swift_format = '4!a[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':23F:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 31,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':78:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 32,
    swift_format = '3n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':26E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 33,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':31S:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 34,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':48B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 35,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':48D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 36,
    swift_format = '12*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':39E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 37,
    swift_format = '50*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':45L:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 38,
    swift_format = '4!c[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':24E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 40,
    swift_format = 'Empty field',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':15C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 41,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':31C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 42,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':22D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 43,
    swift_format = '4!a[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':40C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 44,
    swift_format = '4!c[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':22K:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 45,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':23B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 46,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':31E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 47,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':35G:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 48,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':50:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 49,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':51:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 50,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 51,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':59:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 52,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 53,
    swift_format = '12*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':39F:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 54,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 55,
    swift_format = 'F or G',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':41a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 56,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':71D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 57,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':45C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 58,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':77L:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 59,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':22Y:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 60,
    swift_format = '2!a',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':40D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 61,
    swift_format = '2!a[/35x]<crlf><crlf>[/65x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':44J:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 62,
    swift_format = '4!a[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':23F:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 63,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':78:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 64,
    swift_format = '3n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':26E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 65,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':31S:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 66,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':48B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 67,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':48D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 68,
    swift_format = '12*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':39E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 69,
    swift_format = '50*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':45L:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 70,
    swift_format = '4!c[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':24E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 71,
    swift_format = '4!c<crlf>[12*65z]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':24G:'
  AND spec_version = '2024';

-- MT761 (5 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT761'
  AND field_code = ':27:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT761'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT761'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT761'
  AND field_code = ':77U:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT761'
  AND field_code = ':77L:'
  AND spec_version = '2024';

-- MT765 (17 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':23:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'No letter option or A',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':59a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':31L:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':22G:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':78:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '4!c<crlf>[50*65z]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':49A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '20*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':77:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':31E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':31R:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':56a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':23X:'
  AND spec_version = '2024';

-- MT767 (32 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = 'Empty field',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':15A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':27:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':22A:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6!a',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':23S:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':23X:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = 'Empty field',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':15B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '3n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':26E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':30:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':23:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':33B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':23B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':31E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 18,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':35G:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 19,
    swift_format = 'No letter option or A',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':59a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 20,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':77U:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 21,
    swift_format = '4!c[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':24E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 22,
    swift_format = '4!c<crlf>[12*65z]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':24G:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 23,
    swift_format = 'Empty field',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':15C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 24,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 25,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':33B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 26,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':23B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 27,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':31E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 28,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':35G:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 29,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':59:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 30,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':77L:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 31,
    swift_format = '4!c[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':24E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 32,
    swift_format = '4!c<crlf>[12*65z]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':24G:'
  AND spec_version = '2024';

-- MT768 (9 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':25:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':30:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'B or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':32a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':71D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':23X:'
  AND spec_version = '2024';

-- MT769 (12 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':25:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':30:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'B or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':32a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':33B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':34B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':39C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':71D:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':23X:'
  AND spec_version = '2024';

-- MT775 (7 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT775'
  AND field_code = ':27:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT775'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT775'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '3n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT775'
  AND field_code = ':26E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT775'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT775'
  AND field_code = ':77U:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT775'
  AND field_code = ':77L:'
  AND spec_version = '2024';

-- MT785 (10 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':31C:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'No letter option or A',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':59a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':56a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':57a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':31E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':23X:'
  AND spec_version = '2024';

-- MT786 (9 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':30:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':32B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '70*50z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':77J:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '3*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':77B:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':23X:'
  AND spec_version = '2024';

-- MT787 (7 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT787'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT787'
  AND field_code = ':21:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT787'
  AND field_code = ':52a:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '3n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT787'
  AND field_code = ':26E:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '4!c<crlf>[6*35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT787'
  AND field_code = ':23R:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT787'
  AND field_code = ':72Z:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT787'
  AND field_code = ':23X:'
  AND spec_version = '2024';

-- MT798 (3 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT798'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '3!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT798'
  AND field_code = ':12:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '73z<crlf>[n*145z]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT798'
  AND field_code = ':77E:'
  AND spec_version = '2024';

-- MT799 (2 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT799'
  AND field_code = ':20:'
  AND spec_version = '2024';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT799'
  AND field_code = ':21:'
  AND spec_version = '2024';

-- Total updates: 606

-- ==================================================
-- Migration: Fix SWIFT field display_order and swift_format
-- Source: Official SWIFT PDF Specifications 2025
-- Generated: 2026-02-18T09:36:52.152802
-- ==================================================

-- This migration corrects display_order to match the official
-- SWIFT PDF specification numbering (column 'No.' in Format Specifications)
-- and updates swift_format with the official Content/Options from the PDF.

-- MT400 (12 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A, B, or K',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':32a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':33A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':53a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':54a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':58a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':71B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':72:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT400'
  AND field_code = ':73:'
  AND spec_version = '2025';

-- MT410 (3 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT410'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT410'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A, B, or K',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT410'
  AND field_code = ':32a:'
  AND spec_version = '2025';

-- MT412 (3 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT412'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT412'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '6!n3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT412'
  AND field_code = ':32A:'
  AND spec_version = '2025';

-- MT416 (15 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '4!c[/30x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':23E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '[/1!a][/34x]<crlf>4!a2!a2!c[3!c]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':51A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'A or B',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':53a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':71F:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '20*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':77A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':21A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4!c[/30x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':23E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':21C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = 'A, B, or K',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':32a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '[/1!a][/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':50D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':59:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':71F:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = '20*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT416'
  AND field_code = ':77A:'
  AND spec_version = '2025';

-- MT420 (6 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT420'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT420'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A, B, or K',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT420'
  AND field_code = ':32a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT420'
  AND field_code = ':30:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT420'
  AND field_code = ':59:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT420'
  AND field_code = ':72:'
  AND spec_version = '2025';

-- MT422 (6 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT422'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT422'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A, B, or K',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT422'
  AND field_code = ':32a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT422'
  AND field_code = ':72:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT422'
  AND field_code = ':75:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT422'
  AND field_code = ':76:'
  AND spec_version = '2025';

-- MT430 (7 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT430'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT430'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A or K',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT430'
  AND field_code = ':32a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = 'A or K',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT430'
  AND field_code = ':33a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT430'
  AND field_code = ':59:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT430'
  AND field_code = ':72:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT430'
  AND field_code = ':74:'
  AND spec_version = '2025';

-- MT450 (7 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT450'
  AND field_code = ':25:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT450'
  AND field_code = ':72:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT450'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT450'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT450'
  AND field_code = ':30:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6!n3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT450'
  AND field_code = ':32A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT450'
  AND field_code = ':52a:'
  AND spec_version = '2025';

-- MT455 (8 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT455'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT455'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT455'
  AND field_code = ':25:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT455'
  AND field_code = ':30:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6!n3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT455'
  AND field_code = ':32A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'C or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT455'
  AND field_code = ':33a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT455'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '20*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT455'
  AND field_code = ':77A:'
  AND spec_version = '2025';

-- MT456 (11 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':25:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':72:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A or B',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':32a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6!n3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':33D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':71B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '20*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':77A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':77D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '6*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT456'
  AND field_code = ':72:'
  AND spec_version = '2025';

-- MT499 (2 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT499'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT499'
  AND field_code = ':21:'
  AND spec_version = '2025';

-- MT700 (39 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':27:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '24x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':40A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':23:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':31C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '30x[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':40E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6!n29x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':31D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':51a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':50:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':59:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '2n/2n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':39A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':39C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':41a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = '3*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':42C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':42a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':42M:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 18,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':42P:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 19,
    swift_format = '11x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':43P:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 20,
    swift_format = '11x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':43T:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 21,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':44A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 22,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':44E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 23,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':44F:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 24,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':44B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 25,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':44C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 26,
    swift_format = '6*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':44D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 27,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':45A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 28,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':46A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 29,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':47A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 30,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':49G:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 31,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':49H:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 32,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':71D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 33,
    swift_format = '3n[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':48:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 34,
    swift_format = '7!x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':49:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 35,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':58a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 36,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':53a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 37,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':78:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 38,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 39,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT700'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

-- MT701 (7 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT701'
  AND field_code = ':27:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT701'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT701'
  AND field_code = ':45A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT701'
  AND field_code = ':46A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT701'
  AND field_code = ':47A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT701'
  AND field_code = ':49G:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT701'
  AND field_code = ':49H:'
  AND spec_version = '2025';

-- MT705 (19 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '24x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':40A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '6!n29x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':31D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':50:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':59:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '2n/2n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':39A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':39C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':41a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':44A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':44E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':44F:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':44B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':44C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = '6*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':44D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':45A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 18,
    swift_format = '35*50z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':79Z:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 19,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT705'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

-- MT707 (47 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':27:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':23:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':50B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':31C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '3n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':26E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':30:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':22A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '6!a',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':23S:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '24x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':40A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '30x[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':40E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = '6!n29x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':31D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':50:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':59:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 18,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':33B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 19,
    swift_format = '2n/2n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':39A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 20,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':39C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 21,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':41a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 22,
    swift_format = '3*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':42C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 23,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':42a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 24,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':42M:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 25,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':42P:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 26,
    swift_format = '11x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':43P:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 27,
    swift_format = '11x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':43T:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 28,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':44A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 29,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':44E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 30,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':44F:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 31,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':44B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 32,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':44C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 33,
    swift_format = '6*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':44D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 34,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':45B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 35,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':46B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 36,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':47B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 37,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':49M:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 38,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':49N:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 39,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':71D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 40,
    swift_format = '4!c<crlf>[6*35z]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':71N:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 41,
    swift_format = '3n[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':48:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 42,
    swift_format = '7!x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':49:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 43,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':58a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 44,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':53a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 45,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':78:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 46,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 47,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT707'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

-- MT708 (11 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':27:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':23:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '3n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':26E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':30:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':45B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':46B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':47B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':49M:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT708'
  AND field_code = ':49N:'
  AND spec_version = '2025';

-- MT710 (43 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':27:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '24x<crlf>24x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':40B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':23:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':31C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '30x[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':40E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '6!n29x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':31D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':50B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':51a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':50:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':59:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = '2n/2n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':39A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':39C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':41a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 18,
    swift_format = '3*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':42C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 19,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':42a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 20,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':42M:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 21,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':42P:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 22,
    swift_format = '11x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':43P:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 23,
    swift_format = '11x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':43T:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 24,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':44A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 25,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':44E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 26,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':44F:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 27,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':44B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 28,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':44C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 29,
    swift_format = '6*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':44D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 30,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':45A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 31,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':46A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 32,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':47A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 33,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':49G:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 34,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':49H:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 35,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':71D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 36,
    swift_format = '3n[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':48:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 37,
    swift_format = '7!x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':49:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 38,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':58a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 39,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':53a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 40,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':78:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 41,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':78D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 42,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 43,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT710'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

-- MT711 (8 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT711'
  AND field_code = ':27:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT711'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT711'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT711'
  AND field_code = ':45A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT711'
  AND field_code = ':46A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT711'
  AND field_code = ':47A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT711'
  AND field_code = ':49G:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT711'
  AND field_code = ':49H:'
  AND spec_version = '2025';

-- MT720 (40 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':27:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '24x<crlf>24x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':40B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':31C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '30x[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':40E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6!n29x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':31D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':50B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':50:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':59:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '2n/2n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':39A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':39C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':41a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = '3*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':42C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':42a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 18,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':42M:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 19,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':42P:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 20,
    swift_format = '11x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':43P:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 21,
    swift_format = '11x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':43T:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 22,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':44A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 23,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':44E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 24,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':44F:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 25,
    swift_format = '140z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':44B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 26,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':44C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 27,
    swift_format = '6*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':44D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 28,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':45A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 29,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':46A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 30,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':47A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 31,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':49G:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 32,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':49H:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 33,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':71D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 34,
    swift_format = '3n[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':48:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 35,
    swift_format = '7!x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':49:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 36,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':58a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 37,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':78:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 38,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':78D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 39,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 40,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT720'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

-- MT721 (8 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT721'
  AND field_code = ':27:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT721'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT721'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT721'
  AND field_code = ':45A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT721'
  AND field_code = ':46A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT721'
  AND field_code = ':47A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT721'
  AND field_code = ':49G:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT721'
  AND field_code = ':49H:'
  AND spec_version = '2025';

-- MT730 (9 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':25:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':30:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'B or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':32a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':71D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '35*50z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT730'
  AND field_code = ':79Z:'
  AND spec_version = '2025';

-- MT732 (5 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT732'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT732'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT732'
  AND field_code = ':30:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT732'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT732'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

-- MT734 (9 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '6!n3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':32A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':73A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'A or B',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':33a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '70*50z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':77J:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '3*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT734'
  AND field_code = ':77B:'
  AND spec_version = '2025';

-- MT740 (17 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':25:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '30x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':40F:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n29x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':31D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':58a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':59:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '2n/2n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':39A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':39C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':41a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '3*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':42C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':42a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':42M:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':42P:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = '3!a',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':71A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':71D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT740'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

-- MT742 (11 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':31C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':33B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':71D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = 'A or B',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':34a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':58a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT742'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

-- MT744 (10 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':21A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':31C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A or B',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':34a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '4!c[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':73R:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '4!c[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':73S:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':71D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT744'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

-- MT747 (11 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':30:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':31E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':33B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':34B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '2n/2n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':39A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':39C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '20*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT747'
  AND field_code = ':77:'
  AND spec_version = '2025';

-- MT750 (10 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':33B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':71D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':73A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':34B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '70*50z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT750'
  AND field_code = ':77J:'
  AND spec_version = '2025';

-- MT752 (11 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':23:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':30:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':71D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = 'A or B',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':33a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':53a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':54a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '35*50z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT752'
  AND field_code = ':79Z:'
  AND spec_version = '2025';

-- MT754 (12 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A or B',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':32a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':33B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':71D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':73A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = 'A or B',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':34a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':53a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':58a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '20*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT754'
  AND field_code = ':77:'
  AND spec_version = '2025';

-- MT756 (8 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT756'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT756'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT756'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT756'
  AND field_code = ':33A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT756'
  AND field_code = ':53a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT756'
  AND field_code = ':54a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT756'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '35*50z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT756'
  AND field_code = ':79Z:'
  AND spec_version = '2025';

-- MT759 (9 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':27:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':22D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':23:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '8!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':23H:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':45D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT759'
  AND field_code = ':23X:'
  AND spec_version = '2025';

-- MT760 (69 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = 'Empty field',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':15A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':27:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':22A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':23X:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'Empty field',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':15B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':30:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':22D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '4!a[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':40C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':23B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':31E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':50:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':51:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = 'No letter option or A',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':59a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 18,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':56a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 19,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':23:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 20,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 21,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 22,
    swift_format = '12*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':39F:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 23,
    swift_format = 'F or G',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':41a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 24,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':71D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 25,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':45C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 26,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':77U:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 27,
    swift_format = '7!x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':49:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 28,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':58a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 29,
    swift_format = '2!a[/35x]<crlf><crlf>[/65x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':44J:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 30,
    swift_format = '4!a[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':23F:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 31,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':78:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 32,
    swift_format = '3n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':26E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 33,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':31S:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 34,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':48B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 35,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':48D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 36,
    swift_format = '12*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':39E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 37,
    swift_format = '50*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':45L:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 38,
    swift_format = '4!c[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':24E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 40,
    swift_format = 'Empty field',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':15C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 41,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':31C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 42,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':22D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 43,
    swift_format = '4!a[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':40C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 44,
    swift_format = '4!c[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':22K:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 45,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':23B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 46,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':31E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 47,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':35G:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 48,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':50:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 49,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':51:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 50,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 51,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':59:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 52,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 53,
    swift_format = '12*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':39F:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 54,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 55,
    swift_format = 'F or G',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':41a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 56,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':71D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 57,
    swift_format = '100*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':45C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 58,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':77L:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 59,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':22Y:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 60,
    swift_format = '2!a',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':40D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 61,
    swift_format = '2!a[/35x]<crlf><crlf>[/65x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':44J:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 62,
    swift_format = '4!a[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':23F:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 63,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':78:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 64,
    swift_format = '3n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':26E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 65,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':31S:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 66,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':48B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 67,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':48D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 68,
    swift_format = '12*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':39E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 69,
    swift_format = '50*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':45L:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 70,
    swift_format = '4!c[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':24E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 71,
    swift_format = '4!c<crlf>[12*65z]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT760'
  AND field_code = ':24G:'
  AND spec_version = '2025';

-- MT761 (5 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT761'
  AND field_code = ':27:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT761'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT761'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT761'
  AND field_code = ':77U:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT761'
  AND field_code = ':77L:'
  AND spec_version = '2025';

-- MT765 (17 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':23:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'No letter option or A',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':59a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':31L:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':22G:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':78:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '4!c<crlf>[50*65z]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':49A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '20*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':77:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':31E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':31R:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':56a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT765'
  AND field_code = ':23X:'
  AND spec_version = '2025';

-- MT767 (32 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = 'Empty field',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':15A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':27:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':22A:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '6!a',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':23S:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':23X:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = 'Empty field',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':15B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '3n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':26E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':30:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 13,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':23:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 14,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 15,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':33B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 16,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':23B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 17,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':31E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 18,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':35G:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 19,
    swift_format = 'No letter option or A',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':59a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 20,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':77U:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 21,
    swift_format = '4!c[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':24E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 22,
    swift_format = '4!c<crlf>[12*65z]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':24G:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 23,
    swift_format = 'Empty field',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':15C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 24,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 25,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':33B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 26,
    swift_format = '4!c',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':23B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 27,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':31E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 28,
    swift_format = '12*65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':35G:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 29,
    swift_format = '[/34x]<crlf>4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':59:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 30,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':77L:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 31,
    swift_format = '4!c[/35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':24E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 32,
    swift_format = '4!c<crlf>[12*65z]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT767'
  AND field_code = ':24G:'
  AND spec_version = '2025';

-- MT768 (9 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':25:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':30:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'B or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':32a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':71D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT768'
  AND field_code = ':23X:'
  AND spec_version = '2025';

-- MT769 (12 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':25:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':30:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'B or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':32a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':33B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':34B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '4*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':39C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = 'A, B, or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':71D:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 11,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 12,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT769'
  AND field_code = ':23X:'
  AND spec_version = '2025';

-- MT775 (7 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '1!n/1!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT775'
  AND field_code = ':27:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT775'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT775'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '3n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT775'
  AND field_code = ':26E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT775'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT775'
  AND field_code = ':77U:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '150*65z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT775'
  AND field_code = ':77L:'
  AND spec_version = '2025';

-- MT785 (10 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':31C:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = 'No letter option or A',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':59a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':56a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':57a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':31E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 10,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT785'
  AND field_code = ':23X:'
  AND spec_version = '2025';

-- MT786 (9 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '6!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':30:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '3!a15d',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':32B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '70*50z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':77J:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '3*35x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':77B:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 8,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 9,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT786'
  AND field_code = ':23X:'
  AND spec_version = '2025';

-- MT787 (7 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT787'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT787'
  AND field_code = ':21:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = 'A or D',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT787'
  AND field_code = ':52a:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 4,
    swift_format = '3n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT787'
  AND field_code = ':26E:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 5,
    swift_format = '4!c<crlf>[6*35x]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT787'
  AND field_code = ':23R:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 6,
    swift_format = '6*35z',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT787'
  AND field_code = ':72Z:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 7,
    swift_format = '4!c/65x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT787'
  AND field_code = ':23X:'
  AND spec_version = '2025';

-- MT798 (3 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT798'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '3!n',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT798'
  AND field_code = ':12:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 3,
    swift_format = '73z<crlf>[n*145z]',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT798'
  AND field_code = ':77E:'
  AND spec_version = '2025';

-- MT799 (2 fields)
-- ============================================================

UPDATE swift_field_config_readmodel
SET display_order = 1,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT799'
  AND field_code = ':20:'
  AND spec_version = '2025';

UPDATE swift_field_config_readmodel
SET display_order = 2,
    swift_format = '16x',
    updated_at = NOW(),
    updated_by = 'SWIFT_PDF_PARSER'
WHERE message_type = 'MT799'
  AND field_code = ':21:'
  AND spec_version = '2025';

-- Total updates: 606