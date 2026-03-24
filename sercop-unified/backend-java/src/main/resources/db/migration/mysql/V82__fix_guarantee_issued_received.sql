-- ============================================================================
-- V82: Reclasificar operaciones de garantías según cuentas contables Ecuador
-- ============================================================================
-- Problema: Todas las operaciones del archivo GID estaban como GUARANTEE genérico
-- Se necesita clasificar según prefijo de referencia y cuentas contables:
--
-- | Prefijo | Cuenta Contable | Tipo Producto | Descripción |
-- |---------|-----------------|---------------|-------------|
-- | K*, CE* | 630105/640105 | AVAL | Avales |
-- | B* | 630290/640290 | GUARANTEE_ISSUED | Garantía Emitida |
-- | J* | 630290/640290 | GUARANTEE_RECEIVED | Garantía Recibida |
-- | S* | 630215/640215 | STANDBY_LC | Stand By Recibidas |
-- | A* | 630205/640205 | GUARANTEE | Fianzas |
-- | G* | 739010/749010 | COLLECTION_EXPORT | Cobranzas Avisadas |
-- ============================================================================

-- 1. Actualizar operaciones B* de GUARANTEE a GUARANTEE_ISSUED
UPDATE operation_readmodel
SET product_type = 'GUARANTEE_ISSUED',
    modified_at = NOW(),
    modified_by = 'MIGRATION_GUARANTEE_TYPE_FIX'
WHERE product_type = 'GUARANTEE'
AND reference LIKE 'B%';

-- 2. Actualizar operaciones J* de GUARANTEE a GUARANTEE_RECEIVED
UPDATE operation_readmodel
SET product_type = 'GUARANTEE_RECEIVED',
    modified_at = NOW(),
    modified_by = 'MIGRATION_GUARANTEE_TYPE_FIX'
WHERE product_type = 'GUARANTEE'
AND reference LIKE 'J%';

-- 3. Actualizar operaciones S* (SE, S1, S2) de GUARANTEE a STANDBY_LC
UPDATE operation_readmodel
SET product_type = 'STANDBY_LC',
    message_type = 'MT760',
    modified_at = NOW(),
    modified_by = 'MIGRATION_STANDBY_FIX'
WHERE product_type = 'GUARANTEE'
AND (reference LIKE 'SE%' OR reference LIKE 'S1%' OR reference LIKE 'S2%');

-- 4. Actualizar operaciones G* (GE, GI) de GUARANTEE a COLLECTION_EXPORT
UPDATE operation_readmodel
SET product_type = 'COLLECTION_EXPORT',
    message_type = 'MT400',
    modified_at = NOW(),
    modified_by = 'MIGRATION_COLLECTION_FIX'
WHERE product_type = 'GUARANTEE'
AND (reference LIKE 'GE%' OR reference LIKE 'GI%');

-- 5. Actualizar mensajes SWIFT correspondientes
UPDATE swift_message_readmodel
SET operation_type = 'GUARANTEE_ISSUED'
WHERE operation_id IN (
    SELECT operation_id FROM operation_readmodel WHERE product_type = 'GUARANTEE_ISSUED'
) AND operation_type = 'GUARANTEE';

UPDATE swift_message_readmodel
SET operation_type = 'GUARANTEE_RECEIVED'
WHERE operation_id IN (
    SELECT operation_id FROM operation_readmodel WHERE product_type = 'GUARANTEE_RECEIVED'
) AND operation_type = 'GUARANTEE';

UPDATE swift_message_readmodel
SET operation_type = 'STANDBY_LC'
WHERE operation_id IN (
    SELECT operation_id FROM operation_readmodel WHERE product_type = 'STANDBY_LC'
) AND operation_type = 'GUARANTEE';

UPDATE swift_message_readmodel
SET operation_type = 'COLLECTION_EXPORT', message_type = 'MT400'
WHERE operation_id IN (
    SELECT operation_id FROM operation_readmodel
    WHERE product_type = 'COLLECTION_EXPORT' AND reference LIKE 'G%'
) AND operation_type = 'GUARANTEE';

-- 6. Insertar configuración de tipos de producto
INSERT INTO product_type_config (
    product_type, base_url, wizard_url, view_mode_title_key,
    description, swift_message_type, category, account_prefix,
    active, display_order, created_at
) VALUES
(
    'GUARANTEE_ISSUED',
    '/guarantees',
    '/guarantees/issuance-wizard',
    'guarantees.viewMode.title',
    'Garantía Emitida - Garantías bancarias emitidas por el banco (B*)',
    'MT760',
    'GUARANTEES',
    '630290002,630290011,640290002,640290011',
    1,
    8,
    NOW()
),
(
    'GUARANTEE_RECEIVED',
    '/guarantees',
    '/guarantees/issuance-wizard',
    'guarantees.viewMode.title',
    'Garantía Recibida - Garantías bancarias recibidas de otros bancos (J*)',
    'MT760',
    'GUARANTEES',
    '630290002,630290011,640290002,640290011',
    1,
    9,
    NOW()
)
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    account_prefix = VALUES(account_prefix),
    active = 1;

-- 7. Actualizar STANDBY_LC con cuenta correcta
UPDATE product_type_config
SET account_prefix = '630215001,640215001'
WHERE product_type = 'STANDBY_LC';
