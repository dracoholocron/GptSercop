-- =====================================================
-- V78: Seed Guarantee Document Templates
-- Migrates all Doka guarantee templates to GlobalCMX
-- =====================================================

CREATE TABLE IF NOT EXISTS template_read_model (
    id BIGINT NOT NULL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    document_type VARCHAR(50),
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size BIGINT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME,
    updated_at DATETIME,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    aggregate_id VARCHAR(100),
    variables TEXT,
    version BIGINT DEFAULT 0,
    INDEX idx_template_code (code),
    INDEX idx_template_active (active),
    INDEX idx_template_doc_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @template_has_version := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'template_read_model'
      AND column_name = 'version'
);
SET @template_version_sql := IF(
    @template_has_version = 0,
    'ALTER TABLE template_read_model ADD COLUMN version BIGINT DEFAULT 0',
    'SELECT 1'
);
PREPARE stmt_template_version FROM @template_version_sql;
EXECUTE stmt_template_version;
DEALLOCATE PREPARE stmt_template_version;

-- Insert guarantee document templates
INSERT INTO template_read_model (id, code, name, description, document_type, file_name, file_path, file_size, active, created_at, created_by, aggregate_id, variables, version) VALUES
-- Advance Payment Guarantee
(1001, 'GAR-ADV-PAY-ES', 'Garantia de Anticipo (Espanol)', 'Plantilla para garantias de anticipo en espanol. Basada en formato estandar URDG 758.', 'HTML', 'advance-payment-es.html', 'templates/guarantees/advance-payment-es.html', 7181, 1, NOW(), 'system', 'TPL-GAR-ADV-PAY-ES', '["numeroGarantia","bancoGaranteNombre","ordenanteNombre","beneficiarioNombre","monto","montoFormateado","montoLetras","fechaEmision","fechaVencimiento","numeroContrato","objetoContrato","porcentajeFormateado","condicionesEjecucion","textoLeyAplicable"]', 1),
(1002, 'GAR-ADV-PAY-EN', 'Advance Payment Guarantee (English)', 'Template for advance payment guarantees in English. Based on URDG 758 standard format.', 'HTML', 'advance-payment-en.html', 'templates/guarantees/advance-payment-en.html', 7130, 1, NOW(), 'system', 'TPL-GAR-ADV-PAY-EN', '["numeroGarantia","issuingBankName","applicantName","beneficiaryName","monto","montoFormateado","montoLetras","fechaEmision","fechaVencimiento","numeroContrato","objetoContrato","porcentajeFormateado","condicionesEjecucion","textoLeyAplicable"]', 1),

-- Performance Bond
(1003, 'GAR-PERF-BOND-ES', 'Garantia de Cumplimiento (Espanol)', 'Plantilla para garantias de cumplimiento/fiel cumplimiento en espanol.', 'HTML', 'performance-bond-es.html', 'templates/guarantees/performance-bond-es.html', 7722, 1, NOW(), 'system', 'TPL-GAR-PERF-BOND-ES', '["numeroGarantia","bancoGaranteNombre","ordenanteNombre","beneficiarioNombre","monto","montoFormateado","montoLetras","fechaEmision","fechaVencimiento","numeroContrato","objetoContrato","montoContratoFormateado","porcentajeFormateado","condicionesEjecucion","textoLeyAplicable"]', 1),
(1004, 'GAR-PERF-BOND-EN', 'Performance Bond (English)', 'Template for performance bonds in English.', 'HTML', 'performance-bond-en.html', 'templates/guarantees/performance-bond-en.html', 7609, 1, NOW(), 'system', 'TPL-GAR-PERF-BOND-EN', '["numeroGarantia","issuingBankName","applicantName","beneficiaryName","monto","montoFormateado","montoLetras","fechaEmision","fechaVencimiento","numeroContrato","objetoContrato","montoContratoFormateado","porcentajeFormateado","condicionesEjecucion","textoLeyAplicable"]', 1),

-- Bid Bond
(1005, 'GAR-BID-BOND-ES', 'Garantia de Licitacion (Espanol)', 'Plantilla para garantias de seriedad de oferta/licitacion en espanol.', 'HTML', 'bid-bond-es.html', 'templates/guarantees/bid-bond-es.html', 5890, 1, NOW(), 'system', 'TPL-GAR-BID-BOND-ES', '["numeroGarantia","bancoGaranteNombre","ordenanteNombre","beneficiarioNombre","monto","montoFormateado","montoLetras","fechaEmision","fechaVencimiento","numeroContrato","objetoContrato","montoContratoFormateado","porcentajeFormateado","textoLeyAplicable"]', 1),
(1006, 'GAR-BID-BOND-EN', 'Bid Bond (English)', 'Template for bid bonds/tender guarantees in English.', 'HTML', 'bid-bond-en.html', 'templates/guarantees/bid-bond-en.html', 5714, 1, NOW(), 'system', 'TPL-GAR-BID-BOND-EN', '["numeroGarantia","issuingBankName","applicantName","beneficiaryName","monto","montoFormateado","montoLetras","fechaEmision","fechaVencimiento","numeroContrato","objetoContrato","montoContratoFormateado","porcentajeFormateado","textoLeyAplicable"]', 1),

-- Payment Guarantee
(1007, 'GAR-PAYMENT-ES', 'Garantia de Pago (Espanol)', 'Plantilla para garantias de pago en espanol Jean garantiza el pago del comprador al vendedor.', 'HTML', 'payment-guarantee-es.html', 'templates/guarantees/payment-guarantee-es.html', 5991, 1, NOW(), 'system', 'TPL-GAR-PAYMENT-ES', '["numeroGarantia","bancoGaranteNombre","ordenanteNombre","beneficiarioNombre","monto","montoFormateado","montoLetras","fechaEmision","fechaVencimiento","numeroContrato","objetoContrato","montoContratoFormateado","textoLeyAplicable"]', 1),
(1008, 'GAR-PAYMENT-EN', 'Payment Guarantee (English)', 'Template for payment guarantees in English. Guarantees buyer payment to seller.', 'HTML', 'payment-guarantee-en.html', 'templates/guarantees/payment-guarantee-en.html', 5938, 1, NOW(), 'system', 'TPL-GAR-PAYMENT-EN', '["numeroGarantia","issuingBankName","applicantName","beneficiaryName","monto","montoFormateado","montoLetras","fechaEmision","fechaVencimiento","numeroContrato","objetoContrato","montoContratoFormateado","textoLeyAplicable"]', 1),

-- Warranty Bond
(1009, 'GAR-WARRANTY-ES', 'Garantia de Calidad (Espanol)', 'Plantilla para garantias de calidad/buen funcionamiento en espanol.', 'HTML', 'warranty-bond-es.html', 'templates/guarantees/warranty-bond-es.html', 6112, 1, NOW(), 'system', 'TPL-GAR-WARRANTY-ES', '["numeroGarantia","bancoGaranteNombre","ordenanteNombre","beneficiarioNombre","monto","montoFormateado","montoLetras","fechaEmision","fechaVencimiento","numeroContrato","objetoContrato","montoContratoFormateado","porcentajeFormateado","textoLeyAplicable"]', 1),
(1010, 'GAR-WARRANTY-EN', 'Warranty Bond (English)', 'Template for warranty bonds in English.', 'HTML', 'warranty-bond-en.html', 'templates/guarantees/warranty-bond-en.html', 6023, 1, NOW(), 'system', 'TPL-GAR-WARRANTY-EN', '["numeroGarantia","issuingBankName","applicantName","beneficiaryName","monto","montoFormateado","montoLetras","fechaEmision","fechaVencimiento","numeroContrato","objetoContrato","montoContratoFormateado","porcentajeFormateado","textoLeyAplicable"]', 1),

-- Counter Guarantee
(1011, 'GAR-COUNTER-ES', 'Contragarantia (Espanol)', 'Plantilla para contragarantias en espanol. Utilizada cuando un banco local emite la garantia respaldada por el banco contragarante.', 'HTML', 'counter-guarantee-es.html', 'templates/guarantees/counter-guarantee-es.html', 6896, 1, NOW(), 'system', 'TPL-GAR-COUNTER-ES', '["numeroGarantia","bancoGaranteNombre","bancoContragaranteNombre","ordenanteNombre","beneficiarioNombre","monto","montoFormateado","montoLetras","fechaEmision","fechaVencimiento","numeroContrato","objetoContrato","montoContratoFormateado","tipoDescripcion"]', 1),
(1012, 'GAR-COUNTER-EN', 'Counter Guarantee (English)', 'Template for counter guarantees in English. Used when a local bank issues the guarantee backed by the counter-guarantor bank.', 'HTML', 'counter-guarantee-en.html', 'templates/guarantees/counter-guarantee-en.html', 6734, 1, NOW(), 'system', 'TPL-GAR-COUNTER-EN', '["numeroGarantia","issuingBankName","counterGuarantorName","applicantName","beneficiaryName","monto","montoFormateado","montoLetras","fechaEmision","fechaVencimiento","numeroContrato","objetoContrato","montoContratoFormateado","tipoDescripcion"]', 1),

-- Credit Facilities Guarantee
(1013, 'GAR-CREDIT-ES', 'Garantia de Facilidad Crediticia (Espanol)', 'Plantilla para garantias de lineas de credito/facilidades crediticias en espanol.', 'HTML', 'credit-facilities-es.html', 'templates/guarantees/credit-facilities-es.html', 5941, 1, NOW(), 'system', 'TPL-GAR-CREDIT-ES', '["numeroGarantia","bancoGaranteNombre","ordenanteNombre","beneficiarioNombre","monto","montoFormateado","montoLetras","fechaEmision","fechaVencimiento","numeroContrato","objetoContrato","montoContratoFormateado","textoLeyAplicable"]', 1),
(1014, 'GAR-CREDIT-EN', 'Credit Facilities Guarantee (English)', 'Template for credit facilities guarantees in English.', 'HTML', 'credit-facilities-en.html', 'templates/guarantees/credit-facilities-en.html', 5835, 1, NOW(), 'system', 'TPL-GAR-CREDIT-EN', '["numeroGarantia","issuingBankName","applicantName","beneficiaryName","monto","montoFormateado","montoLetras","fechaEmision","fechaVencimiento","numeroContrato","objetoContrato","montoContratoFormateado","textoLeyAplicable"]', 1),

-- Default Templates
(1015, 'GAR-DEFAULT-ES', 'Garantia Generica (Espanol)', 'Plantilla generica para cualquier tipo de garantia en espanol.', 'HTML', 'default-es.html', 'templates/guarantees/default-es.html', 4951, 1, NOW(), 'system', 'TPL-GAR-DEFAULT-ES', '["numeroGarantia","bancoGaranteNombre","ordenanteNombre","beneficiarioNombre","monto","montoFormateado","montoLetras","fechaEmision","fechaVencimiento","numeroContrato","objetoContrato","condicionesEjecucion","textoLeyAplicable","tipoDescripcion"]', 1),
(1016, 'GAR-DEFAULT-EN', 'Generic Guarantee (English)', 'Generic template for any guarantee type in English.', 'HTML', 'default-en.html', 'templates/guarantees/default-en.html', 4776, 1, NOW(), 'system', 'TPL-GAR-DEFAULT-EN', '["numeroGarantia","issuingBankName","applicantName","beneficiaryName","monto","montoFormateado","montoLetras","fechaEmision","fechaVencimiento","numeroContrato","objetoContrato","condicionesEjecucion","textoLeyAplicable","tipoDescripcion"]', 1)

ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    file_path = VALUES(file_path),
    variables = VALUES(variables),
    updated_at = NOW();
