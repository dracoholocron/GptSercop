-- ==================================================
-- Migración V18: Eliminar registros duplicados en inglés
-- ==================================================
-- El wizard está mostrando campos duplicados (español e inglés).
-- Como solución temporal, eliminamos los registros en inglés
-- y dejamos solo los de español.
-- ==================================================

-- Eliminar todos los registros en inglés
DELETE FROM swift_field_config_readmodel
WHERE `language` = 'en';

-- Verificar que solo quedan registros en español
SELECT
    `language`,
    message_type,
    COUNT(*) as total_fields
FROM swift_field_config_readmodel
GROUP BY `language`, message_type
ORDER BY message_type, `language`;
