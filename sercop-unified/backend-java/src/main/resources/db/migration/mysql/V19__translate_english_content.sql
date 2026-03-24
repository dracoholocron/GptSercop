-- ==================================================
-- Migración V19: Traducir contenido en inglés
-- ==================================================
-- Los registros en inglés tienen help_text y documentation_url en español.
-- Esta migración traduce el contenido al inglés correctamente.
-- ==================================================

-- Actualizar help_text para registros en inglés
UPDATE swift_field_config_readmodel
SET help_text = CASE field_code
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
END
WHERE `language` = 'en';

-- Actualizar documentation_url para mantener consistencia
-- (Las URLs de SWIFT no necesitan traducción, pero podemos agregar comentarios en inglés si es necesario)
UPDATE swift_field_config_readmodel
SET documentation_url = documentation_url
WHERE `language` = 'en' AND documentation_url IS NOT NULL;

-- Verificar cambios
SELECT
    field_code,
    field_name,
    `language`,
    LEFT(help_text, 50) as help_text_preview
FROM swift_field_config_readmodel
WHERE `language` = 'en'
ORDER BY field_code
LIMIT 10;
