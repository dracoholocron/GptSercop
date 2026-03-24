-- =====================================================
-- V153: Fix MT760 field types for SELECT fields
-- =====================================================
-- All fields that "must contain one of the following codes"
-- should be SELECT dropdowns, not TEXT inputs
-- =====================================================

-- ===========================================
-- MT760 SELECT FIELDS
-- ===========================================

-- :22A: Purpose of Message - ISSU (Issuance), AMND (Amendment), CANC (Cancellation), REDU (Reduction)
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'SELECT',
    validation_rules = '{"options": [{"value": "ISSU", "label": "ISSU - Issuance"}, {"value": "AMND", "label": "AMND - Amendment"}, {"value": "CANC", "label": "CANC - Cancellation"}, {"value": "REDU", "label": "REDU - Reduction"}], "required": true}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':22A:'
  AND message_type = 'MT760';

-- :22D: Form of Undertaking - DGAR (Demand Guarantee), SGAR (Standby)
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'SELECT',
    validation_rules = '{"options": [{"value": "DGAR", "label": "DGAR - Demand Guarantee"}, {"value": "SGAR", "label": "SGAR - Standby Letter of Credit"}], "required": true}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':22D:'
  AND message_type = 'MT760';

-- :22K: Type of Undertaking
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'SELECT',
    validation_rules = '{"options": [{"value": "ADVP", "label": "ADVP - Advance Payment"}, {"value": "BIDE", "label": "BIDE - Bid/Tender"}, {"value": "CUST", "label": "CUST - Customs"}, {"value": "FINA", "label": "FINA - Financial"}, {"value": "INSU", "label": "INSU - Insurance"}, {"value": "MANT", "label": "MANT - Maintenance"}, {"value": "OTHR", "label": "OTHR - Other"}, {"value": "PAYM", "label": "PAYM - Payment"}, {"value": "PERF", "label": "PERF - Performance"}, {"value": "RETN", "label": "RETN - Retention"}, {"value": "SHIP", "label": "SHIP - Shipping"}, {"value": "TAXS", "label": "TAXS - Tax"}, {"value": "WARR", "label": "WARR - Warranty"}], "required": false}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':22K:'
  AND message_type = 'MT760';

-- :22Y: Extended Type of Undertaking (narrative with type)
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'INPUT',
    validation_rules = '{"maxLength": 35}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':22Y:'
  AND message_type = 'MT760';

-- :23B: Expiry Type - COND (Conditional), DATE (Fixed Date), OPEN (Open-ended)
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'SELECT',
    validation_rules = '{"options": [{"value": "COND", "label": "COND - Conditional/Event"}, {"value": "DATE", "label": "DATE - Fixed Date"}, {"value": "OPEN", "label": "OPEN - Open-ended"}], "required": true}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':23B:'
  AND message_type = 'MT760';

-- :23F: Presentation Instructions
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'SELECT',
    validation_rules = '{"options": [{"value": "MAIL", "label": "MAIL - By Mail"}, {"value": "BKRQ", "label": "BKRQ - By Bank Request"}, {"value": "ELEC", "label": "ELEC - Electronic"}, {"value": "SWIF", "label": "SWIF - SWIFT"}, {"value": "TLXF", "label": "TLXF - Telex"}], "required": false}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':23F:'
  AND message_type = 'MT760';

-- :23X: File Identification (first code + narrative)
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'INPUT',
    validation_rules = '{"maxLength": 65}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':23X:'
  AND message_type = 'MT760';

-- :24E: Delivery Channel
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'SELECT',
    validation_rules = '{"options": [{"value": "COUR", "label": "COUR - Courier"}, {"value": "FAXI", "label": "FAXI - Fax"}, {"value": "MAIL", "label": "MAIL - Mail"}, {"value": "SWIF", "label": "SWIF - SWIFT"}, {"value": "TLXF", "label": "TLXF - Telex"}], "required": false}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':24E:'
  AND message_type = 'MT760';

-- :24G: Delivery Method
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'SELECT',
    validation_rules = '{"options": [{"value": "COPY", "label": "COPY - Copy"}, {"value": "ORIG", "label": "ORIG - Original"}], "required": false}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':24G:'
  AND message_type = 'MT760';

-- :26E: Number of Days for Response
UPDATE swift_field_config_readmodel
SET
    field_type = 'NUMBER',
    component_type = 'INPUT',
    validation_rules = '{"minValue": 1, "maxValue": 999}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':26E:'
  AND message_type = 'MT760';

-- :39E: Amount Tolerance (percentage plus/minus)
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'INPUT',
    validation_rules = '{"pattern": "^[0-9]{1,2}/[0-9]{1,2}$", "placeholder": "Plus/Minus e.g. 10/10"}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':39E:'
  AND message_type = 'MT760';

-- :39F: Quantity Tolerance
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'INPUT',
    validation_rules = '{"pattern": "^[0-9]{1,2}/[0-9]{1,2}$", "placeholder": "Plus/Minus e.g. 5/5"}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':39F:'
  AND message_type = 'MT760';

-- :40C: Applicable Rules
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'SELECT',
    validation_rules = '{"options": [{"value": "EUCP", "label": "EUCP - eUCP"}, {"value": "EUCPURR", "label": "EUCPURR - eUCP + URR"}, {"value": "ISP98", "label": "ISP98 - ISP98"}, {"value": "ISPR", "label": "ISPR - ISP98 + URR"}, {"value": "NONE", "label": "NONE - No Rules"}, {"value": "OTHR", "label": "OTHR - Other Rules"}, {"value": "URDG", "label": "URDG - URDG 758"}, {"value": "URCG", "label": "URCG - URR 725"}], "required": false}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':40C:'
  AND message_type = 'MT760';

-- :40D: Applicable Rules Narrative - should be TEXTAREA
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXTAREA',
    component_type = 'TEXTAREA',
    validation_rules = '{"maxLength": 780}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':40D:'
  AND message_type = 'MT760';

-- :41a: Available With... By...
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'SELECT',
    validation_rules = '{"options": [{"value": "ACCP", "label": "ACCP - By Acceptance"}, {"value": "DEFP", "label": "DEFP - By Deferred Payment"}, {"value": "MIXP", "label": "MIXP - By Mixed Payment"}, {"value": "NEPA", "label": "NEPA - By Negotiation, Any Bank"}, {"value": "NEPR", "label": "NEPR - By Negotiation, Restricted"}, {"value": "PAYM", "label": "PAYM - By Payment"}], "required": false}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':41a:'
  AND message_type = 'MT760';

-- :44J: Place of Presentation
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'INPUT',
    validation_rules = '{"maxLength": 65}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':44J:'
  AND message_type = 'MT760';

-- :48B: Period of Presentation in Days
UPDATE swift_field_config_readmodel
SET
    field_type = 'NUMBER',
    component_type = 'INPUT',
    validation_rules = '{"minValue": 1, "maxValue": 999}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':48B:'
  AND message_type = 'MT760';

-- :48D: Period of Presentation Narrative
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXTAREA',
    component_type = 'TEXTAREA',
    validation_rules = '{"maxLength": 390}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':48D:'
  AND message_type = 'MT760';

-- :49: Confirmation Instructions
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'SELECT',
    validation_rules = '{"options": [{"value": "CONFIRM", "label": "CONFIRM - Confirm"}, {"value": "WITHOUT", "label": "WITHOUT - Without"}, {"value": "MAY ADD", "label": "MAY ADD - May Add"}], "required": false}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':49:'
  AND message_type = 'MT760';

-- :52a: Issuer
UPDATE swift_field_config_readmodel
SET
    field_type = 'INSTITUTION',
    component_type = 'BANK_SELECTOR',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':52a:'
  AND message_type = 'MT760';

-- :59a: Beneficiary (already TEXTAREA in original, but let's ensure)
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXTAREA',
    component_type = 'TEXTAREA',
    validation_rules = '{"maxLength": 140}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':59a:'
  AND message_type = 'MT760'
  AND component_type = 'INPUT';

-- ===========================================
-- MT707 SELECT FIELDS (Amendment)
-- ===========================================

-- :22A: Purpose of Message for MT707
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'SELECT',
    validation_rules = '{"options": [{"value": "AMND", "label": "AMND - Amendment"}, {"value": "CANC", "label": "CANC - Cancellation"}], "required": true}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':22A:'
  AND message_type = 'MT707';

-- ===========================================
-- MT767 SELECT FIELDS (Guarantee Amendment)
-- ===========================================

-- :22A: Purpose of Message for MT767
UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'SELECT',
    validation_rules = '{"options": [{"value": "AMND", "label": "AMND - Amendment"}, {"value": "CANC", "label": "CANC - Cancellation"}, {"value": "REDU", "label": "REDU - Reduction"}], "required": true}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code = ':22A:'
  AND message_type = 'MT767';

-- ===========================================
-- FIX ALL :15x: SEQUENCE MARKERS
-- ===========================================
-- Sequence markers (15A, 15B, 15C) should be hidden or just labels
-- They don't need user input

UPDATE swift_field_config_readmodel
SET
    field_type = 'TEXT',
    component_type = 'LABEL',
    is_required = 0,
    validation_rules = '{}',
    updated_at = NOW(),
    updated_by = 'V153_FIX_SELECT_TYPES'
WHERE field_code IN (':15A:', ':15B:', ':15C:', ':15D:', ':15E:')
  AND message_type = 'MT760';

-- ===========================================
-- Verify the updates
-- ===========================================
SELECT field_code, field_type, component_type,
       LEFT(validation_rules, 100) as validation_preview
FROM swift_field_config_readmodel
WHERE field_code IN (':22A:', ':22D:', ':22K:', ':23B:', ':40C:', ':41a:', ':49:')
  AND message_type = 'MT760'
  AND is_active = 1
ORDER BY field_code;
