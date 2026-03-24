-- ==================================================
-- Migración V22: Actualizar campo :50: a componente SWIFT_PARTY
-- ==================================================
-- Actualiza el campo :50: (Ordenante/Applicant) del MT700
-- para usar el nuevo componente SWIFT_PARTY que permite
-- ingresar/editar datos en formato SWIFT de 4 líneas:
-- Línea 1: Nombre completo o razón social (máx 35 caracteres)
-- Línea 2: Dirección - calle y número (máx 35 caracteres)
-- Línea 3: Ciudad (máx 35 caracteres)
-- Línea 4: País (máx 35 caracteres)
-- ==================================================

-- Cambiar field_type de ENUM a VARCHAR para permitir más flexibilidad
ALTER TABLE swift_field_config_readmodel MODIFY COLUMN field_type VARCHAR(50) NOT NULL;

-- Actualizar campo :50: para ambos idiomas
UPDATE swift_field_config_readmodel
SET
    component_type = 'SWIFT_PARTY',
    field_type = 'SWIFT_PARTY',
    placeholder = CASE
        WHEN language = 'es' THEN 'Seleccione un participante o ingrese manualmente'
        WHEN language = 'en' THEN 'Select a participant or enter manually'
        ELSE placeholder
    END,
    help_text = CASE
        WHEN language = 'es' THEN 'Formato SWIFT: 4 líneas de máximo 35 caracteres cada una. Línea 1: Nombre, Línea 2: Dirección, Línea 3: Ciudad, Línea 4: País'
        WHEN language = 'en' THEN 'SWIFT format: 4 lines of maximum 35 characters each. Line 1: Name, Line 2: Address, Line 3: City, Line 4: Country'
        ELSE help_text
    END
WHERE field_code = ':50:'
  AND message_type = 'MT700';

-- Verificar la actualización
SELECT
    field_code,
    field_name,
    language,
    component_type,
    field_type,
    placeholder
FROM swift_field_config_readmodel
WHERE field_code = ':50:'
  AND message_type = 'MT700'
ORDER BY language;
