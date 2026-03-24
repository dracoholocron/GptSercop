-- =====================================================
-- Document Management Read Models (CQRS)
-- Migration: V20251228_2__create_document_readmodels.sql
-- =====================================================

-- -----------------------------------------------------
-- Table: document_readmodel
-- Denormalized read model for document queries
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS document_readmodel (
    document_id VARCHAR(36) PRIMARY KEY,
    operation_id VARCHAR(100),
    event_id VARCHAR(100),

    -- File info
    original_file_name VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    formatted_file_size VARCHAR(50),

    -- Classification - denormalized
    category_code VARCHAR(50) NOT NULL,
    category_name_es VARCHAR(100),
    category_name_en VARCHAR(100),
    subcategory_code VARCHAR(50),
    document_type_code VARCHAR(50) NOT NULL,
    document_type_name_es VARCHAR(100),
    document_type_name_en VARCHAR(100),
    tags TEXT,

    -- Version info
    version INT NOT NULL DEFAULT 1,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    change_notes VARCHAR(1000),

    -- Security
    access_level VARCHAR(20) NOT NULL DEFAULT 'RESTRICTED',

    -- Audit - denormalized
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_by_name VARCHAR(200),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(100),
    modified_at TIMESTAMP,

    -- Computed fields
    can_preview BOOLEAN DEFAULT FALSE,
    download_count INT DEFAULT 0,
    view_count INT DEFAULT 0
);

CREATE INDEX idx_doc_rm_operation ON document_readmodel(operation_id);
CREATE INDEX idx_doc_rm_event ON document_readmodel(event_id);
CREATE INDEX idx_doc_rm_category ON document_readmodel(category_code);
CREATE INDEX idx_doc_rm_type ON document_readmodel(document_type_code);
CREATE INDEX idx_doc_rm_uploaded_at ON document_readmodel(uploaded_at);
CREATE INDEX idx_doc_rm_is_latest ON document_readmodel(is_latest);

-- -----------------------------------------------------
-- Table: document_category_readmodel
-- Denormalized read model for category queries
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS document_category_readmodel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id VARCHAR(36) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    parent_code VARCHAR(50),
    name_es VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    description_es VARCHAR(500),
    description_en VARCHAR(500),
    icon VARCHAR(50),
    display_order INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    document_count INT DEFAULT 0,
    has_children BOOLEAN DEFAULT FALSE,
    level INT DEFAULT 0,
    full_path VARCHAR(500)
);

CREATE INDEX idx_doc_cat_rm_code ON document_category_readmodel(code);
CREATE INDEX idx_doc_cat_rm_parent ON document_category_readmodel(parent_code);
CREATE INDEX idx_doc_cat_rm_order ON document_category_readmodel(display_order);
CREATE INDEX idx_doc_cat_rm_active ON document_category_readmodel(is_active);

-- -----------------------------------------------------
-- Table: document_type_readmodel
-- Denormalized read model for document type queries
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS document_type_readmodel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type_id VARCHAR(36) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    category_code VARCHAR(50) NOT NULL,
    category_name_es VARCHAR(100),
    category_name_en VARCHAR(100),
    name_es VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    description_es VARCHAR(500),
    description_en VARCHAR(500),
    allowed_mime_types TEXT,
    allowed_extensions VARCHAR(500),
    max_file_size_mb INT DEFAULT 50,
    requires_approval BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    document_count INT DEFAULT 0
);

CREATE INDEX idx_doc_type_rm_code ON document_type_readmodel(code);
CREATE INDEX idx_doc_type_rm_category ON document_type_readmodel(category_code);
CREATE INDEX idx_doc_type_rm_active ON document_type_readmodel(is_active);

-- =====================================================
-- Populate read models from write models
-- =====================================================

-- Populate category read models
INSERT INTO document_category_readmodel (category_id, code, parent_code, name_es, name_en, description_es, description_en, icon, display_order, is_active, document_count, has_children, level, full_path)
SELECT
    c.category_id,
    c.code,
    pc.code as parent_code,
    c.name_es,
    c.name_en,
    c.description_es,
    c.description_en,
    c.icon,
    c.display_order,
    c.is_active,
    0 as document_count,
    EXISTS(SELECT 1 FROM document_categories ch WHERE ch.parent_category_id = c.category_id) as has_children,
    CASE WHEN c.parent_category_id IS NULL THEN 0 ELSE 1 END as level,
    CASE WHEN pc.name_es IS NULL THEN c.name_es ELSE CONCAT(pc.name_es, ' > ', c.name_es) END as full_path
FROM document_categories c
LEFT JOIN document_categories pc ON c.parent_category_id = pc.category_id;

-- Populate type read models
INSERT INTO document_type_readmodel (type_id, code, category_code, category_name_es, category_name_en, name_es, name_en, description_es, description_en, allowed_mime_types, max_file_size_mb, requires_approval, is_active, document_count)
SELECT
    t.type_id,
    t.code,
    t.category_code,
    c.name_es as category_name_es,
    c.name_en as category_name_en,
    t.name_es,
    t.name_en,
    t.description_es,
    t.description_en,
    t.allowed_mime_types,
    t.max_file_size_mb,
    t.requires_approval,
    t.is_active,
    0 as document_count
FROM document_types t
JOIN document_categories c ON t.category_code = c.code;
