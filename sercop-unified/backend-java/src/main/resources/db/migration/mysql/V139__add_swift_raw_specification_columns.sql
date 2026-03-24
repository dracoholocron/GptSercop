-- ==================================================
-- Migration V139: Add SWIFT Raw Specification Columns
-- ==================================================
-- Adds columns to store the exact SWIFT specification data
-- including format specifications, official status, and documentation.
--
-- Purpose: Allow users to see both:
-- - The exact SWIFT specification (raw from standard)
-- - The system's converted/interpreted values
-- ==================================================

-- Step 1: Add raw specification columns (idempotent)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND COLUMN_NAME = 'swift_format');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE swift_field_config_readmodel ADD COLUMN swift_format VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND COLUMN_NAME = 'swift_status');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE swift_field_config_readmodel ADD COLUMN swift_status CHAR(1) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND COLUMN_NAME = 'swift_definition_en');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE swift_field_config_readmodel ADD COLUMN swift_definition_en TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND COLUMN_NAME = 'swift_usage_notes');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE swift_field_config_readmodel ADD COLUMN swift_usage_notes TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Add index for swift_status for filtering (idempotent)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'swift_field_config_readmodel' AND INDEX_NAME = 'idx_sfc_swift_status');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_sfc_swift_status ON swift_field_config_readmodel(swift_status, message_type, spec_version)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ==================================================
-- Step 3: Update existing 2024 specification data
-- ==================================================

-- :27: Sequence of Total
UPDATE swift_field_config_readmodel
SET swift_format = '1!n/1!n',
    swift_status = 'M',
    swift_definition_en = 'Sequence of Total - Number of this message in a series of related messages / total number of messages in the series'
WHERE field_code = ':27:' AND message_type = 'MT700' AND spec_version = '2024';

-- :40A: Form of Documentary Credit
UPDATE swift_field_config_readmodel
SET swift_format = '24x',
    swift_status = 'M',
    swift_definition_en = 'Form of Documentary Credit - Code identifying the form of documentary credit (IRREVOCABLE, REVOCABLE, etc.)'
WHERE field_code = ':40A:' AND message_type = 'MT700' AND spec_version = '2024';

-- :20: Documentary Credit Number
UPDATE swift_field_config_readmodel
SET swift_format = '16x',
    swift_status = 'M',
    swift_definition_en = 'Documentary Credit Number - Reference number assigned by the issuing bank'
WHERE field_code = ':20:' AND message_type = 'MT700' AND spec_version = '2024';

-- :23: Reference to Pre-Advice
UPDATE swift_field_config_readmodel
SET swift_format = '16x',
    swift_status = 'O',
    swift_definition_en = 'Reference to Pre-Advice - Reference to any pre-advice of the documentary credit'
WHERE field_code = ':23:' AND message_type = 'MT700' AND spec_version = '2024';

-- :31C: Date of Issue
UPDATE swift_field_config_readmodel
SET swift_format = '6!n',
    swift_status = 'M',
    swift_definition_en = 'Date of Issue - Date on which the documentary credit was issued (YYMMDD)'
WHERE field_code = ':31C:' AND message_type = 'MT700' AND spec_version = '2024';

-- :40E: Applicable Rules
UPDATE swift_field_config_readmodel
SET swift_format = '30x[/35x]',
    swift_status = 'M',
    swift_definition_en = 'Applicable Rules - Code and optionally narrative indicating the rules applicable to the documentary credit'
WHERE field_code = ':40E:' AND message_type = 'MT700' AND spec_version = '2024';

-- :31D: Date and Place of Expiry
UPDATE swift_field_config_readmodel
SET swift_format = '6!n29x',
    swift_status = 'M',
    swift_definition_en = 'Date and Place of Expiry - Date (YYMMDD) and place where the credit expires'
WHERE field_code = ':31D:' AND message_type = 'MT700' AND spec_version = '2024';

-- :51a: Applicant Bank
UPDATE swift_field_config_readmodel
SET swift_format = 'A or D',
    swift_status = 'O',
    swift_definition_en = 'Applicant Bank - BIC or name/address of the bank of the applicant',
    swift_usage_notes = 'Option A: [/1!a][/34x]4!a2!a2!c[3!c] | Option D: [/1!a][/34x]4*35x'
WHERE field_code = ':51a:' AND message_type = 'MT700' AND spec_version = '2024';

-- :50: Applicant (2024 version - will be deprecated in 2026)
UPDATE swift_field_config_readmodel
SET swift_format = '4*35x',
    swift_status = 'M',
    swift_definition_en = 'Applicant - Name and address of the party on whose request the documentary credit is issued'
WHERE field_code = ':50:' AND message_type = 'MT700' AND spec_version = '2024';

-- :59: Beneficiary (2024 version - will be deprecated in 2026)
UPDATE swift_field_config_readmodel
SET swift_format = '[/34x]4*35x',
    swift_status = 'M',
    swift_definition_en = 'Beneficiary - Account number (optional) and name/address of the beneficiary'
WHERE field_code = ':59:' AND message_type = 'MT700' AND spec_version = '2024';

-- :32B: Currency Code, Amount
UPDATE swift_field_config_readmodel
SET swift_format = '3!a15d',
    swift_status = 'M',
    swift_definition_en = 'Currency Code, Amount - 3-letter ISO currency code followed by the amount'
WHERE field_code = ':32B:' AND message_type = 'MT700' AND spec_version = '2024';

-- :39A: Percentage Credit Amount Tolerance
UPDATE swift_field_config_readmodel
SET swift_format = '2n/2n',
    swift_status = 'O',
    swift_definition_en = 'Percentage Credit Amount Tolerance - Positive/negative tolerance percentage for the credit amount'
WHERE field_code = ':39A:' AND message_type = 'MT700' AND spec_version = '2024';

-- :39C: Additional Amounts Covered
UPDATE swift_field_config_readmodel
SET swift_format = '4*35x',
    swift_status = 'O',
    swift_definition_en = 'Additional Amounts Covered - Description of any additional amounts covered by the credit'
WHERE field_code = ':39C:' AND message_type = 'MT700' AND spec_version = '2024';

-- :41a: Available With ... By ...
UPDATE swift_field_config_readmodel
SET swift_format = 'A or D',
    swift_status = 'M',
    swift_definition_en = 'Available With ... By ... - BIC or name/address of the bank with which the credit is available and type of availability',
    swift_usage_notes = 'Option A: 4!a2!a2!c[3!c]14x | Option D: 4*35x14x'
WHERE field_code = ':41a:' AND message_type = 'MT700' AND spec_version = '2024';

-- :42C: Drafts at ...
UPDATE swift_field_config_readmodel
SET swift_format = '3*35x',
    swift_status = 'O',
    swift_definition_en = 'Drafts at ... - Tenor details of drafts to be drawn under the credit'
WHERE field_code = ':42C:' AND message_type = 'MT700' AND spec_version = '2024';

-- :42a: Drawee
UPDATE swift_field_config_readmodel
SET swift_format = 'A or D',
    swift_status = 'O',
    swift_definition_en = 'Drawee - BIC or name/address of the drawee bank',
    swift_usage_notes = 'Option A: [/1!a][/34x]4!a2!a2!c[3!c] | Option D: [/1!a][/34x]4*35x'
WHERE field_code = ':42a:' AND message_type = 'MT700' AND spec_version = '2024';

-- :42M: Mixed Payment Details
UPDATE swift_field_config_readmodel
SET swift_format = '4*35x',
    swift_status = 'O',
    swift_definition_en = 'Mixed Payment Details - Details when payment is to be made partly by acceptance and partly by negotiation/deferred payment'
WHERE field_code = ':42M:' AND message_type = 'MT700' AND spec_version = '2024';

-- :42P: Negotiation/Deferred Payment Details
UPDATE swift_field_config_readmodel
SET swift_format = '4*35x',
    swift_status = 'O',
    swift_definition_en = 'Negotiation/Deferred Payment Details - Terms of the deferred payment or negotiation'
WHERE field_code = ':42P:' AND message_type = 'MT700' AND spec_version = '2024';

-- :43P: Partial Shipments
UPDATE swift_field_config_readmodel
SET swift_format = '11x',
    swift_status = 'O',
    swift_definition_en = 'Partial Shipments - Indicates whether partial shipments are allowed or not (ALLOWED/NOT ALLOWED)'
WHERE field_code = ':43P:' AND message_type = 'MT700' AND spec_version = '2024';

-- :43T: Transhipment
UPDATE swift_field_config_readmodel
SET swift_format = '11x',
    swift_status = 'O',
    swift_definition_en = 'Transhipment - Indicates whether transhipment is allowed or not (ALLOWED/NOT ALLOWED)'
WHERE field_code = ':43T:' AND message_type = 'MT700' AND spec_version = '2024';

-- :44A: Place of Taking in Charge/Dispatch from .../Place of Receipt
UPDATE swift_field_config_readmodel
SET swift_format = '140z',
    swift_status = 'O',
    swift_definition_en = 'Place of Taking in Charge/Dispatch from .../Place of Receipt - Place where goods are to be taken in charge or dispatched'
WHERE field_code = ':44A:' AND message_type = 'MT700' AND spec_version = '2024';

-- :44E: Port of Loading/Airport of Departure
UPDATE swift_field_config_readmodel
SET swift_format = '140z',
    swift_status = 'O',
    swift_definition_en = 'Port of Loading/Airport of Departure - Port of loading or airport of departure'
WHERE field_code = ':44E:' AND message_type = 'MT700' AND spec_version = '2024';

-- :44F: Port of Discharge/Airport of Destination
UPDATE swift_field_config_readmodel
SET swift_format = '140z',
    swift_status = 'O',
    swift_definition_en = 'Port of Discharge/Airport of Destination - Port of discharge or airport of destination'
WHERE field_code = ':44F:' AND message_type = 'MT700' AND spec_version = '2024';

-- :44B: Place of Final Destination/For Transportation to .../Place of Delivery
UPDATE swift_field_config_readmodel
SET swift_format = '140z',
    swift_status = 'O',
    swift_definition_en = 'Place of Final Destination/For Transportation to .../Place of Delivery - Final destination of goods'
WHERE field_code = ':44B:' AND message_type = 'MT700' AND spec_version = '2024';

-- :44C: Latest Date of Shipment
UPDATE swift_field_config_readmodel
SET swift_format = '6!n',
    swift_status = 'O',
    swift_definition_en = 'Latest Date of Shipment - Latest date by which shipment must be effected (YYMMDD)'
WHERE field_code = ':44C:' AND message_type = 'MT700' AND spec_version = '2024';

-- :44D: Shipment Period
UPDATE swift_field_config_readmodel
SET swift_format = '6*65x',
    swift_status = 'O',
    swift_definition_en = 'Shipment Period - Period during which shipment is to be effected'
WHERE field_code = ':44D:' AND message_type = 'MT700' AND spec_version = '2024';

-- :45A: Description of Goods and/or Services
UPDATE swift_field_config_readmodel
SET swift_format = '100*65z',
    swift_status = 'O',
    swift_definition_en = 'Description of Goods and/or Services - Full description of goods and/or services'
WHERE field_code = ':45A:' AND message_type = 'MT700' AND spec_version = '2024';

-- :46A: Documents Required
UPDATE swift_field_config_readmodel
SET swift_format = '100*65z',
    swift_status = 'O',
    swift_definition_en = 'Documents Required - List of documents required to be presented'
WHERE field_code = ':46A:' AND message_type = 'MT700' AND spec_version = '2024';

-- :47A: Additional Conditions
UPDATE swift_field_config_readmodel
SET swift_format = '100*65z',
    swift_status = 'O',
    swift_definition_en = 'Additional Conditions - Any additional conditions not covered elsewhere'
WHERE field_code = ':47A:' AND message_type = 'MT700' AND spec_version = '2024';

-- :49G: Special Payment Conditions for Beneficiary
UPDATE swift_field_config_readmodel
SET swift_format = '100*65z',
    swift_status = 'O',
    swift_definition_en = 'Special Payment Conditions for Beneficiary - Special conditions applicable to payment to the beneficiary'
WHERE field_code = ':49G:' AND message_type = 'MT700' AND spec_version = '2024';

-- :49H: Special Payment Conditions for Bank Only
UPDATE swift_field_config_readmodel
SET swift_format = '100*65z',
    swift_status = 'O',
    swift_definition_en = 'Special Payment Conditions for Bank Only - Special conditions applicable to bank only'
WHERE field_code = ':49H:' AND message_type = 'MT700' AND spec_version = '2024';

-- :71D: Charges
UPDATE swift_field_config_readmodel
SET swift_format = '6*35z',
    swift_status = 'O',
    swift_definition_en = 'Charges - Details of charges applicable to the credit'
WHERE field_code = ':71D:' AND message_type = 'MT700' AND spec_version = '2024';

-- :48: Period for Presentation in Days
UPDATE swift_field_config_readmodel
SET swift_format = '3n[/35x]',
    swift_status = 'O',
    swift_definition_en = 'Period for Presentation in Days - Number of days after shipment date for presentation'
WHERE field_code = ':48:' AND message_type = 'MT700' AND spec_version = '2024';

-- :49: Confirmation Instructions
UPDATE swift_field_config_readmodel
SET swift_format = '7!x',
    swift_status = 'M',
    swift_definition_en = 'Confirmation Instructions - Code for confirmation instructions (CONFIRM, MAY ADD, WITHOUT)'
WHERE field_code = ':49:' AND message_type = 'MT700' AND spec_version = '2024';

-- :58a: Requested Confirmation Party
UPDATE swift_field_config_readmodel
SET swift_format = 'A or D',
    swift_status = 'O',
    swift_definition_en = 'Requested Confirmation Party - BIC or name/address of the requested confirming bank',
    swift_usage_notes = 'Option A: [/1!a][/34x]4!a2!a2!c[3!c] | Option D: [/1!a][/34x]4*35x'
WHERE field_code = ':58a:' AND message_type = 'MT700' AND spec_version = '2024';

-- :53a: Reimbursing Bank
UPDATE swift_field_config_readmodel
SET swift_format = 'A or D',
    swift_status = 'O',
    swift_definition_en = 'Reimbursing Bank - BIC or name/address of the reimbursing bank',
    swift_usage_notes = 'Option A: [/1!a][/34x]4!a2!a2!c[3!c] | Option D: [/1!a][/34x]4*35x'
WHERE field_code = ':53a:' AND message_type = 'MT700' AND spec_version = '2024';

-- :78: Instructions to the Paying/Accepting/Negotiating Bank (2024 - will become :78K: in 2026)
UPDATE swift_field_config_readmodel
SET swift_format = '12*65x',
    swift_status = 'O',
    swift_definition_en = 'Instructions to the Paying/Accepting/Negotiating Bank - Instructions to the bank handling the credit'
WHERE field_code = ':78:' AND message_type = 'MT700' AND spec_version = '2024';

-- :57a: 'Advise Through' Bank
UPDATE swift_field_config_readmodel
SET swift_format = 'A, B, or D',
    swift_status = 'O',
    swift_definition_en = '''Advise Through'' Bank - BIC or name/address of the bank through which the credit is to be advised',
    swift_usage_notes = 'Option A: [/1!a][/34x]4!a2!a2!c[3!c] | Option B: [/1!a][/34x][35x] | Option D: [/1!a][/34x]4*35x'
WHERE field_code = ':57a:' AND message_type = 'MT700' AND spec_version = '2024';

-- :72Z: Sender to Receiver Information
UPDATE swift_field_config_readmodel
SET swift_format = '6*35z',
    swift_status = 'O',
    swift_definition_en = 'Sender to Receiver Information - Additional information from sender to receiver'
WHERE field_code = ':72Z:' AND message_type = 'MT700' AND spec_version = '2024';

-- ==================================================
-- Step 4: Update 2026 specification data with new formats
-- ==================================================

-- New Applicant Sequence A fields (2026)
UPDATE swift_field_config_readmodel
SET swift_format = '4*35z',
    swift_status = 'M',
    swift_definition_en = 'Applicant Name - Name of the applicant (new structured format for 2026)'
WHERE field_code = ':50N:' AND message_type = 'MT700' AND spec_version = '2026';

UPDATE swift_field_config_readmodel
SET swift_format = '4*35z',
    swift_status = 'M',
    swift_definition_en = 'Applicant Address - Street address of the applicant'
WHERE field_code = ':50S:' AND message_type = 'MT700' AND spec_version = '2026';

UPDATE swift_field_config_readmodel
SET swift_format = '35z',
    swift_status = 'M',
    swift_definition_en = 'Applicant Town/City/State - Town, city, or state of the applicant'
WHERE field_code = ':50T:' AND message_type = 'MT700' AND spec_version = '2026';

UPDATE swift_field_config_readmodel
SET swift_format = '16z',
    swift_status = 'O',
    swift_definition_en = 'Applicant Post Code - Postal code of the applicant (highly recommended when known)'
WHERE field_code = ':50P:' AND message_type = 'MT700' AND spec_version = '2026';

UPDATE swift_field_config_readmodel
SET swift_format = '2!a',
    swift_status = 'M',
    swift_definition_en = 'Applicant Country - ISO 3166 two-letter country code'
WHERE field_code = ':50R:' AND message_type = 'MT700' AND spec_version = '2026';

-- New Beneficiary Sequence B fields (2026)
UPDATE swift_field_config_readmodel
SET swift_format = '4*35z',
    swift_status = 'M',
    swift_definition_en = 'Beneficiary Name - Name of the beneficiary (new structured format for 2026)'
WHERE field_code = ':59N:' AND message_type = 'MT700' AND spec_version = '2026';

UPDATE swift_field_config_readmodel
SET swift_format = '4*35z',
    swift_status = 'M',
    swift_definition_en = 'Beneficiary Address - Street address of the beneficiary'
WHERE field_code = ':59S:' AND message_type = 'MT700' AND spec_version = '2026';

UPDATE swift_field_config_readmodel
SET swift_format = '35z',
    swift_status = 'M',
    swift_definition_en = 'Beneficiary Town/City/State - Town, city, or state of the beneficiary'
WHERE field_code = ':59T:' AND message_type = 'MT700' AND spec_version = '2026';

UPDATE swift_field_config_readmodel
SET swift_format = '16z',
    swift_status = 'O',
    swift_definition_en = 'Beneficiary Post Code - Postal code of the beneficiary (highly recommended when known)'
WHERE field_code = ':59P:' AND message_type = 'MT700' AND spec_version = '2026';

UPDATE swift_field_config_readmodel
SET swift_format = '2!a',
    swift_status = 'M',
    swift_definition_en = 'Beneficiary Country - ISO 3166 two-letter country code'
WHERE field_code = ':59R:' AND message_type = 'MT700' AND spec_version = '2026';

-- New field 44I: Incoterms (2026)
UPDATE swift_field_config_readmodel
SET swift_format = '3!a[2*70z]',
    swift_status = 'O',
    swift_definition_en = 'Incoterms - 3-letter Incoterms code with optional delivery location details'
WHERE field_code = ':44I:' AND message_type = 'MT700' AND spec_version = '2026';

-- New field 45H: HS Code (2026)
UPDATE swift_field_config_readmodel
SET swift_format = '65x',
    swift_status = 'O',
    swift_definition_en = 'HS Code - Harmonized System code for goods classification'
WHERE field_code = ':45H:' AND message_type = 'MT700' AND spec_version = '2026';

-- Updated field 78K (formerly 78) - 2026
UPDATE swift_field_config_readmodel
SET swift_format = '30*65z',
    swift_status = 'O',
    swift_definition_en = 'Instructions to the Paying/Accepting/Negotiating Bank - Instructions to the bank handling the credit (expanded from 12*65x in 2024)'
WHERE field_code = ':78K:' AND message_type = 'MT700' AND spec_version = '2026';

-- Updated format fields for 2026 (140z -> 2*70z)
UPDATE swift_field_config_readmodel
SET swift_format = '2*70z',
    swift_status = 'O',
    swift_definition_en = 'Place of Taking in Charge/Dispatch from .../Place of Receipt - Place where goods are to be taken in charge or dispatched (format changed from 140z to 2*70z in 2026)'
WHERE field_code = ':44A:' AND message_type = 'MT700' AND spec_version = '2026';

UPDATE swift_field_config_readmodel
SET swift_format = '2*70z',
    swift_status = 'O',
    swift_definition_en = 'Port of Loading/Airport of Departure - Port of loading or airport of departure (format changed from 140z to 2*70z in 2026)'
WHERE field_code = ':44E:' AND message_type = 'MT700' AND spec_version = '2026';

UPDATE swift_field_config_readmodel
SET swift_format = '2*70z',
    swift_status = 'O',
    swift_definition_en = 'Port of Discharge/Airport of Destination - Port of discharge or airport of destination (format changed from 140z to 2*70z in 2026)'
WHERE field_code = ':44F:' AND message_type = 'MT700' AND spec_version = '2026';

UPDATE swift_field_config_readmodel
SET swift_format = '2*70z',
    swift_status = 'O',
    swift_definition_en = 'Place of Final Destination/For Transportation to .../Place of Delivery - Final destination of goods (format changed from 140z to 2*70z in 2026)'
WHERE field_code = ':44B:' AND message_type = 'MT700' AND spec_version = '2026';

-- Updated format for :42C: (3*35x -> 3*35z in 2026)
UPDATE swift_field_config_readmodel
SET swift_format = '3*35z',
    swift_status = 'O',
    swift_definition_en = 'Drafts at ... - Tenor details of drafts to be drawn under the credit (format changed from 3*35x to 3*35z in 2026)'
WHERE field_code = ':42C:' AND message_type = 'MT700' AND spec_version = '2026';

-- ==================================================
-- Documentation: Format Notation Key
-- ==================================================
-- Format characters:
--   n = digits only
--   a = alphabetic characters only (A-Z)
--   x = any character from SWIFT X character set
--   z = any character from SWIFT Z character set (extended)
--   d = decimal number (comma or period as decimal)
--
-- Format qualifiers:
--   ! = fixed length (e.g., 6!n = exactly 6 digits)
--   * = maximum repetitions (e.g., 4*35x = up to 4 lines of 35 chars)
--   [...] = optional component
--   / = separator within field
--
-- Examples:
--   1!n/1!n = 2 digits separated by slash (e.g., "1/3")
--   4*35z = up to 4 lines, each max 35 characters
--   6!n = exactly 6 digits (date YYMMDD)
--   3!a15d = 3-letter code + decimal amount up to 15 digits
--   2!a = exactly 2 alphabetic characters (country code)
-- ==================================================
