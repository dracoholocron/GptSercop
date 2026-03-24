-- Permisos para widgets embebidos.
-- Controlan que usuarios pueden generar tokens para embeber dashboards en sistemas externos.
-- Modulo: WIDGET

INSERT INTO permission_read_model (code, name, description, module) VALUES
    ('CAN_EMBED_DASHBOARD', 'Embeber Dashboard', 'Permite embeber el Business Dashboard en sistemas externos', 'WIDGET'),
    ('CAN_EMBED_COMMISSIONS', 'Embeber Comisiones', 'Permite embeber el Dashboard de Comisiones en sistemas externos', 'WIDGET'),
    ('CAN_EMBED_ALERTS', 'Embeber Alertas', 'Permite embeber el panel de Alertas en sistemas externos', 'WIDGET')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- Asignar todos los permisos WIDGET a ROLE_ADMIN
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_ADMIN'
  AND p.module = 'WIDGET'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);

-- Asignar permisos WIDGET a ROLE_MANAGER
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_MANAGER'
  AND p.module = 'WIDGET'
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);
