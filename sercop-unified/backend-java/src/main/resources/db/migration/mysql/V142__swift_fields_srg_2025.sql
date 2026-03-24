-- ==================================================
-- Migration: SWIFT Fields for Version 2025
-- Generated: 2026-01-15T11:35:43.240300
-- Effective Date: 2025-11-16
-- ==================================================

-- MT700 Fields (39 fields)
-- ==================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':27:', 'Sequence of Total', 'This field specifies the number of this message in the series of messages sent for a documentary credit, and the total number of messages in the series.',
    'MT700', 'es', 'GENERAL', 1,
    1, 1,
    'NUMBER', 'INPUT', '1!n', 'M',
    'This field specifies the number of this message in the series of messages sent for a documentary credit, and the total number of messages in the series.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':27:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':27:', 'Sequence of Total', 'This field specifies the number of this message in the series of messages sent for a documentary credit, and the total number of messages in the series.',
    'MT700', 'en', 'GENERAL', 1,
    1, 1,
    'NUMBER', 'INPUT', '1!n', 'M',
    'This field specifies the number of this message in the series of messages sent for a documentary credit, and the total number of messages in the series.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':27:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40A:', 'Form of Documentary Credit', 'This field specifies the type of credit. Type must contain one of the following codes (Error code(s): T60) : Details of any special conditions applying to the transferability of the credit and/or the bank authorised to transfer the credit in a freely negotiable credit should be included in field 47A Additional Conditions.',
    'MT700', 'es', 'GENERAL', 2,
    1, 1,
    'SELECT', 'DROPDOWN', '24x', 'M',
    'This field specifies the type of credit. Type must contain one of the following codes (Error code(s): T60) : Details of any special conditions applying to the transferability of the credit and/or the bank authorised to transfer the credit in a freely negotiable credit should be included in field 47A Additional Conditions.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40A:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40A:', 'Form of Documentary Credit', 'This field specifies the type of credit. Type must contain one of the following codes (Error code(s): T60) : Details of any special conditions applying to the transferability of the credit and/or the bank authorised to transfer the credit in a freely negotiable credit should be included in field 47A Additional Conditions.',
    'MT700', 'en', 'GENERAL', 2,
    1, 1,
    'SELECT', 'DROPDOWN', '24x', 'M',
    'This field specifies the type of credit. Type must contain one of the following codes (Error code(s): T60) : Details of any special conditions applying to the transferability of the credit and/or the bank authorised to transfer the credit in a freely negotiable credit should be included in field 47A Additional Conditions.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40A:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Documentary Credit Number', 'This field specifies the documentary credit number which has been assigned by the Sender.',
    'MT700', 'es', 'GENERAL', 3,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the documentary credit number which has been assigned by the Sender.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Documentary Credit Number', 'This field specifies the documentary credit number which has been assigned by the Sender.',
    'MT700', 'en', 'GENERAL', 3,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the documentary credit number which has been assigned by the Sender.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23:', 'Reference to Pre-Advice', 'Use of this field indicates that the documentary credit has been pre-advised. This field must contain the code PREADV followed by a slash ''/'' and a reference to the pre-advice, for example, by date.',
    'MT700', 'es', 'GENERAL', 4,
    0, 1,
    'TEXT', 'INPUT', '16x', 'O',
    'Use of this field indicates that the documentary credit has been pre-advised. This field must contain the code PREADV followed by a slash ''/'' and a reference to the pre-advice, for example, by date.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23:', 'Reference to Pre-Advice', 'Use of this field indicates that the documentary credit has been pre-advised. This field must contain the code PREADV followed by a slash ''/'' and a reference to the pre-advice, for example, by date.',
    'MT700', 'en', 'GENERAL', 4,
    0, 1,
    'TEXT', 'INPUT', '16x', 'O',
    'Use of this field indicates that the documentary credit has been pre-advised. This field must contain the code PREADV followed by a slash ''/'' and a reference to the pre-advice, for example, by date.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31C:', 'Date of Issue', 'This field specifies the date on which the issuing bank (Sender) considers the documentary credit as being issued.',
    'MT700', 'es', 'GENERAL', 5,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date on which the issuing bank (Sender) considers the documentary credit as being issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31C:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31C:', 'Date of Issue', 'This field specifies the date on which the issuing bank (Sender) considers the documentary credit as being issued.',
    'MT700', 'en', 'GENERAL', 5,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date on which the issuing bank (Sender) considers the documentary credit as being issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31C:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40E:', 'Applicable Rules', 'This field specifies the rules the credit is subject to. Applicable Rules must contain one of the following codes (Error code(s): T59) :',
    'MT700', 'es', 'GENERAL', 6,
    1, 1,
    'SELECT', 'DROPDOWN', '30x', 'M',
    'This field specifies the rules the credit is subject to. Applicable Rules must contain one of the following codes (Error code(s): T59) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40E:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40E:', 'Applicable Rules', 'This field specifies the rules the credit is subject to. Applicable Rules must contain one of the following codes (Error code(s): T59) :',
    'MT700', 'en', 'GENERAL', 6,
    1, 1,
    'SELECT', 'DROPDOWN', '30x', 'M',
    'This field specifies the rules the credit is subject to. Applicable Rules must contain one of the following codes (Error code(s): T59) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40E:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31D:', 'Date and Place of Expiry', 'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented.',
    'MT700', 'es', 'GENERAL', 7,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31D:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31D:', 'Date and Place of Expiry', 'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented.',
    'MT700', 'en', 'GENERAL', 7,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31D:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':51a:', 'Applicant Bank', 'This field specifies the bank of the applicant customer, if different from the issuing bank.',
    'MT700', 'es', 'GENERAL', 8,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the bank of the applicant customer, if different from the issuing bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':51a:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':51a:', 'Applicant Bank', 'This field specifies the bank of the applicant customer, if different from the issuing bank.',
    'MT700', 'en', 'GENERAL', 8,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the bank of the applicant customer, if different from the issuing bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':51a:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50:', 'Applicant', 'This field specifies the party on behalf of which the documentary credit is being issued.',
    'MT700', 'es', 'GENERAL', 9,
    1, 1,
    'PARTICIPANT', 'PARTICIPANT_SELECTOR', '4*35x', 'M',
    'This field specifies the party on behalf of which the documentary credit is being issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50:', 'Applicant', 'This field specifies the party on behalf of which the documentary credit is being issued.',
    'MT700', 'en', 'GENERAL', 9,
    1, 1,
    'PARTICIPANT', 'PARTICIPANT_SELECTOR', '4*35x', 'M',
    'This field specifies the party on behalf of which the documentary credit is being issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59:', 'Beneficiary', 'This field specifies the party in favour of which the documentary credit is being issued.',
    'MT700', 'es', 'GENERAL', 10,
    1, 1,
    'PARTICIPANT', 'NON_CLIENT_SELECTOR', '[/34x]4*35x', 'M',
    'This field specifies the party in favour of which the documentary credit is being issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59:', 'Beneficiary', 'This field specifies the party in favour of which the documentary credit is being issued.',
    'MT700', 'en', 'GENERAL', 10,
    1, 1,
    'PARTICIPANT', 'NON_CLIENT_SELECTOR', '[/34x]4*35x', 'M',
    'This field specifies the party in favour of which the documentary credit is being issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Currency Code, Amount', 'This field contains the currency code and amount of the documentary credit.',
    'MT700', 'es', 'GENERAL', 11,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field contains the currency code and amount of the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Currency Code, Amount', 'This field contains the currency code and amount of the documentary credit.',
    'MT700', 'en', 'GENERAL', 11,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field contains the currency code and amount of the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39A:', 'Percentage Credit Amount Tolerance', 'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount. Tolerance 1 specifies a positive tolerance, the Tolerance 2 specifies a negative tolerance.',
    'MT700', 'es', 'GENERAL', 12,
    0, 1,
    'NUMBER', 'INPUT', '2n', 'O',
    'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount. Tolerance 1 specifies a positive tolerance, the Tolerance 2 specifies a negative tolerance.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39A:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39A:', 'Percentage Credit Amount Tolerance', 'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount. Tolerance 1 specifies a positive tolerance, the Tolerance 2 specifies a negative tolerance.',
    'MT700', 'en', 'GENERAL', 12,
    0, 1,
    'NUMBER', 'INPUT', '2n', 'O',
    'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount. Tolerance 1 specifies a positive tolerance, the Tolerance 2 specifies a negative tolerance.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39A:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39C:', 'Additional Amounts Covered', 'This field specifies any additional amounts available to the beneficiary under the terms of the credit, such as insurance, freight, interest, etc.',
    'MT700', 'es', 'GENERAL', 13,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies any additional amounts available to the beneficiary under the terms of the credit, such as insurance, freight, interest, etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39C:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39C:', 'Additional Amounts Covered', 'This field specifies any additional amounts available to the beneficiary under the terms of the credit, such as insurance, freight, interest, etc.',
    'MT700', 'en', 'GENERAL', 13,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies any additional amounts available to the beneficiary under the terms of the credit, such as insurance, freight, interest, etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39C:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':41a:', 'Available With ... By ...', 'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available. In option A or D, Code must contain one of the following codes (Error code(s): T68) :',
    'MT700', 'es', 'GENERAL', 14,
    1, 1,
    'SELECT', 'DROPDOWN', '4!a', 'M',
    'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available. In option A or D, Code must contain one of the following codes (Error code(s): T68) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':41a:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':41a:', 'Available With ... By ...', 'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available. In option A or D, Code must contain one of the following codes (Error code(s): T68) :',
    'MT700', 'en', 'GENERAL', 14,
    1, 1,
    'SELECT', 'DROPDOWN', '4!a', 'M',
    'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available. In option A or D, Code must contain one of the following codes (Error code(s): T68) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':41a:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42C:', 'Drafts at ...', 'This field specifies the tenor of drafts to be drawn under the documentary credit.',
    'MT700', 'es', 'GENERAL', 15,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '3*35x', 'O',
    'This field specifies the tenor of drafts to be drawn under the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42C:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42C:', 'Drafts at ...', 'This field specifies the tenor of drafts to be drawn under the documentary credit.',
    'MT700', 'en', 'GENERAL', 15,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '3*35x', 'O',
    'This field specifies the tenor of drafts to be drawn under the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42C:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42a:', 'Drawee', 'This field identifies the drawee of the drafts to be drawn under the documentary credit.',
    'MT700', 'es', 'GENERAL', 16,
    0, 1,
    'TEXT', 'INPUT', '1!a', 'O',
    'This field identifies the drawee of the drafts to be drawn under the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42a:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42a:', 'Drawee', 'This field identifies the drawee of the drafts to be drawn under the documentary credit.',
    'MT700', 'en', 'GENERAL', 16,
    0, 1,
    'TEXT', 'INPUT', '1!a', 'O',
    'This field identifies the drawee of the drafts to be drawn under the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42a:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42M:', 'Mixed Payment Details', 'This field specifies the payment dates, amounts and/or method for their determination in a documentary credit which is available by mixed payment.',
    'MT700', 'es', 'GENERAL', 17,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the payment dates, amounts and/or method for their determination in a documentary credit which is available by mixed payment.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42M:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42M:', 'Mixed Payment Details', 'This field specifies the payment dates, amounts and/or method for their determination in a documentary credit which is available by mixed payment.',
    'MT700', 'en', 'GENERAL', 17,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the payment dates, amounts and/or method for their determination in a documentary credit which is available by mixed payment.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42M:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42P:', 'Negotiation/Deferred Payment Details', 'This field specifies the payment date or method for its determination in a documentary credit which is available by deferred payment or negotiation only.',
    'MT700', 'es', 'GENERAL', 18,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the payment date or method for its determination in a documentary credit which is available by deferred payment or negotiation only.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42P:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42P:', 'Negotiation/Deferred Payment Details', 'This field specifies the payment date or method for its determination in a documentary credit which is available by deferred payment or negotiation only.',
    'MT700', 'en', 'GENERAL', 18,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the payment date or method for its determination in a documentary credit which is available by deferred payment or negotiation only.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42P:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':43P:', 'Partial Shipments', 'This field specifies whether or not partial shipments are allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T64) :',
    'MT700', 'es', 'GENERAL', 19,
    0, 1,
    'SELECT', 'DROPDOWN', '11x', 'O',
    'This field specifies whether or not partial shipments are allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T64) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':43P:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':43P:', 'Partial Shipments', 'This field specifies whether or not partial shipments are allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T64) :',
    'MT700', 'en', 'GENERAL', 19,
    0, 1,
    'SELECT', 'DROPDOWN', '11x', 'O',
    'This field specifies whether or not partial shipments are allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T64) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':43P:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':43T:', 'Transhipment', 'This field specifies whether or not transhipment is allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T65) :',
    'MT700', 'es', 'GENERAL', 20,
    0, 1,
    'SELECT', 'DROPDOWN', '11x', 'O',
    'This field specifies whether or not transhipment is allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T65) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':43T:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':43T:', 'Transhipment', 'This field specifies whether or not transhipment is allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T65) :',
    'MT700', 'en', 'GENERAL', 20,
    0, 1,
    'SELECT', 'DROPDOWN', '11x', 'O',
    'This field specifies whether or not transhipment is allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T65) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':43T:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44A:', 'Place of Taking in Charge/Dispatch from .../Place of Receipt', 'This field specifies the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.',
    'MT700', 'es', 'GENERAL', 21,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44A:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44A:', 'Place of Taking in Charge/Dispatch from .../Place of Receipt', 'This field specifies the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.',
    'MT700', 'en', 'GENERAL', 21,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44A:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44E:', 'Port of Loading/Airport of Departure', 'This field specifies the port of loading or airport of departure to be indicated on the transport document.',
    'MT700', 'es', 'GENERAL', 22,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the port of loading or airport of departure to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44E:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44E:', 'Port of Loading/Airport of Departure', 'This field specifies the port of loading or airport of departure to be indicated on the transport document.',
    'MT700', 'en', 'GENERAL', 22,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the port of loading or airport of departure to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44E:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44F:', 'Port of Discharge/Airport of Destination', 'This field specifies the port of discharge or airport of destination to be indicated on the transport document.',
    'MT700', 'es', 'GENERAL', 23,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the port of discharge or airport of destination to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44F:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44F:', 'Port of Discharge/Airport of Destination', 'This field specifies the port of discharge or airport of destination to be indicated on the transport document.',
    'MT700', 'en', 'GENERAL', 23,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the port of discharge or airport of destination to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44F:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44B:', 'Place of Final Destination/For Transportation to .../Place of Delivery', 'This field specifies the final destination or place of delivery to be indicated on the transport document.',
    'MT700', 'es', 'GENERAL', 24,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the final destination or place of delivery to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44B:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44B:', 'Place of Final Destination/For Transportation to .../Place of Delivery', 'This field specifies the final destination or place of delivery to be indicated on the transport document.',
    'MT700', 'en', 'GENERAL', 24,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the final destination or place of delivery to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44B:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44C:', 'Latest Date of Shipment', 'This field specifies the latest date for loading on board/dispatch/taking in charge.',
    'MT700', 'es', 'GENERAL', 25,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the latest date for loading on board/dispatch/taking in charge.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44C:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44C:', 'Latest Date of Shipment', 'This field specifies the latest date for loading on board/dispatch/taking in charge.',
    'MT700', 'en', 'GENERAL', 25,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the latest date for loading on board/dispatch/taking in charge.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44C:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44D:', 'Shipment Period', 'This field specifies the period of time during which the goods are to be loaded on board/despatched/taken in charge.',
    'MT700', 'es', 'GENERAL', 26,
    0, 1,
    'DATE', 'DATE_PICKER', '6*65x', 'O',
    'This field specifies the period of time during which the goods are to be loaded on board/despatched/taken in charge.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44D:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44D:', 'Shipment Period', 'This field specifies the period of time during which the goods are to be loaded on board/despatched/taken in charge.',
    'MT700', 'en', 'GENERAL', 26,
    0, 1,
    'DATE', 'DATE_PICKER', '6*65x', 'O',
    'This field specifies the period of time during which the goods are to be loaded on board/despatched/taken in charge.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44D:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45A:', 'Description of Goods and/or Services', 'This field contains a description of the goods and/or services. Terms such as FOB, CIF, etc. should be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.',
    'MT700', 'es', 'GENERAL', 27,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of the goods and/or services. Terms such as FOB, CIF, etc. should be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45A:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45A:', 'Description of Goods and/or Services', 'This field contains a description of the goods and/or services. Terms such as FOB, CIF, etc. should be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.',
    'MT700', 'en', 'GENERAL', 27,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of the goods and/or services. Terms such as FOB, CIF, etc. should be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45A:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':46A:', 'Documents Required', 'This field contains a description of any documents required. When the ultimate date of issue of a transport document is specified, it is to be specified with the relative document in this field. For credits subject to eUCP, the format in which electronic records are to be presented must be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.',
    'MT700', 'es', 'GENERAL', 28,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of any documents required. When the ultimate date of issue of a transport document is specified, it is to be specified with the relative document in this field. For credits subject to eUCP, the format in which electronic records are to be presented must be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':46A:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':46A:', 'Documents Required', 'This field contains a description of any documents required. When the ultimate date of issue of a transport document is specified, it is to be specified with the relative document in this field. For credits subject to eUCP, the format in which electronic records are to be presented must be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.',
    'MT700', 'en', 'GENERAL', 28,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of any documents required. When the ultimate date of issue of a transport document is specified, it is to be specified with the relative document in this field. For credits subject to eUCP, the format in which electronic records are to be presented must be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':46A:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':47A:', 'Additional Conditions', 'This field contains a description of further conditions of the documentary credit. Where applicable, for credits subject to eUCP: If presentation of both electronic records and paper documents is allowed, the place for presentation of the electronic records (that is, the electronic address to which presentation must be made) as well as the place for presentation of the paper documents must be specified in this field. If presentation of only electronic records is allowed, the place for presentati',
    'MT700', 'es', 'GENERAL', 29,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of further conditions of the documentary credit. Where applicable, for credits subject to eUCP: If presentation of both electronic records and paper documents is allowed, the place for presentation of the electronic records (that is, the electronic address to which presentation must be made) as well as the place for presentation of the paper documents must be specified in this field. If presentation of only electronic records is allowed, the place for presentati', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':47A:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':47A:', 'Additional Conditions', 'This field contains a description of further conditions of the documentary credit. Where applicable, for credits subject to eUCP: If presentation of both electronic records and paper documents is allowed, the place for presentation of the electronic records (that is, the electronic address to which presentation must be made) as well as the place for presentation of the paper documents must be specified in this field. If presentation of only electronic records is allowed, the place for presentati',
    'MT700', 'en', 'GENERAL', 29,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of further conditions of the documentary credit. Where applicable, for credits subject to eUCP: If presentation of both electronic records and paper documents is allowed, the place for presentation of the electronic records (that is, the electronic address to which presentation must be made) as well as the place for presentation of the paper documents must be specified in this field. If presentation of only electronic records is allowed, the place for presentati', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':47A:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49G:', 'Special Payment Conditions for Beneficiary', 'This field specifies special payment conditions applicable to the beneficiary, for example, post-financing request/conditions.',
    'MT700', 'es', 'GENERAL', 30,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies special payment conditions applicable to the beneficiary, for example, post-financing request/conditions.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49G:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49G:', 'Special Payment Conditions for Beneficiary', 'This field specifies special payment conditions applicable to the beneficiary, for example, post-financing request/conditions.',
    'MT700', 'en', 'GENERAL', 30,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies special payment conditions applicable to the beneficiary, for example, post-financing request/conditions.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49G:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49H:', 'Special Payment Conditions for Bank Only', 'This field specifies special payment conditions applicable to a bank without disclosure to the beneficiary, for example, post-financing request/conditions. Content of the field must specify to which bank it is addressed.',
    'MT700', 'es', 'GENERAL', 31,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies special payment conditions applicable to a bank without disclosure to the beneficiary, for example, post-financing request/conditions. Content of the field must specify to which bank it is addressed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49H:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49H:', 'Special Payment Conditions for Bank Only', 'This field specifies special payment conditions applicable to a bank without disclosure to the beneficiary, for example, post-financing request/conditions. Content of the field must specify to which bank it is addressed.',
    'MT700', 'en', 'GENERAL', 31,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies special payment conditions applicable to a bank without disclosure to the beneficiary, for example, post-financing request/conditions. Content of the field must specify to which bank it is addressed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49H:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':71D:', 'Charges', 'This field may be used only to specify charges to be borne by the beneficiary. One or more of the following codes may be used in Code, followed by the currency code and amount: In the absence of this field, all charges, except negotiation and transfer charges, are to be borne by the applicant. Any code used in this field must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information',
    'MT700', 'es', 'GENERAL', 32,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field may be used only to specify charges to be borne by the beneficiary. One or more of the following codes may be used in Code, followed by the currency code and amount: In the absence of this field, all charges, except negotiation and transfer charges, are to be borne by the applicant. Any code used in this field must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':71D:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':71D:', 'Charges', 'This field may be used only to specify charges to be borne by the beneficiary. One or more of the following codes may be used in Code, followed by the currency code and amount: In the absence of this field, all charges, except negotiation and transfer charges, are to be borne by the applicant. Any code used in this field must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information',
    'MT700', 'en', 'GENERAL', 32,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field may be used only to specify charges to be borne by the beneficiary. One or more of the following codes may be used in Code, followed by the currency code and amount: In the absence of this field, all charges, except negotiation and transfer charges, are to be borne by the applicant. Any code used in this field must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':71D:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':48:', 'Period for Presentation in Days', 'This field specifies the number of calendar days after the date of shipment within which the documents must be presented for payment, acceptance, or negotiation. Narrative must only be used to specify another type of date than a shipment date, for example invoice date, from which the period for presentation begins. The absence of this field means that the presentation period is 21 days after the date of shipment, where applicable.',
    'MT700', 'es', 'GENERAL', 33,
    0, 1,
    'NUMBER', 'INPUT', '3n', 'O',
    'This field specifies the number of calendar days after the date of shipment within which the documents must be presented for payment, acceptance, or negotiation. Narrative must only be used to specify another type of date than a shipment date, for example invoice date, from which the period for presentation begins. The absence of this field means that the presentation period is 21 days after the date of shipment, where applicable.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':48:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':48:', 'Period for Presentation in Days', 'This field specifies the number of calendar days after the date of shipment within which the documents must be presented for payment, acceptance, or negotiation. Narrative must only be used to specify another type of date than a shipment date, for example invoice date, from which the period for presentation begins. The absence of this field means that the presentation period is 21 days after the date of shipment, where applicable.',
    'MT700', 'en', 'GENERAL', 33,
    0, 1,
    'NUMBER', 'INPUT', '3n', 'O',
    'This field specifies the number of calendar days after the date of shipment within which the documents must be presented for payment, acceptance, or negotiation. Narrative must only be used to specify another type of date than a shipment date, for example invoice date, from which the period for presentation begins. The absence of this field means that the presentation period is 21 days after the date of shipment, where applicable.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':48:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49:', 'Confirmation Instructions', 'This field contains confirmation instructions for the requested confirmation party. Instruction must contain one of the following codes (Error code(s): T67) :',
    'MT700', 'es', 'GENERAL', 34,
    1, 1,
    'SELECT', 'DROPDOWN', '7!x', 'M',
    'This field contains confirmation instructions for the requested confirmation party. Instruction must contain one of the following codes (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49:', 'Confirmation Instructions', 'This field contains confirmation instructions for the requested confirmation party. Instruction must contain one of the following codes (Error code(s): T67) :',
    'MT700', 'en', 'GENERAL', 34,
    1, 1,
    'SELECT', 'DROPDOWN', '7!x', 'M',
    'This field contains confirmation instructions for the requested confirmation party. Instruction must contain one of the following codes (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':58a:', 'Requested Confirmation Party', 'Bank which is requested to add its confirmation or may add its confirmation.',
    'MT700', 'es', 'GENERAL', 35,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'Bank which is requested to add its confirmation or may add its confirmation.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':58a:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':58a:', 'Requested Confirmation Party', 'Bank which is requested to add its confirmation or may add its confirmation.',
    'MT700', 'en', 'GENERAL', 35,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'Bank which is requested to add its confirmation or may add its confirmation.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':58a:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':53a:', 'Reimbursing Bank', 'This field specifies the name of the bank which has been authorised by the Sender to reimburse drawings under the documentary credit. This may be a branch of the Sender or the Receiver, or an entirely different bank.',
    'MT700', 'es', 'GENERAL', 36,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the name of the bank which has been authorised by the Sender to reimburse drawings under the documentary credit. This may be a branch of the Sender or the Receiver, or an entirely different bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':53a:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':53a:', 'Reimbursing Bank', 'This field specifies the name of the bank which has been authorised by the Sender to reimburse drawings under the documentary credit. This may be a branch of the Sender or the Receiver, or an entirely different bank.',
    'MT700', 'en', 'GENERAL', 36,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the name of the bank which has been authorised by the Sender to reimburse drawings under the documentary credit. This may be a branch of the Sender or the Receiver, or an entirely different bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':53a:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78:', 'Instructions to the Paying/Accepting/Negotiating Bank', 'This field specifies instructions to the paying, accepting or negotiating bank. It may also indicate if pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required. When used to indicate pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required, the number and type of days, that is, banking or calendar days, within which the issuing bank has to be notified should also be indicated.',
    'MT700', 'es', 'GENERAL', 37,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies instructions to the paying, accepting or negotiating bank. It may also indicate if pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required. When used to indicate pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required, the number and type of days, that is, banking or calendar days, within which the issuing bank has to be notified should also be indicated.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78:', 'Instructions to the Paying/Accepting/Negotiating Bank', 'This field specifies instructions to the paying, accepting or negotiating bank. It may also indicate if pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required. When used to indicate pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required, the number and type of days, that is, banking or calendar days, within which the issuing bank has to be notified should also be indicated.',
    'MT700', 'en', 'GENERAL', 37,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies instructions to the paying, accepting or negotiating bank. It may also indicate if pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required. When used to indicate pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required, the number and type of days, that is, banking or calendar days, within which the issuing bank has to be notified should also be indicated.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', '''Advise Through'' Bank', 'This field identifies the bank, if different from the Receiver, through which the documentary credit is to be advised/confirmed to the beneficiary.',
    'MT700', 'es', 'GENERAL', 38,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field identifies the bank, if different from the Receiver, through which the documentary credit is to be advised/confirmed to the beneficiary.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', '''Advise Through'' Bank', 'This field identifies the bank, if different from the Receiver, through which the documentary credit is to be advised/confirmed to the beneficiary.',
    'MT700', 'en', 'GENERAL', 38,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field identifies the bank, if different from the Receiver, through which the documentary credit is to be advised/confirmed to the beneficiary.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.',
    'MT700', 'es', 'GENERAL', 39,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT700'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.',
    'MT700', 'en', 'GENERAL', 39,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT700'
    AND language = 'en'
    AND spec_version = '2025'
);

-- MT705 Fields (19 fields)
-- ==================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40A:', 'Form of Documentary Credit', 'This field specifies the type of credit. Type must contain one of the following codes (Error code(s): T60) :',
    'MT705', 'es', 'GENERAL', 1,
    1, 1,
    'SELECT', 'DROPDOWN', '24x', 'M',
    'This field specifies the type of credit. Type must contain one of the following codes (Error code(s): T60) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40A:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40A:', 'Form of Documentary Credit', 'This field specifies the type of credit. Type must contain one of the following codes (Error code(s): T60) :',
    'MT705', 'en', 'GENERAL', 1,
    1, 1,
    'SELECT', 'DROPDOWN', '24x', 'M',
    'This field specifies the type of credit. Type must contain one of the following codes (Error code(s): T60) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40A:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Documentary Credit Number', 'This field specifies the documentary credit number which has been assigned by the Sender.',
    'MT705', 'es', 'GENERAL', 2,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the documentary credit number which has been assigned by the Sender.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Documentary Credit Number', 'This field specifies the documentary credit number which has been assigned by the Sender.',
    'MT705', 'en', 'GENERAL', 2,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the documentary credit number which has been assigned by the Sender.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31D:', 'Date and Place of Expiry', 'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented.',
    'MT705', 'es', 'GENERAL', 3,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31D:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31D:', 'Date and Place of Expiry', 'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented.',
    'MT705', 'en', 'GENERAL', 3,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31D:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50:', 'Applicant', 'This field specifies the party on behalf of which the documentary credit is being issued.',
    'MT705', 'es', 'GENERAL', 4,
    1, 1,
    'PARTICIPANT', 'PARTICIPANT_SELECTOR', '4*35x', 'M',
    'This field specifies the party on behalf of which the documentary credit is being issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50:', 'Applicant', 'This field specifies the party on behalf of which the documentary credit is being issued.',
    'MT705', 'en', 'GENERAL', 4,
    1, 1,
    'PARTICIPANT', 'PARTICIPANT_SELECTOR', '4*35x', 'M',
    'This field specifies the party on behalf of which the documentary credit is being issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59:', 'Beneficiary', 'This field specifies the party in favour of which the documentary credit is being issued.',
    'MT705', 'es', 'GENERAL', 5,
    1, 1,
    'PARTICIPANT', 'NON_CLIENT_SELECTOR', '[/34x]4*35x', 'M',
    'This field specifies the party in favour of which the documentary credit is being issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59:', 'Beneficiary', 'This field specifies the party in favour of which the documentary credit is being issued.',
    'MT705', 'en', 'GENERAL', 5,
    1, 1,
    'PARTICIPANT', 'NON_CLIENT_SELECTOR', '[/34x]4*35x', 'M',
    'This field specifies the party in favour of which the documentary credit is being issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Currency Code, Amount', 'This field contains the currency and amount of the documentary credit.',
    'MT705', 'es', 'GENERAL', 6,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field contains the currency and amount of the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Currency Code, Amount', 'This field contains the currency and amount of the documentary credit.',
    'MT705', 'en', 'GENERAL', 6,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field contains the currency and amount of the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39A:', 'Percentage Credit Amount Tolerance', 'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount. Tolerance 1 specifies a positive tolerance, Tolerance 2 specifies a negative tolerance.',
    'MT705', 'es', 'GENERAL', 7,
    0, 1,
    'NUMBER', 'INPUT', '2n', 'O',
    'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount. Tolerance 1 specifies a positive tolerance, Tolerance 2 specifies a negative tolerance.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39A:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39A:', 'Percentage Credit Amount Tolerance', 'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount. Tolerance 1 specifies a positive tolerance, Tolerance 2 specifies a negative tolerance.',
    'MT705', 'en', 'GENERAL', 7,
    0, 1,
    'NUMBER', 'INPUT', '2n', 'O',
    'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount. Tolerance 1 specifies a positive tolerance, Tolerance 2 specifies a negative tolerance.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39A:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39C:', 'Additional Amounts Covered', 'This field specifies any additional amounts covered such as insurance, freight, interest, etc.',
    'MT705', 'es', 'GENERAL', 8,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies any additional amounts covered such as insurance, freight, interest, etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39C:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39C:', 'Additional Amounts Covered', 'This field specifies any additional amounts covered such as insurance, freight, interest, etc.',
    'MT705', 'en', 'GENERAL', 8,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies any additional amounts covered such as insurance, freight, interest, etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39C:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':41a:', 'Available With ... By ...', 'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available. In option A or D, Code must contain one of the following codes (Error code(s): T68) :',
    'MT705', 'es', 'GENERAL', 9,
    0, 1,
    'SELECT', 'DROPDOWN', '4!a', 'O',
    'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available. In option A or D, Code must contain one of the following codes (Error code(s): T68) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':41a:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':41a:', 'Available With ... By ...', 'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available. In option A or D, Code must contain one of the following codes (Error code(s): T68) :',
    'MT705', 'en', 'GENERAL', 9,
    0, 1,
    'SELECT', 'DROPDOWN', '4!a', 'O',
    'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available. In option A or D, Code must contain one of the following codes (Error code(s): T68) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':41a:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44A:', 'Place of Taking in Charge/Dispatch from .../Place of Receipt', 'This field specifies the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.',
    'MT705', 'es', 'GENERAL', 10,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44A:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44A:', 'Place of Taking in Charge/Dispatch from .../Place of Receipt', 'This field specifies the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.',
    'MT705', 'en', 'GENERAL', 10,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44A:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44E:', 'Port of Loading/Airport of Departure', 'This field specifies the port of loading or airport of departure to be indicated on the transport document.',
    'MT705', 'es', 'GENERAL', 11,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the port of loading or airport of departure to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44E:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44E:', 'Port of Loading/Airport of Departure', 'This field specifies the port of loading or airport of departure to be indicated on the transport document.',
    'MT705', 'en', 'GENERAL', 11,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the port of loading or airport of departure to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44E:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44F:', 'Port of Discharge/Airport of Destination', 'This field specifies the port of discharge or airport of destination to be indicated on the transport document.',
    'MT705', 'es', 'GENERAL', 12,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the port of discharge or airport of destination to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44F:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44F:', 'Port of Discharge/Airport of Destination', 'This field specifies the port of discharge or airport of destination to be indicated on the transport document.',
    'MT705', 'en', 'GENERAL', 12,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the port of discharge or airport of destination to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44F:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44B:', 'Place of Final Destination/For Transportation to .../Place of Delivery', 'This field specifies the final destination or place of delivery to be indicated on the transport document.',
    'MT705', 'es', 'GENERAL', 13,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the final destination or place of delivery to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44B:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44B:', 'Place of Final Destination/For Transportation to .../Place of Delivery', 'This field specifies the final destination or place of delivery to be indicated on the transport document.',
    'MT705', 'en', 'GENERAL', 13,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the final destination or place of delivery to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44B:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44C:', 'Latest Date of Shipment', 'This field specifies the latest date for loading on board/dispatch/taking in charge.',
    'MT705', 'es', 'GENERAL', 14,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the latest date for loading on board/dispatch/taking in charge.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44C:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44C:', 'Latest Date of Shipment', 'This field specifies the latest date for loading on board/dispatch/taking in charge.',
    'MT705', 'en', 'GENERAL', 14,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the latest date for loading on board/dispatch/taking in charge.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44C:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44D:', 'Shipment Period', 'This field specifies the period of time during which the goods are to be loaded on board/despatched/taken in charge.',
    'MT705', 'es', 'GENERAL', 15,
    0, 1,
    'DATE', 'DATE_PICKER', '6*65x', 'O',
    'This field specifies the period of time during which the goods are to be loaded on board/despatched/taken in charge.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44D:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44D:', 'Shipment Period', 'This field specifies the period of time during which the goods are to be loaded on board/despatched/taken in charge.',
    'MT705', 'en', 'GENERAL', 15,
    0, 1,
    'DATE', 'DATE_PICKER', '6*65x', 'O',
    'This field specifies the period of time during which the goods are to be loaded on board/despatched/taken in charge.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44D:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45A:', 'Description of Goods and/or Services', 'This field contains a description of the goods or services. Terms such as FOB, CIF, etc. should be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.',
    'MT705', 'es', 'GENERAL', 16,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of the goods or services. Terms such as FOB, CIF, etc. should be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45A:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45A:', 'Description of Goods and/or Services', 'This field contains a description of the goods or services. Terms such as FOB, CIF, etc. should be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.',
    'MT705', 'en', 'GENERAL', 16,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of the goods or services. Terms such as FOB, CIF, etc. should be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45A:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', '''Advise Through'' Bank', 'This field identifies the bank, if different from the Receiver, through which the pre-advice of a documentary credit is to be advised to the beneficiary.',
    'MT705', 'es', 'GENERAL', 17,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field identifies the bank, if different from the Receiver, through which the pre-advice of a documentary credit is to be advised to the beneficiary.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', '''Advise Through'' Bank', 'This field identifies the bank, if different from the Receiver, through which the pre-advice of a documentary credit is to be advised to the beneficiary.',
    'MT705', 'en', 'GENERAL', 17,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field identifies the bank, if different from the Receiver, through which the pre-advice of a documentary credit is to be advised to the beneficiary.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':79Z:', 'Narrative', 'This field specifies additional information concerning the documentary credit.',
    'MT705', 'es', 'GENERAL', 18,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '35*50z', 'O',
    'This field specifies additional information concerning the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':79Z:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':79Z:', 'Narrative', 'This field specifies additional information concerning the documentary credit.',
    'MT705', 'en', 'GENERAL', 18,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '35*50z', 'O',
    'This field specifies additional information concerning the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':79Z:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.',
    'MT705', 'es', 'GENERAL', 19,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT705'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.',
    'MT705', 'en', 'GENERAL', 19,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT705'
    AND language = 'en'
    AND spec_version = '2025'
);

-- MT707 Fields (47 fields)
-- ==================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':27:', 'Sequence of Total', 'This field specifies the number of this message in the series of messages sent for a documentary credit amendment, and the total number of messages in the series.',
    'MT707', 'es', 'GENERAL', 1,
    1, 1,
    'NUMBER', 'INPUT', '1!n', 'M',
    'This field specifies the number of this message in the series of messages sent for a documentary credit amendment, and the total number of messages in the series.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':27:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':27:', 'Sequence of Total', 'This field specifies the number of this message in the series of messages sent for a documentary credit amendment, and the total number of messages in the series.',
    'MT707', 'en', 'GENERAL', 1,
    1, 1,
    'NUMBER', 'INPUT', '1!n', 'M',
    'This field specifies the number of this message in the series of messages sent for a documentary credit amendment, and the total number of messages in the series.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':27:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Sender''s Reference', 'This field specifies the reference assigned by the Sender to unambiguously identify the message.',
    'MT707', 'es', 'GENERAL', 2,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the reference assigned by the Sender to unambiguously identify the message.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Sender''s Reference', 'This field specifies the reference assigned by the Sender to unambiguously identify the message.',
    'MT707', 'en', 'GENERAL', 2,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the reference assigned by the Sender to unambiguously identify the message.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':21:', 'Receiver''s Reference', 'This field contains the reference number assigned to the documentary credit by the Receiver of the message.',
    'MT707', 'es', 'GENERAL', 3,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field contains the reference number assigned to the documentary credit by the Receiver of the message.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':21:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':21:', 'Receiver''s Reference', 'This field contains the reference number assigned to the documentary credit by the Receiver of the message.',
    'MT707', 'en', 'GENERAL', 3,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field contains the reference number assigned to the documentary credit by the Receiver of the message.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':21:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23:', 'Issuing Bank''s Reference', 'This field specifies the documentary credit number which was assigned by the issuing bank.',
    'MT707', 'es', 'GENERAL', 4,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the documentary credit number which was assigned by the issuing bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23:', 'Issuing Bank''s Reference', 'This field specifies the documentary credit number which was assigned by the issuing bank.',
    'MT707', 'en', 'GENERAL', 4,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the documentary credit number which was assigned by the issuing bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuing Bank', 'This field specifies the issuing bank.',
    'MT707', 'es', 'GENERAL', 5,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the issuing bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuing Bank', 'This field specifies the issuing bank.',
    'MT707', 'en', 'GENERAL', 5,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the issuing bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50B:', 'Non-Bank Issuer', 'This field specifies the non-bank issuer of the credit.',
    'MT707', 'es', 'GENERAL', 6,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the non-bank issuer of the credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50B:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50B:', 'Non-Bank Issuer', 'This field specifies the non-bank issuer of the credit.',
    'MT707', 'en', 'GENERAL', 6,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the non-bank issuer of the credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50B:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31C:', 'Date of Issue', 'This field specifies the date of the original issue of the documentary credit, that is, the date on which the issuing bank considers the documentary credit as being issued.',
    'MT707', 'es', 'GENERAL', 7,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date of the original issue of the documentary credit, that is, the date on which the issuing bank considers the documentary credit as being issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31C:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31C:', 'Date of Issue', 'This field specifies the date of the original issue of the documentary credit, that is, the date on which the issuing bank considers the documentary credit as being issued.',
    'MT707', 'en', 'GENERAL', 7,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date of the original issue of the documentary credit, that is, the date on which the issuing bank considers the documentary credit as being issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31C:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':26E:', 'Number of Amendment', 'This field specifies the sequence number that identifies this amendment.',
    'MT707', 'es', 'GENERAL', 8,
    1, 1,
    'NUMBER', 'INPUT', '3n', 'M',
    'This field specifies the sequence number that identifies this amendment.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':26E:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':26E:', 'Number of Amendment', 'This field specifies the sequence number that identifies this amendment.',
    'MT707', 'en', 'GENERAL', 8,
    1, 1,
    'NUMBER', 'INPUT', '3n', 'M',
    'This field specifies the sequence number that identifies this amendment.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':26E:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':30:', 'Date of Amendment', 'This field specifies the date on which the issuing bank considers the documentary credit as being amended.',
    'MT707', 'es', 'GENERAL', 9,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date on which the issuing bank considers the documentary credit as being amended.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':30:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':30:', 'Date of Amendment', 'This field specifies the date on which the issuing bank considers the documentary credit as being amended.',
    'MT707', 'en', 'GENERAL', 9,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date on which the issuing bank considers the documentary credit as being amended.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':30:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':22A:', 'Purpose of Message', 'This field specifies the purpose of this message. Purpose must contain one of the following codes (Error code(s): T36) :',
    'MT707', 'es', 'GENERAL', 10,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the purpose of this message. Purpose must contain one of the following codes (Error code(s): T36) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':22A:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':22A:', 'Purpose of Message', 'This field specifies the purpose of this message. Purpose must contain one of the following codes (Error code(s): T36) :',
    'MT707', 'en', 'GENERAL', 10,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the purpose of this message. Purpose must contain one of the following codes (Error code(s): T36) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':22A:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23S:', 'Cancellation Request', 'This field specifies that the instrument is requested to be cancelled. Request must contain the following code (Error code(s): T93) :',
    'MT707', 'es', 'GENERAL', 11,
    0, 1,
    'TEXT', 'INPUT', '6!a', 'O',
    'This field specifies that the instrument is requested to be cancelled. Request must contain the following code (Error code(s): T93) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23S:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23S:', 'Cancellation Request', 'This field specifies that the instrument is requested to be cancelled. Request must contain the following code (Error code(s): T93) :',
    'MT707', 'en', 'GENERAL', 11,
    0, 1,
    'TEXT', 'INPUT', '6!a', 'O',
    'This field specifies that the instrument is requested to be cancelled. Request must contain the following code (Error code(s): T93) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23S:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40A:', 'Form of Documentary Credit', 'This field specifies the type of credit, if changed. Type must contain one of the following codes (Error code(s): T60) :',
    'MT707', 'es', 'GENERAL', 12,
    0, 1,
    'SELECT', 'DROPDOWN', '24x', 'O',
    'This field specifies the type of credit, if changed. Type must contain one of the following codes (Error code(s): T60) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40A:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40A:', 'Form of Documentary Credit', 'This field specifies the type of credit, if changed. Type must contain one of the following codes (Error code(s): T60) :',
    'MT707', 'en', 'GENERAL', 12,
    0, 1,
    'SELECT', 'DROPDOWN', '24x', 'O',
    'This field specifies the type of credit, if changed. Type must contain one of the following codes (Error code(s): T60) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40A:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40E:', 'Applicable Rules', 'This field specifies the rules the credit is subject to, if changed. Applicable Rules must contain one of the following codes (Error code(s): T59) :',
    'MT707', 'es', 'GENERAL', 13,
    0, 1,
    'SELECT', 'DROPDOWN', '30x', 'O',
    'This field specifies the rules the credit is subject to, if changed. Applicable Rules must contain one of the following codes (Error code(s): T59) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40E:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40E:', 'Applicable Rules', 'This field specifies the rules the credit is subject to, if changed. Applicable Rules must contain one of the following codes (Error code(s): T59) :',
    'MT707', 'en', 'GENERAL', 13,
    0, 1,
    'SELECT', 'DROPDOWN', '30x', 'O',
    'This field specifies the rules the credit is subject to, if changed. Applicable Rules must contain one of the following codes (Error code(s): T59) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40E:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31D:', 'Date and Place of Expiry', 'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented, if changed.',
    'MT707', 'es', 'GENERAL', 14,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31D:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31D:', 'Date and Place of Expiry', 'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented, if changed.',
    'MT707', 'en', 'GENERAL', 14,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31D:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50:', 'Changed Applicant Details', 'This field specifies the party on behalf of which the documentary credit is being issued, if details have changed',
    'MT707', 'es', 'GENERAL', 15,
    0, 1,
    'PARTICIPANT', 'PARTICIPANT_SELECTOR', '4*35x', 'O',
    'This field specifies the party on behalf of which the documentary credit is being issued, if details have changed', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50:', 'Changed Applicant Details', 'This field specifies the party on behalf of which the documentary credit is being issued, if details have changed',
    'MT707', 'en', 'GENERAL', 15,
    0, 1,
    'PARTICIPANT', 'PARTICIPANT_SELECTOR', '4*35x', 'O',
    'This field specifies the party on behalf of which the documentary credit is being issued, if details have changed', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59:', 'Beneficiary', 'This field specifies the new party in favour of which the documentary credit is issued, if changed.',
    'MT707', 'es', 'GENERAL', 16,
    0, 1,
    'PARTICIPANT', 'NON_CLIENT_SELECTOR', '[/34x]4*35x', 'O',
    'This field specifies the new party in favour of which the documentary credit is issued, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59:', 'Beneficiary', 'This field specifies the new party in favour of which the documentary credit is issued, if changed.',
    'MT707', 'en', 'GENERAL', 16,
    0, 1,
    'PARTICIPANT', 'NON_CLIENT_SELECTOR', '[/34x]4*35x', 'O',
    'This field specifies the new party in favour of which the documentary credit is issued, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Increase of Documentary Credit Amount', 'This field contains the currency and amount of an increase in the documentary credit amount, if changed.',
    'MT707', 'es', 'GENERAL', 17,
    0, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'O',
    'This field contains the currency and amount of an increase in the documentary credit amount, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Increase of Documentary Credit Amount', 'This field contains the currency and amount of an increase in the documentary credit amount, if changed.',
    'MT707', 'en', 'GENERAL', 17,
    0, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'O',
    'This field contains the currency and amount of an increase in the documentary credit amount, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':33B:', 'Decrease of Documentary Credit Amount', 'This field contains the currency and amount of a decrease in the documentary credit amount, if changed.',
    'MT707', 'es', 'GENERAL', 18,
    0, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'O',
    'This field contains the currency and amount of a decrease in the documentary credit amount, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':33B:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':33B:', 'Decrease of Documentary Credit Amount', 'This field contains the currency and amount of a decrease in the documentary credit amount, if changed.',
    'MT707', 'en', 'GENERAL', 18,
    0, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'O',
    'This field contains the currency and amount of a decrease in the documentary credit amount, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':33B:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39A:', 'Percentage Credit Amount Tolerance', 'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount, if changed.',
    'MT707', 'es', 'GENERAL', 19,
    0, 1,
    'NUMBER', 'INPUT', '2n', 'O',
    'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39A:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39A:', 'Percentage Credit Amount Tolerance', 'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount, if changed.',
    'MT707', 'en', 'GENERAL', 19,
    0, 1,
    'NUMBER', 'INPUT', '2n', 'O',
    'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39A:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39C:', 'Additional Amounts Covered', 'This field specifies amendments to any additional amounts covered, such as insurance, freight, interest, etc.',
    'MT707', 'es', 'GENERAL', 20,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies amendments to any additional amounts covered, such as insurance, freight, interest, etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39C:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39C:', 'Additional Amounts Covered', 'This field specifies amendments to any additional amounts covered, such as insurance, freight, interest, etc.',
    'MT707', 'en', 'GENERAL', 20,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies amendments to any additional amounts covered, such as insurance, freight, interest, etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39C:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':41a:', 'Available With ... By ...', 'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available, if these elements have changed. In option A or D, Code must contain one of the following codes (Error code(s): T68) :',
    'MT707', 'es', 'GENERAL', 21,
    0, 1,
    'SELECT', 'DROPDOWN', '4!a', 'O',
    'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available, if these elements have changed. In option A or D, Code must contain one of the following codes (Error code(s): T68) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':41a:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':41a:', 'Available With ... By ...', 'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available, if these elements have changed. In option A or D, Code must contain one of the following codes (Error code(s): T68) :',
    'MT707', 'en', 'GENERAL', 21,
    0, 1,
    'SELECT', 'DROPDOWN', '4!a', 'O',
    'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available, if these elements have changed. In option A or D, Code must contain one of the following codes (Error code(s): T68) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':41a:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42C:', 'Drafts at ...', 'This field specifies the tenor of drafts to be drawn under the documentary credit, if changed.',
    'MT707', 'es', 'GENERAL', 22,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '3*35x', 'O',
    'This field specifies the tenor of drafts to be drawn under the documentary credit, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42C:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42C:', 'Drafts at ...', 'This field specifies the tenor of drafts to be drawn under the documentary credit, if changed.',
    'MT707', 'en', 'GENERAL', 22,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '3*35x', 'O',
    'This field specifies the tenor of drafts to be drawn under the documentary credit, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42C:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42a:', 'Drawee', 'This field identifies the drawee of the drafts to be drawn under the documentary credit, if changed.',
    'MT707', 'es', 'GENERAL', 23,
    0, 1,
    'TEXT', 'INPUT', '1!a', 'O',
    'This field identifies the drawee of the drafts to be drawn under the documentary credit, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42a:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42a:', 'Drawee', 'This field identifies the drawee of the drafts to be drawn under the documentary credit, if changed.',
    'MT707', 'en', 'GENERAL', 23,
    0, 1,
    'TEXT', 'INPUT', '1!a', 'O',
    'This field identifies the drawee of the drafts to be drawn under the documentary credit, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42a:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42M:', 'Mixed Payment Details', 'This field specifies the payment dates, amounts and/or method for their determination in a documentary credit which is available by mixed payment, if these elements have changed.',
    'MT707', 'es', 'GENERAL', 24,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the payment dates, amounts and/or method for their determination in a documentary credit which is available by mixed payment, if these elements have changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42M:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42M:', 'Mixed Payment Details', 'This field specifies the payment dates, amounts and/or method for their determination in a documentary credit which is available by mixed payment, if these elements have changed.',
    'MT707', 'en', 'GENERAL', 24,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the payment dates, amounts and/or method for their determination in a documentary credit which is available by mixed payment, if these elements have changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42M:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42P:', 'Negotiation/Deferred Payment Details', 'This field specifies the payment date or method for its determination in a documentary credit which is available by deferred payment or negotiation only, if these elements have changed.',
    'MT707', 'es', 'GENERAL', 25,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the payment date or method for its determination in a documentary credit which is available by deferred payment or negotiation only, if these elements have changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42P:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42P:', 'Negotiation/Deferred Payment Details', 'This field specifies the payment date or method for its determination in a documentary credit which is available by deferred payment or negotiation only, if these elements have changed.',
    'MT707', 'en', 'GENERAL', 25,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the payment date or method for its determination in a documentary credit which is available by deferred payment or negotiation only, if these elements have changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42P:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':43P:', 'Partial Shipments', 'This field specifies whether or not partial shipments are allowed under the documentary credit, if changed. Code must contain one of the following codes (Error code(s): T64) :',
    'MT707', 'es', 'GENERAL', 26,
    0, 1,
    'SELECT', 'DROPDOWN', '11x', 'O',
    'This field specifies whether or not partial shipments are allowed under the documentary credit, if changed. Code must contain one of the following codes (Error code(s): T64) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':43P:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':43P:', 'Partial Shipments', 'This field specifies whether or not partial shipments are allowed under the documentary credit, if changed. Code must contain one of the following codes (Error code(s): T64) :',
    'MT707', 'en', 'GENERAL', 26,
    0, 1,
    'SELECT', 'DROPDOWN', '11x', 'O',
    'This field specifies whether or not partial shipments are allowed under the documentary credit, if changed. Code must contain one of the following codes (Error code(s): T64) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':43P:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':43T:', 'Transhipment', 'This field specifies whether or not transhipment is allowed under the documentary credit, if changed. Code must contain one of the following codes (Error code(s): T65) :',
    'MT707', 'es', 'GENERAL', 27,
    0, 1,
    'SELECT', 'DROPDOWN', '11x', 'O',
    'This field specifies whether or not transhipment is allowed under the documentary credit, if changed. Code must contain one of the following codes (Error code(s): T65) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':43T:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':43T:', 'Transhipment', 'This field specifies whether or not transhipment is allowed under the documentary credit, if changed. Code must contain one of the following codes (Error code(s): T65) :',
    'MT707', 'en', 'GENERAL', 27,
    0, 1,
    'SELECT', 'DROPDOWN', '11x', 'O',
    'This field specifies whether or not transhipment is allowed under the documentary credit, if changed. Code must contain one of the following codes (Error code(s): T65) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':43T:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44A:', 'Place of Taking in Charge/Dispatch from .../Place of Receipt', 'This field specifies amendments to the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.',
    'MT707', 'es', 'GENERAL', 28,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies amendments to the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44A:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44A:', 'Place of Taking in Charge/Dispatch from .../Place of Receipt', 'This field specifies amendments to the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.',
    'MT707', 'en', 'GENERAL', 28,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies amendments to the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44A:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44E:', 'Port of Loading/Airport of Departure', 'This field specifies amendments to the port of loading or airport of departure to be indicated on the transport document.',
    'MT707', 'es', 'GENERAL', 29,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies amendments to the port of loading or airport of departure to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44E:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44E:', 'Port of Loading/Airport of Departure', 'This field specifies amendments to the port of loading or airport of departure to be indicated on the transport document.',
    'MT707', 'en', 'GENERAL', 29,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies amendments to the port of loading or airport of departure to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44E:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44F:', 'Port of Discharge/Airport of Destination', 'This field specifies amendments to the port of discharge or airport of destination to be indicated on the transport document.',
    'MT707', 'es', 'GENERAL', 30,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies amendments to the port of discharge or airport of destination to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44F:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44F:', 'Port of Discharge/Airport of Destination', 'This field specifies amendments to the port of discharge or airport of destination to be indicated on the transport document.',
    'MT707', 'en', 'GENERAL', 30,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies amendments to the port of discharge or airport of destination to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44F:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44B:', 'Place of Final Destination/For Transportation to .../Place of Delivery', 'This field specifies amendments to the place of final destination or place of delivery to be indicated on the transport document.',
    'MT707', 'es', 'GENERAL', 31,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies amendments to the place of final destination or place of delivery to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44B:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44B:', 'Place of Final Destination/For Transportation to .../Place of Delivery', 'This field specifies amendments to the place of final destination or place of delivery to be indicated on the transport document.',
    'MT707', 'en', 'GENERAL', 31,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies amendments to the place of final destination or place of delivery to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44B:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44C:', 'Latest Date of Shipment', 'This field specifies amendments to the latest date for loading on board/dispatch/taking in charge, if changed.',
    'MT707', 'es', 'GENERAL', 32,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies amendments to the latest date for loading on board/dispatch/taking in charge, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44C:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44C:', 'Latest Date of Shipment', 'This field specifies amendments to the latest date for loading on board/dispatch/taking in charge, if changed.',
    'MT707', 'en', 'GENERAL', 32,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies amendments to the latest date for loading on board/dispatch/taking in charge, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44C:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44D:', 'Shipment Period', 'This field specifies the period of time, if changed, during which the goods are to be loaded on board/despatched/taken in charge, if changed.',
    'MT707', 'es', 'GENERAL', 33,
    0, 1,
    'DATE', 'DATE_PICKER', '6*65x', 'O',
    'This field specifies the period of time, if changed, during which the goods are to be loaded on board/despatched/taken in charge, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44D:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44D:', 'Shipment Period', 'This field specifies the period of time, if changed, during which the goods are to be loaded on board/despatched/taken in charge, if changed.',
    'MT707', 'en', 'GENERAL', 33,
    0, 1,
    'DATE', 'DATE_PICKER', '6*65x', 'O',
    'This field specifies the period of time, if changed, during which the goods are to be loaded on board/despatched/taken in charge, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44D:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45B:', 'Description of Goods and/or Services', 'This field contains a description of the goods and/or services, if changed. One or more of the following codes must be used in Code (Error code(s): T67) :',
    'MT707', 'es', 'GENERAL', 34,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of the goods and/or services, if changed. One or more of the following codes must be used in Code (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45B:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45B:', 'Description of Goods and/or Services', 'This field contains a description of the goods and/or services, if changed. One or more of the following codes must be used in Code (Error code(s): T67) :',
    'MT707', 'en', 'GENERAL', 34,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of the goods and/or services, if changed. One or more of the following codes must be used in Code (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45B:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':46B:', 'Documents Required', 'This field contains a description of any documents required, if changed. One or more of the following codes must be used in Code (Error code(s): T93) :',
    'MT707', 'es', 'GENERAL', 35,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of any documents required, if changed. One or more of the following codes must be used in Code (Error code(s): T93) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':46B:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':46B:', 'Documents Required', 'This field contains a description of any documents required, if changed. One or more of the following codes must be used in Code (Error code(s): T93) :',
    'MT707', 'en', 'GENERAL', 35,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of any documents required, if changed. One or more of the following codes must be used in Code (Error code(s): T93) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':46B:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':47B:', 'Additional Conditions', 'This field contains a description of further conditions of the documentary credit, if changed. One or more of the following codes must be used in Code (Error code(s): T67) :',
    'MT707', 'es', 'GENERAL', 36,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of further conditions of the documentary credit, if changed. One or more of the following codes must be used in Code (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':47B:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':47B:', 'Additional Conditions', 'This field contains a description of further conditions of the documentary credit, if changed. One or more of the following codes must be used in Code (Error code(s): T67) :',
    'MT707', 'en', 'GENERAL', 36,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of further conditions of the documentary credit, if changed. One or more of the following codes must be used in Code (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':47B:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49M:', 'Special Payment Conditions for Beneficiary', 'This field specifies special payment conditions, if changed, applicable to the beneficiary, for example, post-financing request/conditions. One or more of the following codes must be used in Code (Error code(s): T93) :',
    'MT707', 'es', 'GENERAL', 37,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies special payment conditions, if changed, applicable to the beneficiary, for example, post-financing request/conditions. One or more of the following codes must be used in Code (Error code(s): T93) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49M:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49M:', 'Special Payment Conditions for Beneficiary', 'This field specifies special payment conditions, if changed, applicable to the beneficiary, for example, post-financing request/conditions. One or more of the following codes must be used in Code (Error code(s): T93) :',
    'MT707', 'en', 'GENERAL', 37,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies special payment conditions, if changed, applicable to the beneficiary, for example, post-financing request/conditions. One or more of the following codes must be used in Code (Error code(s): T93) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49M:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49N:', 'Special Payment Conditions for Bank Only', 'This field specifies special payment conditions, if changed, applicable to a bank without disclosure to the beneficiary, for example, post-financing request/conditions. Content of the field must specify to which bank it is addressed. One or more of the following codes must be used in Code (Error code(s): T67) :',
    'MT707', 'es', 'GENERAL', 38,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies special payment conditions, if changed, applicable to a bank without disclosure to the beneficiary, for example, post-financing request/conditions. Content of the field must specify to which bank it is addressed. One or more of the following codes must be used in Code (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49N:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49N:', 'Special Payment Conditions for Bank Only', 'This field specifies special payment conditions, if changed, applicable to a bank without disclosure to the beneficiary, for example, post-financing request/conditions. Content of the field must specify to which bank it is addressed. One or more of the following codes must be used in Code (Error code(s): T67) :',
    'MT707', 'en', 'GENERAL', 38,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies special payment conditions, if changed, applicable to a bank without disclosure to the beneficiary, for example, post-financing request/conditions. Content of the field must specify to which bank it is addressed. One or more of the following codes must be used in Code (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49N:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':71D:', 'Charges', 'This field may be used only to specify charges to be borne by the beneficiary, if changed. One or more of the following codes may be used in Code, followed by the currency code and amount:',
    'MT707', 'es', 'GENERAL', 39,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field may be used only to specify charges to be borne by the beneficiary, if changed. One or more of the following codes may be used in Code, followed by the currency code and amount:', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':71D:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':71D:', 'Charges', 'This field may be used only to specify charges to be borne by the beneficiary, if changed. One or more of the following codes may be used in Code, followed by the currency code and amount:',
    'MT707', 'en', 'GENERAL', 39,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field may be used only to specify charges to be borne by the beneficiary, if changed. One or more of the following codes may be used in Code, followed by the currency code and amount:', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':71D:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':71N:', 'Amendment Charge Payable By', 'This field specifies the party responsible for this amendment charge (on both sides). Code must contain one of the following codes (Error code(s): T67) : Narrative text may only be used with code OTHR.',
    'MT707', 'es', 'GENERAL', 40,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies the party responsible for this amendment charge (on both sides). Code must contain one of the following codes (Error code(s): T67) : Narrative text may only be used with code OTHR.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':71N:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':71N:', 'Amendment Charge Payable By', 'This field specifies the party responsible for this amendment charge (on both sides). Code must contain one of the following codes (Error code(s): T67) : Narrative text may only be used with code OTHR.',
    'MT707', 'en', 'GENERAL', 40,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies the party responsible for this amendment charge (on both sides). Code must contain one of the following codes (Error code(s): T67) : Narrative text may only be used with code OTHR.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':71N:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':48:', 'Period for Presentation in Days', 'This field specifies the new number of calendar days after the date of shipment within which the documents must be presented for payment, acceptance, or negotiation, if changed. Narrative should only be used to specify another type of date than a shipment date, for example invoice date, from which the period for presentation begins.',
    'MT707', 'es', 'GENERAL', 41,
    0, 1,
    'NUMBER', 'INPUT', '3n', 'O',
    'This field specifies the new number of calendar days after the date of shipment within which the documents must be presented for payment, acceptance, or negotiation, if changed. Narrative should only be used to specify another type of date than a shipment date, for example invoice date, from which the period for presentation begins.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':48:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':48:', 'Period for Presentation in Days', 'This field specifies the new number of calendar days after the date of shipment within which the documents must be presented for payment, acceptance, or negotiation, if changed. Narrative should only be used to specify another type of date than a shipment date, for example invoice date, from which the period for presentation begins.',
    'MT707', 'en', 'GENERAL', 41,
    0, 1,
    'NUMBER', 'INPUT', '3n', 'O',
    'This field specifies the new number of calendar days after the date of shipment within which the documents must be presented for payment, acceptance, or negotiation, if changed. Narrative should only be used to specify another type of date than a shipment date, for example invoice date, from which the period for presentation begins.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':48:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49:', 'Confirmation Instructions', 'This field contains confirmation instructions for the requested confirmation party, if changed. Instruction must contain one of the following codes (Error code(s): T67) :',
    'MT707', 'es', 'GENERAL', 42,
    0, 1,
    'SELECT', 'DROPDOWN', '7!x', 'O',
    'This field contains confirmation instructions for the requested confirmation party, if changed. Instruction must contain one of the following codes (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49:', 'Confirmation Instructions', 'This field contains confirmation instructions for the requested confirmation party, if changed. Instruction must contain one of the following codes (Error code(s): T67) :',
    'MT707', 'en', 'GENERAL', 42,
    0, 1,
    'SELECT', 'DROPDOWN', '7!x', 'O',
    'This field contains confirmation instructions for the requested confirmation party, if changed. Instruction must contain one of the following codes (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':58a:', 'Requested Confirmation Party', 'Bank which is requested to add its confirmation or may add its confirmation, if changed.',
    'MT707', 'es', 'GENERAL', 43,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'Bank which is requested to add its confirmation or may add its confirmation, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':58a:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':58a:', 'Requested Confirmation Party', 'Bank which is requested to add its confirmation or may add its confirmation, if changed.',
    'MT707', 'en', 'GENERAL', 43,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'Bank which is requested to add its confirmation or may add its confirmation, if changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':58a:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':53a:', 'Reimbursing Bank', 'This field specifies the name of the bank which has been authorised by the Sender to reimburse drawings under the documentary credit, if changed. This may be a branch of the Sender or the Receiver, or an entirely different bank.',
    'MT707', 'es', 'GENERAL', 44,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the name of the bank which has been authorised by the Sender to reimburse drawings under the documentary credit, if changed. This may be a branch of the Sender or the Receiver, or an entirely different bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':53a:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':53a:', 'Reimbursing Bank', 'This field specifies the name of the bank which has been authorised by the Sender to reimburse drawings under the documentary credit, if changed. This may be a branch of the Sender or the Receiver, or an entirely different bank.',
    'MT707', 'en', 'GENERAL', 44,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the name of the bank which has been authorised by the Sender to reimburse drawings under the documentary credit, if changed. This may be a branch of the Sender or the Receiver, or an entirely different bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':53a:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78:', 'Instructions to the Paying/Accepting/Negotiating Bank', 'This field specifies instructions to the paying, accepting or negotiating bank, if changed . The presence of this field implies that description of instructions is amended.',
    'MT707', 'es', 'GENERAL', 45,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies instructions to the paying, accepting or negotiating bank, if changed . The presence of this field implies that description of instructions is amended.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78:', 'Instructions to the Paying/Accepting/Negotiating Bank', 'This field specifies instructions to the paying, accepting or negotiating bank, if changed . The presence of this field implies that description of instructions is amended.',
    'MT707', 'en', 'GENERAL', 45,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies instructions to the paying, accepting or negotiating bank, if changed . The presence of this field implies that description of instructions is amended.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', '''Advise Through'' Bank', 'This field identifies the bank, if different from the Receiver, through which the documentary credit amendment is to be advised to the beneficiary.',
    'MT707', 'es', 'GENERAL', 46,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field identifies the bank, if different from the Receiver, through which the documentary credit amendment is to be advised to the beneficiary.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', '''Advise Through'' Bank', 'This field identifies the bank, if different from the Receiver, through which the documentary credit amendment is to be advised to the beneficiary.',
    'MT707', 'en', 'GENERAL', 46,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field identifies the bank, if different from the Receiver, through which the documentary credit amendment is to be advised to the beneficiary.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.',
    'MT707', 'es', 'GENERAL', 47,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT707'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.',
    'MT707', 'en', 'GENERAL', 47,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT707'
    AND language = 'en'
    AND spec_version = '2025'
);

-- MT710 Fields (43 fields)
-- ==================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':27:', 'Sequence of Total', 'This field specifies the number of this message in the series of messages sent for a documentary credit, and the total number of messages in the series.',
    'MT710', 'es', 'GENERAL', 1,
    1, 1,
    'NUMBER', 'INPUT', '1!n', 'M',
    'This field specifies the number of this message in the series of messages sent for a documentary credit, and the total number of messages in the series.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':27:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':27:', 'Sequence of Total', 'This field specifies the number of this message in the series of messages sent for a documentary credit, and the total number of messages in the series.',
    'MT710', 'en', 'GENERAL', 1,
    1, 1,
    'NUMBER', 'INPUT', '1!n', 'M',
    'This field specifies the number of this message in the series of messages sent for a documentary credit, and the total number of messages in the series.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':27:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40B:', 'Form of Documentary Credit', 'This field specifies the type of credit and whether or not the Sender is adding its confirmation to the credit. Type must contain one of the following codes (Error code(s): T60) : Code must contain one of the following codes (Error code(s): T66) : Details of any special conditions applying to the transferability of the credit and/or the bank authorised to transfer the credit in a freely negotiable credit should be included in field 47A Additional Conditions.',
    'MT710', 'es', 'GENERAL', 2,
    1, 1,
    'TEXT', 'INPUT', '24x', 'M',
    'This field specifies the type of credit and whether or not the Sender is adding its confirmation to the credit. Type must contain one of the following codes (Error code(s): T60) : Code must contain one of the following codes (Error code(s): T66) : Details of any special conditions applying to the transferability of the credit and/or the bank authorised to transfer the credit in a freely negotiable credit should be included in field 47A Additional Conditions.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40B:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40B:', 'Form of Documentary Credit', 'This field specifies the type of credit and whether or not the Sender is adding its confirmation to the credit. Type must contain one of the following codes (Error code(s): T60) : Code must contain one of the following codes (Error code(s): T66) : Details of any special conditions applying to the transferability of the credit and/or the bank authorised to transfer the credit in a freely negotiable credit should be included in field 47A Additional Conditions.',
    'MT710', 'en', 'GENERAL', 2,
    1, 1,
    'TEXT', 'INPUT', '24x', 'M',
    'This field specifies the type of credit and whether or not the Sender is adding its confirmation to the credit. Type must contain one of the following codes (Error code(s): T60) : Code must contain one of the following codes (Error code(s): T66) : Details of any special conditions applying to the transferability of the credit and/or the bank authorised to transfer the credit in a freely negotiable credit should be included in field 47A Additional Conditions.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40B:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Sender''s Reference', 'This field contains the reference number which the Sender has assigned to the documentary credit.',
    'MT710', 'es', 'GENERAL', 3,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field contains the reference number which the Sender has assigned to the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Sender''s Reference', 'This field contains the reference number which the Sender has assigned to the documentary credit.',
    'MT710', 'en', 'GENERAL', 3,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field contains the reference number which the Sender has assigned to the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':21:', 'Documentary Credit Number', 'This field specifies the documentary credit number which has been assigned by the issuing bank.',
    'MT710', 'es', 'GENERAL', 4,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the documentary credit number which has been assigned by the issuing bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':21:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':21:', 'Documentary Credit Number', 'This field specifies the documentary credit number which has been assigned by the issuing bank.',
    'MT710', 'en', 'GENERAL', 4,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the documentary credit number which has been assigned by the issuing bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':21:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23:', 'Reference to Pre-Advice', 'This field specifies if the documentary credit has been pre-advised. This field must contain the code PREADV followed by a slash ''/'' and a reference to the pre-advice, for example, by date.',
    'MT710', 'es', 'GENERAL', 5,
    0, 1,
    'TEXT', 'INPUT', '16x', 'O',
    'This field specifies if the documentary credit has been pre-advised. This field must contain the code PREADV followed by a slash ''/'' and a reference to the pre-advice, for example, by date.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23:', 'Reference to Pre-Advice', 'This field specifies if the documentary credit has been pre-advised. This field must contain the code PREADV followed by a slash ''/'' and a reference to the pre-advice, for example, by date.',
    'MT710', 'en', 'GENERAL', 5,
    0, 1,
    'TEXT', 'INPUT', '16x', 'O',
    'This field specifies if the documentary credit has been pre-advised. This field must contain the code PREADV followed by a slash ''/'' and a reference to the pre-advice, for example, by date.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31C:', 'Date of Issue', 'This field specifies the date on which the issuing bank considers the documentary credit as being issued.',
    'MT710', 'es', 'GENERAL', 6,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date on which the issuing bank considers the documentary credit as being issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31C:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31C:', 'Date of Issue', 'This field specifies the date on which the issuing bank considers the documentary credit as being issued.',
    'MT710', 'en', 'GENERAL', 6,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date on which the issuing bank considers the documentary credit as being issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31C:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40E:', 'Applicable Rules', 'This field specifies the rules the credit is subject to. Applicable Rules must contain one of the following codes (Error code(s): T59) :',
    'MT710', 'es', 'GENERAL', 7,
    1, 1,
    'SELECT', 'DROPDOWN', '30x', 'M',
    'This field specifies the rules the credit is subject to. Applicable Rules must contain one of the following codes (Error code(s): T59) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40E:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40E:', 'Applicable Rules', 'This field specifies the rules the credit is subject to. Applicable Rules must contain one of the following codes (Error code(s): T59) :',
    'MT710', 'en', 'GENERAL', 7,
    1, 1,
    'SELECT', 'DROPDOWN', '30x', 'M',
    'This field specifies the rules the credit is subject to. Applicable Rules must contain one of the following codes (Error code(s): T59) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40E:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31D:', 'Date and Place of Expiry', 'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented.',
    'MT710', 'es', 'GENERAL', 8,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31D:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31D:', 'Date and Place of Expiry', 'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented.',
    'MT710', 'en', 'GENERAL', 8,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31D:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuing Bank', 'This field specifies the issuing bank of the credit.',
    'MT710', 'es', 'GENERAL', 9,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the issuing bank of the credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuing Bank', 'This field specifies the issuing bank of the credit.',
    'MT710', 'en', 'GENERAL', 9,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the issuing bank of the credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50B:', 'Non-Bank Issuer', 'This field specifies the non-bank issuer of the credit.',
    'MT710', 'es', 'GENERAL', 10,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the non-bank issuer of the credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50B:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50B:', 'Non-Bank Issuer', 'This field specifies the non-bank issuer of the credit.',
    'MT710', 'en', 'GENERAL', 10,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the non-bank issuer of the credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50B:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':51a:', 'Applicant Bank', 'This field specifies the bank of the applicant customer, if different from the issuing bank.',
    'MT710', 'es', 'GENERAL', 11,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the bank of the applicant customer, if different from the issuing bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':51a:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':51a:', 'Applicant Bank', 'This field specifies the bank of the applicant customer, if different from the issuing bank.',
    'MT710', 'en', 'GENERAL', 11,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the bank of the applicant customer, if different from the issuing bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':51a:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50:', 'Applicant', 'This field specifies the party on behalf of which the documentary credit has been issued.',
    'MT710', 'es', 'GENERAL', 12,
    1, 1,
    'PARTICIPANT', 'PARTICIPANT_SELECTOR', '4*35x', 'M',
    'This field specifies the party on behalf of which the documentary credit has been issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50:', 'Applicant', 'This field specifies the party on behalf of which the documentary credit has been issued.',
    'MT710', 'en', 'GENERAL', 12,
    1, 1,
    'PARTICIPANT', 'PARTICIPANT_SELECTOR', '4*35x', 'M',
    'This field specifies the party on behalf of which the documentary credit has been issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59:', 'Beneficiary', 'This field specifies the party in favour of which the documentary credit has been issued.',
    'MT710', 'es', 'GENERAL', 13,
    1, 1,
    'PARTICIPANT', 'NON_CLIENT_SELECTOR', '[/34x]4*35x', 'M',
    'This field specifies the party in favour of which the documentary credit has been issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59:', 'Beneficiary', 'This field specifies the party in favour of which the documentary credit has been issued.',
    'MT710', 'en', 'GENERAL', 13,
    1, 1,
    'PARTICIPANT', 'NON_CLIENT_SELECTOR', '[/34x]4*35x', 'M',
    'This field specifies the party in favour of which the documentary credit has been issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Currency Code, Amount', 'This field contains the currency code and amount of the documentary credit.',
    'MT710', 'es', 'GENERAL', 14,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field contains the currency code and amount of the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Currency Code, Amount', 'This field contains the currency code and amount of the documentary credit.',
    'MT710', 'en', 'GENERAL', 14,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field contains the currency code and amount of the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39A:', 'Percentage Credit Amount Tolerance', 'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount. Tolerance 1 specifies a positive tolerance, Tolerance 2 specifies a negative tolerance.',
    'MT710', 'es', 'GENERAL', 15,
    0, 1,
    'NUMBER', 'INPUT', '2n', 'O',
    'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount. Tolerance 1 specifies a positive tolerance, Tolerance 2 specifies a negative tolerance.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39A:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39A:', 'Percentage Credit Amount Tolerance', 'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount. Tolerance 1 specifies a positive tolerance, Tolerance 2 specifies a negative tolerance.',
    'MT710', 'en', 'GENERAL', 15,
    0, 1,
    'NUMBER', 'INPUT', '2n', 'O',
    'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount. Tolerance 1 specifies a positive tolerance, Tolerance 2 specifies a negative tolerance.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39A:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39C:', 'Additional Amounts Covered', 'This field specifies any additional amounts covered such as insurance, freight, interest, etc.',
    'MT710', 'es', 'GENERAL', 16,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies any additional amounts covered such as insurance, freight, interest, etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39C:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39C:', 'Additional Amounts Covered', 'This field specifies any additional amounts covered such as insurance, freight, interest, etc.',
    'MT710', 'en', 'GENERAL', 16,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies any additional amounts covered such as insurance, freight, interest, etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39C:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':41a:', 'Available With ... By ...', 'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available. In option A or D, Code must contain one of the following codes (Error code(s): T68) :',
    'MT710', 'es', 'GENERAL', 17,
    1, 1,
    'SELECT', 'DROPDOWN', '4!a', 'M',
    'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available. In option A or D, Code must contain one of the following codes (Error code(s): T68) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':41a:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':41a:', 'Available With ... By ...', 'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available. In option A or D, Code must contain one of the following codes (Error code(s): T68) :',
    'MT710', 'en', 'GENERAL', 17,
    1, 1,
    'SELECT', 'DROPDOWN', '4!a', 'M',
    'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available. In option A or D, Code must contain one of the following codes (Error code(s): T68) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':41a:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42C:', 'Drafts at ...', 'This field specifies the tenor of drafts to be drawn under the documentary credit.',
    'MT710', 'es', 'GENERAL', 18,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '3*35x', 'O',
    'This field specifies the tenor of drafts to be drawn under the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42C:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42C:', 'Drafts at ...', 'This field specifies the tenor of drafts to be drawn under the documentary credit.',
    'MT710', 'en', 'GENERAL', 18,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '3*35x', 'O',
    'This field specifies the tenor of drafts to be drawn under the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42C:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42a:', 'Drawee', 'This field identifies the drawee of the drafts to be drawn under the documentary credit.',
    'MT710', 'es', 'GENERAL', 19,
    0, 1,
    'TEXT', 'INPUT', '1!a', 'O',
    'This field identifies the drawee of the drafts to be drawn under the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42a:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42a:', 'Drawee', 'This field identifies the drawee of the drafts to be drawn under the documentary credit.',
    'MT710', 'en', 'GENERAL', 19,
    0, 1,
    'TEXT', 'INPUT', '1!a', 'O',
    'This field identifies the drawee of the drafts to be drawn under the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42a:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42M:', 'Mixed Payment Details', 'This field specifies the payment dates, amounts and/or method for their determination in a documentary credit which is available by mixed payment.',
    'MT710', 'es', 'GENERAL', 20,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the payment dates, amounts and/or method for their determination in a documentary credit which is available by mixed payment.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42M:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42M:', 'Mixed Payment Details', 'This field specifies the payment dates, amounts and/or method for their determination in a documentary credit which is available by mixed payment.',
    'MT710', 'en', 'GENERAL', 20,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the payment dates, amounts and/or method for their determination in a documentary credit which is available by mixed payment.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42M:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42P:', 'Negotiation/Deferred Payment Details', 'This field specifies the payment date or method for its determination in a documentary credit which is available by deferred payment or negotiation only.',
    'MT710', 'es', 'GENERAL', 21,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the payment date or method for its determination in a documentary credit which is available by deferred payment or negotiation only.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42P:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42P:', 'Negotiation/Deferred Payment Details', 'This field specifies the payment date or method for its determination in a documentary credit which is available by deferred payment or negotiation only.',
    'MT710', 'en', 'GENERAL', 21,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the payment date or method for its determination in a documentary credit which is available by deferred payment or negotiation only.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42P:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':43P:', 'Partial Shipments', 'This field specifies whether or not partial shipments are allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T64) :',
    'MT710', 'es', 'GENERAL', 22,
    0, 1,
    'SELECT', 'DROPDOWN', '11x', 'O',
    'This field specifies whether or not partial shipments are allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T64) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':43P:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':43P:', 'Partial Shipments', 'This field specifies whether or not partial shipments are allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T64) :',
    'MT710', 'en', 'GENERAL', 22,
    0, 1,
    'SELECT', 'DROPDOWN', '11x', 'O',
    'This field specifies whether or not partial shipments are allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T64) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':43P:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':43T:', 'Transhipment', 'This field specifies whether or not transhipment is allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T65) :',
    'MT710', 'es', 'GENERAL', 23,
    0, 1,
    'SELECT', 'DROPDOWN', '11x', 'O',
    'This field specifies whether or not transhipment is allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T65) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':43T:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':43T:', 'Transhipment', 'This field specifies whether or not transhipment is allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T65) :',
    'MT710', 'en', 'GENERAL', 23,
    0, 1,
    'SELECT', 'DROPDOWN', '11x', 'O',
    'This field specifies whether or not transhipment is allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T65) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':43T:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44A:', 'Place of Taking in Charge/Dispatch from .../Place of Receipt', 'This field specifies the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.',
    'MT710', 'es', 'GENERAL', 24,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44A:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44A:', 'Place of Taking in Charge/Dispatch from .../Place of Receipt', 'This field specifies the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.',
    'MT710', 'en', 'GENERAL', 24,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44A:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44E:', 'Port of Loading/Airport of Departure', 'This field specifies the port of loading or airport of departure to be indicated on the transport document.',
    'MT710', 'es', 'GENERAL', 25,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the port of loading or airport of departure to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44E:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44E:', 'Port of Loading/Airport of Departure', 'This field specifies the port of loading or airport of departure to be indicated on the transport document.',
    'MT710', 'en', 'GENERAL', 25,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the port of loading or airport of departure to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44E:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44F:', 'Port of Discharge/Airport of Destination', 'This field specifies the port of discharge or airport of destination to be indicated on the transport document.',
    'MT710', 'es', 'GENERAL', 26,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the port of discharge or airport of destination to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44F:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44F:', 'Port of Discharge/Airport of Destination', 'This field specifies the port of discharge or airport of destination to be indicated on the transport document.',
    'MT710', 'en', 'GENERAL', 26,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the port of discharge or airport of destination to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44F:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44B:', 'Place of Final Destination/For Transportation to .../Place of Delivery', 'This field specifies the final destination or place of delivery to be indicated on the transport document.',
    'MT710', 'es', 'GENERAL', 27,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the final destination or place of delivery to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44B:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44B:', 'Place of Final Destination/For Transportation to .../Place of Delivery', 'This field specifies the final destination or place of delivery to be indicated on the transport document.',
    'MT710', 'en', 'GENERAL', 27,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the final destination or place of delivery to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44B:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44C:', 'Latest Date of Shipment', 'This field specifies the latest date for loading on board/dispatch/taking in charge.',
    'MT710', 'es', 'GENERAL', 28,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the latest date for loading on board/dispatch/taking in charge.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44C:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44C:', 'Latest Date of Shipment', 'This field specifies the latest date for loading on board/dispatch/taking in charge.',
    'MT710', 'en', 'GENERAL', 28,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the latest date for loading on board/dispatch/taking in charge.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44C:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44D:', 'Shipment Period', 'This field specifies the period of time during which the goods are to be loaded on board/despatched/taken in charge.',
    'MT710', 'es', 'GENERAL', 29,
    0, 1,
    'DATE', 'DATE_PICKER', '6*65x', 'O',
    'This field specifies the period of time during which the goods are to be loaded on board/despatched/taken in charge.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44D:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44D:', 'Shipment Period', 'This field specifies the period of time during which the goods are to be loaded on board/despatched/taken in charge.',
    'MT710', 'en', 'GENERAL', 29,
    0, 1,
    'DATE', 'DATE_PICKER', '6*65x', 'O',
    'This field specifies the period of time during which the goods are to be loaded on board/despatched/taken in charge.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44D:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45A:', 'Description of Goods and/or Services', 'This field contains a description of the goods and/or services. Terms such as FOB, CIF, etc. should be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.',
    'MT710', 'es', 'GENERAL', 30,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of the goods and/or services. Terms such as FOB, CIF, etc. should be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45A:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45A:', 'Description of Goods and/or Services', 'This field contains a description of the goods and/or services. Terms such as FOB, CIF, etc. should be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.',
    'MT710', 'en', 'GENERAL', 30,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of the goods and/or services. Terms such as FOB, CIF, etc. should be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45A:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':46A:', 'Documents Required', 'This field contains a description of any documents required. When the ultimate date of issue of a transport document is specified, it is to be specified with the relative document in this field. For credits subject to eUCP, the format in which electronic records are to be presented must be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.',
    'MT710', 'es', 'GENERAL', 31,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of any documents required. When the ultimate date of issue of a transport document is specified, it is to be specified with the relative document in this field. For credits subject to eUCP, the format in which electronic records are to be presented must be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':46A:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':46A:', 'Documents Required', 'This field contains a description of any documents required. When the ultimate date of issue of a transport document is specified, it is to be specified with the relative document in this field. For credits subject to eUCP, the format in which electronic records are to be presented must be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.',
    'MT710', 'en', 'GENERAL', 31,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of any documents required. When the ultimate date of issue of a transport document is specified, it is to be specified with the relative document in this field. For credits subject to eUCP, the format in which electronic records are to be presented must be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':46A:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':47A:', 'Additional Conditions', 'This field contains a description of further conditions of the documentary credit. Where applicable, for credits subject to eUCP: If presentation of both electronic records and paper documents is allowed, the place for presentation of the electronic records (that is, the electronic address to which presentation must be made) as well as the place for presentation of the paper documents must be specified in this field. If presentation of only electronic records is allowed, the place for presentati',
    'MT710', 'es', 'GENERAL', 32,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of further conditions of the documentary credit. Where applicable, for credits subject to eUCP: If presentation of both electronic records and paper documents is allowed, the place for presentation of the electronic records (that is, the electronic address to which presentation must be made) as well as the place for presentation of the paper documents must be specified in this field. If presentation of only electronic records is allowed, the place for presentati', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':47A:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':47A:', 'Additional Conditions', 'This field contains a description of further conditions of the documentary credit. Where applicable, for credits subject to eUCP: If presentation of both electronic records and paper documents is allowed, the place for presentation of the electronic records (that is, the electronic address to which presentation must be made) as well as the place for presentation of the paper documents must be specified in this field. If presentation of only electronic records is allowed, the place for presentati',
    'MT710', 'en', 'GENERAL', 32,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of further conditions of the documentary credit. Where applicable, for credits subject to eUCP: If presentation of both electronic records and paper documents is allowed, the place for presentation of the electronic records (that is, the electronic address to which presentation must be made) as well as the place for presentation of the paper documents must be specified in this field. If presentation of only electronic records is allowed, the place for presentati', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':47A:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49G:', 'Special Payment Conditions for Beneficiary', 'This field specifies special payment conditions applicable to the beneficiary, for example, post-financing request/conditions.',
    'MT710', 'es', 'GENERAL', 33,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies special payment conditions applicable to the beneficiary, for example, post-financing request/conditions.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49G:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49G:', 'Special Payment Conditions for Beneficiary', 'This field specifies special payment conditions applicable to the beneficiary, for example, post-financing request/conditions.',
    'MT710', 'en', 'GENERAL', 33,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies special payment conditions applicable to the beneficiary, for example, post-financing request/conditions.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49G:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49H:', 'Special Payment Conditions for Bank Only', 'This field specifies special payment conditions applicable to a bank without disclosure to the beneficiary, for example, post-financing request/conditions. Content of the field must specify to which bank it is addressed.',
    'MT710', 'es', 'GENERAL', 34,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies special payment conditions applicable to a bank without disclosure to the beneficiary, for example, post-financing request/conditions. Content of the field must specify to which bank it is addressed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49H:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49H:', 'Special Payment Conditions for Bank Only', 'This field specifies special payment conditions applicable to a bank without disclosure to the beneficiary, for example, post-financing request/conditions. Content of the field must specify to which bank it is addressed.',
    'MT710', 'en', 'GENERAL', 34,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies special payment conditions applicable to a bank without disclosure to the beneficiary, for example, post-financing request/conditions. Content of the field must specify to which bank it is addressed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49H:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':71D:', 'Charges', 'This field may be used only to specify charges to be borne by the beneficiary. One or more of the following codes may be used in Code, followed by the currency code and amount: In the absence of this field, all charges, except negotiation and transfer charges, are to be borne by the applicant. Any code used in this field must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information',
    'MT710', 'es', 'GENERAL', 35,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field may be used only to specify charges to be borne by the beneficiary. One or more of the following codes may be used in Code, followed by the currency code and amount: In the absence of this field, all charges, except negotiation and transfer charges, are to be borne by the applicant. Any code used in this field must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':71D:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':71D:', 'Charges', 'This field may be used only to specify charges to be borne by the beneficiary. One or more of the following codes may be used in Code, followed by the currency code and amount: In the absence of this field, all charges, except negotiation and transfer charges, are to be borne by the applicant. Any code used in this field must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information',
    'MT710', 'en', 'GENERAL', 35,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field may be used only to specify charges to be borne by the beneficiary. One or more of the following codes may be used in Code, followed by the currency code and amount: In the absence of this field, all charges, except negotiation and transfer charges, are to be borne by the applicant. Any code used in this field must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':71D:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':48:', 'Period for Presentation in Days', 'This field specifies the number of calendar days after the date of shipment within which the documents must be presented for payment, acceptance, or negotiation. The second subfield is used to specify another type of date than a shipment date, for example invoice date, from which the period for presentation begins. It should only be used in that case. The absence of this field means that the presentation period is 21 days after the date of shipment, where applicable.',
    'MT710', 'es', 'GENERAL', 36,
    0, 1,
    'NUMBER', 'INPUT', '3n', 'O',
    'This field specifies the number of calendar days after the date of shipment within which the documents must be presented for payment, acceptance, or negotiation. The second subfield is used to specify another type of date than a shipment date, for example invoice date, from which the period for presentation begins. It should only be used in that case. The absence of this field means that the presentation period is 21 days after the date of shipment, where applicable.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':48:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':48:', 'Period for Presentation in Days', 'This field specifies the number of calendar days after the date of shipment within which the documents must be presented for payment, acceptance, or negotiation. The second subfield is used to specify another type of date than a shipment date, for example invoice date, from which the period for presentation begins. It should only be used in that case. The absence of this field means that the presentation period is 21 days after the date of shipment, where applicable.',
    'MT710', 'en', 'GENERAL', 36,
    0, 1,
    'NUMBER', 'INPUT', '3n', 'O',
    'This field specifies the number of calendar days after the date of shipment within which the documents must be presented for payment, acceptance, or negotiation. The second subfield is used to specify another type of date than a shipment date, for example invoice date, from which the period for presentation begins. It should only be used in that case. The absence of this field means that the presentation period is 21 days after the date of shipment, where applicable.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':48:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49:', 'Confirmation Instructions', 'This field contains confirmation instructions from the issuing bank for the requested confirmation party. Instruction must contain one of the following codes (Error code(s): T67) :',
    'MT710', 'es', 'GENERAL', 37,
    1, 1,
    'SELECT', 'DROPDOWN', '7!x', 'M',
    'This field contains confirmation instructions from the issuing bank for the requested confirmation party. Instruction must contain one of the following codes (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49:', 'Confirmation Instructions', 'This field contains confirmation instructions from the issuing bank for the requested confirmation party. Instruction must contain one of the following codes (Error code(s): T67) :',
    'MT710', 'en', 'GENERAL', 37,
    1, 1,
    'SELECT', 'DROPDOWN', '7!x', 'M',
    'This field contains confirmation instructions from the issuing bank for the requested confirmation party. Instruction must contain one of the following codes (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':58a:', 'Requested Confirmation Party', 'Bank which is requested to add its confirmation or may add its confirmation.',
    'MT710', 'es', 'GENERAL', 38,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'Bank which is requested to add its confirmation or may add its confirmation.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':58a:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':58a:', 'Requested Confirmation Party', 'Bank which is requested to add its confirmation or may add its confirmation.',
    'MT710', 'en', 'GENERAL', 38,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'Bank which is requested to add its confirmation or may add its confirmation.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':58a:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':53a:', 'Reimbursing Bank', 'This field specifies the name of the bank or branch of the Receiver which has been authorised by the issuing bank to reimburse drawings under the documentary credit.',
    'MT710', 'es', 'GENERAL', 39,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the name of the bank or branch of the Receiver which has been authorised by the issuing bank to reimburse drawings under the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':53a:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':53a:', 'Reimbursing Bank', 'This field specifies the name of the bank or branch of the Receiver which has been authorised by the issuing bank to reimburse drawings under the documentary credit.',
    'MT710', 'en', 'GENERAL', 39,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the name of the bank or branch of the Receiver which has been authorised by the issuing bank to reimburse drawings under the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':53a:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78:', 'Instructions to the Paying/Accepting/Negotiating Bank', 'This field specifies instructions to the paying, accepting or negotiating bank. It may also indicate if pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required. When used to indicate pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required, the number and type, that is, banking or calendar, of days within which the issuing bank has to be notified should also be indicated.',
    'MT710', 'es', 'GENERAL', 40,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies instructions to the paying, accepting or negotiating bank. It may also indicate if pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required. When used to indicate pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required, the number and type, that is, banking or calendar, of days within which the issuing bank has to be notified should also be indicated.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78:', 'Instructions to the Paying/Accepting/Negotiating Bank', 'This field specifies instructions to the paying, accepting or negotiating bank. It may also indicate if pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required. When used to indicate pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required, the number and type, that is, banking or calendar, of days within which the issuing bank has to be notified should also be indicated.',
    'MT710', 'en', 'GENERAL', 40,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies instructions to the paying, accepting or negotiating bank. It may also indicate if pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required. When used to indicate pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required, the number and type, that is, banking or calendar, of days within which the issuing bank has to be notified should also be indicated.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78D:', 'Instructions to Intermediary Bank', 'This field specifies instructions to the intermediary banks.',
    'MT710', 'es', 'GENERAL', 41,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies instructions to the intermediary banks.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78D:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78D:', 'Instructions to Intermediary Bank', 'This field specifies instructions to the intermediary banks.',
    'MT710', 'en', 'GENERAL', 41,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies instructions to the intermediary banks.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78D:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', '''Advise Through'' Bank', 'This field identifies the bank, if different from the Receiver, through which the documentary credit is to be advised/confirmed to the beneficiary.',
    'MT710', 'es', 'GENERAL', 42,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field identifies the bank, if different from the Receiver, through which the documentary credit is to be advised/confirmed to the beneficiary.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', '''Advise Through'' Bank', 'This field identifies the bank, if different from the Receiver, through which the documentary credit is to be advised/confirmed to the beneficiary.',
    'MT710', 'en', 'GENERAL', 42,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field identifies the bank, if different from the Receiver, through which the documentary credit is to be advised/confirmed to the beneficiary.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.',
    'MT710', 'es', 'GENERAL', 43,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT710'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.',
    'MT710', 'en', 'GENERAL', 43,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT710'
    AND language = 'en'
    AND spec_version = '2025'
);

-- MT720 Fields (40 fields)
-- ==================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':27:', 'Sequence of Total', 'This field specifies the number of this message in the series of messages sent for a documentary credit, and the total number of messages in the series.',
    'MT720', 'es', 'GENERAL', 1,
    1, 1,
    'NUMBER', 'INPUT', '1!n', 'M',
    'This field specifies the number of this message in the series of messages sent for a documentary credit, and the total number of messages in the series.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':27:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':27:', 'Sequence of Total', 'This field specifies the number of this message in the series of messages sent for a documentary credit, and the total number of messages in the series.',
    'MT720', 'en', 'GENERAL', 1,
    1, 1,
    'NUMBER', 'INPUT', '1!n', 'M',
    'This field specifies the number of this message in the series of messages sent for a documentary credit, and the total number of messages in the series.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':27:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40B:', 'Form of Documentary Credit', 'This field specifies the type of credit and whether or not the Sender is adding its confirmation to the credit. Type must contain one of the following codes (Error code(s): T64) : Code must contain one of the following codes (Error code(s): T66) :',
    'MT720', 'es', 'GENERAL', 2,
    1, 1,
    'TEXT', 'INPUT', '24x', 'M',
    'This field specifies the type of credit and whether or not the Sender is adding its confirmation to the credit. Type must contain one of the following codes (Error code(s): T64) : Code must contain one of the following codes (Error code(s): T66) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40B:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40B:', 'Form of Documentary Credit', 'This field specifies the type of credit and whether or not the Sender is adding its confirmation to the credit. Type must contain one of the following codes (Error code(s): T64) : Code must contain one of the following codes (Error code(s): T66) :',
    'MT720', 'en', 'GENERAL', 2,
    1, 1,
    'TEXT', 'INPUT', '24x', 'M',
    'This field specifies the type of credit and whether or not the Sender is adding its confirmation to the credit. Type must contain one of the following codes (Error code(s): T64) : Code must contain one of the following codes (Error code(s): T66) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40B:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Transferring Bank''s Reference', 'This field contains the reference number which the transferring bank (Sender) has assigned to the documentary credit.',
    'MT720', 'es', 'GENERAL', 3,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field contains the reference number which the transferring bank (Sender) has assigned to the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Transferring Bank''s Reference', 'This field contains the reference number which the transferring bank (Sender) has assigned to the documentary credit.',
    'MT720', 'en', 'GENERAL', 3,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field contains the reference number which the transferring bank (Sender) has assigned to the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':21:', 'Documentary Credit Number', 'This field specifies the documentary credit number which has been assigned by the issuing bank.',
    'MT720', 'es', 'GENERAL', 4,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the documentary credit number which has been assigned by the issuing bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':21:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':21:', 'Documentary Credit Number', 'This field specifies the documentary credit number which has been assigned by the issuing bank.',
    'MT720', 'en', 'GENERAL', 4,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the documentary credit number which has been assigned by the issuing bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':21:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31C:', 'Date of Issue', 'This field specifies the date on which the issuing bank considers the documentary credit as being issued.',
    'MT720', 'es', 'GENERAL', 5,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date on which the issuing bank considers the documentary credit as being issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31C:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31C:', 'Date of Issue', 'This field specifies the date on which the issuing bank considers the documentary credit as being issued.',
    'MT720', 'en', 'GENERAL', 5,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date on which the issuing bank considers the documentary credit as being issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31C:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40E:', 'Applicable Rules', 'This field specifies the rules the credit is subject to. One of the following codes must be used in Applicable Rules (Error code(s): T59) :',
    'MT720', 'es', 'GENERAL', 6,
    1, 1,
    'SELECT', 'DROPDOWN', '30x', 'M',
    'This field specifies the rules the credit is subject to. One of the following codes must be used in Applicable Rules (Error code(s): T59) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40E:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40E:', 'Applicable Rules', 'This field specifies the rules the credit is subject to. One of the following codes must be used in Applicable Rules (Error code(s): T59) :',
    'MT720', 'en', 'GENERAL', 6,
    1, 1,
    'SELECT', 'DROPDOWN', '30x', 'M',
    'This field specifies the rules the credit is subject to. One of the following codes must be used in Applicable Rules (Error code(s): T59) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40E:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31D:', 'Date and Place of Expiry', 'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented.',
    'MT720', 'es', 'GENERAL', 7,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31D:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31D:', 'Date and Place of Expiry', 'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented.',
    'MT720', 'en', 'GENERAL', 7,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the latest date for presentation under the documentary credit and the place where documents may be presented.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31D:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuing Bank of the Original Documentary Credit', 'This field specifies the issuing bank of the original documentary credit.',
    'MT720', 'es', 'GENERAL', 8,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the issuing bank of the original documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuing Bank of the Original Documentary Credit', 'This field specifies the issuing bank of the original documentary credit.',
    'MT720', 'en', 'GENERAL', 8,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the issuing bank of the original documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50B:', 'Non-Bank Issuer of the Original Documentary Credit', 'This field specifies the non-bank issuer of the original documentary credit.',
    'MT720', 'es', 'GENERAL', 9,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the non-bank issuer of the original documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50B:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50B:', 'Non-Bank Issuer of the Original Documentary Credit', 'This field specifies the non-bank issuer of the original documentary credit.',
    'MT720', 'en', 'GENERAL', 9,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the non-bank issuer of the original documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50B:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50:', 'First Beneficiary', 'This field specifies the party on behalf of which the documentary credit has been issued/transferred.',
    'MT720', 'es', 'GENERAL', 10,
    1, 1,
    'PARTICIPANT', 'PARTICIPANT_SELECTOR', '4*35x', 'M',
    'This field specifies the party on behalf of which the documentary credit has been issued/transferred.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50:', 'First Beneficiary', 'This field specifies the party on behalf of which the documentary credit has been issued/transferred.',
    'MT720', 'en', 'GENERAL', 10,
    1, 1,
    'PARTICIPANT', 'PARTICIPANT_SELECTOR', '4*35x', 'M',
    'This field specifies the party on behalf of which the documentary credit has been issued/transferred.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59:', 'Second Beneficiary', 'This field specifies the name of the beneficiary of the transferred credit, referred to in the UCP as the second beneficiary .',
    'MT720', 'es', 'GENERAL', 11,
    1, 1,
    'PARTICIPANT', 'NON_CLIENT_SELECTOR', '[/34x]4*35x', 'M',
    'This field specifies the name of the beneficiary of the transferred credit, referred to in the UCP as the second beneficiary .', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59:', 'Second Beneficiary', 'This field specifies the name of the beneficiary of the transferred credit, referred to in the UCP as the second beneficiary .',
    'MT720', 'en', 'GENERAL', 11,
    1, 1,
    'PARTICIPANT', 'NON_CLIENT_SELECTOR', '[/34x]4*35x', 'M',
    'This field specifies the name of the beneficiary of the transferred credit, referred to in the UCP as the second beneficiary .', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Currency Code, Amount', 'This field contains the currency code and amount of the documentary credit.',
    'MT720', 'es', 'GENERAL', 12,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field contains the currency code and amount of the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Currency Code, Amount', 'This field contains the currency code and amount of the documentary credit.',
    'MT720', 'en', 'GENERAL', 12,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field contains the currency code and amount of the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39A:', 'Percentage Credit Amount Tolerance', 'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount. Tolerance 1 specifies a positive tolerance, Tolerance 2 specifies a negative tolerance.',
    'MT720', 'es', 'GENERAL', 13,
    0, 1,
    'NUMBER', 'INPUT', '2n', 'O',
    'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount. Tolerance 1 specifies a positive tolerance, Tolerance 2 specifies a negative tolerance.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39A:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39A:', 'Percentage Credit Amount Tolerance', 'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount. Tolerance 1 specifies a positive tolerance, Tolerance 2 specifies a negative tolerance.',
    'MT720', 'en', 'GENERAL', 13,
    0, 1,
    'NUMBER', 'INPUT', '2n', 'O',
    'This field specifies the tolerance relative to the documentary credit amount as a percentage plus and/or minus that amount. Tolerance 1 specifies a positive tolerance, Tolerance 2 specifies a negative tolerance.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39A:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39C:', 'Additional Amounts Covered', 'This field specifies any additional amounts covered such as insurance, freight, interest, etc.',
    'MT720', 'es', 'GENERAL', 14,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies any additional amounts covered such as insurance, freight, interest, etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39C:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39C:', 'Additional Amounts Covered', 'This field specifies any additional amounts covered such as insurance, freight, interest, etc.',
    'MT720', 'en', 'GENERAL', 14,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies any additional amounts covered such as insurance, freight, interest, etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39C:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':41a:', 'Available With ... By ...', 'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available. In option A or D, Code must contain one of the following codes (Error code(s): T68) :',
    'MT720', 'es', 'GENERAL', 15,
    1, 1,
    'SELECT', 'DROPDOWN', '4!a', 'M',
    'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available. In option A or D, Code must contain one of the following codes (Error code(s): T68) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':41a:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':41a:', 'Available With ... By ...', 'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available. In option A or D, Code must contain one of the following codes (Error code(s): T68) :',
    'MT720', 'en', 'GENERAL', 15,
    1, 1,
    'SELECT', 'DROPDOWN', '4!a', 'M',
    'This field identifies the bank with which the credit is available (the place for presentation) and an indication of how the credit is available. In option A or D, Code must contain one of the following codes (Error code(s): T68) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':41a:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42C:', 'Drafts at ...', 'This field specifies the tenor of drafts to be drawn under the documentary credit.',
    'MT720', 'es', 'GENERAL', 16,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '3*35x', 'O',
    'This field specifies the tenor of drafts to be drawn under the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42C:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42C:', 'Drafts at ...', 'This field specifies the tenor of drafts to be drawn under the documentary credit.',
    'MT720', 'en', 'GENERAL', 16,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '3*35x', 'O',
    'This field specifies the tenor of drafts to be drawn under the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42C:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42a:', 'Drawee', 'This field identifies the drawee of the drafts to be drawn under the documentary credit.',
    'MT720', 'es', 'GENERAL', 17,
    0, 1,
    'TEXT', 'INPUT', '1!a', 'O',
    'This field identifies the drawee of the drafts to be drawn under the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42a:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42a:', 'Drawee', 'This field identifies the drawee of the drafts to be drawn under the documentary credit.',
    'MT720', 'en', 'GENERAL', 17,
    0, 1,
    'TEXT', 'INPUT', '1!a', 'O',
    'This field identifies the drawee of the drafts to be drawn under the documentary credit.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42a:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42M:', 'Mixed Payment Details', 'This field specifies the payment dates, amounts and/or method for their determination in a documentary credit which is available by mixed payment.',
    'MT720', 'es', 'GENERAL', 18,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the payment dates, amounts and/or method for their determination in a documentary credit which is available by mixed payment.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42M:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42M:', 'Mixed Payment Details', 'This field specifies the payment dates, amounts and/or method for their determination in a documentary credit which is available by mixed payment.',
    'MT720', 'en', 'GENERAL', 18,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the payment dates, amounts and/or method for their determination in a documentary credit which is available by mixed payment.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42M:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42P:', 'Negotiation/Deferred Payment Details', 'This field specifies the payment date or method for its determination in a documentary credit which is available by deferred payment or negotiation only.',
    'MT720', 'es', 'GENERAL', 19,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the payment date or method for its determination in a documentary credit which is available by deferred payment or negotiation only.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42P:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':42P:', 'Negotiation/Deferred Payment Details', 'This field specifies the payment date or method for its determination in a documentary credit which is available by deferred payment or negotiation only.',
    'MT720', 'en', 'GENERAL', 19,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the payment date or method for its determination in a documentary credit which is available by deferred payment or negotiation only.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':42P:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':43P:', 'Partial Shipments', 'This field specifies whether or not partial shipments are allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T64) :',
    'MT720', 'es', 'GENERAL', 20,
    0, 1,
    'SELECT', 'DROPDOWN', '11x', 'O',
    'This field specifies whether or not partial shipments are allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T64) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':43P:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':43P:', 'Partial Shipments', 'This field specifies whether or not partial shipments are allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T64) :',
    'MT720', 'en', 'GENERAL', 20,
    0, 1,
    'SELECT', 'DROPDOWN', '11x', 'O',
    'This field specifies whether or not partial shipments are allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T64) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':43P:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':43T:', 'Transhipment', 'This field specifies whether or not transhipment is allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T65) :',
    'MT720', 'es', 'GENERAL', 21,
    0, 1,
    'SELECT', 'DROPDOWN', '11x', 'O',
    'This field specifies whether or not transhipment is allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T65) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':43T:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':43T:', 'Transhipment', 'This field specifies whether or not transhipment is allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T65) :',
    'MT720', 'en', 'GENERAL', 21,
    0, 1,
    'SELECT', 'DROPDOWN', '11x', 'O',
    'This field specifies whether or not transhipment is allowed under the documentary credit. Code must contain one of the following codes (Error code(s): T65) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':43T:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44A:', 'Place of Taking in Charge/Dispatch from .../Place of Receipt', 'This field specifies the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.',
    'MT720', 'es', 'GENERAL', 22,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44A:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44A:', 'Place of Taking in Charge/Dispatch from .../Place of Receipt', 'This field specifies the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.',
    'MT720', 'en', 'GENERAL', 22,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the place of taking in charge (in case of a multimodal transport document), the place of receipt (in case of a road, rail or inland waterway transport document or a courier or expedited delivery service document), the place of dispatch or the place of shipment to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44A:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44E:', 'Port of Loading/Airport of Departure', 'This field specifies the port of loading or airport of departure to be indicated on the transport document.',
    'MT720', 'es', 'GENERAL', 23,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the port of loading or airport of departure to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44E:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44E:', 'Port of Loading/Airport of Departure', 'This field specifies the port of loading or airport of departure to be indicated on the transport document.',
    'MT720', 'en', 'GENERAL', 23,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the port of loading or airport of departure to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44E:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44F:', 'Port of Discharge/Airport of Destination', 'This field specifies the port of discharge or airport of destination to be indicated on the transport document.',
    'MT720', 'es', 'GENERAL', 24,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the port of discharge or airport of destination to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44F:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44F:', 'Port of Discharge/Airport of Destination', 'This field specifies the port of discharge or airport of destination to be indicated on the transport document.',
    'MT720', 'en', 'GENERAL', 24,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the port of discharge or airport of destination to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44F:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44B:', 'Place of Final Destination/For Transportation to .../Place of Delivery', 'This field specifies the final destination or place of delivery to be indicated on the transport document.',
    'MT720', 'es', 'GENERAL', 25,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the final destination or place of delivery to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44B:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44B:', 'Place of Final Destination/For Transportation to .../Place of Delivery', 'This field specifies the final destination or place of delivery to be indicated on the transport document.',
    'MT720', 'en', 'GENERAL', 25,
    0, 1,
    'TEXT', 'INPUT', '140z', 'O',
    'This field specifies the final destination or place of delivery to be indicated on the transport document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44B:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44C:', 'Latest Date of Shipment', 'This field specifies the latest date for loading on board/dispatch/taking in charge.',
    'MT720', 'es', 'GENERAL', 26,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the latest date for loading on board/dispatch/taking in charge.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44C:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44C:', 'Latest Date of Shipment', 'This field specifies the latest date for loading on board/dispatch/taking in charge.',
    'MT720', 'en', 'GENERAL', 26,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the latest date for loading on board/dispatch/taking in charge.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44C:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44D:', 'Shipment Period', 'This field specifies the period of time during which the goods are to be loaded on board/despatched/taken in charge.',
    'MT720', 'es', 'GENERAL', 27,
    0, 1,
    'DATE', 'DATE_PICKER', '6*65x', 'O',
    'This field specifies the period of time during which the goods are to be loaded on board/despatched/taken in charge.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44D:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44D:', 'Shipment Period', 'This field specifies the period of time during which the goods are to be loaded on board/despatched/taken in charge.',
    'MT720', 'en', 'GENERAL', 27,
    0, 1,
    'DATE', 'DATE_PICKER', '6*65x', 'O',
    'This field specifies the period of time during which the goods are to be loaded on board/despatched/taken in charge.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44D:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45A:', 'Description of Goods and/or Services', 'This field contains a description of the goods and/or services. Terms such as FOB, CIF, etc. should be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.',
    'MT720', 'es', 'GENERAL', 28,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of the goods and/or services. Terms such as FOB, CIF, etc. should be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45A:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45A:', 'Description of Goods and/or Services', 'This field contains a description of the goods and/or services. Terms such as FOB, CIF, etc. should be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.',
    'MT720', 'en', 'GENERAL', 28,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of the goods and/or services. Terms such as FOB, CIF, etc. should be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45A:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':46A:', 'Documents Required', 'This field contains a description of any documents required. When the ultimate date of issue of a transport document is specified, it is to be specified with the relative document in this field. For credits subject to eUCP, the format in which electronic records are to be presented must be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.',
    'MT720', 'es', 'GENERAL', 29,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of any documents required. When the ultimate date of issue of a transport document is specified, it is to be specified with the relative document in this field. For credits subject to eUCP, the format in which electronic records are to be presented must be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':46A:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':46A:', 'Documents Required', 'This field contains a description of any documents required. When the ultimate date of issue of a transport document is specified, it is to be specified with the relative document in this field. For credits subject to eUCP, the format in which electronic records are to be presented must be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.',
    'MT720', 'en', 'GENERAL', 29,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of any documents required. When the ultimate date of issue of a transport document is specified, it is to be specified with the relative document in this field. For credits subject to eUCP, the format in which electronic records are to be presented must be specified in this field. The specification of each new item should begin on a new line, preceded by the sign ''+'' or numbered using +1), +2), etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':46A:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':47A:', 'Additional Conditions', 'This field contains a description of further conditions of the documentary credit. If presentation of only electronic records is allowed, the place for presentation of the electronic records (that is, the electronic address to which presentation must be made) must be specified in this field. If not already part of the original documentary credit, the advising bank, that is, the receiver of the message, must provide the beneficiary or another advising bank with the electronic address of the issui',
    'MT720', 'es', 'GENERAL', 30,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of further conditions of the documentary credit. If presentation of only electronic records is allowed, the place for presentation of the electronic records (that is, the electronic address to which presentation must be made) must be specified in this field. If not already part of the original documentary credit, the advising bank, that is, the receiver of the message, must provide the beneficiary or another advising bank with the electronic address of the issui', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':47A:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':47A:', 'Additional Conditions', 'This field contains a description of further conditions of the documentary credit. If presentation of only electronic records is allowed, the place for presentation of the electronic records (that is, the electronic address to which presentation must be made) must be specified in this field. If not already part of the original documentary credit, the advising bank, that is, the receiver of the message, must provide the beneficiary or another advising bank with the electronic address of the issui',
    'MT720', 'en', 'GENERAL', 30,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field contains a description of further conditions of the documentary credit. If presentation of only electronic records is allowed, the place for presentation of the electronic records (that is, the electronic address to which presentation must be made) must be specified in this field. If not already part of the original documentary credit, the advising bank, that is, the receiver of the message, must provide the beneficiary or another advising bank with the electronic address of the issui', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':47A:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49G:', 'Special Payment Conditions for Beneficiary', 'This field specifies special payment conditions applicable to the beneficiary, for example, post-financing request/conditions.',
    'MT720', 'es', 'GENERAL', 31,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies special payment conditions applicable to the beneficiary, for example, post-financing request/conditions.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49G:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49G:', 'Special Payment Conditions for Beneficiary', 'This field specifies special payment conditions applicable to the beneficiary, for example, post-financing request/conditions.',
    'MT720', 'en', 'GENERAL', 31,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies special payment conditions applicable to the beneficiary, for example, post-financing request/conditions.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49G:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49H:', 'Special Payment Conditions for Bank Only', 'This field specifies special payment conditions applicable to a bank without disclosure to the beneficiary, for example, post-financing request/conditions. Content of the field must specify to which bank it is addressed.',
    'MT720', 'es', 'GENERAL', 32,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies special payment conditions applicable to a bank without disclosure to the beneficiary, for example, post-financing request/conditions. Content of the field must specify to which bank it is addressed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49H:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49H:', 'Special Payment Conditions for Bank Only', 'This field specifies special payment conditions applicable to a bank without disclosure to the beneficiary, for example, post-financing request/conditions. Content of the field must specify to which bank it is addressed.',
    'MT720', 'en', 'GENERAL', 32,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies special payment conditions applicable to a bank without disclosure to the beneficiary, for example, post-financing request/conditions. Content of the field must specify to which bank it is addressed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49H:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':71D:', 'Charges', 'This field may be used only to specify charges to be borne by the beneficiary. One or more of the following codes may be used in Code, followed by the currency code and amount: In the absence of this field, all charges, except negotiation and transfer charges, are to be borne by the applicant. Any code used in this field must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information',
    'MT720', 'es', 'GENERAL', 33,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field may be used only to specify charges to be borne by the beneficiary. One or more of the following codes may be used in Code, followed by the currency code and amount: In the absence of this field, all charges, except negotiation and transfer charges, are to be borne by the applicant. Any code used in this field must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':71D:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':71D:', 'Charges', 'This field may be used only to specify charges to be borne by the beneficiary. One or more of the following codes may be used in Code, followed by the currency code and amount: In the absence of this field, all charges, except negotiation and transfer charges, are to be borne by the applicant. Any code used in this field must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information',
    'MT720', 'en', 'GENERAL', 33,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field may be used only to specify charges to be borne by the beneficiary. One or more of the following codes may be used in Code, followed by the currency code and amount: In the absence of this field, all charges, except negotiation and transfer charges, are to be borne by the applicant. Any code used in this field must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':71D:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':48:', 'Period for Presentation in Days', 'This field specifies the number of calendar days after the date of shipment within which the documents must be presented for payment, acceptance, or negotiation. If the date is not a shipment date, for example, it is an invoice date, then the details must be given in Narrative. The absence of this field means that the presentation period is 21 days after the date of shipment, where applicable.',
    'MT720', 'es', 'GENERAL', 34,
    0, 1,
    'NUMBER', 'INPUT', '3n', 'O',
    'This field specifies the number of calendar days after the date of shipment within which the documents must be presented for payment, acceptance, or negotiation. If the date is not a shipment date, for example, it is an invoice date, then the details must be given in Narrative. The absence of this field means that the presentation period is 21 days after the date of shipment, where applicable.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':48:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':48:', 'Period for Presentation in Days', 'This field specifies the number of calendar days after the date of shipment within which the documents must be presented for payment, acceptance, or negotiation. If the date is not a shipment date, for example, it is an invoice date, then the details must be given in Narrative. The absence of this field means that the presentation period is 21 days after the date of shipment, where applicable.',
    'MT720', 'en', 'GENERAL', 34,
    0, 1,
    'NUMBER', 'INPUT', '3n', 'O',
    'This field specifies the number of calendar days after the date of shipment within which the documents must be presented for payment, acceptance, or negotiation. If the date is not a shipment date, for example, it is an invoice date, then the details must be given in Narrative. The absence of this field means that the presentation period is 21 days after the date of shipment, where applicable.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':48:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49:', 'Confirmation Instructions', 'This field contains confirmation instructions for the requested confirmation party. Instruction must contain one of the following codes (Error code(s): T67) :',
    'MT720', 'es', 'GENERAL', 35,
    1, 1,
    'SELECT', 'DROPDOWN', '7!x', 'M',
    'This field contains confirmation instructions for the requested confirmation party. Instruction must contain one of the following codes (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49:', 'Confirmation Instructions', 'This field contains confirmation instructions for the requested confirmation party. Instruction must contain one of the following codes (Error code(s): T67) :',
    'MT720', 'en', 'GENERAL', 35,
    1, 1,
    'SELECT', 'DROPDOWN', '7!x', 'M',
    'This field contains confirmation instructions for the requested confirmation party. Instruction must contain one of the following codes (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':58a:', 'Requested Confirmation Party', 'Bank which is requested to add its confirmation or may add its confirmation.',
    'MT720', 'es', 'GENERAL', 36,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'Bank which is requested to add its confirmation or may add its confirmation.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':58a:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':58a:', 'Requested Confirmation Party', 'Bank which is requested to add its confirmation or may add its confirmation.',
    'MT720', 'en', 'GENERAL', 36,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'Bank which is requested to add its confirmation or may add its confirmation.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':58a:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78:', 'Instructions to the Paying/Accepting/Negotiating Bank', 'This field specifies instructions to the paying, accepting or negotiating bank. It may also indicate if pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required. When used to indicate pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required, the number and type, that is, banking or calendar, of days within which the issuing bank has to be notified should also be indicated.',
    'MT720', 'es', 'GENERAL', 37,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies instructions to the paying, accepting or negotiating bank. It may also indicate if pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required. When used to indicate pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required, the number and type, that is, banking or calendar, of days within which the issuing bank has to be notified should also be indicated.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78:', 'Instructions to the Paying/Accepting/Negotiating Bank', 'This field specifies instructions to the paying, accepting or negotiating bank. It may also indicate if pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required. When used to indicate pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required, the number and type, that is, banking or calendar, of days within which the issuing bank has to be notified should also be indicated.',
    'MT720', 'en', 'GENERAL', 37,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies instructions to the paying, accepting or negotiating bank. It may also indicate if pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required. When used to indicate pre-notification of a reimbursement claim or pre-debit notification to the issuing bank is required, the number and type, that is, banking or calendar, of days within which the issuing bank has to be notified should also be indicated.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78D:', 'Instructions to Intermediary Bank', 'This field specifies instructions to the intermediary banks.',
    'MT720', 'es', 'GENERAL', 38,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies instructions to the intermediary banks.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78D:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78D:', 'Instructions to Intermediary Bank', 'This field specifies instructions to the intermediary banks.',
    'MT720', 'en', 'GENERAL', 38,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies instructions to the intermediary banks.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78D:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', '''Advise Through'' Bank', 'This field identifies the bank, if different from the Receiver, through which the documentary credit is to be advised/confirmed to the beneficiary.',
    'MT720', 'es', 'GENERAL', 39,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field identifies the bank, if different from the Receiver, through which the documentary credit is to be advised/confirmed to the beneficiary.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', '''Advise Through'' Bank', 'This field identifies the bank, if different from the Receiver, through which the documentary credit is to be advised/confirmed to the beneficiary.',
    'MT720', 'en', 'GENERAL', 39,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field identifies the bank, if different from the Receiver, through which the documentary credit is to be advised/confirmed to the beneficiary.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.',
    'MT720', 'es', 'GENERAL', 40,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT720'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.',
    'MT720', 'en', 'GENERAL', 40,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code: Any code must be between slashes and must appear at the beginning of a line. Narrative text must not begin with a slash and, if used, must begin on a new line and be the last information in the field.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT720'
    AND language = 'en'
    AND spec_version = '2025'
);

-- MT760 Fields (75 fields)
-- ==================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':15A:', 'New Sequence', 'This field specifies the start of mandatory sequence A General Information. Only the field tag must be present, the field is empty.',
    'MT760', 'es', 'GENERAL', 1,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the start of mandatory sequence A General Information. Only the field tag must be present, the field is empty.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':15A:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':15A:', 'New Sequence', 'This field specifies the start of mandatory sequence A General Information. Only the field tag must be present, the field is empty.',
    'MT760', 'en', 'GENERAL', 1,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the start of mandatory sequence A General Information. Only the field tag must be present, the field is empty.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':15A:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':27:', 'Sequence of Total', 'This field specifies the number of this message in the series of messages sent for an undertaking, and the total number of messages in the series.',
    'MT760', 'es', 'GENERAL', 2,
    1, 1,
    'NUMBER', 'INPUT', '1!n', 'M',
    'This field specifies the number of this message in the series of messages sent for an undertaking, and the total number of messages in the series.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':27:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':27:', 'Sequence of Total', 'This field specifies the number of this message in the series of messages sent for an undertaking, and the total number of messages in the series.',
    'MT760', 'en', 'GENERAL', 2,
    1, 1,
    'NUMBER', 'INPUT', '1!n', 'M',
    'This field specifies the number of this message in the series of messages sent for an undertaking, and the total number of messages in the series.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':27:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':22A:', 'Purpose of Message', 'This field specifies the purpose of this message. Purpose must contain one of the following codes (Error code(s): T36) :',
    'MT760', 'es', 'GENERAL', 3,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the purpose of this message. Purpose must contain one of the following codes (Error code(s): T36) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':22A:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':22A:', 'Purpose of Message', 'This field specifies the purpose of this message. Purpose must contain one of the following codes (Error code(s): T36) :',
    'MT760', 'en', 'GENERAL', 3,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the purpose of this message. Purpose must contain one of the following codes (Error code(s): T36) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':22A:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code:',
    'MT760', 'es', 'GENERAL', 4,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'M',
    'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code:', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code:',
    'MT760', 'en', 'GENERAL', 4,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'M',
    'This field specifies additional information for the Receiver. One or more of the following codes may be used in Code:', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23X:', 'File Identification', 'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.',
    'MT760', 'es', 'GENERAL', 5,
    1, 1,
    'TEXT', 'INPUT', '65x', 'M',
    'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23X:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23X:', 'File Identification', 'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.',
    'MT760', 'en', 'GENERAL', 5,
    1, 1,
    'TEXT', 'INPUT', '65x', 'M',
    'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23X:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':15B:', 'New Sequence', 'This field specifies the start of mandatory sequence B Undertaking Details. Only the field tag must be present, the field is empty.',
    'MT760', 'es', 'GENERAL', 6,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the start of mandatory sequence B Undertaking Details. Only the field tag must be present, the field is empty.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':15B:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':15B:', 'New Sequence', 'This field specifies the start of mandatory sequence B Undertaking Details. Only the field tag must be present, the field is empty.',
    'MT760', 'en', 'GENERAL', 6,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the start of mandatory sequence B Undertaking Details. Only the field tag must be present, the field is empty.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':15B:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Undertaking Number', 'This field specifies the unique and unambiguous undertaking identifier that is assigned by the issuer.',
    'MT760', 'es', 'GENERAL', 7,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the unique and unambiguous undertaking identifier that is assigned by the issuer.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Undertaking Number', 'This field specifies the unique and unambiguous undertaking identifier that is assigned by the issuer.',
    'MT760', 'en', 'GENERAL', 7,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the unique and unambiguous undertaking identifier that is assigned by the issuer.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':30:', 'Date of Issue', 'This field specifies the date on which the undertaking is issued.',
    'MT760', 'es', 'GENERAL', 8,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date on which the undertaking is issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':30:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':30:', 'Date of Issue', 'This field specifies the date on which the undertaking is issued.',
    'MT760', 'en', 'GENERAL', 8,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date on which the undertaking is issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':30:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':22D:', 'Form of Undertaking', 'This field specifies the form of the independent and irrevocable undertaking. Form must contain one of the following codes (Error code(s): T71) :',
    'MT760', 'es', 'GENERAL', 9,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the form of the independent and irrevocable undertaking. Form must contain one of the following codes (Error code(s): T71) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':22D:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':22D:', 'Form of Undertaking', 'This field specifies the form of the independent and irrevocable undertaking. Form must contain one of the following codes (Error code(s): T71) :',
    'MT760', 'en', 'GENERAL', 9,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the form of the independent and irrevocable undertaking. Form must contain one of the following codes (Error code(s): T71) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':22D:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40C:', 'Applicable Rules', 'This field specifies the rules to which the undertaking is subject. Type must contain one of the following codes (Error code(s): T60) :',
    'MT760', 'es', 'GENERAL', 10,
    1, 1,
    'TEXT', 'INPUT', '4!a', 'M',
    'This field specifies the rules to which the undertaking is subject. Type must contain one of the following codes (Error code(s): T60) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40C:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40C:', 'Applicable Rules', 'This field specifies the rules to which the undertaking is subject. Type must contain one of the following codes (Error code(s): T60) :',
    'MT760', 'en', 'GENERAL', 10,
    1, 1,
    'TEXT', 'INPUT', '4!a', 'M',
    'This field specifies the rules to which the undertaking is subject. Type must contain one of the following codes (Error code(s): T60) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40C:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23B:', 'Expiry Type', 'This field specifies whether the undertaking has a specified expiry date or is open-ended or is dependent on a documentary condition or event. Type must contain one of the following codes (Error code(s): T36) :',
    'MT760', 'es', 'GENERAL', 11,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies whether the undertaking has a specified expiry date or is open-ended or is dependent on a documentary condition or event. Type must contain one of the following codes (Error code(s): T36) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23B:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23B:', 'Expiry Type', 'This field specifies whether the undertaking has a specified expiry date or is open-ended or is dependent on a documentary condition or event. Type must contain one of the following codes (Error code(s): T36) :',
    'MT760', 'en', 'GENERAL', 11,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies whether the undertaking has a specified expiry date or is open-ended or is dependent on a documentary condition or event. Type must contain one of the following codes (Error code(s): T36) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23B:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31E:', 'Date of Expiry', 'This field specifies the date when the undertaking will cease to be available.',
    'MT760', 'es', 'GENERAL', 12,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date when the undertaking will cease to be available.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31E:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31E:', 'Date of Expiry', 'This field specifies the date when the undertaking will cease to be available.',
    'MT760', 'en', 'GENERAL', 12,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date when the undertaking will cease to be available.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31E:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':35G:', 'Expiry Condition/Event', 'This field specifies the documentary condition/event that indicates when the undertaking will cease to be available, for example 180 days after date of required document.',
    'MT760', 'es', 'GENERAL', 13,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'M',
    'This field specifies the documentary condition/event that indicates when the undertaking will cease to be available, for example 180 days after date of required document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':35G:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':35G:', 'Expiry Condition/Event', 'This field specifies the documentary condition/event that indicates when the undertaking will cease to be available, for example 180 days after date of required document.',
    'MT760', 'en', 'GENERAL', 13,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'M',
    'This field specifies the documentary condition/event that indicates when the undertaking will cease to be available, for example 180 days after date of required document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':35G:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50:', 'Applicant', 'This field specifies the party named in the undertaking as the applicant.',
    'MT760', 'es', 'GENERAL', 14,
    1, 1,
    'PARTICIPANT', 'PARTICIPANT_SELECTOR', '4*35x', 'M',
    'This field specifies the party named in the undertaking as the applicant.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50:', 'Applicant', 'This field specifies the party named in the undertaking as the applicant.',
    'MT760', 'en', 'GENERAL', 14,
    1, 1,
    'PARTICIPANT', 'PARTICIPANT_SELECTOR', '4*35x', 'M',
    'This field specifies the party named in the undertaking as the applicant.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':51:', 'Obligor/Instructing Party', 'This field specifies the party obligated to reimburse the issuer.',
    'MT760', 'es', 'GENERAL', 15,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'M',
    'This field specifies the party obligated to reimburse the issuer.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':51:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':51:', 'Obligor/Instructing Party', 'This field specifies the party obligated to reimburse the issuer.',
    'MT760', 'en', 'GENERAL', 15,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'M',
    'This field specifies the party obligated to reimburse the issuer.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':51:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuer', 'This field specifies the party that issues the undertaking (or counter-undertaking).',
    'MT760', 'es', 'GENERAL', 16,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies the party that issues the undertaking (or counter-undertaking).', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuer', 'This field specifies the party that issues the undertaking (or counter-undertaking).',
    'MT760', 'en', 'GENERAL', 16,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies the party that issues the undertaking (or counter-undertaking).', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59a:', 'Beneficiary', 'This field specifies the party in whose favour the undertaking (or counter-undertaking) is issued.',
    'MT760', 'es', 'GENERAL', 17,
    1, 1,
    'TEXT', 'INPUT', '34x', 'M',
    'This field specifies the party in whose favour the undertaking (or counter-undertaking) is issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59a:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59a:', 'Beneficiary', 'This field specifies the party in whose favour the undertaking (or counter-undertaking) is issued.',
    'MT760', 'en', 'GENERAL', 17,
    1, 1,
    'TEXT', 'INPUT', '34x', 'M',
    'This field specifies the party in whose favour the undertaking (or counter-undertaking) is issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59a:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':56a:', 'Advising Bank', 'This field specifies the advising bank.',
    'MT760', 'es', 'GENERAL', 18,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies the advising bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':56a:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':56a:', 'Advising Bank', 'This field specifies the advising bank.',
    'MT760', 'en', 'GENERAL', 18,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies the advising bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':56a:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23:', 'Advising Bank Reference', 'This field specifies a reference assigned by the advising bank.',
    'MT760', 'es', 'GENERAL', 19,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies a reference assigned by the advising bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23:', 'Advising Bank Reference', 'This field specifies a reference assigned by the advising bank.',
    'MT760', 'en', 'GENERAL', 19,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies a reference assigned by the advising bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', '''Advise Through'' Bank', 'This field specifies an additional bank that is requested to advise the undertaking.',
    'MT760', 'es', 'GENERAL', 20,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies an additional bank that is requested to advise the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', '''Advise Through'' Bank', 'This field specifies an additional bank that is requested to advise the undertaking.',
    'MT760', 'en', 'GENERAL', 20,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies an additional bank that is requested to advise the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Undertaking Amount', 'This field specifies the currency and the amount of the undertaking.',
    'MT760', 'es', 'GENERAL', 21,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field specifies the currency and the amount of the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Undertaking Amount', 'This field specifies the currency and the amount of the undertaking.',
    'MT760', 'en', 'GENERAL', 21,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field specifies the currency and the amount of the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39D:', 'Additional Amount Information', 'This field contains information about additional amounts related to the undertaking, for example, interests, tolerances. Plus/minus tolerances to be specified as 2n/2n.',
    'MT760', 'es', 'GENERAL', 22,
    1, 0,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'M',
    'This field contains information about additional amounts related to the undertaking, for example, interests, tolerances. Plus/minus tolerances to be specified as 2n/2n.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39D:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
); -- DELETED in this version

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39D:', 'Additional Amount Information', 'This field contains information about additional amounts related to the undertaking, for example, interests, tolerances. Plus/minus tolerances to be specified as 2n/2n.',
    'MT760', 'en', 'GENERAL', 22,
    1, 0,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'M',
    'This field contains information about additional amounts related to the undertaking, for example, interests, tolerances. Plus/minus tolerances to be specified as 2n/2n.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39D:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39F:', 'Supplementary Information About Amount', 'This field contains supplementary information about amount related to the undertaking. The information can be optionally provided using codes. One or more of the following codes or any bilaterally agreed code may be used in Code:',
    'MT760', 'es', 'GENERAL', 22,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'M',
    'This field contains supplementary information about amount related to the undertaking. The information can be optionally provided using codes. One or more of the following codes or any bilaterally agreed code may be used in Code:', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39F:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39F:', 'Supplementary Information About Amount', 'This field contains supplementary information about amount related to the undertaking. The information can be optionally provided using codes. One or more of the following codes or any bilaterally agreed code may be used in Code:',
    'MT760', 'en', 'GENERAL', 22,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'M',
    'This field contains supplementary information about amount related to the undertaking. The information can be optionally provided using codes. One or more of the following codes or any bilaterally agreed code may be used in Code:', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39F:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':41a:', 'Available With...', 'This field identifies the bank with which the credit is available (the place for presentation).',
    'MT760', 'es', 'GENERAL', 23,
    1, 1,
    'SELECT', 'DROPDOWN', '4!a', 'M',
    'This field identifies the bank with which the credit is available (the place for presentation).', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':41a:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':41a:', 'Available With...', 'This field identifies the bank with which the credit is available (the place for presentation).',
    'MT760', 'en', 'GENERAL', 23,
    1, 1,
    'SELECT', 'DROPDOWN', '4!a', 'M',
    'This field identifies the bank with which the credit is available (the place for presentation).', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':41a:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':71D:', 'Charges', 'This field contains information about the charges associated with the undertaking, for example "Confirmation charges are for account of beneficiary". One or more of the following codes may be used in Code, followed by the currency code and amount:',
    'MT760', 'es', 'GENERAL', 24,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'M',
    'This field contains information about the charges associated with the undertaking, for example "Confirmation charges are for account of beneficiary". One or more of the following codes may be used in Code, followed by the currency code and amount:', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':71D:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':71D:', 'Charges', 'This field contains information about the charges associated with the undertaking, for example "Confirmation charges are for account of beneficiary". One or more of the following codes may be used in Code, followed by the currency code and amount:',
    'MT760', 'en', 'GENERAL', 24,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'M',
    'This field contains information about the charges associated with the undertaking, for example "Confirmation charges are for account of beneficiary". One or more of the following codes may be used in Code, followed by the currency code and amount:', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':71D:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45C:', 'Document and Presentation Instructions', 'This field specifies the presentation instructions (for example, form and/or place of presentation) including documents required to make a complying demand.',
    'MT760', 'es', 'GENERAL', 25,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'M',
    'This field specifies the presentation instructions (for example, form and/or place of presentation) including documents required to make a complying demand.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45C:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45C:', 'Document and Presentation Instructions', 'This field specifies the presentation instructions (for example, form and/or place of presentation) including documents required to make a complying demand.',
    'MT760', 'en', 'GENERAL', 25,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'M',
    'This field specifies the presentation instructions (for example, form and/or place of presentation) including documents required to make a complying demand.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45C:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':77U:', 'Undertaking Terms and Conditions', 'This field specifies the applicable terms and conditions of the undertaking that are not already mentioned in any other field in this message.',
    'MT760', 'es', 'GENERAL', 26,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '150*65z', 'M',
    'This field specifies the applicable terms and conditions of the undertaking that are not already mentioned in any other field in this message.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':77U:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':77U:', 'Undertaking Terms and Conditions', 'This field specifies the applicable terms and conditions of the undertaking that are not already mentioned in any other field in this message.',
    'MT760', 'en', 'GENERAL', 26,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '150*65z', 'M',
    'This field specifies the applicable terms and conditions of the undertaking that are not already mentioned in any other field in this message.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':77U:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49:', 'Confirmation Instructions', 'This field contains confirmation instructions from the issuing bank to the advising party. Instruction must contain one of the following codes (Error code(s): T67) :',
    'MT760', 'es', 'GENERAL', 27,
    1, 1,
    'SELECT', 'DROPDOWN', '7!x', 'M',
    'This field contains confirmation instructions from the issuing bank to the advising party. Instruction must contain one of the following codes (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49:', 'Confirmation Instructions', 'This field contains confirmation instructions from the issuing bank to the advising party. Instruction must contain one of the following codes (Error code(s): T67) :',
    'MT760', 'en', 'GENERAL', 27,
    1, 1,
    'SELECT', 'DROPDOWN', '7!x', 'M',
    'This field contains confirmation instructions from the issuing bank to the advising party. Instruction must contain one of the following codes (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':58a:', 'Requested Confirmation Party', 'This field specifies the party requested to add its confirmation to the undertaking.',
    'MT760', 'es', 'GENERAL', 28,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies the party requested to add its confirmation to the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':58a:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':58a:', 'Requested Confirmation Party', 'This field specifies the party requested to add its confirmation to the undertaking.',
    'MT760', 'en', 'GENERAL', 28,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies the party requested to add its confirmation to the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':58a:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44H:', 'Governing Law and/or Place of Jurisdiction', 'This field specifies the governing law (as an ISO 3166-1 code in Country Code) and/or place of jurisdiction (in Narrative, optionally) that is applicable to the undertaking.',
    'MT760', 'es', 'GENERAL', 29,
    1, 0,
    'TEXT', 'INPUT', '2!a', 'M',
    'This field specifies the governing law (as an ISO 3166-1 code in Country Code) and/or place of jurisdiction (in Narrative, optionally) that is applicable to the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44H:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
); -- DELETED in this version

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44H:', 'Governing Law and/or Place of Jurisdiction', 'This field specifies the governing law (as an ISO 3166-1 code in Country Code) and/or place of jurisdiction (in Narrative, optionally) that is applicable to the undertaking.',
    'MT760', 'en', 'GENERAL', 29,
    1, 0,
    'TEXT', 'INPUT', '2!a', 'M',
    'This field specifies the governing law (as an ISO 3166-1 code in Country Code) and/or place of jurisdiction (in Narrative, optionally) that is applicable to the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44H:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44J:', 'Governing Law/Jurisdiction', 'This field specifies the governing law (as an ISO 3166-1 code in Country Code and optionally, country subdivision). This field may also specify the place of jurisdiction (in narrative) that is applicable to the undertaking.',
    'MT760', 'es', 'GENERAL', 29,
    1, 1,
    'TEXT', 'INPUT', '2!a', 'M',
    'This field specifies the governing law (as an ISO 3166-1 code in Country Code and optionally, country subdivision). This field may also specify the place of jurisdiction (in narrative) that is applicable to the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44J:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44J:', 'Governing Law/Jurisdiction', 'This field specifies the governing law (as an ISO 3166-1 code in Country Code and optionally, country subdivision). This field may also specify the place of jurisdiction (in narrative) that is applicable to the undertaking.',
    'MT760', 'en', 'GENERAL', 29,
    1, 1,
    'TEXT', 'INPUT', '2!a', 'M',
    'This field specifies the governing law (as an ISO 3166-1 code in Country Code and optionally, country subdivision). This field may also specify the place of jurisdiction (in narrative) that is applicable to the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44J:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23F:', 'Automatic Extension Period', 'This field contains details about the automatic extension of the expiry date. Period must contain one of the following codes (Error code(s): T08) :',
    'MT760', 'es', 'GENERAL', 30,
    1, 1,
    'TEXT', 'INPUT', '4!a', 'M',
    'This field contains details about the automatic extension of the expiry date. Period must contain one of the following codes (Error code(s): T08) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23F:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23F:', 'Automatic Extension Period', 'This field contains details about the automatic extension of the expiry date. Period must contain one of the following codes (Error code(s): T08) :',
    'MT760', 'en', 'GENERAL', 30,
    1, 1,
    'TEXT', 'INPUT', '4!a', 'M',
    'This field contains details about the automatic extension of the expiry date. Period must contain one of the following codes (Error code(s): T08) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23F:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78:', 'Automatic Extension Non-Extension Notification', 'This field contains details about the non-extension to the automatic expiry date extension, such as notification method, and notification recipient details.',
    'MT760', 'es', 'GENERAL', 31,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'M',
    'This field contains details about the non-extension to the automatic expiry date extension, such as notification method, and notification recipient details.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78:', 'Automatic Extension Non-Extension Notification', 'This field contains details about the non-extension to the automatic expiry date extension, such as notification method, and notification recipient details.',
    'MT760', 'en', 'GENERAL', 31,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'M',
    'This field contains details about the non-extension to the automatic expiry date extension, such as notification method, and notification recipient details.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':26E:', 'Automatic Extension Notification Period', 'This field specifies the minimum number of calendar days prior to the current expiry date by which notice of non-extension must be sent.',
    'MT760', 'es', 'GENERAL', 32,
    1, 1,
    'NUMBER', 'INPUT', '3n', 'M',
    'This field specifies the minimum number of calendar days prior to the current expiry date by which notice of non-extension must be sent.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':26E:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':26E:', 'Automatic Extension Notification Period', 'This field specifies the minimum number of calendar days prior to the current expiry date by which notice of non-extension must be sent.',
    'MT760', 'en', 'GENERAL', 32,
    1, 1,
    'NUMBER', 'INPUT', '3n', 'M',
    'This field specifies the minimum number of calendar days prior to the current expiry date by which notice of non-extension must be sent.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':26E:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31S:', 'Automatic Extension Final Expiry Date', 'This field specifies the final expiry date after which the undertaking will no longer be subject to automatic extension.',
    'MT760', 'es', 'GENERAL', 33,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the final expiry date after which the undertaking will no longer be subject to automatic extension.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31S:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31S:', 'Automatic Extension Final Expiry Date', 'This field specifies the final expiry date after which the undertaking will no longer be subject to automatic extension.',
    'MT760', 'en', 'GENERAL', 33,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the final expiry date after which the undertaking will no longer be subject to automatic extension.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31S:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':48B:', 'Demand Indicator', 'This field specifies if partial and/or multiple demands are not permitted. Code must contain one of the following codes (Error code(s): T03) : Absence of this field indicates that multiple and partial demands are permitted.',
    'MT760', 'es', 'GENERAL', 34,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies if partial and/or multiple demands are not permitted. Code must contain one of the following codes (Error code(s): T03) : Absence of this field indicates that multiple and partial demands are permitted.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':48B:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':48B:', 'Demand Indicator', 'This field specifies if partial and/or multiple demands are not permitted. Code must contain one of the following codes (Error code(s): T03) : Absence of this field indicates that multiple and partial demands are permitted.',
    'MT760', 'en', 'GENERAL', 34,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies if partial and/or multiple demands are not permitted. Code must contain one of the following codes (Error code(s): T03) : Absence of this field indicates that multiple and partial demands are permitted.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':48B:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':48D:', 'Transfer Indicator', 'This field specifies that the undertaking is transferable. Code must contain the following code (Error code(s): T04) : Absence of this field indicates that the undertaking is not transferable.',
    'MT760', 'es', 'GENERAL', 35,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies that the undertaking is transferable. Code must contain the following code (Error code(s): T04) : Absence of this field indicates that the undertaking is not transferable.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':48D:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':48D:', 'Transfer Indicator', 'This field specifies that the undertaking is transferable. Code must contain the following code (Error code(s): T04) : Absence of this field indicates that the undertaking is not transferable.',
    'MT760', 'en', 'GENERAL', 35,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies that the undertaking is transferable. Code must contain the following code (Error code(s): T04) : Absence of this field indicates that the undertaking is not transferable.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':48D:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39E:', 'Transfer Conditions', 'This field specifies transfer conditions, if more details are needed than the indicator.',
    'MT760', 'es', 'GENERAL', 36,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'M',
    'This field specifies transfer conditions, if more details are needed than the indicator.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39E:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39E:', 'Transfer Conditions', 'This field specifies transfer conditions, if more details are needed than the indicator.',
    'MT760', 'en', 'GENERAL', 36,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'M',
    'This field specifies transfer conditions, if more details are needed than the indicator.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39E:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45L:', 'Underlying Transaction Details', 'This field specifies concise details of the underlying business transaction for which the undertaking is issued.',
    'MT760', 'es', 'GENERAL', 37,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '50*65z', 'M',
    'This field specifies concise details of the underlying business transaction for which the undertaking is issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45L:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45L:', 'Underlying Transaction Details', 'This field specifies concise details of the underlying business transaction for which the undertaking is issued.',
    'MT760', 'en', 'GENERAL', 37,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '50*65z', 'M',
    'This field specifies concise details of the underlying business transaction for which the undertaking is issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45L:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':24E:', 'Delivery of Original Undertaking', 'This field specifies the method by which the original undertaking is to be delivered. Code must contain one of the following codes (Error code(s): T59) :',
    'MT760', 'es', 'GENERAL', 38,
    1, 1,
    'TEXT', 'INPUT', '35x', 'M',
    'This field specifies the method by which the original undertaking is to be delivered. Code must contain one of the following codes (Error code(s): T59) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':24E:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':24E:', 'Delivery of Original Undertaking', 'This field specifies the method by which the original undertaking is to be delivered. Code must contain one of the following codes (Error code(s): T59) :',
    'MT760', 'en', 'GENERAL', 38,
    1, 1,
    'TEXT', 'INPUT', '35x', 'M',
    'This field specifies the method by which the original undertaking is to be delivered. Code must contain one of the following codes (Error code(s): T59) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':24E:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':24G:', 'Delivery To/Collection By', 'This field specifies to whom the original undertaking is to be delivered or by whom the original undertaking is to be collected. Code must contain one of the following codes (Error code(s): T60) :',
    'MT760', 'es', 'GENERAL', 39,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'M',
    'This field specifies to whom the original undertaking is to be delivered or by whom the original undertaking is to be collected. Code must contain one of the following codes (Error code(s): T60) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':24G:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':24G:', 'Delivery To/Collection By', 'This field specifies to whom the original undertaking is to be delivered or by whom the original undertaking is to be collected. Code must contain one of the following codes (Error code(s): T60) :',
    'MT760', 'en', 'GENERAL', 39,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'M',
    'This field specifies to whom the original undertaking is to be delivered or by whom the original undertaking is to be collected. Code must contain one of the following codes (Error code(s): T60) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':24G:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':15C:', 'New Sequence', 'This field specifies the start of optional sequence C Local Undertaking Details. This field may only be used when at least one other field in the optional sequence C is present and is otherwise not allowed. Only the field tag must be present, the field is empty.',
    'MT760', 'es', 'GENERAL', 40,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the start of optional sequence C Local Undertaking Details. This field may only be used when at least one other field in the optional sequence C is present and is otherwise not allowed. Only the field tag must be present, the field is empty.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':15C:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':15C:', 'New Sequence', 'This field specifies the start of optional sequence C Local Undertaking Details. This field may only be used when at least one other field in the optional sequence C is present and is otherwise not allowed. Only the field tag must be present, the field is empty.',
    'MT760', 'en', 'GENERAL', 40,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the start of optional sequence C Local Undertaking Details. This field may only be used when at least one other field in the optional sequence C is present and is otherwise not allowed. Only the field tag must be present, the field is empty.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':15C:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31C:', 'Requested Date of Issue', 'This field specifies the date on or by which the requested local undertaking is to be issued.',
    'MT760', 'es', 'GENERAL', 41,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the date on or by which the requested local undertaking is to be issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31C:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31C:', 'Requested Date of Issue', 'This field specifies the date on or by which the requested local undertaking is to be issued.',
    'MT760', 'en', 'GENERAL', 41,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the date on or by which the requested local undertaking is to be issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31C:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':22D:', 'Form of Undertaking', 'This field specifies the form of local undertaking (independent or dependent). Form must contain one of the following codes (Error code(s): T71) :',
    'MT760', 'es', 'GENERAL', 42,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the form of local undertaking (independent or dependent). Form must contain one of the following codes (Error code(s): T71) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':22D:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':22D:', 'Form of Undertaking', 'This field specifies the form of local undertaking (independent or dependent). Form must contain one of the following codes (Error code(s): T71) :',
    'MT760', 'en', 'GENERAL', 42,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the form of local undertaking (independent or dependent). Form must contain one of the following codes (Error code(s): T71) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':22D:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40C:', 'Applicable Rules', 'This field specifies the rules to which the local undertaking is subject. Type must contain one of the following codes (Error code(s): T60) :',
    'MT760', 'es', 'GENERAL', 43,
    1, 1,
    'TEXT', 'INPUT', '4!a', 'M',
    'This field specifies the rules to which the local undertaking is subject. Type must contain one of the following codes (Error code(s): T60) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40C:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40C:', 'Applicable Rules', 'This field specifies the rules to which the local undertaking is subject. Type must contain one of the following codes (Error code(s): T60) :',
    'MT760', 'en', 'GENERAL', 43,
    1, 1,
    'TEXT', 'INPUT', '4!a', 'M',
    'This field specifies the rules to which the local undertaking is subject. Type must contain one of the following codes (Error code(s): T60) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40C:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':22K:', 'Type of Undertaking', 'This field specifies the type of the local undertaking. Code must contain one of the following codes (Error code(s): T48) :',
    'MT760', 'es', 'GENERAL', 44,
    0, 1,
    'TEXT', 'INPUT', '35x', 'O',
    'This field specifies the type of the local undertaking. Code must contain one of the following codes (Error code(s): T48) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':22K:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':22K:', 'Type of Undertaking', 'This field specifies the type of the local undertaking. Code must contain one of the following codes (Error code(s): T48) :',
    'MT760', 'en', 'GENERAL', 44,
    0, 1,
    'TEXT', 'INPUT', '35x', 'O',
    'This field specifies the type of the local undertaking. Code must contain one of the following codes (Error code(s): T48) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':22K:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23B:', 'Expiry Type', 'This field specifies whether the local undertaking has a specified expiry date or is open-ended or is dependent on a documentary condition or event. Type must contain one of the following codes (Error code(s): T36) :',
    'MT760', 'es', 'GENERAL', 45,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies whether the local undertaking has a specified expiry date or is open-ended or is dependent on a documentary condition or event. Type must contain one of the following codes (Error code(s): T36) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23B:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23B:', 'Expiry Type', 'This field specifies whether the local undertaking has a specified expiry date or is open-ended or is dependent on a documentary condition or event. Type must contain one of the following codes (Error code(s): T36) :',
    'MT760', 'en', 'GENERAL', 45,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies whether the local undertaking has a specified expiry date or is open-ended or is dependent on a documentary condition or event. Type must contain one of the following codes (Error code(s): T36) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23B:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31E:', 'Date of Expiry', 'This field specifies the date when the local undertaking will cease to be available.',
    'MT760', 'es', 'GENERAL', 46,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the date when the local undertaking will cease to be available.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31E:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31E:', 'Date of Expiry', 'This field specifies the date when the local undertaking will cease to be available.',
    'MT760', 'en', 'GENERAL', 46,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the date when the local undertaking will cease to be available.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31E:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':35G:', 'Expiry Condition/Event', 'This field specifies the documentary condition/event that indicates when the local undertaking will cease to be available, for example 180 days after date of required document.',
    'MT760', 'es', 'GENERAL', 47,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies the documentary condition/event that indicates when the local undertaking will cease to be available, for example 180 days after date of required document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':35G:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':35G:', 'Expiry Condition/Event', 'This field specifies the documentary condition/event that indicates when the local undertaking will cease to be available, for example 180 days after date of required document.',
    'MT760', 'en', 'GENERAL', 47,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies the documentary condition/event that indicates when the local undertaking will cease to be available, for example 180 days after date of required document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':35G:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50:', 'Applicant', 'This field specifies the party named in the undertaking as the applicant.',
    'MT760', 'es', 'GENERAL', 48,
    1, 1,
    'PARTICIPANT', 'PARTICIPANT_SELECTOR', '4*35x', 'M',
    'This field specifies the party named in the undertaking as the applicant.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':50:', 'Applicant', 'This field specifies the party named in the undertaking as the applicant.',
    'MT760', 'en', 'GENERAL', 48,
    1, 1,
    'PARTICIPANT', 'PARTICIPANT_SELECTOR', '4*35x', 'M',
    'This field specifies the party named in the undertaking as the applicant.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':50:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':51:', 'Obligor/Instructing Party', 'This field specifies the party other than the applicant, that gives instructions to issue a counter-undertaking and is responsible for indemnifying the issuer of the counter-undertaking. Also applicable to counter-counter undertaking. This field specifies the party obligated to reimburse the issuer of the undertaking.',
    'MT760', 'es', 'GENERAL', 49,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the party other than the applicant, that gives instructions to issue a counter-undertaking and is responsible for indemnifying the issuer of the counter-undertaking. Also applicable to counter-counter undertaking. This field specifies the party obligated to reimburse the issuer of the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':51:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':51:', 'Obligor/Instructing Party', 'This field specifies the party other than the applicant, that gives instructions to issue a counter-undertaking and is responsible for indemnifying the issuer of the counter-undertaking. Also applicable to counter-counter undertaking. This field specifies the party obligated to reimburse the issuer of the undertaking.',
    'MT760', 'en', 'GENERAL', 49,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '4*35x', 'O',
    'This field specifies the party other than the applicant, that gives instructions to issue a counter-undertaking and is responsible for indemnifying the issuer of the counter-undertaking. Also applicable to counter-counter undertaking. This field specifies the party obligated to reimburse the issuer of the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':51:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuer', 'This field specifies the party that issues the local undertaking.',
    'MT760', 'es', 'GENERAL', 50,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the party that issues the local undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuer', 'This field specifies the party that issues the local undertaking.',
    'MT760', 'en', 'GENERAL', 50,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the party that issues the local undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59:', 'Beneficiary', 'This field specifies the party in whose favour the local undertaking is issued.',
    'MT760', 'es', 'GENERAL', 51,
    1, 1,
    'PARTICIPANT', 'NON_CLIENT_SELECTOR', '[/34x]4*35x', 'M',
    'This field specifies the party in whose favour the local undertaking is issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59:', 'Beneficiary', 'This field specifies the party in whose favour the local undertaking is issued.',
    'MT760', 'en', 'GENERAL', 51,
    1, 1,
    'PARTICIPANT', 'NON_CLIENT_SELECTOR', '[/34x]4*35x', 'M',
    'This field specifies the party in whose favour the local undertaking is issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Undertaking Amount', 'This field specifies the currency and the amount of the local undertaking.',
    'MT760', 'es', 'GENERAL', 52,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field specifies the currency and the amount of the local undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Undertaking Amount', 'This field specifies the currency and the amount of the local undertaking.',
    'MT760', 'en', 'GENERAL', 52,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field specifies the currency and the amount of the local undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39D:', 'Additional Amount Information', 'This field contains information about additional amounts related to the local undertaking, for example, interests, tolerances. Plus/minus tolerances to be specified as 2n/2n.',
    'MT760', 'es', 'GENERAL', 53,
    0, 0,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'O',
    'This field contains information about additional amounts related to the local undertaking, for example, interests, tolerances. Plus/minus tolerances to be specified as 2n/2n.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39D:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
); -- DELETED in this version

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39D:', 'Additional Amount Information', 'This field contains information about additional amounts related to the local undertaking, for example, interests, tolerances. Plus/minus tolerances to be specified as 2n/2n.',
    'MT760', 'en', 'GENERAL', 53,
    0, 0,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'O',
    'This field contains information about additional amounts related to the local undertaking, for example, interests, tolerances. Plus/minus tolerances to be specified as 2n/2n.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39D:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39F:', 'Supplementary Information About Amount', 'This field contains supplementary information about amount related to the local undertaking. The information can be optionally provided using codes. One or more of the following codes or any bilaterally agreed code may be used in Code:',
    'MT760', 'es', 'GENERAL', 53,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'O',
    'This field contains supplementary information about amount related to the local undertaking. The information can be optionally provided using codes. One or more of the following codes or any bilaterally agreed code may be used in Code:', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39F:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39F:', 'Supplementary Information About Amount', 'This field contains supplementary information about amount related to the local undertaking. The information can be optionally provided using codes. One or more of the following codes or any bilaterally agreed code may be used in Code:',
    'MT760', 'en', 'GENERAL', 53,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'O',
    'This field contains supplementary information about amount related to the local undertaking. The information can be optionally provided using codes. One or more of the following codes or any bilaterally agreed code may be used in Code:', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39F:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', '''Advise Through'' Bank', 'This field specifies an additional bank that is requested to advise the local undertaking.',
    'MT760', 'es', 'GENERAL', 54,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies an additional bank that is requested to advise the local undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', '''Advise Through'' Bank', 'This field specifies an additional bank that is requested to advise the local undertaking.',
    'MT760', 'en', 'GENERAL', 54,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies an additional bank that is requested to advise the local undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':41a:', 'Available With...', 'This field identifies the bank with which the credit is available (the place for presentation).',
    'MT760', 'es', 'GENERAL', 55,
    0, 1,
    'SELECT', 'DROPDOWN', '4!a', 'O',
    'This field identifies the bank with which the credit is available (the place for presentation).', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':41a:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':41a:', 'Available With...', 'This field identifies the bank with which the credit is available (the place for presentation).',
    'MT760', 'en', 'GENERAL', 55,
    0, 1,
    'SELECT', 'DROPDOWN', '4!a', 'O',
    'This field identifies the bank with which the credit is available (the place for presentation).', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':41a:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':71D:', 'Charges', 'This field contains information about the charges associated with the local undertaking, for example "Confirmation charges are for account of beneficiary". One or more of the following codes may be used in Code, followed by the currency code and amount:',
    'MT760', 'es', 'GENERAL', 56,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field contains information about the charges associated with the local undertaking, for example "Confirmation charges are for account of beneficiary". One or more of the following codes may be used in Code, followed by the currency code and amount:', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':71D:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':71D:', 'Charges', 'This field contains information about the charges associated with the local undertaking, for example "Confirmation charges are for account of beneficiary". One or more of the following codes may be used in Code, followed by the currency code and amount:',
    'MT760', 'en', 'GENERAL', 56,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field contains information about the charges associated with the local undertaking, for example "Confirmation charges are for account of beneficiary". One or more of the following codes may be used in Code, followed by the currency code and amount:', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':71D:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45C:', 'Document and Presentation Instructions', 'This field specifies the instructions (for example, form and/or place of presentation) including documents required to make a complying demand.',
    'MT760', 'es', 'GENERAL', 57,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies the instructions (for example, form and/or place of presentation) including documents required to make a complying demand.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45C:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45C:', 'Document and Presentation Instructions', 'This field specifies the instructions (for example, form and/or place of presentation) including documents required to make a complying demand.',
    'MT760', 'en', 'GENERAL', 57,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '100*65z', 'O',
    'This field specifies the instructions (for example, form and/or place of presentation) including documents required to make a complying demand.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45C:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':77L:', 'Requested Local Undertaking Terms and Conditions', 'This field specifies the requested terms and conditions of the local undertaking. This field must not repeat or be in conflict with any information that is already provided elsewhere in this message.',
    'MT760', 'es', 'GENERAL', 58,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '150*65z', 'O',
    'This field specifies the requested terms and conditions of the local undertaking. This field must not repeat or be in conflict with any information that is already provided elsewhere in this message.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':77L:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':77L:', 'Requested Local Undertaking Terms and Conditions', 'This field specifies the requested terms and conditions of the local undertaking. This field must not repeat or be in conflict with any information that is already provided elsewhere in this message.',
    'MT760', 'en', 'GENERAL', 58,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '150*65z', 'O',
    'This field specifies the requested terms and conditions of the local undertaking. This field must not repeat or be in conflict with any information that is already provided elsewhere in this message.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':77L:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':22Y:', 'Standard Wording Required', 'This field specifies that the wording of the terms and conditions must be the standard wording of the local undertaking issuer. Required must contain the following code (Error code(s): T48) :',
    'MT760', 'es', 'GENERAL', 59,
    0, 1,
    'TEXT', 'INPUT', '', 'O',
    'This field specifies that the wording of the terms and conditions must be the standard wording of the local undertaking issuer. Required must contain the following code (Error code(s): T48) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':22Y:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':22Y:', 'Standard Wording Required', 'This field specifies that the wording of the terms and conditions must be the standard wording of the local undertaking issuer. Required must contain the following code (Error code(s): T48) :',
    'MT760', 'en', 'GENERAL', 59,
    0, 1,
    'TEXT', 'INPUT', '', 'O',
    'This field specifies that the wording of the terms and conditions must be the standard wording of the local undertaking issuer. Required must contain the following code (Error code(s): T48) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':22Y:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44H:', 'Governing Law and/or Place of Jurisdiction', 'This field specifies the governing law (as an ISO 3166-1 code in Country Code) and/or place of jurisdiction (in Narrative, optionally) that is applicable to the local undertaking.',
    'MT760', 'es', 'GENERAL', 60,
    0, 0,
    'TEXT', 'INPUT', '2!a', 'O',
    'This field specifies the governing law (as an ISO 3166-1 code in Country Code) and/or place of jurisdiction (in Narrative, optionally) that is applicable to the local undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44H:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
); -- DELETED in this version

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44H:', 'Governing Law and/or Place of Jurisdiction', 'This field specifies the governing law (as an ISO 3166-1 code in Country Code) and/or place of jurisdiction (in Narrative, optionally) that is applicable to the local undertaking.',
    'MT760', 'en', 'GENERAL', 60,
    0, 0,
    'TEXT', 'INPUT', '2!a', 'O',
    'This field specifies the governing law (as an ISO 3166-1 code in Country Code) and/or place of jurisdiction (in Narrative, optionally) that is applicable to the local undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44H:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40D:', 'Standard Wording Requested Language', 'This field specifies the requested ISO 639 language code for the wording of the local undertaking.',
    'MT760', 'es', 'GENERAL', 60,
    0, 1,
    'TEXT', 'INPUT', '2!a', 'O',
    'This field specifies the requested ISO 639 language code for the wording of the local undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40D:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':40D:', 'Standard Wording Requested Language', 'This field specifies the requested ISO 639 language code for the wording of the local undertaking.',
    'MT760', 'en', 'GENERAL', 60,
    0, 1,
    'TEXT', 'INPUT', '2!a', 'O',
    'This field specifies the requested ISO 639 language code for the wording of the local undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':40D:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44J:', 'Governing Law/Jurisdiction', 'This field specifies the governing law (as an ISO 3166-1 code in Country Code and optionally, country subdivision). This field may also specify the place of jurisdiction (in narrative) that is applicable to the local undertaking.',
    'MT760', 'es', 'GENERAL', 61,
    0, 1,
    'TEXT', 'INPUT', '2!a', 'O',
    'This field specifies the governing law (as an ISO 3166-1 code in Country Code and optionally, country subdivision). This field may also specify the place of jurisdiction (in narrative) that is applicable to the local undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44J:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':44J:', 'Governing Law/Jurisdiction', 'This field specifies the governing law (as an ISO 3166-1 code in Country Code and optionally, country subdivision). This field may also specify the place of jurisdiction (in narrative) that is applicable to the local undertaking.',
    'MT760', 'en', 'GENERAL', 61,
    0, 1,
    'TEXT', 'INPUT', '2!a', 'O',
    'This field specifies the governing law (as an ISO 3166-1 code in Country Code and optionally, country subdivision). This field may also specify the place of jurisdiction (in narrative) that is applicable to the local undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':44J:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23F:', 'Automatic Extension Period', 'This field contains details about the automatic extension of the expiry date. Period must contain one of the following codes (Error code(s): T08) :',
    'MT760', 'es', 'GENERAL', 62,
    0, 1,
    'TEXT', 'INPUT', '4!a', 'O',
    'This field contains details about the automatic extension of the expiry date. Period must contain one of the following codes (Error code(s): T08) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23F:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23F:', 'Automatic Extension Period', 'This field contains details about the automatic extension of the expiry date. Period must contain one of the following codes (Error code(s): T08) :',
    'MT760', 'en', 'GENERAL', 62,
    0, 1,
    'TEXT', 'INPUT', '4!a', 'O',
    'This field contains details about the automatic extension of the expiry date. Period must contain one of the following codes (Error code(s): T08) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23F:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78:', 'Automatic Extension Non-Extension Notification', 'This field specifies information related to the non-extension to the automatic expiry date extension, such as notification method, and notification recipient details.',
    'MT760', 'es', 'GENERAL', 63,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies information related to the non-extension to the automatic expiry date extension, such as notification method, and notification recipient details.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78:', 'Automatic Extension Non-Extension Notification', 'This field specifies information related to the non-extension to the automatic expiry date extension, such as notification method, and notification recipient details.',
    'MT760', 'en', 'GENERAL', 63,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies information related to the non-extension to the automatic expiry date extension, such as notification method, and notification recipient details.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':26E:', 'Automatic Extension Notification Period', 'This field specifies the minimum number of calendar days prior to the current expiry date by which notice of non-extension must be sent.',
    'MT760', 'es', 'GENERAL', 64,
    0, 1,
    'NUMBER', 'INPUT', '3n', 'O',
    'This field specifies the minimum number of calendar days prior to the current expiry date by which notice of non-extension must be sent.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':26E:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':26E:', 'Automatic Extension Notification Period', 'This field specifies the minimum number of calendar days prior to the current expiry date by which notice of non-extension must be sent.',
    'MT760', 'en', 'GENERAL', 64,
    0, 1,
    'NUMBER', 'INPUT', '3n', 'O',
    'This field specifies the minimum number of calendar days prior to the current expiry date by which notice of non-extension must be sent.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':26E:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31S:', 'Automatic Extension Final Expiry Date', 'This field specifies the final expiry date after which the local undertaking will no longer be subject to automatic extension.',
    'MT760', 'es', 'GENERAL', 65,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the final expiry date after which the local undertaking will no longer be subject to automatic extension.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31S:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31S:', 'Automatic Extension Final Expiry Date', 'This field specifies the final expiry date after which the local undertaking will no longer be subject to automatic extension.',
    'MT760', 'en', 'GENERAL', 65,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the final expiry date after which the local undertaking will no longer be subject to automatic extension.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31S:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':48B:', 'Demand Indicator', 'This field specifies whether partial and/or multiple demands are not permitted. Code must contain one of the following codes (Error code(s): T03) : Absence of this field indicates that multiple and partial demands are permitted.',
    'MT760', 'es', 'GENERAL', 66,
    0, 1,
    'TEXT', 'INPUT', '', 'O',
    'This field specifies whether partial and/or multiple demands are not permitted. Code must contain one of the following codes (Error code(s): T03) : Absence of this field indicates that multiple and partial demands are permitted.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':48B:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':48B:', 'Demand Indicator', 'This field specifies whether partial and/or multiple demands are not permitted. Code must contain one of the following codes (Error code(s): T03) : Absence of this field indicates that multiple and partial demands are permitted.',
    'MT760', 'en', 'GENERAL', 66,
    0, 1,
    'TEXT', 'INPUT', '', 'O',
    'This field specifies whether partial and/or multiple demands are not permitted. Code must contain one of the following codes (Error code(s): T03) : Absence of this field indicates that multiple and partial demands are permitted.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':48B:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':48D:', 'Transfer Indicator', 'This field specifies that the local undertaking is transferable. Code must contain the following code (Error code(s): T04) : Absence of this field indicates that the local undertaking is not transferable.',
    'MT760', 'es', 'GENERAL', 67,
    0, 1,
    'TEXT', 'INPUT', '', 'O',
    'This field specifies that the local undertaking is transferable. Code must contain the following code (Error code(s): T04) : Absence of this field indicates that the local undertaking is not transferable.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':48D:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':48D:', 'Transfer Indicator', 'This field specifies that the local undertaking is transferable. Code must contain the following code (Error code(s): T04) : Absence of this field indicates that the local undertaking is not transferable.',
    'MT760', 'en', 'GENERAL', 67,
    0, 1,
    'TEXT', 'INPUT', '', 'O',
    'This field specifies that the local undertaking is transferable. Code must contain the following code (Error code(s): T04) : Absence of this field indicates that the local undertaking is not transferable.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':48D:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39E:', 'Transfer Conditions', 'This field specifies transfer conditions, if more details are needed than the indicator.',
    'MT760', 'es', 'GENERAL', 68,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'O',
    'This field specifies transfer conditions, if more details are needed than the indicator.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39E:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':39E:', 'Transfer Conditions', 'This field specifies transfer conditions, if more details are needed than the indicator.',
    'MT760', 'en', 'GENERAL', 68,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'O',
    'This field specifies transfer conditions, if more details are needed than the indicator.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':39E:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45L:', 'Underlying Transaction Details', 'This field specifies concise details of the underlying business transaction for which the local undertaking is issued.',
    'MT760', 'es', 'GENERAL', 69,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '50*65z', 'M',
    'This field specifies concise details of the underlying business transaction for which the local undertaking is issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45L:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':45L:', 'Underlying Transaction Details', 'This field specifies concise details of the underlying business transaction for which the local undertaking is issued.',
    'MT760', 'en', 'GENERAL', 69,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '50*65z', 'M',
    'This field specifies concise details of the underlying business transaction for which the local undertaking is issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':45L:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':24E:', 'Delivery of Local Undertaking', 'This field specifies the method by which the original local undertaking is to be delivered. Code must contain one of the following codes (Error code(s): T59) :',
    'MT760', 'es', 'GENERAL', 70,
    0, 1,
    'TEXT', 'INPUT', '35x', 'O',
    'This field specifies the method by which the original local undertaking is to be delivered. Code must contain one of the following codes (Error code(s): T59) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':24E:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':24E:', 'Delivery of Local Undertaking', 'This field specifies the method by which the original local undertaking is to be delivered. Code must contain one of the following codes (Error code(s): T59) :',
    'MT760', 'en', 'GENERAL', 70,
    0, 1,
    'TEXT', 'INPUT', '35x', 'O',
    'This field specifies the method by which the original local undertaking is to be delivered. Code must contain one of the following codes (Error code(s): T59) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':24E:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':24G:', 'Delivery To/Collection By', 'This field specifies to whom the original local undertaking is to be delivered or by whom the original local undertaking is to be collected. Code must contain one of the following codes (Error code(s): T60) :',
    'MT760', 'es', 'GENERAL', 71,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'O',
    'This field specifies to whom the original local undertaking is to be delivered or by whom the original local undertaking is to be collected. Code must contain one of the following codes (Error code(s): T60) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':24G:'
    AND message_type = 'MT760'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':24G:', 'Delivery To/Collection By', 'This field specifies to whom the original local undertaking is to be delivered or by whom the original local undertaking is to be collected. Code must contain one of the following codes (Error code(s): T60) :',
    'MT760', 'en', 'GENERAL', 71,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'O',
    'This field specifies to whom the original local undertaking is to be delivered or by whom the original local undertaking is to be collected. Code must contain one of the following codes (Error code(s): T60) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':24G:'
    AND message_type = 'MT760'
    AND language = 'en'
    AND spec_version = '2025'
);

-- MT765 Fields (17 fields)
-- ==================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Transaction Reference Number', 'This field contains the reference assigned by the Sender to unambiguously identify the message.',
    'MT765', 'es', 'GENERAL', 1,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field contains the reference assigned by the Sender to unambiguously identify the message.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Transaction Reference Number', 'This field contains the reference assigned by the Sender to unambiguously identify the message.',
    'MT765', 'en', 'GENERAL', 1,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field contains the reference assigned by the Sender to unambiguously identify the message.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':21:', 'Related Reference', 'This field specifies the reference which has been assigned to the undertaking by the issuing bank.',
    'MT765', 'es', 'GENERAL', 2,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the reference which has been assigned to the undertaking by the issuing bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':21:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':21:', 'Related Reference', 'This field specifies the reference which has been assigned to the undertaking by the issuing bank.',
    'MT765', 'en', 'GENERAL', 2,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the reference which has been assigned to the undertaking by the issuing bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':21:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23:', 'Beneficiary Reference Number', 'This field specifies the reference which has been assigned by the beneficiary.',
    'MT765', 'es', 'GENERAL', 3,
    0, 1,
    'TEXT', 'INPUT', '16x', 'O',
    'This field specifies the reference which has been assigned by the beneficiary.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23:', 'Beneficiary Reference Number', 'This field specifies the reference which has been assigned by the beneficiary.',
    'MT765', 'en', 'GENERAL', 3,
    0, 1,
    'TEXT', 'INPUT', '16x', 'O',
    'This field specifies the reference which has been assigned by the beneficiary.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuer', 'This field specifies the party that issued the undertaking (or counter-undertaking).',
    'MT765', 'es', 'GENERAL', 4,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies the party that issued the undertaking (or counter-undertaking).', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuer', 'This field specifies the party that issued the undertaking (or counter-undertaking).',
    'MT765', 'en', 'GENERAL', 4,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies the party that issued the undertaking (or counter-undertaking).', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59a:', 'Beneficiary', 'This field specifies the party in whose favour the undertaking is issued.',
    'MT765', 'es', 'GENERAL', 5,
    0, 1,
    'TEXT', 'INPUT', '34x', 'O',
    'This field specifies the party in whose favour the undertaking is issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59a:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59a:', 'Beneficiary', 'This field specifies the party in whose favour the undertaking is issued.',
    'MT765', 'en', 'GENERAL', 5,
    0, 1,
    'TEXT', 'INPUT', '34x', 'O',
    'This field specifies the party in whose favour the undertaking is issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59a:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31L:', 'Date of Demand', 'This field specifies the date on which the demand is issued by the beneficiary.',
    'MT765', 'es', 'GENERAL', 6,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the date on which the demand is issued by the beneficiary.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31L:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31L:', 'Date of Demand', 'This field specifies the date on which the demand is issued by the beneficiary.',
    'MT765', 'en', 'GENERAL', 6,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the date on which the demand is issued by the beneficiary.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31L:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':22G:', 'Demand Type', 'This field specifies the type of demand. Type must contain one of the following codes (Error code(s): T71) :',
    'MT765', 'es', 'GENERAL', 7,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the type of demand. Type must contain one of the following codes (Error code(s): T71) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':22G:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':22G:', 'Demand Type', 'This field specifies the type of demand. Type must contain one of the following codes (Error code(s): T71) :',
    'MT765', 'en', 'GENERAL', 7,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the type of demand. Type must contain one of the following codes (Error code(s): T71) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':22G:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Demand Amount', 'This field contains the currency and amount of the amount claimed. The total demand amount might include additional amounts, for example, interest, fees, etc.',
    'MT765', 'es', 'GENERAL', 8,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field contains the currency and amount of the amount claimed. The total demand amount might include additional amounts, for example, interest, fees, etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Demand Amount', 'This field contains the currency and amount of the amount claimed. The total demand amount might include additional amounts, for example, interest, fees, etc.',
    'MT765', 'en', 'GENERAL', 8,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field contains the currency and amount of the amount claimed. The total demand amount might include additional amounts, for example, interest, fees, etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78:', 'Additional Amount Information', 'This field specifies additional information about the demand amount. It might also include requests for handling of additional amounts like interest, fees, etc.',
    'MT765', 'es', 'GENERAL', 9,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies additional information about the demand amount. It might also include requests for handling of additional amounts like interest, fees, etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':78:', 'Additional Amount Information', 'This field specifies additional information about the demand amount. It might also include requests for handling of additional amounts like interest, fees, etc.',
    'MT765', 'en', 'GENERAL', 9,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies additional information about the demand amount. It might also include requests for handling of additional amounts like interest, fees, etc.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':78:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49A:', 'Demand Statement', 'This field specifies the narrative text that constitutes the demand. Code must contain one of the following codes (Error code(s): T67) :',
    'MT765', 'es', 'GENERAL', 10,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '50*65z', 'O',
    'This field specifies the narrative text that constitutes the demand. Code must contain one of the following codes (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49A:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':49A:', 'Demand Statement', 'This field specifies the narrative text that constitutes the demand. Code must contain one of the following codes (Error code(s): T67) :',
    'MT765', 'en', 'GENERAL', 10,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '50*65z', 'O',
    'This field specifies the narrative text that constitutes the demand. Code must contain one of the following codes (Error code(s): T67) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':49A:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':77:', 'Presentation Completion Details', 'This field specifies information about the presentation documentation. If the presentation is incomplete, this must specify how the presentation will be completed.',
    'MT765', 'es', 'GENERAL', 11,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '20*35z', 'O',
    'This field specifies information about the presentation documentation. If the presentation is incomplete, this must specify how the presentation will be completed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':77:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':77:', 'Presentation Completion Details', 'This field specifies information about the presentation documentation. If the presentation is incomplete, this must specify how the presentation will be completed.',
    'MT765', 'en', 'GENERAL', 11,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '20*35z', 'O',
    'This field specifies information about the presentation documentation. If the presentation is incomplete, this must specify how the presentation will be completed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':77:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31E:', 'Requested New Date of Expiry', 'This field specifies the requested new expiry date as an alternative to payment of the demand.',
    'MT765', 'es', 'GENERAL', 12,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the requested new expiry date as an alternative to payment of the demand.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31E:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31E:', 'Requested New Date of Expiry', 'This field specifies the requested new expiry date as an alternative to payment of the demand.',
    'MT765', 'en', 'GENERAL', 12,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the requested new expiry date as an alternative to payment of the demand.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31E:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31R:', 'Requested New Date of Expiry of Local Undertaking', 'This field specifies (if applicable) the requested new expiry date of the local undertaking as an alternative to payment of the demand.',
    'MT765', 'es', 'GENERAL', 13,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies (if applicable) the requested new expiry date of the local undertaking as an alternative to payment of the demand.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31R:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31R:', 'Requested New Date of Expiry of Local Undertaking', 'This field specifies (if applicable) the requested new expiry date of the local undertaking as an alternative to payment of the demand.',
    'MT765', 'en', 'GENERAL', 13,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies (if applicable) the requested new expiry date of the local undertaking as an alternative to payment of the demand.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31R:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':56a:', 'Intermediary', 'This field specifies the financial institution through which the amount claimed must pass to reach the account with institution.',
    'MT765', 'es', 'GENERAL', 14,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the financial institution through which the amount claimed must pass to reach the account with institution.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':56a:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':56a:', 'Intermediary', 'This field specifies the financial institution through which the amount claimed must pass to reach the account with institution.',
    'MT765', 'en', 'GENERAL', 14,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the financial institution through which the amount claimed must pass to reach the account with institution.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':56a:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', 'Account With Institution', 'This field specifies the financial institution at which the amount claimed is to be settled.',
    'MT765', 'es', 'GENERAL', 15,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the financial institution at which the amount claimed is to be settled.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', 'Account With Institution', 'This field specifies the financial institution at which the amount claimed is to be settled.',
    'MT765', 'en', 'GENERAL', 15,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the financial institution at which the amount claimed is to be settled.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver.',
    'MT765', 'es', 'GENERAL', 16,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies additional information for the Receiver.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver.',
    'MT765', 'en', 'GENERAL', 16,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies additional information for the Receiver.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23X:', 'File Identification', 'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.',
    'MT765', 'es', 'GENERAL', 17,
    0, 1,
    'TEXT', 'INPUT', '65x', 'O',
    'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23X:'
    AND message_type = 'MT765'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23X:', 'File Identification', 'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.',
    'MT765', 'en', 'GENERAL', 17,
    0, 1,
    'TEXT', 'INPUT', '65x', 'O',
    'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23X:'
    AND message_type = 'MT765'
    AND language = 'en'
    AND spec_version = '2025'
);

-- MT767 Fields (32 fields)
-- ==================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':15A:', 'New Sequence', 'This field specifies the start of mandatory sequence A General Information. Only the field tag must be present, the field is empty.',
    'MT767', 'es', 'GENERAL', 1,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the start of mandatory sequence A General Information. Only the field tag must be present, the field is empty.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':15A:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':15A:', 'New Sequence', 'This field specifies the start of mandatory sequence A General Information. Only the field tag must be present, the field is empty.',
    'MT767', 'en', 'GENERAL', 1,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the start of mandatory sequence A General Information. Only the field tag must be present, the field is empty.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':15A:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':27:', 'Sequence of Total', 'This field specifies the number of this message in the series of messages sent for an undertaking amendment, and the total number of messages in the series.',
    'MT767', 'es', 'GENERAL', 2,
    1, 1,
    'NUMBER', 'INPUT', '1!n', 'M',
    'This field specifies the number of this message in the series of messages sent for an undertaking amendment, and the total number of messages in the series.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':27:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':27:', 'Sequence of Total', 'This field specifies the number of this message in the series of messages sent for an undertaking amendment, and the total number of messages in the series.',
    'MT767', 'en', 'GENERAL', 2,
    1, 1,
    'NUMBER', 'INPUT', '1!n', 'M',
    'This field specifies the number of this message in the series of messages sent for an undertaking amendment, and the total number of messages in the series.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':27:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':21:', 'Related Reference', 'If the Receiver of this message has previously sent an MT 768 Acknowledgement of a Guarantee/Standby Message or its equivalent, this field contains the contents of field 20 Transaction Reference Number of the acknowledgement. If no acknowledgement was previously received, this field will contain a reference which is meaningful to the Receiver, for example, the undertaking number.',
    'MT767', 'es', 'GENERAL', 3,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'If the Receiver of this message has previously sent an MT 768 Acknowledgement of a Guarantee/Standby Message or its equivalent, this field contains the contents of field 20 Transaction Reference Number of the acknowledgement. If no acknowledgement was previously received, this field will contain a reference which is meaningful to the Receiver, for example, the undertaking number.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':21:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':21:', 'Related Reference', 'If the Receiver of this message has previously sent an MT 768 Acknowledgement of a Guarantee/Standby Message or its equivalent, this field contains the contents of field 20 Transaction Reference Number of the acknowledgement. If no acknowledgement was previously received, this field will contain a reference which is meaningful to the Receiver, for example, the undertaking number.',
    'MT767', 'en', 'GENERAL', 3,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'If the Receiver of this message has previously sent an MT 768 Acknowledgement of a Guarantee/Standby Message or its equivalent, this field contains the contents of field 20 Transaction Reference Number of the acknowledgement. If no acknowledgement was previously received, this field will contain a reference which is meaningful to the Receiver, for example, the undertaking number.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':21:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':22A:', 'Purpose of Message', 'This field specifies the purpose of this message. Purpose must contain one of the following codes (Error code(s): T36) :',
    'MT767', 'es', 'GENERAL', 4,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the purpose of this message. Purpose must contain one of the following codes (Error code(s): T36) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':22A:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':22A:', 'Purpose of Message', 'This field specifies the purpose of this message. Purpose must contain one of the following codes (Error code(s): T36) :',
    'MT767', 'en', 'GENERAL', 4,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the purpose of this message. Purpose must contain one of the following codes (Error code(s): T36) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':22A:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23S:', 'Cancellation Request', 'This field specifies that the instrument is requested to be cancelled. Request must contain the following code (Error code(s): T93) :',
    'MT767', 'es', 'GENERAL', 5,
    1, 1,
    'TEXT', 'INPUT', '6!a', 'M',
    'This field specifies that the instrument is requested to be cancelled. Request must contain the following code (Error code(s): T93) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23S:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23S:', 'Cancellation Request', 'This field specifies that the instrument is requested to be cancelled. Request must contain the following code (Error code(s): T93) :',
    'MT767', 'en', 'GENERAL', 5,
    1, 1,
    'TEXT', 'INPUT', '6!a', 'M',
    'This field specifies that the instrument is requested to be cancelled. Request must contain the following code (Error code(s): T93) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23S:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field contains additional information for the Receiver. One or more of the following codes may be used in Code:',
    'MT767', 'es', 'GENERAL', 6,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'M',
    'This field contains additional information for the Receiver. One or more of the following codes may be used in Code:', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field contains additional information for the Receiver. One or more of the following codes may be used in Code:',
    'MT767', 'en', 'GENERAL', 6,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'M',
    'This field contains additional information for the Receiver. One or more of the following codes may be used in Code:', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23X:', 'File Identification', 'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) :',
    'MT767', 'es', 'GENERAL', 7,
    1, 1,
    'TEXT', 'INPUT', '65x', 'M',
    'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23X:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23X:', 'File Identification', 'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) :',
    'MT767', 'en', 'GENERAL', 7,
    1, 1,
    'TEXT', 'INPUT', '65x', 'M',
    'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23X:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':15B:', 'New Sequence', 'This field specifies the start of mandatory sequence B Undertaking Details. Only the field tag must be present, the field is empty.',
    'MT767', 'es', 'GENERAL', 8,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the start of mandatory sequence B Undertaking Details. Only the field tag must be present, the field is empty.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':15B:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':15B:', 'New Sequence', 'This field specifies the start of mandatory sequence B Undertaking Details. Only the field tag must be present, the field is empty.',
    'MT767', 'en', 'GENERAL', 8,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the start of mandatory sequence B Undertaking Details. Only the field tag must be present, the field is empty.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':15B:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Undertaking Number', 'This field specifies the unique and unambiguous undertaking identifier assigned by the issuer.',
    'MT767', 'es', 'GENERAL', 9,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the unique and unambiguous undertaking identifier assigned by the issuer.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Undertaking Number', 'This field specifies the unique and unambiguous undertaking identifier assigned by the issuer.',
    'MT767', 'en', 'GENERAL', 9,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the unique and unambiguous undertaking identifier assigned by the issuer.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':26E:', 'Number of Amendment', 'This field specifies the sequence number that identifies this amendment. This number should be the latest in the series of all amendments made, regardless of the means by which previous amendments were sent.',
    'MT767', 'es', 'GENERAL', 10,
    1, 1,
    'NUMBER', 'INPUT', '3n', 'M',
    'This field specifies the sequence number that identifies this amendment. This number should be the latest in the series of all amendments made, regardless of the means by which previous amendments were sent.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':26E:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':26E:', 'Number of Amendment', 'This field specifies the sequence number that identifies this amendment. This number should be the latest in the series of all amendments made, regardless of the means by which previous amendments were sent.',
    'MT767', 'en', 'GENERAL', 10,
    1, 1,
    'NUMBER', 'INPUT', '3n', 'M',
    'This field specifies the sequence number that identifies this amendment. This number should be the latest in the series of all amendments made, regardless of the means by which previous amendments were sent.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':26E:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':30:', 'Date of Amendment', 'This field specifies the date on which the undertaking amendment is issued.',
    'MT767', 'es', 'GENERAL', 11,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date on which the undertaking amendment is issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':30:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':30:', 'Date of Amendment', 'This field specifies the date on which the undertaking amendment is issued.',
    'MT767', 'en', 'GENERAL', 11,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date on which the undertaking amendment is issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':30:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuer', 'This field specifies the party that issues the undertaking (or counter-undertaking).',
    'MT767', 'es', 'GENERAL', 12,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies the party that issues the undertaking (or counter-undertaking).', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuer', 'This field specifies the party that issues the undertaking (or counter-undertaking).',
    'MT767', 'en', 'GENERAL', 12,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies the party that issues the undertaking (or counter-undertaking).', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23:', 'Advising Bank Reference', 'This field specifies a reference assigned by the advising bank.',
    'MT767', 'es', 'GENERAL', 13,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies a reference assigned by the advising bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23:', 'Advising Bank Reference', 'This field specifies a reference assigned by the advising bank.',
    'MT767', 'en', 'GENERAL', 13,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies a reference assigned by the advising bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Increase of Undertaking Amount', 'This field specifies the currency and the amount of the increase of the undertaking amount.',
    'MT767', 'es', 'GENERAL', 14,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field specifies the currency and the amount of the increase of the undertaking amount.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Increase of Undertaking Amount', 'This field specifies the currency and the amount of the increase of the undertaking amount.',
    'MT767', 'en', 'GENERAL', 14,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field specifies the currency and the amount of the increase of the undertaking amount.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':33B:', 'Decrease of Undertaking Amount', 'This field specifies the currency and the amount of the decrease of the undertaking amount.',
    'MT767', 'es', 'GENERAL', 15,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field specifies the currency and the amount of the decrease of the undertaking amount.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':33B:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':33B:', 'Decrease of Undertaking Amount', 'This field specifies the currency and the amount of the decrease of the undertaking amount.',
    'MT767', 'en', 'GENERAL', 15,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field specifies the currency and the amount of the decrease of the undertaking amount.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':33B:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23B:', 'Expiry Type', 'This field specifies whether the undertaking has a specified expiry date or is open-ended or is dependent on a documentary condition or event, if it has changed. Type must contain one of the following codes (Error code(s): T36) :',
    'MT767', 'es', 'GENERAL', 16,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies whether the undertaking has a specified expiry date or is open-ended or is dependent on a documentary condition or event, if it has changed. Type must contain one of the following codes (Error code(s): T36) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23B:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23B:', 'Expiry Type', 'This field specifies whether the undertaking has a specified expiry date or is open-ended or is dependent on a documentary condition or event, if it has changed. Type must contain one of the following codes (Error code(s): T36) :',
    'MT767', 'en', 'GENERAL', 16,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies whether the undertaking has a specified expiry date or is open-ended or is dependent on a documentary condition or event, if it has changed. Type must contain one of the following codes (Error code(s): T36) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23B:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31E:', 'Date of Expiry', 'This field specifies the new date when the undertaking will cease to be available, if it has changed.',
    'MT767', 'es', 'GENERAL', 17,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the new date when the undertaking will cease to be available, if it has changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31E:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31E:', 'Date of Expiry', 'This field specifies the new date when the undertaking will cease to be available, if it has changed.',
    'MT767', 'en', 'GENERAL', 17,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the new date when the undertaking will cease to be available, if it has changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31E:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':35G:', 'Expiry Condition/Event', 'This field specifies the documentary condition/event that indicates when the undertaking will cease to be available, if it has changed, for example 180 days after date of required document.',
    'MT767', 'es', 'GENERAL', 18,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'M',
    'This field specifies the documentary condition/event that indicates when the undertaking will cease to be available, if it has changed, for example 180 days after date of required document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':35G:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':35G:', 'Expiry Condition/Event', 'This field specifies the documentary condition/event that indicates when the undertaking will cease to be available, if it has changed, for example 180 days after date of required document.',
    'MT767', 'en', 'GENERAL', 18,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'M',
    'This field specifies the documentary condition/event that indicates when the undertaking will cease to be available, if it has changed, for example 180 days after date of required document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':35G:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59a:', 'Beneficiary', 'This field specifies the beneficiary of the undertaking, if it has changed.',
    'MT767', 'es', 'GENERAL', 19,
    1, 1,
    'TEXT', 'INPUT', '34x', 'M',
    'This field specifies the beneficiary of the undertaking, if it has changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59a:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59a:', 'Beneficiary', 'This field specifies the beneficiary of the undertaking, if it has changed.',
    'MT767', 'en', 'GENERAL', 19,
    1, 1,
    'TEXT', 'INPUT', '34x', 'M',
    'This field specifies the beneficiary of the undertaking, if it has changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59a:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':77U:', 'Other Amendments to Undertaking', 'This field specifies changes to the terms and conditions of the undertaking (excluding information already expressed in other fields or other associated messages). The presence of this field implies that undertaking terms and conditions are amended.',
    'MT767', 'es', 'GENERAL', 20,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '150*65z', 'M',
    'This field specifies changes to the terms and conditions of the undertaking (excluding information already expressed in other fields or other associated messages). The presence of this field implies that undertaking terms and conditions are amended.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':77U:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':77U:', 'Other Amendments to Undertaking', 'This field specifies changes to the terms and conditions of the undertaking (excluding information already expressed in other fields or other associated messages). The presence of this field implies that undertaking terms and conditions are amended.',
    'MT767', 'en', 'GENERAL', 20,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '150*65z', 'M',
    'This field specifies changes to the terms and conditions of the undertaking (excluding information already expressed in other fields or other associated messages). The presence of this field implies that undertaking terms and conditions are amended.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':77U:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':24E:', 'Delivery of Amendment To Undertaking', 'This field specifies the method by which the amendment to the undertaking is to be delivered. Code must contain one of the following codes (Error code(s): T59) :',
    'MT767', 'es', 'GENERAL', 21,
    1, 1,
    'TEXT', 'INPUT', '35x', 'M',
    'This field specifies the method by which the amendment to the undertaking is to be delivered. Code must contain one of the following codes (Error code(s): T59) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':24E:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':24E:', 'Delivery of Amendment To Undertaking', 'This field specifies the method by which the amendment to the undertaking is to be delivered. Code must contain one of the following codes (Error code(s): T59) :',
    'MT767', 'en', 'GENERAL', 21,
    1, 1,
    'TEXT', 'INPUT', '35x', 'M',
    'This field specifies the method by which the amendment to the undertaking is to be delivered. Code must contain one of the following codes (Error code(s): T59) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':24E:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':24G:', 'Delivery To/Collection By', 'This field specifies to whom the amendment to the undertaking is to be delivered or by whom the amendment to the undertaking is to be collected. Code must contain one of the following codes (Error code(s): T60) :',
    'MT767', 'es', 'GENERAL', 22,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'M',
    'This field specifies to whom the amendment to the undertaking is to be delivered or by whom the amendment to the undertaking is to be collected. Code must contain one of the following codes (Error code(s): T60) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':24G:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':24G:', 'Delivery To/Collection By', 'This field specifies to whom the amendment to the undertaking is to be delivered or by whom the amendment to the undertaking is to be collected. Code must contain one of the following codes (Error code(s): T60) :',
    'MT767', 'en', 'GENERAL', 22,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'M',
    'This field specifies to whom the amendment to the undertaking is to be delivered or by whom the amendment to the undertaking is to be collected. Code must contain one of the following codes (Error code(s): T60) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':24G:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':15C:', 'New Sequence', 'This field specifies the start of optional sequence C Local Undertaking Details. This field may only be used when at least one other field in the optional sequence C is present and is otherwise not allowed. Only the field tag must be present, the field is empty.',
    'MT767', 'es', 'GENERAL', 23,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the start of optional sequence C Local Undertaking Details. This field may only be used when at least one other field in the optional sequence C is present and is otherwise not allowed. Only the field tag must be present, the field is empty.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':15C:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':15C:', 'New Sequence', 'This field specifies the start of optional sequence C Local Undertaking Details. This field may only be used when at least one other field in the optional sequence C is present and is otherwise not allowed. Only the field tag must be present, the field is empty.',
    'MT767', 'en', 'GENERAL', 23,
    1, 1,
    'TEXT', 'INPUT', '', 'M',
    'This field specifies the start of optional sequence C Local Undertaking Details. This field may only be used when at least one other field in the optional sequence C is present and is otherwise not allowed. Only the field tag must be present, the field is empty.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':15C:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Increase of Local Undertaking Amount', 'This field specifies the currency and the amount of the increase of the local undertaking amount.',
    'MT767', 'es', 'GENERAL', 24,
    0, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'O',
    'This field specifies the currency and the amount of the increase of the local undertaking amount.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Increase of Local Undertaking Amount', 'This field specifies the currency and the amount of the increase of the local undertaking amount.',
    'MT767', 'en', 'GENERAL', 24,
    0, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'O',
    'This field specifies the currency and the amount of the increase of the local undertaking amount.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':33B:', 'Decrease of Local Undertaking Amount', 'This field specifies the currency and the amount of the decrease of the local undertaking amount.',
    'MT767', 'es', 'GENERAL', 25,
    0, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'O',
    'This field specifies the currency and the amount of the decrease of the local undertaking amount.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':33B:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':33B:', 'Decrease of Local Undertaking Amount', 'This field specifies the currency and the amount of the decrease of the local undertaking amount.',
    'MT767', 'en', 'GENERAL', 25,
    0, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'O',
    'This field specifies the currency and the amount of the decrease of the local undertaking amount.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':33B:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23B:', 'Expiry Type', 'This field specifies whether the local undertaking has a specified expiry date or is open-ended or is dependent on a documentary condition or event, if it has changed. Type must contain one of the following codes (Error code(s): T36) :',
    'MT767', 'es', 'GENERAL', 26,
    0, 1,
    'TEXT', 'INPUT', '', 'O',
    'This field specifies whether the local undertaking has a specified expiry date or is open-ended or is dependent on a documentary condition or event, if it has changed. Type must contain one of the following codes (Error code(s): T36) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23B:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23B:', 'Expiry Type', 'This field specifies whether the local undertaking has a specified expiry date or is open-ended or is dependent on a documentary condition or event, if it has changed. Type must contain one of the following codes (Error code(s): T36) :',
    'MT767', 'en', 'GENERAL', 26,
    0, 1,
    'TEXT', 'INPUT', '', 'O',
    'This field specifies whether the local undertaking has a specified expiry date or is open-ended or is dependent on a documentary condition or event, if it has changed. Type must contain one of the following codes (Error code(s): T36) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23B:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31E:', 'Date of Expiry', 'This field specifies the new date when the local undertaking will cease to be available, if it has changed.',
    'MT767', 'es', 'GENERAL', 27,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the new date when the local undertaking will cease to be available, if it has changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31E:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31E:', 'Date of Expiry', 'This field specifies the new date when the local undertaking will cease to be available, if it has changed.',
    'MT767', 'en', 'GENERAL', 27,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the new date when the local undertaking will cease to be available, if it has changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31E:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':35G:', 'Expiry Condition/Event', 'This field specifies the new documentary condition/event that indicates when the local undertaking will cease to be available, if it has changed, for example 180 days after date of required document.',
    'MT767', 'es', 'GENERAL', 28,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies the new documentary condition/event that indicates when the local undertaking will cease to be available, if it has changed, for example 180 days after date of required document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':35G:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':35G:', 'Expiry Condition/Event', 'This field specifies the new documentary condition/event that indicates when the local undertaking will cease to be available, if it has changed, for example 180 days after date of required document.',
    'MT767', 'en', 'GENERAL', 28,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65x', 'O',
    'This field specifies the new documentary condition/event that indicates when the local undertaking will cease to be available, if it has changed, for example 180 days after date of required document.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':35G:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59:', 'Beneficiary', 'This field specifies the new beneficiary of the local undertaking, if it has changed.',
    'MT767', 'es', 'GENERAL', 29,
    0, 1,
    'PARTICIPANT', 'NON_CLIENT_SELECTOR', '[/34x]4*35x', 'O',
    'This field specifies the new beneficiary of the local undertaking, if it has changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59:', 'Beneficiary', 'This field specifies the new beneficiary of the local undertaking, if it has changed.',
    'MT767', 'en', 'GENERAL', 29,
    0, 1,
    'PARTICIPANT', 'NON_CLIENT_SELECTOR', '[/34x]4*35x', 'O',
    'This field specifies the new beneficiary of the local undertaking, if it has changed.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':77L:', 'Other Amendments to Local Undertaking', 'This field specifies changes to the terms and conditions of the local undertaking (excluding information already expressed in other fields or other associated messages). The presence of this field implies that local undertaking terms and conditions are amended.',
    'MT767', 'es', 'GENERAL', 30,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '150*65z', 'O',
    'This field specifies changes to the terms and conditions of the local undertaking (excluding information already expressed in other fields or other associated messages). The presence of this field implies that local undertaking terms and conditions are amended.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':77L:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':77L:', 'Other Amendments to Local Undertaking', 'This field specifies changes to the terms and conditions of the local undertaking (excluding information already expressed in other fields or other associated messages). The presence of this field implies that local undertaking terms and conditions are amended.',
    'MT767', 'en', 'GENERAL', 30,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '150*65z', 'O',
    'This field specifies changes to the terms and conditions of the local undertaking (excluding information already expressed in other fields or other associated messages). The presence of this field implies that local undertaking terms and conditions are amended.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':77L:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':24E:', 'Delivery of Amendment To Local Undertaking', 'This field specifies the method by which the amendment to the local undertaking is to be delivered. Code must contain one of the following codes (Error code(s): T59) :',
    'MT767', 'es', 'GENERAL', 31,
    0, 1,
    'TEXT', 'INPUT', '35x', 'O',
    'This field specifies the method by which the amendment to the local undertaking is to be delivered. Code must contain one of the following codes (Error code(s): T59) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':24E:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':24E:', 'Delivery of Amendment To Local Undertaking', 'This field specifies the method by which the amendment to the local undertaking is to be delivered. Code must contain one of the following codes (Error code(s): T59) :',
    'MT767', 'en', 'GENERAL', 31,
    0, 1,
    'TEXT', 'INPUT', '35x', 'O',
    'This field specifies the method by which the amendment to the local undertaking is to be delivered. Code must contain one of the following codes (Error code(s): T59) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':24E:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':24G:', 'Delivery To/Collection By', 'This field specifies to whom the amendment to the local undertaking is to be delivered or by whom the amendment to the local undertaking is to be collected. Code must contain one of the following codes (Error code(s): T60) :',
    'MT767', 'es', 'GENERAL', 32,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'O',
    'This field specifies to whom the amendment to the local undertaking is to be delivered or by whom the amendment to the local undertaking is to be collected. Code must contain one of the following codes (Error code(s): T60) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':24G:'
    AND message_type = 'MT767'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':24G:', 'Delivery To/Collection By', 'This field specifies to whom the amendment to the local undertaking is to be delivered or by whom the amendment to the local undertaking is to be collected. Code must contain one of the following codes (Error code(s): T60) :',
    'MT767', 'en', 'GENERAL', 32,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '12*65z', 'O',
    'This field specifies to whom the amendment to the local undertaking is to be delivered or by whom the amendment to the local undertaking is to be collected. Code must contain one of the following codes (Error code(s): T60) :', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':24G:'
    AND message_type = 'MT767'
    AND language = 'en'
    AND spec_version = '2025'
);

-- MT785 Fields (10 fields)
-- ==================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Undertaking Number', 'This field specifies the unique and unambiguous identifier assigned by the issuer of the undertaking.',
    'MT785', 'es', 'GENERAL', 1,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the unique and unambiguous identifier assigned by the issuer of the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT785'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Undertaking Number', 'This field specifies the unique and unambiguous identifier assigned by the issuer of the undertaking.',
    'MT785', 'en', 'GENERAL', 1,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the unique and unambiguous identifier assigned by the issuer of the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT785'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':21:', 'Related Reference', 'This field specifies the reference which has been assigned by the beneficiary of the undertaking or counter-undertaking.',
    'MT785', 'es', 'GENERAL', 2,
    0, 1,
    'TEXT', 'INPUT', '16x', 'O',
    'This field specifies the reference which has been assigned by the beneficiary of the undertaking or counter-undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':21:'
    AND message_type = 'MT785'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':21:', 'Related Reference', 'This field specifies the reference which has been assigned by the beneficiary of the undertaking or counter-undertaking.',
    'MT785', 'en', 'GENERAL', 2,
    0, 1,
    'TEXT', 'INPUT', '16x', 'O',
    'This field specifies the reference which has been assigned by the beneficiary of the undertaking or counter-undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':21:'
    AND message_type = 'MT785'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuer', 'This field specifies the party that issued the undertaking (or counter-undertaking).',
    'MT785', 'es', 'GENERAL', 3,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies the party that issued the undertaking (or counter-undertaking).', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT785'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuer', 'This field specifies the party that issued the undertaking (or counter-undertaking).',
    'MT785', 'en', 'GENERAL', 3,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies the party that issued the undertaking (or counter-undertaking).', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT785'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31C:', 'Date of Issue', 'This field specifies the date on which the undertaking was issued.',
    'MT785', 'es', 'GENERAL', 4,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date on which the undertaking was issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31C:'
    AND message_type = 'MT785'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31C:', 'Date of Issue', 'This field specifies the date on which the undertaking was issued.',
    'MT785', 'en', 'GENERAL', 4,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date on which the undertaking was issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31C:'
    AND message_type = 'MT785'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59a:', 'Beneficiary', 'This field specifies the party in whose favour the undertaking (or counter-undertaking) is issued.',
    'MT785', 'es', 'GENERAL', 5,
    1, 1,
    'TEXT', 'INPUT', '34x', 'M',
    'This field specifies the party in whose favour the undertaking (or counter-undertaking) is issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59a:'
    AND message_type = 'MT785'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':59a:', 'Beneficiary', 'This field specifies the party in whose favour the undertaking (or counter-undertaking) is issued.',
    'MT785', 'en', 'GENERAL', 5,
    1, 1,
    'TEXT', 'INPUT', '34x', 'M',
    'This field specifies the party in whose favour the undertaking (or counter-undertaking) is issued.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':59a:'
    AND message_type = 'MT785'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':56a:', 'Advising Bank', 'This field specifies the advising bank.',
    'MT785', 'es', 'GENERAL', 6,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the advising bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':56a:'
    AND message_type = 'MT785'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':56a:', 'Advising Bank', 'This field specifies the advising bank.',
    'MT785', 'en', 'GENERAL', 6,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies the advising bank.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':56a:'
    AND message_type = 'MT785'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', '''Advise Through'' Bank', 'This field specifies an additional bank requested to advise the undertaking.',
    'MT785', 'es', 'GENERAL', 7,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies an additional bank requested to advise the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT785'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':57a:', '''Advise Through'' Bank', 'This field specifies an additional bank requested to advise the undertaking.',
    'MT785', 'en', 'GENERAL', 7,
    0, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'O',
    'This field specifies an additional bank requested to advise the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':57a:'
    AND message_type = 'MT785'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31E:', 'Final Date of Expiry', 'This field specifies the final expiry date.',
    'MT785', 'es', 'GENERAL', 8,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the final expiry date.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31E:'
    AND message_type = 'MT785'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':31E:', 'Final Date of Expiry', 'This field specifies the final expiry date.',
    'MT785', 'en', 'GENERAL', 8,
    0, 1,
    'DATE', 'DATE_PICKER', '6!n', 'O',
    'This field specifies the final expiry date.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':31E:'
    AND message_type = 'MT785'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver.',
    'MT785', 'es', 'GENERAL', 9,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies additional information for the Receiver.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT785'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver.',
    'MT785', 'en', 'GENERAL', 9,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies additional information for the Receiver.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT785'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23X:', 'File Identification', 'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.',
    'MT785', 'es', 'GENERAL', 10,
    0, 1,
    'TEXT', 'INPUT', '65x', 'O',
    'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23X:'
    AND message_type = 'MT785'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23X:', 'File Identification', 'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.',
    'MT785', 'en', 'GENERAL', 10,
    0, 1,
    'TEXT', 'INPUT', '65x', 'O',
    'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23X:'
    AND message_type = 'MT785'
    AND language = 'en'
    AND spec_version = '2025'
);

-- MT786 Fields (9 fields)
-- ==================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Undertaking Number', 'This field specifies the unique and unambiguous undertaking identifier that is assigned by the issuer.',
    'MT786', 'es', 'GENERAL', 1,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the unique and unambiguous undertaking identifier that is assigned by the issuer.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT786'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Undertaking Number', 'This field specifies the unique and unambiguous undertaking identifier that is assigned by the issuer.',
    'MT786', 'en', 'GENERAL', 1,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the unique and unambiguous undertaking identifier that is assigned by the issuer.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT786'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':21:', 'Beneficiary Reference Number', 'This field specifies the reference which has been assigned by the beneficiary.',
    'MT786', 'es', 'GENERAL', 2,
    0, 1,
    'TEXT', 'INPUT', '16x', 'O',
    'This field specifies the reference which has been assigned by the beneficiary.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':21:'
    AND message_type = 'MT786'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':21:', 'Beneficiary Reference Number', 'This field specifies the reference which has been assigned by the beneficiary.',
    'MT786', 'en', 'GENERAL', 2,
    0, 1,
    'TEXT', 'INPUT', '16x', 'O',
    'This field specifies the reference which has been assigned by the beneficiary.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':21:'
    AND message_type = 'MT786'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuer', 'This field specifies the party that issues the undertaking (or counter-undertaking).',
    'MT786', 'es', 'GENERAL', 3,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies the party that issues the undertaking (or counter-undertaking).', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT786'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuer', 'This field specifies the party that issues the undertaking (or counter-undertaking).',
    'MT786', 'en', 'GENERAL', 3,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies the party that issues the undertaking (or counter-undertaking).', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT786'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':30:', 'Demand Submission Date', 'This field specifies the date the demand was submitted to the issuer of the undertaking.',
    'MT786', 'es', 'GENERAL', 4,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date the demand was submitted to the issuer of the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':30:'
    AND message_type = 'MT786'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':30:', 'Demand Submission Date', 'This field specifies the date the demand was submitted to the issuer of the undertaking.',
    'MT786', 'en', 'GENERAL', 4,
    1, 1,
    'DATE', 'DATE_PICKER', '6!n', 'M',
    'This field specifies the date the demand was submitted to the issuer of the undertaking.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':30:'
    AND message_type = 'MT786'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Demand Amount', 'This field contains the currency and amount that is claimed in undertaking demand.',
    'MT786', 'es', 'GENERAL', 5,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field contains the currency and amount that is claimed in undertaking demand.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT786'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':32B:', 'Demand Amount', 'This field contains the currency and amount that is claimed in undertaking demand.',
    'MT786', 'en', 'GENERAL', 5,
    1, 1,
    'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '3!a15d', 'M',
    'This field contains the currency and amount that is claimed in undertaking demand.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':32B:'
    AND message_type = 'MT786'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':77J:', 'Reason for Refusal', 'This field specifies the reason(s).',
    'MT786', 'es', 'GENERAL', 6,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '70*50z', 'M',
    'This field specifies the reason(s).', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':77J:'
    AND message_type = 'MT786'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':77J:', 'Reason for Refusal', 'This field specifies the reason(s).',
    'MT786', 'en', 'GENERAL', 6,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '70*50z', 'M',
    'This field specifies the reason(s).', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':77J:'
    AND message_type = 'MT786'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':77B:', 'Disposal of Documents', 'This field specifies how the demand presentation documents will be handled as a consequence of the demand refusal.',
    'MT786', 'es', 'GENERAL', 7,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '3*35x', 'O',
    'This field specifies how the demand presentation documents will be handled as a consequence of the demand refusal.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':77B:'
    AND message_type = 'MT786'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':77B:', 'Disposal of Documents', 'This field specifies how the demand presentation documents will be handled as a consequence of the demand refusal.',
    'MT786', 'en', 'GENERAL', 7,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '3*35x', 'O',
    'This field specifies how the demand presentation documents will be handled as a consequence of the demand refusal.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':77B:'
    AND message_type = 'MT786'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver.',
    'MT786', 'es', 'GENERAL', 8,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies additional information for the Receiver.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT786'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field specifies additional information for the Receiver.',
    'MT786', 'en', 'GENERAL', 8,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field specifies additional information for the Receiver.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT786'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23X:', 'File Identification', 'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.',
    'MT786', 'es', 'GENERAL', 9,
    0, 1,
    'TEXT', 'INPUT', '65x', 'O',
    'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23X:'
    AND message_type = 'MT786'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23X:', 'File Identification', 'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.',
    'MT786', 'en', 'GENERAL', 9,
    0, 1,
    'TEXT', 'INPUT', '65x', 'O',
    'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23X:'
    AND message_type = 'MT786'
    AND language = 'en'
    AND spec_version = '2025'
);

-- MT787 Fields (7 fields)
-- ==================================================

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Transaction Reference Number', 'This field contains the reference assigned by the Sender to unambiguously identify the message.',
    'MT787', 'es', 'GENERAL', 1,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field contains the reference assigned by the Sender to unambiguously identify the message.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT787'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':20:', 'Transaction Reference Number', 'This field contains the reference assigned by the Sender to unambiguously identify the message.',
    'MT787', 'en', 'GENERAL', 1,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field contains the reference assigned by the Sender to unambiguously identify the message.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':20:'
    AND message_type = 'MT787'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':21:', 'Related Reference', 'This field specifies the reference which has been assigned to the undertaking by the receiver.',
    'MT787', 'es', 'GENERAL', 2,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the reference which has been assigned to the undertaking by the receiver.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':21:'
    AND message_type = 'MT787'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':21:', 'Related Reference', 'This field specifies the reference which has been assigned to the undertaking by the receiver.',
    'MT787', 'en', 'GENERAL', 2,
    1, 1,
    'TEXT', 'INPUT', '16x', 'M',
    'This field specifies the reference which has been assigned to the undertaking by the receiver.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':21:'
    AND message_type = 'MT787'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuer', 'This field specifies the party that issues the undertaking (or counter-undertaking) amendment.',
    'MT787', 'es', 'GENERAL', 3,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies the party that issues the undertaking (or counter-undertaking) amendment.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT787'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':52a:', 'Issuer', 'This field specifies the party that issues the undertaking (or counter-undertaking) amendment.',
    'MT787', 'en', 'GENERAL', 3,
    1, 1,
    'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '1!a', 'M',
    'This field specifies the party that issues the undertaking (or counter-undertaking) amendment.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':52a:'
    AND message_type = 'MT787'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':26E:', 'Number of Amendment', 'This field specifies the number of the amendment to which this message is a response.',
    'MT787', 'es', 'GENERAL', 4,
    1, 1,
    'NUMBER', 'INPUT', '3n', 'M',
    'This field specifies the number of the amendment to which this message is a response.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':26E:'
    AND message_type = 'MT787'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':26E:', 'Number of Amendment', 'This field specifies the number of the amendment to which this message is a response.',
    'MT787', 'en', 'GENERAL', 4,
    1, 1,
    'NUMBER', 'INPUT', '3n', 'M',
    'This field specifies the number of the amendment to which this message is a response.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':26E:'
    AND message_type = 'MT787'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23R:', 'Amendment Status', 'This field specifies the status of the amendment. Code must contain one of the following codes (Error code(s): T48) : Text may only be used when Code is REJT to optionally specify a reason for rejection.',
    'MT787', 'es', 'GENERAL', 5,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '6*35x', 'M',
    'This field specifies the status of the amendment. Code must contain one of the following codes (Error code(s): T48) : Text may only be used when Code is REJT to optionally specify a reason for rejection.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23R:'
    AND message_type = 'MT787'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23R:', 'Amendment Status', 'This field specifies the status of the amendment. Code must contain one of the following codes (Error code(s): T48) : Text may only be used when Code is REJT to optionally specify a reason for rejection.',
    'MT787', 'en', 'GENERAL', 5,
    1, 1,
    'TEXTAREA', 'TEXTAREA', '6*35x', 'M',
    'This field specifies the status of the amendment. Code must contain one of the following codes (Error code(s): T48) : Text may only be used when Code is REJT to optionally specify a reason for rejection.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23R:'
    AND message_type = 'MT787'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field contains additional information for the Receiver.',
    'MT787', 'es', 'GENERAL', 6,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field contains additional information for the Receiver.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT787'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':72Z:', 'Sender to Receiver Information', 'This field contains additional information for the Receiver.',
    'MT787', 'en', 'GENERAL', 6,
    0, 1,
    'TEXTAREA', 'TEXTAREA', '6*35z', 'O',
    'This field contains additional information for the Receiver.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':72Z:'
    AND message_type = 'MT787'
    AND language = 'en'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23X:', 'File Identification', 'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.',
    'MT787', 'es', 'GENERAL', 7,
    0, 1,
    'TEXT', 'INPUT', '65x', 'O',
    'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23X:'
    AND message_type = 'MT787'
    AND language = 'es'
    AND spec_version = '2025'
);

INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, language, section,
    display_order, is_required, is_active, field_type, component_type,
    swift_format, swift_status, swift_definition_en, spec_version, effective_date,
    created_at, created_by
) SELECT
    UUID(), ':23X:', 'File Identification', 'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.',
    'MT787', 'en', 'GENERAL', 7,
    0, 1,
    'TEXT', 'INPUT', '65x', 'O',
    'This field identifies the type of delivery channel and associated file name or reference. Code must contain one of the following codes (Error code(s): T93) : The file name must exclude any path attribute. The file name should be unique for a sender-receiver pair for an extended period to avoid instances of duplicate files. This field should be agreed between parties.', '2025', '2025-11-16', NOW(), 'SYSTEM'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM swift_field_config_readmodel
    WHERE field_code = ':23X:'
    AND message_type = 'MT787'
    AND language = 'en'
    AND spec_version = '2025'
);
