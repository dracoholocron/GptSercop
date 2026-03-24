-- ============================================================================
-- V81: Corregir tipo de producto para AVALES
-- ============================================================================
-- Problema: La migración de Doka no estaba diferenciando entre GUARANTEE y AVAL
-- Las operaciones con referencia K* o CE* son AVALES, no GARANTÍAS
--
-- Reglas de clasificación basadas en el prefijo de referencia:
-- - K* (KE, K1, K2, K3) = AVAL (cuenta contable 630105/640105)
-- - CE* = AVAL
-- - B* (BE, B1, B2, etc) = GUARANTEE Emitida (cuenta 630290/640290)
-- - J* (JE, J1, J2, etc) = GUARANTEE Recibida (cuenta 630290/640290)
-- ============================================================================

-- 1. Actualizar operaciones K* de GUARANTEE a AVAL
UPDATE operation_readmodel
SET product_type = 'AVAL',
    modified_at = NOW(),
    modified_by = 'MIGRATION_AVAL_FIX'
WHERE product_type = 'GUARANTEE'
AND (
    reference LIKE 'K%' OR
    reference LIKE 'CE%'
);

-- 2. Actualizar los mensajes SWIFT correspondientes
UPDATE swift_message_readmodel
SET operation_type = 'AVAL'
WHERE operation_id IN (
    SELECT operation_id
    FROM operation_readmodel
    WHERE product_type = 'AVAL'
)
AND operation_type = 'GUARANTEE';

-- 3. Insertar eventos de auditoría para las operaciones corregidas
INSERT INTO operation_event_log_readmodel (
    event_id, operation_id, operation_type, event_code, event_sequence,
    previous_stage, new_stage, previous_status, new_status,
    comments, event_data, reference, currency, amount,
    expiry_date, applicant_name, executed_by, executed_at
)
SELECT
    CONCAT('MIG-AVAL-', operation_id) as event_id,
    operation_id,
    'AVAL' as operation_type,
    'PRODUCT_TYPE_CORRECTED',
    COALESCE((SELECT MAX(event_sequence) FROM operation_event_log_readmodel e
              WHERE e.operation_id = o.operation_id), 0) + 1 as event_sequence,
    stage as previous_stage,
    stage as new_stage,
    status as previous_status,
    status as new_status,
    'Corrección migración: Tipo de producto corregido de GUARANTEE a AVAL. Identificado por prefijo de referencia K* o CE* (cuenta contable 630105/640105 según Catálogo SB Ecuador).',
    JSON_OBJECT(
        'motivo', 'Operaciones K*/CE* son AVALES según cuentas contables Ecuador',
        'producto_anterior', 'GUARANTEE',
        'producto_nuevo', 'AVAL',
        'fecha_correccion', NOW()
    ),
    reference,
    currency,
    amount,
    expiry_date,
    applicant_name,
    'MIGRATION_AVAL_FIX',
    NOW()
FROM operation_readmodel o
WHERE modified_by = 'MIGRATION_AVAL_FIX'
ON DUPLICATE KEY UPDATE executed_at = NOW();

-- 4. Verificar resultado
SELECT
    'AVAL' as product_type,
    COUNT(*) as total_operations,
    SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed
FROM operation_readmodel
WHERE product_type = 'AVAL';
