-- ==================================================
-- Migración V21: Crear registros en inglés correctamente traducidos
-- ==================================================
-- Esta migración crea registros duplicados para inglés basados en los
-- registros en español, pero con los textos traducidos al inglés.
-- ==================================================

-- Insertar registros en inglés duplicando los de español y traduciendo el contenido
INSERT INTO swift_field_config_readmodel (
    id,
    field_code,
    field_name,
    description,
    message_type,
    `language`,
    section,
    display_order,
    is_required,
    is_active,
    field_type,
    component_type,
    placeholder,
    validation_rules,
    dependencies,
    contextual_alerts,
    field_options,
    default_value,
    help_text,
    documentation_url,
    created_at,
    updated_at,
    created_by,
    updated_by
)
SELECT
    UUID() as id,
    field_code,
    CASE field_code
        WHEN ':20:' THEN 'Sender\'s Reference'
        WHEN ':23:' THEN 'Pre-advice'
        WHEN ':31C:' THEN 'Date of Issue'
        WHEN ':31D:' THEN 'Date and Place of Expiry'
        WHEN ':40A:' THEN 'Form of Documentary Credit'
        WHEN ':40E:' THEN 'Applicable Rules'
        WHEN ':50:' THEN 'Applicant'
        WHEN ':59:' THEN 'Beneficiary'
        WHEN ':32B:' THEN 'Currency Code, Amount'
        WHEN ':39A:' THEN 'Percentage Credit Amount Tolerance'
        WHEN ':39B:' THEN 'Maximum Credit Amount'
        WHEN ':39C:' THEN 'Additional Amounts Covered'
        WHEN ':41a:' THEN 'Available With... By...'
        WHEN ':42C:' THEN 'Drafts at...'
        WHEN ':42a:' THEN 'Drawee'
        WHEN ':43P:' THEN 'Partial Shipments'
        WHEN ':43T:' THEN 'Transhipment'
        WHEN ':44A:' THEN 'Loading on Board/Dispatch/Taking in Charge at/from'
        WHEN ':44B:' THEN 'For Transportation to'
        WHEN ':44C:' THEN 'Latest Date of Shipment'
        WHEN ':44D:' THEN 'Shipment Period'
        WHEN ':44E:' THEN 'Port to Port Routing'
        WHEN ':44F:' THEN 'Place of Final Destination'
        WHEN ':45A:' THEN 'Description of Goods and/or Services'
        WHEN ':46A:' THEN 'Documents Required'
        WHEN ':47A:' THEN 'Additional Conditions'
        WHEN ':48:' THEN 'Period for Presentation'
        WHEN ':49:' THEN 'Confirmation Instructions'
        WHEN ':51a:' THEN 'Applicant Bank'
        WHEN ':52a:' THEN 'Issuing Bank'
        WHEN ':53a:' THEN 'Reimbursing Bank'
        WHEN ':54a:' THEN 'Paying/Accepting/Negotiating Bank'
        WHEN ':56a:' THEN 'Advising Bank'
        WHEN ':57a:' THEN 'Second Advising Bank'
        WHEN ':58a:' THEN 'Beneficiary\'s Bank'
        WHEN ':71B:' THEN 'Charges'
        WHEN ':78:' THEN 'Instructions to Paying/Accepting/Negotiating Bank'
        WHEN ':79:' THEN 'Narrative'
        ELSE field_name
    END as field_name,
    description,
    message_type,
    'en' as `language`,
    section,
    display_order,
    is_required,
    is_active,
    field_type,
    component_type,
    placeholder,
    validation_rules,
    dependencies,
    contextual_alerts,
    field_options,
    default_value,
    CASE field_code
        WHEN ':20:' THEN 'Unique reference assigned by the sender to identify the letter of credit'
        WHEN ':23:' THEN 'Indicates whether this is a pre-advice or final issuance'
        WHEN ':31C:' THEN 'Date on which the letter of credit is issued'
        WHEN ':31D:' THEN 'Date and place where the letter of credit expires'
        WHEN ':40A:' THEN 'Type of letter of credit: Irrevocable, Revocable, Standby, etc.'
        WHEN ':40E:' THEN 'Applicable rules: UCP 600, ISP98, URDG, etc.'
        WHEN ':50:' THEN 'Party ordering the issuance of the letter of credit (importer/buyer)'
        WHEN ':59:' THEN 'Party in whose favor the letter of credit is issued (exporter/seller)'
        WHEN ':32B:' THEN 'Currency and amount of the letter of credit'
        WHEN ':39A:' THEN 'Maximum percentage variation allowed in the amount'
        WHEN ':39B:' THEN 'Maximum credit amount'
        WHEN ':39C:' THEN 'Additional amounts beyond the credit'
        WHEN ':41a:' THEN 'Bank where the credit is available'
        WHEN ':42C:' THEN 'Drafts drawn at...'
        WHEN ':42a:' THEN 'Drawee bank'
        WHEN ':43P:' THEN 'Partial shipments allowed or not'
        WHEN ':43T:' THEN 'Transhipment allowed or not'
        WHEN ':44A:' THEN 'Port, airport or place of loading'
        WHEN ':44B:' THEN 'Port, airport or place of discharge'
        WHEN ':44C:' THEN 'Latest date of shipment'
        WHEN ':44D:' THEN 'Shipment period'
        WHEN ':44E:' THEN 'Port to port routing'
        WHEN ':44F:' THEN 'Place of final destination'
        WHEN ':45A:' THEN 'Description of goods and/or services'
        WHEN ':46A:' THEN 'Documents required'
        WHEN ':47A:' THEN 'Additional conditions'
        WHEN ':48:' THEN 'Period for presentation of documents'
        WHEN ':49:' THEN 'Confirmation instructions'
        WHEN ':51a:' THEN 'Applicant bank (ordering bank)'
        WHEN ':52a:' THEN 'Issuing bank'
        WHEN ':53a:' THEN 'Reimbursing bank'
        WHEN ':54a:' THEN 'Paying/Accepting/Negotiating bank'
        WHEN ':56a:' THEN 'Advising bank'
        WHEN ':57a:' THEN 'Second advising bank'
        WHEN ':58a:' THEN 'Beneficiary bank'
        WHEN ':71B:' THEN 'Charges (who pays the charges)'
        WHEN ':78:' THEN 'Instructions to the paying/accepting/negotiating bank'
        WHEN ':79:' THEN 'Additional narrative information'
        ELSE help_text
    END as help_text,
    documentation_url,
    NOW() as created_at,
    NOW() as updated_at,
    'migration_v21' as created_by,
    'migration_v21' as updated_by
FROM swift_field_config_readmodel
WHERE `language` = 'es';

-- Verificar que se crearon los registros
SELECT
    `language`,
    message_type,
    COUNT(*) as total_fields
FROM swift_field_config_readmodel
GROUP BY `language`, message_type
ORDER BY message_type, `language`;
