-- =====================================================
-- V114: Enable Risk Engine in Authorization Config
-- =====================================================

-- Update or insert authorization config to enable risk engine
INSERT INTO security_configuration_read_model (
    config_type,
    config_key,
    config_value,
    is_active,
    environment,
    created_by
) VALUES (
    'AUTHORIZATION',
    'authorization',
    JSON_OBJECT(
        'combinationStrategy', 'any-allows',
        'engines', JSON_OBJECT(
            'rbac', true,
            'four-eyes', true,
            'risk', true
        )
    ),
    TRUE,
    'production',
    'system'
) ON DUPLICATE KEY UPDATE
    config_value = JSON_SET(
        COALESCE(config_value, '{}'),
        '$.engines.risk', true
    ),
    updated_at = CURRENT_TIMESTAMP;

-- Add RISK config type to available configurations
INSERT INTO security_configuration_read_model (
    config_type,
    config_key,
    config_value,
    is_active,
    environment,
    created_by
) VALUES (
    'RISK',
    'risk-engine',
    JSON_OBJECT(
        'enabled', true,
        'defaultAction', 'ALLOW',
        'logAllEvaluations', true,
        'updateUserProfiles', true
    ),
    TRUE,
    'production',
    'system'
) ON DUPLICATE KEY UPDATE
    config_value = config_value;
