-- ==================================================
-- Migration V66: Add draft_field_mapping to MT767 fields
-- ==================================================
-- MT767 is used for guarantee amendments and extensions.
-- Maps SWIFT field codes to operation fields for dynamic updates.
-- ==================================================

-- :31D: Expiry Date -> expiryDate
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'expiryDate'
WHERE field_code = ':31D:' AND message_type = 'MT767' AND draft_field_mapping IS NULL;

-- :31E: Alternative Expiry Date -> expiryDate
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'expiryDate'
WHERE field_code = ':31E:' AND message_type = 'MT767' AND draft_field_mapping IS NULL;

-- :32B: Currency and Amount -> currency,amount
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'currency,amount'
WHERE field_code = ':32B:' AND message_type = 'MT767' AND draft_field_mapping IS NULL;

-- :31C: Issue Date -> issueDate
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'issueDate'
WHERE field_code = ':31C:' AND message_type = 'MT767' AND draft_field_mapping IS NULL;

-- :20: Reference -> reference
UPDATE swift_field_config_readmodel
SET draft_field_mapping = 'reference'
WHERE field_code = ':20:' AND message_type = 'MT767' AND draft_field_mapping IS NULL;

-- ==================================================
-- End of migration V66
-- ==================================================
