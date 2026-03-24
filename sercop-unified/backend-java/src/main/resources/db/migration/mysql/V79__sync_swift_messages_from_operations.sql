-- =============================================================================
-- V79: Sincronizar mensajes SWIFT desde operation_readmodel a swift_message_readmodel
--
-- Problema: La migración V71 eliminó todos los mensajes SWIFT existentes.
-- Esta migración recrea los registros a partir del campo swift_message de las operaciones.
-- =============================================================================

-- Insertar mensajes SWIFT originales desde operation_readmodel
INSERT INTO swift_message_readmodel (
    message_id,
    message_type,
    direction,
    operation_id,
    operation_type,
    sender_bic,
    receiver_bic,
    swift_content,
    field_20_reference,
    field_21_related_ref,
    currency,
    amount,
    value_date,
    status,
    ack_received,
    expects_response,
    response_received,
    triggered_by_event,
    created_by,
    created_at,
    sent_at,
    version
)
SELECT
    CONCAT('MSG-', o.message_type, '-', UNIX_TIMESTAMP(IFNULL(o.created_at, NOW())), '-', o.id) AS message_id,
    o.message_type,
    'OUTBOUND' AS direction,
    o.operation_id,
    o.product_type AS operation_type,
    COALESCE(o.issuing_bank_bic, 'UNKNOWN') AS sender_bic,
    COALESCE(o.advising_bank_bic, 'UNKNOWN') AS receiver_bic,
    o.swift_message AS swift_content,
    o.reference AS field_20_reference,
    NULL AS field_21_related_ref,
    o.currency,
    o.amount,
    o.issue_date AS value_date,
    'SENT' AS status,
    FALSE AS ack_received,
    FALSE AS expects_response,
    FALSE AS response_received,
    CASE
        WHEN o.message_type = 'MT700' THEN 'NEW_OPERATION_CREATED'
        WHEN o.message_type = 'MT760' THEN 'NEW_OPERATION_CREATED'
        WHEN o.message_type = 'MT707' THEN 'AMENDMENT_CREATED'
        WHEN o.message_type = 'MT767' THEN 'AMENDMENT_CREATED'
        ELSE 'LEGACY_MIGRATION'
    END AS triggered_by_event,
    COALESCE(o.created_by, 'migration') AS created_by,
    COALESCE(o.created_at, NOW()) AS created_at,
    COALESCE(o.created_at, NOW()) AS sent_at,
    1 AS version
FROM operation_readmodel o
WHERE o.swift_message IS NOT NULL
  AND o.swift_message != ''
  AND LENGTH(o.swift_message) > 10
  AND NOT EXISTS (
    SELECT 1 FROM swift_message_readmodel sm
    WHERE sm.operation_id = o.operation_id
      AND sm.message_type = o.message_type
  );

-- Log de la migración
SELECT CONCAT('Mensajes SWIFT sincronizados: ', COUNT(*)) AS migration_result
FROM swift_message_readmodel;
