-- ==================================================
-- Migración V4: Agregar campos faltantes de MT700
-- ==================================================
-- Esta migración agrega los 14 campos del wizard que
-- no estaban presentes en la tabla swift_field_config_readmodel
--
-- Campos agregados: :23:, :42M:, :42P:, :44A:, :44B:, :44E:, :44F:,
--                   :48:, :49:, :56a:, :71B:, :72:, :78:, :79:
-- ==================================================

-- Campo: 23 - Referencia a Pre-Aviso (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':23:',
    'Referencia a Pre-Aviso',
    'Referencia si existe un pre-aviso de la carta de crédito',
    'MT700',
    'MONTOS',
    11,
    false,
    true,
    'TEXT',
    'TEXT_INPUT',
    'Referencia si existe un pre-aviso',
    'Número o código de referencia del pre-aviso previamente enviado',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 44A - Puerto de Embarque (REQUERIDO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':44A:',
    'Puerto de Embarque',
    'Puerto desde donde se embarcará la mercancía',
    'MT700',
    'TRANSPORTE',
    40,
    true,
    true,
    'TEXT',
    'TEXT_INPUT',
    'Puerto de embarque',
    'Especifique el puerto o lugar desde donde se realizará el embarque de la mercancía',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 44B - Puerto de Destino (REQUERIDO)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':44B:',
    'Puerto de Destino',
    'Puerto donde se recibirá la mercancía',
    'MT700',
    'TRANSPORTE',
    41,
    true,
    true,
    'TEXT',
    'TEXT_INPUT',
    'Puerto de destino',
    'Especifique el puerto o lugar donde se recibirá la mercancía',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 44E - Ruta Puerto a Puerto (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':44E:',
    'Ruta Puerto a Puerto',
    'Ruta detallada con puertos intermedios',
    'MT700',
    'TRANSPORTE',
    42,
    false,
    true,
    'TEXT',
    'TEXT_INPUT',
    'Ej: Shanghai - Long Beach - Los Angeles',
    'Especifique la ruta completa incluyendo puertos intermedios si es relevante',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 44F - Lugar de Destino Final (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':44F:',
    'Lugar de Destino Final',
    'Dirección o ubicación final específica de entrega',
    'MT700',
    'TRANSPORTE',
    43,
    false,
    true,
    'TEXT',
    'TEXT_INPUT',
    'Dirección o ubicación final específica',
    'Especifique la dirección exacta o ubicación final donde se entregará la mercancía',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 48 - Período para Presentación de Documentos (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':48:',
    'Período para Presentación de Documentos',
    'Tiempo permitido para presentar documentos después del embarque',
    'MT700',
    'TRANSPORTE',
    44,
    false,
    true,
    'TEXT',
    'TEXT_INPUT',
    'Ej: 21 días después del embarque',
    'Especifique el período máximo permitido para presentar los documentos al banco después del embarque',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 49 - Instrucciones de Confirmación (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':49:',
    'Instrucciones de Confirmación',
    'Instrucciones específicas para el banco confirmador',
    'MT700',
    'BANCOS',
    25,
    false,
    true,
    'TEXTAREA',
    'TEXTAREA',
    'Instrucciones específicas para el banco confirmador...',
    'Si hay banco confirmador, especifique las instrucciones exactas de confirmación',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 56a - Banco Intermediario (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':56a:',
    'Banco Intermediario',
    'Banco intermediario en la cadena de pago',
    'MT700',
    'BANCOS',
    24,
    false,
    true,
    'INSTITUTION',
    'FINANCIAL_INSTITUTION_SELECTOR',
    'Seleccione el banco intermediario si aplica',
    'Banco que actúa como intermediario en la cadena de pago entre bancos',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 71B - Responsable de Comisiones Bancarias (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':71B:',
    'Responsable de Comisiones Bancarias',
    'Especifica quién pagará las comisiones bancarias',
    'MT700',
    'CONDICIONES',
    51,
    false,
    true,
    'SELECT',
    'SELECT',
    'Seleccione el responsable de las comisiones',
    'Define qué parte (ordenante o beneficiario) será responsable de pagar las comisiones bancarias',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 72 - Instrucciones Adicionales (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':72:',
    'Instrucciones Adicionales',
    'Instrucciones adicionales para los bancos participantes',
    'MT700',
    'CONDICIONES',
    52,
    false,
    true,
    'TEXTAREA',
    'TEXTAREA',
    'Ingrese instrucciones adicionales para los bancos (opcional)',
    'Información adicional para los bancos que no se cubre en otros campos',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 42P - Detalles de Pago Diferido (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':42P:',
    'Detalles de Pago Diferido',
    'Términos y condiciones para pago diferido',
    'MT700',
    'CONDICIONES',
    53,
    false,
    true,
    'TEXTAREA',
    'TEXTAREA',
    'Ej: Pago a 90 días fecha de embarque',
    'Si el pago no es a la vista, especifique claramente el plazo y condiciones del pago diferido',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 42M - Detalles de Pago Mixto (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':42M:',
    'Detalles de Pago Mixto',
    'Términos para pagos con múltiples plazos',
    'MT700',
    'CONDICIONES',
    54,
    false,
    true,
    'TEXTAREA',
    'TEXTAREA',
    'Ej: 50% a la vista, 50% a 60 días',
    'Si el pago se divide en partes con diferentes plazos, especifique porcentajes y fechas',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 78 - Instrucciones al Banco Pagador/Negociador (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':78:',
    'Instrucciones al Banco Pagador/Negociador',
    'Instrucciones específicas para el banco que efectuará el pago',
    'MT700',
    'CONDICIONES',
    55,
    false,
    true,
    'TEXTAREA',
    'TEXTAREA',
    'Instrucciones específicas para el banco que efectuará el pago...',
    'Instrucciones detalladas al banco pagador sobre cómo procesar la transacción',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- Campo: 79 - Narrativa Adicional (OPCIONAL)
INSERT INTO swift_field_config_readmodel (
    id, field_code, field_name, description, message_type, section, display_order,
    is_required, is_active, field_type, component_type, placeholder,
    help_text, created_by, created_at
) VALUES (
    UUID(),
    ':79:',
    'Narrativa Adicional',
    'Información narrativa adicional no cubierta en otros campos',
    'MT700',
    'CONDICIONES',
    56,
    false,
    true,
    'TEXTAREA',
    'TEXTAREA',
    'Información narrativa adicional no cubierta en otros campos...',
    'Campo libre para información adicional que no encaja en otros campos específicos',
    'SYSTEM',
    CURRENT_TIMESTAMP
);

-- ==================================================
-- Fin de la migración V4
-- ==================================================
