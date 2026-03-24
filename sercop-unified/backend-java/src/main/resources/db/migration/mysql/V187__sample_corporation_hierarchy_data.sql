-- =====================================================
-- V187: Sample Corporation Hierarchy Data
-- =====================================================
-- Creates sample corporations, companies, and branches
-- to demonstrate the hierarchy functionality
-- =====================================================

-- Disable foreign key checks to allow column modification
SET FOREIGN_KEY_CHECKS = 0;

-- Ensure AUTO_INCREMENT is set on id column for inserts
ALTER TABLE participant_read_model MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE user_read_model MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- CORPORATION 1: Grupo Industrial ACME
-- =====================================================

-- Insert Corporation (Top Level)
INSERT IGNORE INTO participant_read_model (
    identification, type, reference_type, first_names, last_names,
    email, phone, address, agency,
    hierarchy_type, hierarchy_level, parent_id,
    created_at, updated_at, created_by
) VALUES (
    'CORP-ACME-001', 'Cliente', 'RUC',
    'Grupo Industrial ACME', 'Holdings',
    'corporativo@grupoacme.com', '+593 4 2123456',
    'Av. Principal 100, Edificio Corporativo, Guayaquil', 'Matriz',
    'CORPORATION', 0, NULL,
    NOW(), NOW(), 'system'
);

SET @acme_corp_id = LAST_INSERT_ID();

-- Insert Companies under ACME Corporation
INSERT IGNORE INTO participant_read_model (
    identification, type, reference_type, first_names, last_names,
    email, phone, address, agency,
    hierarchy_type, hierarchy_level, parent_id,
    created_at, updated_at, created_by
) VALUES (
    'COMP-ACME-IMP-001', 'Cliente', 'RUC',
    'ACME Importaciones', 'S.A.',
    'importaciones@grupoacme.com', '+593 4 2123457',
    'Av. Principal 100, Piso 2, Guayaquil', 'Importaciones',
    'COMPANY', 1, @acme_corp_id,
    NOW(), NOW(), 'system'
);

SET @acme_import_id = LAST_INSERT_ID();

INSERT IGNORE INTO participant_read_model (
    identification, type, reference_type, first_names, last_names,
    email, phone, address, agency,
    hierarchy_type, hierarchy_level, parent_id,
    created_at, updated_at, created_by
) VALUES (
    'COMP-ACME-EXP-001', 'Cliente', 'RUC',
    'ACME Exportaciones', 'S.A.',
    'exportaciones@grupoacme.com', '+593 4 2123458',
    'Av. Principal 100, Piso 3, Guayaquil', 'Exportaciones',
    'COMPANY', 1, @acme_corp_id,
    NOW(), NOW(), 'system'
);

SET @acme_export_id = LAST_INSERT_ID();

-- Insert Branches under ACME Importaciones
INSERT IGNORE INTO participant_read_model (
    identification, type, reference_type, first_names, last_names,
    email, phone, address, agency,
    hierarchy_type, hierarchy_level, parent_id,
    created_at, updated_at, created_by
) VALUES
(
    'BRANCH-ACME-IMP-GYE', 'Cliente', 'RUC',
    'ACME Importaciones', 'Sucursal Guayaquil',
    'imp.guayaquil@grupoacme.com', '+593 4 2123459',
    'Av. de las Americas, Guayaquil', 'Guayaquil',
    'BRANCH', 2, @acme_import_id,
    NOW(), NOW(), 'system'
),
(
    'BRANCH-ACME-IMP-UIO', 'Cliente', 'RUC',
    'ACME Importaciones', 'Sucursal Quito',
    'imp.quito@grupoacme.com', '+593 2 2654321',
    'Av. Amazonas N24-55, Quito', 'Quito',
    'BRANCH', 2, @acme_import_id,
    NOW(), NOW(), 'system'
);

-- Insert Branches under ACME Exportaciones
INSERT IGNORE INTO participant_read_model (
    identification, type, reference_type, first_names, last_names,
    email, phone, address, agency,
    hierarchy_type, hierarchy_level, parent_id,
    created_at, updated_at, created_by
) VALUES
(
    'BRANCH-ACME-EXP-GYE', 'Cliente', 'RUC',
    'ACME Exportaciones', 'Sucursal Guayaquil',
    'exp.guayaquil@grupoacme.com', '+593 4 2123460',
    'Puerto Principal, Guayaquil', 'Guayaquil',
    'BRANCH', 2, @acme_export_id,
    NOW(), NOW(), 'system'
),
(
    'BRANCH-ACME-EXP-MTA', 'Cliente', 'RUC',
    'ACME Exportaciones', 'Sucursal Manta',
    'exp.manta@grupoacme.com', '+593 5 2623456',
    'Puerto de Manta, Manta', 'Manta',
    'BRANCH', 2, @acme_export_id,
    NOW(), NOW(), 'system'
);

-- =====================================================
-- CORPORATION 2: Grupo Financiero Global
-- =====================================================

INSERT IGNORE INTO participant_read_model (
    identification, type, reference_type, first_names, last_names,
    email, phone, address, agency,
    hierarchy_type, hierarchy_level, parent_id,
    created_at, updated_at, created_by
) VALUES (
    'CORP-GLOBAL-001', 'Cliente', 'RUC',
    'Grupo Financiero Global', 'Holdings',
    'corporativo@grupoglobal.com', '+593 2 2987654',
    'Av. 12 de Octubre, Torre Global, Quito', 'Matriz',
    'CORPORATION', 0, NULL,
    NOW(), NOW(), 'system'
);

SET @global_corp_id = LAST_INSERT_ID();

-- Companies under Global Corporation
INSERT IGNORE INTO participant_read_model (
    identification, type, reference_type, first_names, last_names,
    email, phone, address, agency,
    hierarchy_type, hierarchy_level, parent_id,
    created_at, updated_at, created_by
) VALUES
(
    'COMP-GLOBAL-INV-001', 'Cliente', 'RUC',
    'Global Inversiones', 'S.A.',
    'inversiones@grupoglobal.com', '+593 2 2987655',
    'Av. 12 de Octubre, Piso 10, Quito', 'Inversiones',
    'COMPANY', 1, @global_corp_id,
    NOW(), NOW(), 'system'
),
(
    'COMP-GLOBAL-TRD-001', 'Cliente', 'RUC',
    'Global Trading', 'S.A.',
    'trading@grupoglobal.com', '+593 2 2987656',
    'Av. 12 de Octubre, Piso 15, Quito', 'Trading',
    'COMPANY', 1, @global_corp_id,
    NOW(), NOW(), 'system'
),
(
    'COMP-GLOBAL-LOG-001', 'Cliente', 'RUC',
    'Global Logistics', 'S.A.',
    'logistics@grupoglobal.com', '+593 4 2567890',
    'Zona Franca, Guayaquil', 'Logistica',
    'COMPANY', 1, @global_corp_id,
    NOW(), NOW(), 'system'
);

-- =====================================================
-- CORPORATION 3: Multinacional Andina
-- =====================================================

INSERT IGNORE INTO participant_read_model (
    identification, type, reference_type, first_names, last_names,
    email, phone, address, agency,
    hierarchy_type, hierarchy_level, parent_id,
    created_at, updated_at, created_by
) VALUES (
    'CORP-ANDINA-001', 'Cliente', 'RUC',
    'Multinacional Andina', 'Corporation',
    'info@andinacorp.com', '+593 2 2345678',
    'Av. Colon E5-20, Edificio Andina, Quito', 'Matriz Regional',
    'CORPORATION', 0, NULL,
    NOW(), NOW(), 'system'
);

SET @andina_corp_id = LAST_INSERT_ID();

-- Companies under Andina Corporation
INSERT IGNORE INTO participant_read_model (
    identification, type, reference_type, first_names, last_names,
    email, phone, address, agency,
    hierarchy_type, hierarchy_level, parent_id,
    created_at, updated_at, created_by
) VALUES
(
    'COMP-ANDINA-EC-001', 'Cliente', 'RUC',
    'Andina Ecuador', 'S.A.',
    'ecuador@andinacorp.com', '+593 2 2345679',
    'Av. Colon E5-20, Quito, Ecuador', 'Ecuador',
    'COMPANY', 1, @andina_corp_id,
    NOW(), NOW(), 'system'
),
(
    'COMP-ANDINA-CO-001', 'Cliente', 'NIT',
    'Andina Colombia', 'S.A.S.',
    'colombia@andinacorp.com', '+57 1 3456789',
    'Calle 72, Bogota, Colombia', 'Colombia',
    'COMPANY', 1, @andina_corp_id,
    NOW(), NOW(), 'system'
),
(
    'COMP-ANDINA-PE-001', 'Cliente', 'RUC',
    'Andina Peru', 'S.A.C.',
    'peru@andinacorp.com', '+51 1 4567890',
    'Av. Javier Prado, Lima, Peru', 'Peru',
    'COMPANY', 1, @andina_corp_id,
    NOW(), NOW(), 'system'
);

-- =====================================================
-- CLIENT PORTAL USERS for each corporation/company
-- =====================================================

-- Get the CLIENT role ID
SET @client_role_id = (SELECT id FROM role_read_model WHERE name = 'ROLE_CLIENT' LIMIT 1);

-- User for Grupo Industrial ACME (Corporation - can see all child companies)
INSERT IGNORE INTO user_read_model (
    username, email, password, name,
    enabled, accountNonExpired, accountNonLocked, credentialsNonExpired,
    user_type, cliente_id, created_at, updated_at
) VALUES (
    'acme.corp', 'corp.user@grupoacme.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.rsR5TBdVDk5LLsDB6K', -- password: password123
    'Admin Corporativo ACME',
    1, 1, 1, 1,
    'CLIENT', CAST(@acme_corp_id AS CHAR),
    NOW(), NOW()
);
SET @acme_corp_user_id = LAST_INSERT_ID();
INSERT IGNORE INTO user_role_read_model (user_id, role_id) VALUES (@acme_corp_user_id, @client_role_id);

-- User for ACME Importaciones
INSERT IGNORE INTO user_read_model (
    username, email, password, name,
    enabled, accountNonExpired, accountNonLocked, credentialsNonExpired,
    user_type, cliente_id, created_at, updated_at
) VALUES (
    'acme.import', 'import.user@grupoacme.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.rsR5TBdVDk5LLsDB6K',
    'Gerente Importaciones ACME',
    1, 1, 1, 1,
    'CLIENT', CAST(@acme_import_id AS CHAR),
    NOW(), NOW()
);
SET @acme_import_user_id = LAST_INSERT_ID();
INSERT IGNORE INTO user_role_read_model (user_id, role_id) VALUES (@acme_import_user_id, @client_role_id);

-- User for ACME Exportaciones
INSERT IGNORE INTO user_read_model (
    username, email, password, name,
    enabled, accountNonExpired, accountNonLocked, credentialsNonExpired,
    user_type, cliente_id, created_at, updated_at
) VALUES (
    'acme.export', 'export.user@grupoacme.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.rsR5TBdVDk5LLsDB6K',
    'Gerente Exportaciones ACME',
    1, 1, 1, 1,
    'CLIENT', CAST(@acme_export_id AS CHAR),
    NOW(), NOW()
);
SET @acme_export_user_id = LAST_INSERT_ID();
INSERT IGNORE INTO user_role_read_model (user_id, role_id) VALUES (@acme_export_user_id, @client_role_id);

-- User for Grupo Financiero Global (Corporation)
INSERT IGNORE INTO user_read_model (
    username, email, password, name,
    enabled, accountNonExpired, accountNonLocked, credentialsNonExpired,
    user_type, cliente_id, created_at, updated_at
) VALUES (
    'global.corp', 'corp.user@grupoglobal.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.rsR5TBdVDk5LLsDB6K',
    'Director Global Holdings',
    1, 1, 1, 1,
    'CLIENT', CAST(@global_corp_id AS CHAR),
    NOW(), NOW()
);
SET @global_corp_user_id = LAST_INSERT_ID();
INSERT IGNORE INTO user_role_read_model (user_id, role_id) VALUES (@global_corp_user_id, @client_role_id);

-- User for Multinacional Andina (Corporation)
INSERT IGNORE INTO user_read_model (
    username, email, password, name,
    enabled, accountNonExpired, accountNonLocked, credentialsNonExpired,
    user_type, cliente_id, created_at, updated_at
) VALUES (
    'andina.corp', 'regional@andinacorp.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.rsR5TBdVDk5LLsDB6K',
    'Director Regional Andina',
    1, 1, 1, 1,
    'CLIENT', CAST(@andina_corp_id AS CHAR),
    NOW(), NOW()
);
SET @andina_corp_user_id = LAST_INSERT_ID();
INSERT IGNORE INTO user_role_read_model (user_id, role_id) VALUES (@andina_corp_user_id, @client_role_id);

-- User for Andina Ecuador
INSERT IGNORE INTO user_read_model (
    username, email, password, name,
    enabled, accountNonExpired, accountNonLocked, credentialsNonExpired,
    user_type, cliente_id, created_at, updated_at
) VALUES (
    'andina.ec', 'ec.user@andinacorp.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.rsR5TBdVDk5LLsDB6K',
    'Gerente Ecuador',
    1, 1, 1, 1,
    'CLIENT', (SELECT CAST(id AS CHAR) FROM participant_read_model WHERE identification = 'COMP-ANDINA-EC-001'),
    NOW(), NOW()
);
SET @andina_ec_user_id = LAST_INSERT_ID();
INSERT IGNORE INTO user_role_read_model (user_id, role_id) VALUES (@andina_ec_user_id, @client_role_id);

-- =====================================================
-- TEST CREDENTIALS:
-- All users have password: password123
--
-- Corporation Users (can see ALL child companies):
--   - acme.corp / password123     -> Grupo Industrial ACME
--   - global.corp / password123   -> Grupo Financiero Global
--   - andina.corp / password123   -> Multinacional Andina
--
-- Company Users (only see their company):
--   - acme.import / password123   -> ACME Importaciones
--   - acme.export / password123   -> ACME Exportaciones
--   - andina.ec / password123     -> Andina Ecuador
-- =====================================================

-- =====================================================
-- Summary of created hierarchy:
--
-- Grupo Industrial ACME (CORPORATION)
--   ├── ACME Importaciones (COMPANY)
--   │     ├── Sucursal Guayaquil (BRANCH)
--   │     └── Sucursal Quito (BRANCH)
--   └── ACME Exportaciones (COMPANY)
--         ├── Sucursal Guayaquil (BRANCH)
--         └── Sucursal Manta (BRANCH)
--
-- Grupo Financiero Global (CORPORATION)
--   ├── Global Inversiones (COMPANY)
--   ├── Global Trading (COMPANY)
--   └── Global Logistics (COMPANY)
--
-- Multinacional Andina (CORPORATION)
--   ├── Andina Ecuador (COMPANY)
--   ├── Andina Colombia (COMPANY)
--   └── Andina Peru (COMPANY)
-- =====================================================
