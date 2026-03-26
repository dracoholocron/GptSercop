-- Cambiar columna type de ENUM a VARCHAR para soportar todos los tipos de institución financiera
-- El frontend envía: BANCO, CORRESPONSAL, FINTECH
-- El enum Java ahora incluye: BANCO, CORRESPONSAL, FINTECH, BANCO_COMERCIAL, BANCO_CORRESPONSAL, BANCO_CENTRAL, INSTITUCION_FINANCIERA
CREATE TABLE IF NOT EXISTS financial_institution_readmodel (
    id BIGINT NOT NULL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    swift_code VARCHAR(11),
    country VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    type VARCHAR(50) NOT NULL,
    rating VARCHAR(10),
    is_correspondent BOOLEAN DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME,
    updated_at DATETIME,
    aggregate_id VARCHAR(100),
    version BIGINT DEFAULT 0,
    INDEX idx_fin_inst_code (code),
    INDEX idx_fin_inst_type (type),
    INDEX idx_fin_inst_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @has_fin_inst_type := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'financial_institution_readmodel'
      AND column_name = 'type'
);
SET @sql_fix_fin_inst_type := IF(
    @has_fin_inst_type > 0,
    'ALTER TABLE financial_institution_readmodel MODIFY COLUMN type VARCHAR(50) NOT NULL',
    "SELECT 'V256 skipped: type column missing in financial_institution_readmodel' AS migration_note"
);
PREPARE stmt_fix_fin_inst_type FROM @sql_fix_fin_inst_type;
EXECUTE stmt_fix_fin_inst_type;
DEALLOCATE PREPARE stmt_fix_fin_inst_type;
