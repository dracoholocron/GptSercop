-- =====================================================
-- Document Management System Tables
-- Migration: V20251228__create_document_management_tables.sql
-- =====================================================

-- -----------------------------------------------------
-- Table: document_categories
-- Hierarchical classification of documents
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS document_categories (
    category_id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    parent_category_id VARCHAR(36),
    name_es VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    description_es VARCHAR(500),
    description_en VARCHAR(500),
    icon VARCHAR(50),
    display_order INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    modified_at TIMESTAMP,
    modified_by VARCHAR(100),

    CONSTRAINT fk_doc_cat_parent FOREIGN KEY (parent_category_id)
        REFERENCES document_categories(category_id) ON DELETE SET NULL
);

CREATE INDEX idx_doc_cat_code ON document_categories(code);
CREATE INDEX idx_doc_cat_parent ON document_categories(parent_category_id);
CREATE INDEX idx_doc_cat_active ON document_categories(is_active);

-- -----------------------------------------------------
-- Table: document_types
-- Types of documents within categories
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS document_types (
    type_id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    category_code VARCHAR(50) NOT NULL,
    name_es VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    description_es VARCHAR(500),
    description_en VARCHAR(500),
    allowed_mime_types TEXT,
    max_file_size_mb INT DEFAULT 50,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    modified_at TIMESTAMP,
    modified_by VARCHAR(100),

    CONSTRAINT fk_doc_type_category FOREIGN KEY (category_code)
        REFERENCES document_categories(code) ON DELETE RESTRICT
);

CREATE INDEX idx_doc_type_code ON document_types(code);
CREATE INDEX idx_doc_type_category ON document_types(category_code);
CREATE INDEX idx_doc_type_active ON document_types(is_active);

-- -----------------------------------------------------
-- Table: documents
-- Main document storage table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    document_id VARCHAR(36) PRIMARY KEY,
    aggregate_id VARCHAR(100),
    aggregate_type VARCHAR(20),
    operation_id VARCHAR(100),
    event_id VARCHAR(100),

    -- File metadata
    original_file_name VARCHAR(500) NOT NULL,
    stored_file_name VARCHAR(100) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    storage_provider VARCHAR(20) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    checksum VARCHAR(64),

    -- Classification
    category_code VARCHAR(50) NOT NULL,
    subcategory_code VARCHAR(50),
    document_type_code VARCHAR(50) NOT NULL,
    tags TEXT,

    -- Version control
    version INT NOT NULL DEFAULT 1,
    previous_version_id VARCHAR(36),
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    change_notes VARCHAR(1000),

    -- Security
    access_level VARCHAR(20) NOT NULL DEFAULT 'RESTRICTED',
    encryption_key VARCHAR(100),
    virus_scan_passed BOOLEAN,
    virus_scan_at TIMESTAMP,

    -- Audit
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(100),
    modified_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by VARCHAR(100),
    deleted_at TIMESTAMP,

    CONSTRAINT fk_doc_category FOREIGN KEY (category_code)
        REFERENCES document_categories(code) ON DELETE RESTRICT,
    CONSTRAINT fk_doc_type FOREIGN KEY (document_type_code)
        REFERENCES document_types(code) ON DELETE RESTRICT,
    CONSTRAINT fk_doc_previous_version FOREIGN KEY (previous_version_id)
        REFERENCES documents(document_id) ON DELETE SET NULL
);

CREATE INDEX idx_doc_operation ON documents(operation_id);
CREATE INDEX idx_doc_event ON documents(event_id);
CREATE INDEX idx_doc_category ON documents(category_code);
CREATE INDEX idx_doc_type ON documents(document_type_code);
CREATE INDEX idx_doc_uploaded_at ON documents(uploaded_at);
CREATE INDEX idx_doc_is_latest ON documents(is_latest);
CREATE INDEX idx_doc_is_deleted ON documents(is_deleted);

-- -----------------------------------------------------
-- Table: document_access_logs
-- Audit trail for document access
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS document_access_logs (
    log_id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(200),
    action VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details TEXT,

    CONSTRAINT fk_doc_log_document FOREIGN KEY (document_id)
        REFERENCES documents(document_id) ON DELETE CASCADE
);

CREATE INDEX idx_doc_log_document ON document_access_logs(document_id);
CREATE INDEX idx_doc_log_user ON document_access_logs(user_id);
CREATE INDEX idx_doc_log_action ON document_access_logs(action);
CREATE INDEX idx_doc_log_accessed_at ON document_access_logs(accessed_at);

-- =====================================================
-- Initial Data: Categories
-- =====================================================
INSERT INTO document_categories (category_id, code, name_es, name_en, description_es, description_en, icon, display_order, is_active, created_by) VALUES
('CAT-001', 'LEGAL', 'Legal', 'Legal', 'Documentos legales y contratos', 'Legal documents and contracts', 'FiFileText', 1, TRUE, 'system'),
('CAT-002', 'FINANCIAL', 'Financiero', 'Financial', 'Documentos financieros y contables', 'Financial and accounting documents', 'FiDollarSign', 2, TRUE, 'system'),
('CAT-003', 'SHIPPING', 'Embarque', 'Shipping', 'Documentos de transporte y embarque', 'Transport and shipping documents', 'FiTruck', 3, TRUE, 'system'),
('CAT-004', 'INSURANCE', 'Seguros', 'Insurance', 'Polizas y documentos de seguros', 'Insurance policies and documents', 'FiShield', 4, TRUE, 'system'),
('CAT-005', 'CUSTOMS', 'Aduanas', 'Customs', 'Documentos aduaneros', 'Customs documents', 'FiGlobe', 5, TRUE, 'system'),
('CAT-006', 'COMPLIANCE', 'Cumplimiento', 'Compliance', 'Documentos de cumplimiento normativo', 'Regulatory compliance documents', 'FiCheckCircle', 6, TRUE, 'system'),
('CAT-007', 'CORRESPONDENCE', 'Correspondencia', 'Correspondence', 'Correos y comunicaciones', 'Emails and communications', 'FiMail', 7, TRUE, 'system'),
('CAT-008', 'SWIFT', 'Mensajes SWIFT', 'SWIFT Messages', 'Mensajes y confirmaciones SWIFT', 'SWIFT messages and confirmations', 'FiSend', 8, TRUE, 'system'),
('CAT-009', 'OTHER', 'Otros', 'Other', 'Otros documentos', 'Other documents', 'FiFile', 99, TRUE, 'system');

-- =====================================================
-- Initial Data: Document Types
-- =====================================================

-- Legal documents
INSERT INTO document_types (type_id, code, category_code, name_es, name_en, description_es, description_en, allowed_mime_types, max_file_size_mb, created_by) VALUES
('TYPE-001', 'CONTRACT', 'LEGAL', 'Contrato', 'Contract', 'Contratos legales', 'Legal contracts', '["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]', 50, 'system'),
('TYPE-002', 'POWER_OF_ATTORNEY', 'LEGAL', 'Poder Notarial', 'Power of Attorney', 'Poderes notariales', 'Powers of attorney', '["application/pdf"]', 20, 'system'),
('TYPE-003', 'CORPORATE_DOCS', 'LEGAL', 'Documentos Corporativos', 'Corporate Documents', 'Actas y documentos corporativos', 'Minutes and corporate documents', '["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]', 50, 'system');

-- Financial documents
INSERT INTO document_types (type_id, code, category_code, name_es, name_en, description_es, description_en, allowed_mime_types, max_file_size_mb, created_by) VALUES
('TYPE-010', 'COMMERCIAL_INVOICE', 'FINANCIAL', 'Factura Comercial', 'Commercial Invoice', 'Facturas comerciales', 'Commercial invoices', '["application/pdf","image/jpeg","image/png"]', 20, 'system'),
('TYPE-011', 'PROFORMA_INVOICE', 'FINANCIAL', 'Factura Proforma', 'Proforma Invoice', 'Facturas proforma', 'Proforma invoices', '["application/pdf","image/jpeg","image/png"]', 20, 'system'),
('TYPE-012', 'PAYMENT_RECEIPT', 'FINANCIAL', 'Comprobante de Pago', 'Payment Receipt', 'Comprobantes de pago', 'Payment receipts', '["application/pdf","image/jpeg","image/png"]', 10, 'system'),
('TYPE-013', 'BANK_STATEMENT', 'FINANCIAL', 'Estado de Cuenta', 'Bank Statement', 'Estados de cuenta bancarios', 'Bank account statements', '["application/pdf"]', 20, 'system'),
('TYPE-014', 'CREDIT_NOTE', 'FINANCIAL', 'Nota de Credito', 'Credit Note', 'Notas de credito', 'Credit notes', '["application/pdf"]', 10, 'system');

-- Shipping documents
INSERT INTO document_types (type_id, code, category_code, name_es, name_en, description_es, description_en, allowed_mime_types, max_file_size_mb, created_by) VALUES
('TYPE-020', 'BILL_OF_LADING', 'SHIPPING', 'Conocimiento de Embarque', 'Bill of Lading', 'Conocimiento de embarque maritimo', 'Maritime bill of lading', '["application/pdf","image/jpeg","image/png"]', 20, 'system'),
('TYPE-021', 'AIRWAY_BILL', 'SHIPPING', 'Guia Aerea', 'Airway Bill', 'Guia de transporte aereo', 'Air transport waybill', '["application/pdf","image/jpeg","image/png"]', 20, 'system'),
('TYPE-022', 'PACKING_LIST', 'SHIPPING', 'Lista de Empaque', 'Packing List', 'Lista de empaque de mercancias', 'Merchandise packing list', '["application/pdf","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]', 20, 'system'),
('TYPE-023', 'DELIVERY_ORDER', 'SHIPPING', 'Orden de Entrega', 'Delivery Order', 'Orden de entrega de mercancias', 'Merchandise delivery order', '["application/pdf"]', 10, 'system'),
('TYPE-024', 'WEIGHT_CERTIFICATE', 'SHIPPING', 'Certificado de Peso', 'Weight Certificate', 'Certificado de peso de la carga', 'Cargo weight certificate', '["application/pdf"]', 10, 'system');

-- Insurance documents
INSERT INTO document_types (type_id, code, category_code, name_es, name_en, description_es, description_en, allowed_mime_types, max_file_size_mb, created_by) VALUES
('TYPE-030', 'INSURANCE_POLICY', 'INSURANCE', 'Poliza de Seguro', 'Insurance Policy', 'Poliza de seguro de carga', 'Cargo insurance policy', '["application/pdf"]', 20, 'system'),
('TYPE-031', 'INSURANCE_CERTIFICATE', 'INSURANCE', 'Certificado de Seguro', 'Insurance Certificate', 'Certificado de cobertura', 'Insurance coverage certificate', '["application/pdf"]', 10, 'system'),
('TYPE-032', 'CLAIM_DOCUMENT', 'INSURANCE', 'Documento de Reclamo', 'Claim Document', 'Documentos de reclamo de seguro', 'Insurance claim documents', '["application/pdf","image/jpeg","image/png"]', 30, 'system');

-- Customs documents
INSERT INTO document_types (type_id, code, category_code, name_es, name_en, description_es, description_en, allowed_mime_types, max_file_size_mb, created_by) VALUES
('TYPE-040', 'CERTIFICATE_OF_ORIGIN', 'CUSTOMS', 'Certificado de Origen', 'Certificate of Origin', 'Certificado de origen de mercancias', 'Certificate of origin for goods', '["application/pdf","image/jpeg","image/png"]', 20, 'system'),
('TYPE-041', 'CUSTOMS_DECLARATION', 'CUSTOMS', 'Declaracion Aduanera', 'Customs Declaration', 'Declaracion de importacion/exportacion', 'Import/export declaration', '["application/pdf"]', 20, 'system'),
('TYPE-042', 'IMPORT_LICENSE', 'CUSTOMS', 'Licencia de Importacion', 'Import License', 'Licencia de importacion', 'Import license', '["application/pdf"]', 10, 'system'),
('TYPE-043', 'EXPORT_LICENSE', 'CUSTOMS', 'Licencia de Exportacion', 'Export License', 'Licencia de exportacion', 'Export license', '["application/pdf"]', 10, 'system'),
('TYPE-044', 'PHYTOSANITARY_CERT', 'CUSTOMS', 'Certificado Fitosanitario', 'Phytosanitary Certificate', 'Certificado fitosanitario', 'Phytosanitary certificate', '["application/pdf"]', 10, 'system'),
('TYPE-045', 'INSPECTION_CERT', 'CUSTOMS', 'Certificado de Inspeccion', 'Inspection Certificate', 'Certificado de inspeccion de calidad', 'Quality inspection certificate', '["application/pdf"]', 20, 'system');

-- Compliance documents
INSERT INTO document_types (type_id, code, category_code, name_es, name_en, description_es, description_en, allowed_mime_types, max_file_size_mb, created_by) VALUES
('TYPE-050', 'KYC_DOCUMENT', 'COMPLIANCE', 'Documento KYC', 'KYC Document', 'Documentos de conocimiento del cliente', 'Know Your Customer documents', '["application/pdf","image/jpeg","image/png"]', 20, 'system'),
('TYPE-051', 'AML_REPORT', 'COMPLIANCE', 'Reporte AML', 'AML Report', 'Reporte anti-lavado de dinero', 'Anti-money laundering report', '["application/pdf"]', 20, 'system'),
('TYPE-052', 'SANCTIONS_CHECK', 'COMPLIANCE', 'Verificacion de Sanciones', 'Sanctions Check', 'Resultado de verificacion de sanciones', 'Sanctions verification result', '["application/pdf"]', 10, 'system');

-- Correspondence
INSERT INTO document_types (type_id, code, category_code, name_es, name_en, description_es, description_en, allowed_mime_types, max_file_size_mb, created_by) VALUES
('TYPE-060', 'EMAIL', 'CORRESPONDENCE', 'Correo Electronico', 'Email', 'Correos electronicos', 'Email messages', '["application/pdf","message/rfc822","text/plain"]', 20, 'system'),
('TYPE-061', 'LETTER', 'CORRESPONDENCE', 'Carta', 'Letter', 'Cartas oficiales', 'Official letters', '["application/pdf","image/jpeg","image/png"]', 10, 'system'),
('TYPE-062', 'FAX', 'CORRESPONDENCE', 'Fax', 'Fax', 'Comunicaciones por fax', 'Fax communications', '["application/pdf","image/tiff","image/jpeg"]', 10, 'system');

-- SWIFT messages
INSERT INTO document_types (type_id, code, category_code, name_es, name_en, description_es, description_en, allowed_mime_types, max_file_size_mb, created_by) VALUES
('TYPE-070', 'SWIFT_MT700', 'SWIFT', 'MT700 - Emision LC', 'MT700 - LC Issue', 'Mensaje SWIFT MT700', 'SWIFT MT700 message', '["text/plain","application/pdf"]', 5, 'system'),
('TYPE-071', 'SWIFT_MT707', 'SWIFT', 'MT707 - Enmienda LC', 'MT707 - LC Amendment', 'Mensaje SWIFT MT707', 'SWIFT MT707 message', '["text/plain","application/pdf"]', 5, 'system'),
('TYPE-072', 'SWIFT_MT760', 'SWIFT', 'MT760 - Garantia', 'MT760 - Guarantee', 'Mensaje SWIFT MT760', 'SWIFT MT760 message', '["text/plain","application/pdf"]', 5, 'system'),
('TYPE-073', 'SWIFT_MT798', 'SWIFT', 'MT798 - Corporativo', 'MT798 - Corporate', 'Mensaje SWIFT MT798', 'SWIFT MT798 message', '["text/plain","application/pdf"]', 5, 'system'),
('TYPE-074', 'SWIFT_OTHER', 'SWIFT', 'Otro Mensaje SWIFT', 'Other SWIFT Message', 'Otros mensajes SWIFT', 'Other SWIFT messages', '["text/plain","application/pdf"]', 5, 'system');

-- Other documents
INSERT INTO document_types (type_id, code, category_code, name_es, name_en, description_es, description_en, allowed_mime_types, max_file_size_mb, created_by) VALUES
('TYPE-090', 'PHOTO', 'OTHER', 'Fotografia', 'Photo', 'Fotografias de mercancias', 'Merchandise photos', '["image/jpeg","image/png","image/gif"]', 20, 'system'),
('TYPE-091', 'REPORT', 'OTHER', 'Reporte', 'Report', 'Reportes varios', 'Various reports', '["application/pdf","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]', 50, 'system'),
('TYPE-092', 'OTHER', 'OTHER', 'Otro', 'Other', 'Otros documentos no clasificados', 'Other unclassified documents', NULL, 50, 'system');
