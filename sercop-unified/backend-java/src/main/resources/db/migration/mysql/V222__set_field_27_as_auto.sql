-- ================================================
-- V222: Set field :27: (Sequence of Total) as automatic
-- Description: Field :27: should be auto-calculated, not manual input
-- Author: GlobalCMX Architecture
-- Date: 2026-01-31
-- ================================================

-- Change :27: to hidden with default value '1/1'
-- The backend will calculate the actual value if the message is split
UPDATE swift_field_config_readmodel
SET component_type = 'hidden',
    default_value = '1/1',
    updated_at = NOW(),
    updated_by = 'V222_AUTO_SEQUENCE'
WHERE field_code = ':27:';

-- Log summary
SELECT
    'V222 Migration Complete' AS status,
    COUNT(*) AS fields_updated
FROM swift_field_config_readmodel
WHERE field_code = ':27:' AND component_type = 'hidden';
