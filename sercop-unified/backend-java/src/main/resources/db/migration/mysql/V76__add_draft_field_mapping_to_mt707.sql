-- =====================================================
-- Add draft_field_mapping to MT707 (LC Amendment) fields
-- Maps SWIFT field codes to operation/draft entity fields
-- =====================================================

-- Campo :31D: Fecha de Vencimiento (New Expiry Date)
UPDATE swift_field_config_readmodel SET draft_field_mapping = 'expiryDate'
WHERE field_code = ':31D:' AND message_type = 'MT707' AND draft_field_mapping IS NULL;

-- Campo :32B: Monto (New Amount)
UPDATE swift_field_config_readmodel SET draft_field_mapping = 'currency,amount'
WHERE field_code = ':32B:' AND message_type = 'MT707' AND draft_field_mapping IS NULL;

-- Campo :31C: Fecha de emisión
UPDATE swift_field_config_readmodel SET draft_field_mapping = 'issueDate'
WHERE field_code = ':31C:' AND message_type = 'MT707' AND draft_field_mapping IS NULL;

-- Campo :20: Referencia del mensaje
UPDATE swift_field_config_readmodel SET draft_field_mapping = 'reference'
WHERE field_code = ':20:' AND message_type = 'MT707' AND draft_field_mapping IS NULL;

-- Campo :21: Referencia relacionada
UPDATE swift_field_config_readmodel SET draft_field_mapping = 'relatedReference'
WHERE field_code = ':21:' AND message_type = 'MT707' AND draft_field_mapping IS NULL;

-- Campo :50: Ordenante/Solicitante
UPDATE swift_field_config_readmodel SET draft_field_mapping = 'applicantName'
WHERE field_code = ':50:' AND message_type = 'MT707' AND draft_field_mapping IS NULL;

-- Campo :59: Beneficiario
UPDATE swift_field_config_readmodel SET draft_field_mapping = 'beneficiaryName'
WHERE field_code = ':59:' AND message_type = 'MT707' AND draft_field_mapping IS NULL;

-- Campo :52a: Banco Emisor
UPDATE swift_field_config_readmodel SET draft_field_mapping = 'issuingBankBic'
WHERE field_code = ':52a:' AND message_type = 'MT707' AND draft_field_mapping IS NULL;

-- Campo :57A: Banco Avisador
UPDATE swift_field_config_readmodel SET draft_field_mapping = 'advisingBankBic'
WHERE field_code = ':57A:' AND message_type = 'MT707' AND draft_field_mapping IS NULL;

-- Campo :44A: Lugar de embarque/envío
UPDATE swift_field_config_readmodel SET draft_field_mapping = 'placeOfShipment'
WHERE field_code = ':44A:' AND message_type = 'MT707' AND draft_field_mapping IS NULL;

-- Campo :44B: Destino final
UPDATE swift_field_config_readmodel SET draft_field_mapping = 'finalDestination'
WHERE field_code = ':44B:' AND message_type = 'MT707' AND draft_field_mapping IS NULL;

-- Verificar que los campos existen para MT707 (si no existen, no se actualizan)
SELECT message_type, field_code, draft_field_mapping
FROM swift_field_config_readmodel
WHERE message_type = 'MT707' AND draft_field_mapping IS NOT NULL
ORDER BY display_order;
