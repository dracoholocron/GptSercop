-- Ensure core security roles exist in compare environments.
-- Some migration paths omit ROLE_USER / ROLE_ADMIN, but auth flows depend on them.

INSERT IGNORE INTO role_read_model (name, description) VALUES
  ('ROLE_USER', 'Usuario base del sistema'),
  ('ROLE_ADMIN', 'Administrador del sistema');
