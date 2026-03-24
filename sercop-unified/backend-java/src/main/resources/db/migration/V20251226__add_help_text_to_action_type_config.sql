-- =====================================================
-- Add help_text column to action_type_config
-- For displaying tooltips with detailed explanations
-- =====================================================

-- Add column (MySQL doesn't support IF NOT EXISTS for columns)
-- This migration assumes the column doesn't exist yet
-- If column already exists, this migration should be marked as applied manually in flyway_schema_history

SET @column_exists = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE()
    AND table_name = 'action_type_config'
    AND column_name = 'help_text'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE action_type_config ADD COLUMN help_text TEXT AFTER description',
    'SELECT "Column help_text already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- Update Spanish (es) help texts
-- =====================================================

UPDATE action_type_config SET help_text =
'Genera automáticamente un mensaje SWIFT (MT700, MT760, etc.) basado en los datos de la operación y lo registra en el sistema para su posterior envío a través de la red SWIFT. El mensaje incluye todos los campos requeridos según el estándar ISO 15022.'
WHERE action_type = 'SWIFT_MESSAGE' AND language = 'es';

UPDATE action_type_config SET help_text =
'Realiza una llamada HTTP a una API externa configurada. Puede ser utilizada para notificar a sistemas de terceros, sincronizar datos con plataformas externas, o ejecutar integraciones personalizadas. La respuesta de la API se registra para auditoría.'
WHERE action_type = 'API_CALL' AND language = 'es';

UPDATE action_type_config SET help_text =
'Envía una notificación por correo electrónico a los destinatarios configurados. El contenido del correo se genera automáticamente usando plantillas predefinidas e incluye información relevante de la operación como referencia, monto, partes involucradas, etc.'
WHERE action_type = 'EMAIL' AND language = 'es';

UPDATE action_type_config SET help_text =
'Crea un registro permanente en el log de auditoría del sistema. Este registro incluye información detallada sobre la acción realizada, el usuario que la ejecutó, la fecha/hora, y cualquier dato relevante. Es útil para cumplimiento normativo y trazabilidad.'
WHERE action_type = 'AUDITORIA' AND language = 'es';

-- =====================================================
-- Update English (en) help texts
-- =====================================================

UPDATE action_type_config SET help_text =
'Automatically generates a SWIFT message (MT700, MT760, etc.) based on the operation data and registers it in the system for subsequent transmission through the SWIFT network. The message includes all required fields according to the ISO 15022 standard.'
WHERE action_type = 'SWIFT_MESSAGE' AND language = 'en';

UPDATE action_type_config SET help_text =
'Makes an HTTP call to a configured external API. Can be used to notify third-party systems, synchronize data with external platforms, or execute custom integrations. The API response is logged for auditing purposes.'
WHERE action_type = 'API_CALL' AND language = 'en';

UPDATE action_type_config SET help_text =
'Sends an email notification to configured recipients. The email content is automatically generated using predefined templates and includes relevant operation information such as reference, amount, parties involved, etc.'
WHERE action_type = 'EMAIL' AND language = 'en';

UPDATE action_type_config SET help_text =
'Creates a permanent record in the system audit log. This record includes detailed information about the action performed, the user who executed it, the date/time, and any relevant data. Useful for regulatory compliance and traceability.'
WHERE action_type = 'AUDITORIA' AND language = 'en';
