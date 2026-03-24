-- =============================================================================
-- Migration V183: Client Portal Mock External APIs Configuration
-- Configures mock/test APIs for simulating external integrations
-- Uses public mock services: httpbin.org, jsonplaceholder.typicode.com, mockapi.io
-- =============================================================================

-- Cleanup existing data from partial runs (only for tables that exist before this migration)
DELETE FROM external_api_response_config WHERE api_config_id IN (SELECT id FROM external_api_config_read_model WHERE code IN ('CURRENCY_EXCHANGE_RATE', 'CLIENT_CREDIT_CHECK', 'SWIFT_BIC_VALIDATION', 'KYC_AML_SCREENING', 'COUNTRY_RISK_ASSESSMENT', 'DOCUMENT_OCR_VALIDATION', 'CORE_BANKING_INTEGRATION', 'EMAIL_NOTIFICATION_SERVICE', 'SMS_NOTIFICATION_SERVICE', 'TRADE_FINANCE_PRICING', 'REGULATORY_REPORTING', 'CORRESPONDENT_BANK_SWIFT'));
DELETE FROM external_api_request_template WHERE api_config_id IN (SELECT id FROM external_api_config_read_model WHERE code IN ('CURRENCY_EXCHANGE_RATE', 'CLIENT_CREDIT_CHECK', 'SWIFT_BIC_VALIDATION', 'KYC_AML_SCREENING', 'COUNTRY_RISK_ASSESSMENT', 'DOCUMENT_OCR_VALIDATION', 'CORE_BANKING_INTEGRATION', 'EMAIL_NOTIFICATION_SERVICE', 'SMS_NOTIFICATION_SERVICE', 'TRADE_FINANCE_PRICING', 'REGULATORY_REPORTING', 'CORRESPONDENT_BANK_SWIFT'));
DELETE FROM external_api_auth_config WHERE api_config_id IN (SELECT id FROM external_api_config_read_model WHERE code IN ('CURRENCY_EXCHANGE_RATE', 'CLIENT_CREDIT_CHECK', 'SWIFT_BIC_VALIDATION', 'KYC_AML_SCREENING', 'COUNTRY_RISK_ASSESSMENT', 'DOCUMENT_OCR_VALIDATION', 'CORE_BANKING_INTEGRATION', 'EMAIL_NOTIFICATION_SERVICE', 'SMS_NOTIFICATION_SERVICE', 'TRADE_FINANCE_PRICING', 'REGULATORY_REPORTING', 'CORRESPONDENT_BANK_SWIFT'));
DELETE FROM external_api_config_read_model WHERE code IN ('CURRENCY_EXCHANGE_RATE', 'CLIENT_CREDIT_CHECK', 'SWIFT_BIC_VALIDATION', 'KYC_AML_SCREENING', 'COUNTRY_RISK_ASSESSMENT', 'DOCUMENT_OCR_VALIDATION', 'CORE_BANKING_INTEGRATION', 'EMAIL_NOTIFICATION_SERVICE', 'SMS_NOTIFICATION_SERVICE', 'TRADE_FINANCE_PRICING', 'REGULATORY_REPORTING', 'CORRESPONDENT_BANK_SWIFT');

-- =====================================================
-- 1. CURRENCY EXCHANGE RATE API (Using exchangerate-api mock pattern)
-- =====================================================
INSERT INTO external_api_config_read_model (
    code, name, description, base_url, path, http_method, content_type,
    timeout_ms, retry_count, active, environment, created_at, created_by
) VALUES (
    'CURRENCY_EXCHANGE_RATE',
    'Currency Exchange Rate API',
    'Mock API for getting real-time currency exchange rates. Uses httpbin to simulate responses.',
    'https://httpbin.org',
    '/anything/exchange-rates',
    'GET',
    'application/json',
    10000, 3, TRUE, 'DEVELOPMENT',
    NOW(), 'system'
);

SET @exchange_api_id = LAST_INSERT_ID();

INSERT INTO external_api_auth_config (api_config_id, auth_type, api_key_name, api_key_value_encrypted, api_key_location, active)
VALUES (@exchange_api_id, 'API_KEY', 'X-Api-Key', 'mock-exchange-api-key-12345', 'HEADER', TRUE);

INSERT INTO external_api_request_template (api_config_id, name, description, query_params_template, is_default, active)
VALUES (@exchange_api_id, 'Get Exchange Rate', 'Get exchange rate between two currencies',
    '{"base": "{{baseCurrency}}", "target": "{{targetCurrency}}", "amount": "{{amount}}"}',
    TRUE, TRUE);

INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, success_field_path, transaction_id_path, extraction_mappings_json)
VALUES (@exchange_api_id, '200', 'JSON', 'args.base', 'headers.X-Request-Id',
    '{"rate": "json.rate", "convertedAmount": "json.convertedAmount", "timestamp": "json.timestamp"}');

-- =====================================================
-- 2. CLIENT CREDIT CHECK API
-- =====================================================
INSERT INTO external_api_config_read_model (
    code, name, description, base_url, path, http_method, content_type,
    timeout_ms, retry_count, active, environment, created_at, created_by
) VALUES (
    'CLIENT_CREDIT_CHECK',
    'Client Credit Check API',
    'Mock API for checking client credit score and available credit limit',
    'https://httpbin.org',
    '/anything/credit-check',
    'POST',
    'application/json',
    15000, 2, TRUE, 'DEVELOPMENT',
    NOW(), 'system'
);

SET @credit_api_id = LAST_INSERT_ID();

INSERT INTO external_api_auth_config (api_config_id, auth_type, username, password_encrypted, active)
VALUES (@credit_api_id, 'BASIC_AUTH', 'credit_service', 'mock-password-encrypted', TRUE);

INSERT INTO external_api_request_template (api_config_id, name, description, body_template, test_payload_example, is_default, active)
VALUES (@credit_api_id, 'Check Client Credit', 'Validate client credit status and limits',
    '{
        "clientId": "{{clientId}}",
        "clientName": "{{clientName}}",
        "taxId": "{{taxId}}",
        "requestedAmount": {{requestedAmount}},
        "currency": "{{currency}}",
        "productType": "{{productType}}"
    }',
    '{
        "clientId": "CLI-001",
        "clientName": "ABC Exports S.A.",
        "taxId": "1790012345001",
        "requestedAmount": 100000.00,
        "currency": "USD",
        "productType": "GUARANTEE"
    }',
    TRUE, TRUE);

INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, success_field_path, success_expected_value, error_message_path, extraction_mappings_json)
VALUES (@credit_api_id, '200', 'JSON', 'json.status', 'APPROVED', 'json.errorMessage',
    '{"creditScore": "json.creditScore", "availableLimit": "json.availableLimit", "riskLevel": "json.riskLevel", "approvalCode": "json.approvalCode"}');

-- =====================================================
-- 3. SWIFT/BIC VALIDATION API
-- =====================================================
INSERT INTO external_api_config_read_model (
    code, name, description, base_url, path, http_method, content_type,
    timeout_ms, retry_count, active, environment, created_at, created_by
) VALUES (
    'SWIFT_BIC_VALIDATION',
    'SWIFT/BIC Validation API',
    'Mock API for validating SWIFT/BIC codes and retrieving bank information',
    'https://httpbin.org',
    '/anything/swift-validate',
    'GET',
    'application/json',
    8000, 3, TRUE, 'DEVELOPMENT',
    NOW(), 'system'
);

SET @swift_api_id = LAST_INSERT_ID();

INSERT INTO external_api_auth_config (api_config_id, auth_type, active)
VALUES (@swift_api_id, 'NONE', TRUE);

INSERT INTO external_api_request_template (api_config_id, name, description, query_params_template, test_payload_example, is_default, active)
VALUES (@swift_api_id, 'Validate SWIFT Code', 'Validate a SWIFT/BIC code and get bank details',
    '{"swiftCode": "{{swiftCode}}"}',
    '{"swiftCode": "ABORECEGXXX"}',
    TRUE, TRUE);

INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, success_field_path, extraction_mappings_json)
VALUES (@swift_api_id, '200', 'JSON', 'args.swiftCode',
    '{"bankName": "json.bankName", "bankAddress": "json.bankAddress", "city": "json.city", "country": "json.country", "isValid": "json.isValid"}');

-- =====================================================
-- 4. KYC/AML SCREENING API
-- =====================================================
INSERT INTO external_api_config_read_model (
    code, name, description, base_url, path, http_method, content_type,
    timeout_ms, retry_count, active, environment, created_at, created_by
) VALUES (
    'KYC_AML_SCREENING',
    'KYC/AML Compliance Screening API',
    'Mock API for screening clients against sanctions and PEP lists',
    'https://httpbin.org',
    '/anything/kyc-screening',
    'POST',
    'application/json',
    20000, 2, TRUE, 'DEVELOPMENT',
    NOW(), 'system'
);

SET @kyc_api_id = LAST_INSERT_ID();

INSERT INTO external_api_auth_config (api_config_id, auth_type, static_token_encrypted, active)
VALUES (@kyc_api_id, 'BEARER_TOKEN', 'mock-bearer-token-kyc-aml-screening-12345', TRUE);

INSERT INTO external_api_request_template (api_config_id, name, description, body_template, test_payload_example, is_default, active)
VALUES (@kyc_api_id, 'Screen Entity', 'Screen a person or company against compliance databases',
    '{
        "entityType": "{{entityType}}",
        "name": "{{entityName}}",
        "country": "{{country}}",
        "taxId": "{{taxId}}",
        "dateOfBirth": "{{dateOfBirth}}",
        "screeningTypes": ["SANCTIONS", "PEP", "ADVERSE_MEDIA"]
    }',
    '{
        "entityType": "COMPANY",
        "name": "ABC Exports S.A.",
        "country": "EC",
        "taxId": "1790012345001",
        "dateOfBirth": null,
        "screeningTypes": ["SANCTIONS", "PEP", "ADVERSE_MEDIA"]
    }',
    TRUE, TRUE);

INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, success_field_path, success_expected_value, extraction_mappings_json)
VALUES (@kyc_api_id, '200', 'JSON', 'json.screeningResult', 'CLEAR',
    '{"matchCount": "json.matchCount", "riskScore": "json.riskScore", "screeningId": "json.screeningId", "alerts": "json.alerts"}');

-- =====================================================
-- 5. COUNTRY RISK ASSESSMENT API
-- =====================================================
INSERT INTO external_api_config_read_model (
    code, name, description, base_url, path, http_method, content_type,
    timeout_ms, retry_count, active, environment, created_at, created_by
) VALUES (
    'COUNTRY_RISK_ASSESSMENT',
    'Country Risk Assessment API',
    'Mock API for assessing country risk levels for trade finance',
    'https://httpbin.org',
    '/anything/country-risk',
    'GET',
    'application/json',
    5000, 3, TRUE, 'DEVELOPMENT',
    NOW(), 'system'
);

SET @country_risk_api_id = LAST_INSERT_ID();

INSERT INTO external_api_auth_config (api_config_id, auth_type, api_key_name, api_key_value_encrypted, api_key_location, active)
VALUES (@country_risk_api_id, 'API_KEY', 'Authorization', 'ApiKey mock-country-risk-key-67890', 'HEADER', TRUE);

INSERT INTO external_api_request_template (api_config_id, name, description, query_params_template, test_payload_example, is_default, active)
VALUES (@country_risk_api_id, 'Get Country Risk', 'Get risk assessment for a specific country',
    '{"countryCode": "{{countryCode}}", "assessmentType": "{{assessmentType}}"}',
    '{"countryCode": "US", "assessmentType": "TRADE_FINANCE"}',
    TRUE, TRUE);

INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, extraction_mappings_json)
VALUES (@country_risk_api_id, '200', 'JSON',
    '{"riskLevel": "json.riskLevel", "riskScore": "json.riskScore", "sanctioned": "json.sanctioned", "restrictions": "json.restrictions"}');

-- =====================================================
-- 6. DOCUMENT OCR/VALIDATION API
-- =====================================================
INSERT INTO external_api_config_read_model (
    code, name, description, base_url, path, http_method, content_type,
    timeout_ms, retry_count, active, environment, created_at, created_by
) VALUES (
    'DOCUMENT_OCR_VALIDATION',
    'Document OCR & Validation API',
    'Mock API for extracting and validating data from uploaded documents',
    'https://httpbin.org',
    '/anything/document-ocr',
    'POST',
    'application/json',
    30000, 2, TRUE, 'DEVELOPMENT',
    NOW(), 'system'
);

SET @doc_ocr_api_id = LAST_INSERT_ID();

INSERT INTO external_api_auth_config (api_config_id, auth_type, oauth2_token_url, oauth2_client_id, oauth2_client_secret_encrypted, oauth2_scope, active)
VALUES (@doc_ocr_api_id, 'OAUTH2_CLIENT_CREDENTIALS',
    'https://httpbin.org/anything/oauth/token',
    'doc-ocr-client-id',
    'mock-client-secret-encrypted',
    'document:read document:process',
    TRUE);

INSERT INTO external_api_request_template (api_config_id, name, description, body_template, test_payload_example, is_default, active)
VALUES (@doc_ocr_api_id, 'Process Document', 'Extract and validate document data',
    '{
        "documentId": "{{documentId}}",
        "documentType": "{{documentType}}",
        "documentUrl": "{{documentUrl}}",
        "extractFields": {{extractFields}},
        "validateAgainst": "{{validateAgainst}}"
    }',
    '{
        "documentId": "DOC-12345",
        "documentType": "INVOICE",
        "documentUrl": "https://storage.example.com/docs/invoice-001.pdf",
        "extractFields": ["invoiceNumber", "amount", "currency", "issueDate", "dueDate"],
        "validateAgainst": "REQUEST_DATA"
    }',
    TRUE, TRUE);

INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, success_field_path, extraction_mappings_json)
VALUES (@doc_ocr_api_id, '200,202', 'JSON', 'json.status',
    '{"extractedData": "json.extractedData", "validationResult": "json.validationResult", "confidence": "json.confidence", "discrepancies": "json.discrepancies"}');

-- =====================================================
-- 7. CORE BANKING INTEGRATION API
-- =====================================================
INSERT INTO external_api_config_read_model (
    code, name, description, base_url, path, http_method, content_type,
    timeout_ms, retry_count, active, environment, created_at, created_by
) VALUES (
    'CORE_BANKING_INTEGRATION',
    'Core Banking System API',
    'Mock API for core banking integration - account validation, balance checks, transactions',
    'https://httpbin.org',
    '/anything/core-banking',
    'POST',
    'application/json',
    15000, 3, TRUE, 'DEVELOPMENT',
    NOW(), 'system'
);

SET @core_banking_api_id = LAST_INSERT_ID();

INSERT INTO external_api_auth_config (api_config_id, auth_type, jwt_secret_encrypted, jwt_algorithm, jwt_issuer, jwt_audience, jwt_expiration_seconds, active)
VALUES (@core_banking_api_id, 'JWT',
    'mock-jwt-secret-key-for-core-banking',
    'HS256',
    'globalcmx-trade-finance',
    'core-banking-system',
    300,
    TRUE);

INSERT INTO external_api_request_template (api_config_id, name, description, body_template, test_payload_example, is_default, active)
VALUES
(@core_banking_api_id, 'Validate Account', 'Validate client bank account',
    '{
        "operation": "VALIDATE_ACCOUNT",
        "accountNumber": "{{accountNumber}}",
        "accountType": "{{accountType}}",
        "clientId": "{{clientId}}"
    }',
    '{
        "operation": "VALIDATE_ACCOUNT",
        "accountNumber": "1234567890",
        "accountType": "CHECKING",
        "clientId": "CLI-001"
    }',
    TRUE, TRUE),
(@core_banking_api_id, 'Check Balance', 'Check account balance',
    '{
        "operation": "CHECK_BALANCE",
        "accountNumber": "{{accountNumber}}",
        "currency": "{{currency}}"
    }',
    '{
        "operation": "CHECK_BALANCE",
        "accountNumber": "1234567890",
        "currency": "USD"
    }',
    FALSE, TRUE),
(@core_banking_api_id, 'Create Hold', 'Create balance hold for pending operation',
    '{
        "operation": "CREATE_HOLD",
        "accountNumber": "{{accountNumber}}",
        "amount": {{amount}},
        "currency": "{{currency}}",
        "referenceNumber": "{{referenceNumber}}",
        "expirationDate": "{{expirationDate}}"
    }',
    '{
        "operation": "CREATE_HOLD",
        "accountNumber": "1234567890",
        "amount": 50000.00,
        "currency": "USD",
        "referenceNumber": "REQ-2024-000001",
        "expirationDate": "2024-12-31"
    }',
    FALSE, TRUE);

INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, success_field_path, success_expected_value, transaction_id_path, extraction_mappings_json)
VALUES (@core_banking_api_id, '200', 'JSON', 'json.status', 'SUCCESS', 'json.transactionId',
    '{"accountValid": "json.accountValid", "availableBalance": "json.availableBalance", "holdId": "json.holdId", "message": "json.message"}');

-- =====================================================
-- 8. EMAIL NOTIFICATION SERVICE API
-- =====================================================
INSERT INTO external_api_config_read_model (
    code, name, description, base_url, path, http_method, content_type,
    timeout_ms, retry_count, active, environment, created_at, created_by
) VALUES (
    'EMAIL_NOTIFICATION_SERVICE',
    'Email Notification Service',
    'Mock API for sending email notifications to clients and internal users',
    'https://httpbin.org',
    '/anything/send-email',
    'POST',
    'application/json',
    10000, 3, TRUE, 'DEVELOPMENT',
    NOW(), 'system'
);

SET @email_api_id = LAST_INSERT_ID();

INSERT INTO external_api_auth_config (api_config_id, auth_type, api_key_name, api_key_value_encrypted, api_key_location, active)
VALUES (@email_api_id, 'API_KEY', 'X-Mailgun-Api-Key', 'mock-mailgun-api-key-12345', 'HEADER', TRUE);

INSERT INTO external_api_request_template (api_config_id, name, description, body_template, test_payload_example, is_default, active)
VALUES (@email_api_id, 'Send Email', 'Send transactional email',
    '{
        "from": "{{senderEmail}}",
        "to": "{{recipientEmail}}",
        "cc": {{ccEmails}},
        "subject": "{{subject}}",
        "templateId": "{{templateId}}",
        "templateVariables": {
            "clientName": "{{clientName}}",
            "requestNumber": "{{requestNumber}}",
            "productType": "{{productType}}",
            "status": "{{status}}",
            "amount": "{{amount}}",
            "actionUrl": "{{actionUrl}}"
        }
    }',
    '{
        "from": "noreply@globalcmx.com",
        "to": "maria.garcia@abcexports.com",
        "cc": [],
        "subject": "Your request REQ-2024-000001 has been approved",
        "templateId": "REQUEST_APPROVED",
        "templateVariables": {
            "clientName": "ABC Exports S.A.",
            "requestNumber": "REQ-2024-000001",
            "productType": "Guarantee",
            "status": "Approved",
            "amount": "USD 50,000.00",
            "actionUrl": "https://portal.globalcmx.com/requests/REQ-2024-000001"
        }
    }',
    TRUE, TRUE);

INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, success_field_path, transaction_id_path)
VALUES (@email_api_id, '200,202', 'JSON', 'json.status', 'json.messageId');

-- =====================================================
-- 9. SMS NOTIFICATION SERVICE API
-- =====================================================
INSERT INTO external_api_config_read_model (
    code, name, description, base_url, path, http_method, content_type,
    timeout_ms, retry_count, active, environment, created_at, created_by
) VALUES (
    'SMS_NOTIFICATION_SERVICE',
    'SMS Notification Service',
    'Mock API for sending SMS notifications to clients',
    'https://httpbin.org',
    '/anything/send-sms',
    'POST',
    'application/json',
    8000, 2, TRUE, 'DEVELOPMENT',
    NOW(), 'system'
);

SET @sms_api_id = LAST_INSERT_ID();

INSERT INTO external_api_auth_config (api_config_id, auth_type, username, password_encrypted, active)
VALUES (@sms_api_id, 'BASIC_AUTH', 'sms_service_account', 'mock-sms-password', TRUE);

INSERT INTO external_api_request_template (api_config_id, name, description, body_template, test_payload_example, is_default, active)
VALUES (@sms_api_id, 'Send SMS', 'Send SMS notification',
    '{
        "to": "{{phoneNumber}}",
        "message": "{{message}}",
        "senderId": "GLOBALCMX"
    }',
    '{
        "to": "+593987654321",
        "message": "Your request REQ-2024-000001 has been approved. Check your email for details.",
        "senderId": "GLOBALCMX"
    }',
    TRUE, TRUE);

INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, transaction_id_path)
VALUES (@sms_api_id, '200,202', 'JSON', 'json.messageId');

-- =====================================================
-- 10. TRADE FINANCE PRICING API
-- =====================================================
INSERT INTO external_api_config_read_model (
    code, name, description, base_url, path, http_method, content_type,
    timeout_ms, retry_count, active, environment, created_at, created_by
) VALUES (
    'TRADE_FINANCE_PRICING',
    'Trade Finance Pricing Engine',
    'Mock API for calculating fees and commissions for trade finance products',
    'https://httpbin.org',
    '/anything/pricing',
    'POST',
    'application/json',
    10000, 2, TRUE, 'DEVELOPMENT',
    NOW(), 'system'
);

SET @pricing_api_id = LAST_INSERT_ID();

INSERT INTO external_api_auth_config (api_config_id, auth_type, active)
VALUES (@pricing_api_id, 'NONE', TRUE);

INSERT INTO external_api_request_template (api_config_id, name, description, body_template, test_payload_example, is_default, active)
VALUES (@pricing_api_id, 'Calculate Pricing', 'Calculate fees and commissions',
    '{
        "productType": "{{productType}}",
        "subType": "{{subType}}",
        "amount": {{amount}},
        "currency": "{{currency}}",
        "tenor": {{tenor}},
        "tenorUnit": "{{tenorUnit}}",
        "clientSegment": "{{clientSegment}}",
        "clientRiskRating": "{{clientRiskRating}}",
        "countryRisk": "{{countryRisk}}"
    }',
    '{
        "productType": "GUARANTEE",
        "subType": "BID_BOND",
        "amount": 100000.00,
        "currency": "USD",
        "tenor": 90,
        "tenorUnit": "DAYS",
        "clientSegment": "CORPORATE",
        "clientRiskRating": "A",
        "countryRisk": "LOW"
    }',
    TRUE, TRUE);

INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, extraction_mappings_json)
VALUES (@pricing_api_id, '200', 'JSON',
    '{"issuanceFee": "json.issuanceFee", "commissionRate": "json.commissionRate", "commissionAmount": "json.commissionAmount", "swiftFee": "json.swiftFee", "totalFees": "json.totalFees", "effectiveRate": "json.effectiveRate"}');

-- =====================================================
-- 11. REGULATORY REPORTING API
-- =====================================================
INSERT INTO external_api_config_read_model (
    code, name, description, base_url, path, http_method, content_type,
    timeout_ms, retry_count, active, environment, created_at, created_by
) VALUES (
    'REGULATORY_REPORTING',
    'Regulatory Reporting API',
    'Mock API for submitting reports to central bank and regulatory bodies',
    'https://httpbin.org',
    '/anything/regulatory-report',
    'POST',
    'application/json',
    30000, 3, TRUE, 'DEVELOPMENT',
    NOW(), 'system'
);

SET @regulatory_api_id = LAST_INSERT_ID();

INSERT INTO external_api_auth_config (api_config_id, auth_type, mtls_cert_path, mtls_key_path, mtls_ca_cert_path, active)
VALUES (@regulatory_api_id, 'MTLS',
    '/certs/regulatory/client.crt',
    '/certs/regulatory/client.key',
    '/certs/regulatory/ca.crt',
    TRUE);

INSERT INTO external_api_request_template (api_config_id, name, description, body_template, test_payload_example, is_default, active)
VALUES (@regulatory_api_id, 'Submit Report', 'Submit regulatory report',
    '{
        "reportType": "{{reportType}}",
        "reportingPeriod": "{{reportingPeriod}}",
        "institutionCode": "{{institutionCode}}",
        "transactions": {{transactionsJson}}
    }',
    '{
        "reportType": "TRADE_FINANCE_MONTHLY",
        "reportingPeriod": "2024-01",
        "institutionCode": "BANK001",
        "transactions": [{"id": "TXN001", "type": "LC_IMPORT", "amount": 100000, "currency": "USD"}]
    }',
    TRUE, TRUE);

INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, success_field_path, success_expected_value, transaction_id_path)
VALUES (@regulatory_api_id, '200,202', 'JSON', 'json.status', 'ACCEPTED', 'json.reportId');

-- =====================================================
-- 12. CORRESPONDENT BANK API (SWIFT NETWORK SIMULATION)
-- =====================================================
INSERT INTO external_api_config_read_model (
    code, name, description, base_url, path, http_method, content_type,
    timeout_ms, retry_count, active, environment, created_at, created_by
) VALUES (
    'CORRESPONDENT_BANK_SWIFT',
    'Correspondent Bank SWIFT API',
    'Mock API for simulating SWIFT message exchange with correspondent banks',
    'https://httpbin.org',
    '/anything/swift-message',
    'POST',
    'application/json',
    25000, 2, TRUE, 'DEVELOPMENT',
    NOW(), 'system'
);

SET @swift_msg_api_id = LAST_INSERT_ID();

INSERT INTO external_api_auth_config (api_config_id, auth_type, custom_headers_json, active)
VALUES (@swift_msg_api_id, 'CUSTOM_HEADER',
    '{"X-Swift-Service": "GLOBALCMX", "X-Swift-Network": "FIN", "X-Swift-Priority": "NORMAL"}',
    TRUE);

INSERT INTO external_api_request_template (api_config_id, name, description, body_template, test_payload_example, is_default, active)
VALUES
(@swift_msg_api_id, 'Send MT700', 'Send LC issuance message (MT700)',
    '{
        "messageType": "MT700",
        "senderBIC": "{{senderBIC}}",
        "receiverBIC": "{{receiverBIC}}",
        "lcNumber": "{{lcNumber}}",
        "amount": {{amount}},
        "currency": "{{currency}}",
        "applicant": "{{applicant}}",
        "beneficiary": "{{beneficiary}}",
        "expiryDate": "{{expiryDate}}",
        "shipmentDate": "{{shipmentDate}}",
        "goodsDescription": "{{goodsDescription}}"
    }',
    '{
        "messageType": "MT700",
        "senderBIC": "GLOBALCMXEC",
        "receiverBIC": "CHASUS33XXX",
        "lcNumber": "LC-2024-000001",
        "amount": 250000.00,
        "currency": "USD",
        "applicant": "ABC Exports S.A.",
        "beneficiary": "XYZ Suppliers Inc.",
        "expiryDate": "2024-06-30",
        "shipmentDate": "2024-05-31",
        "goodsDescription": "Electronic components as per proforma invoice PI-2024-001"
    }',
    TRUE, TRUE),
(@swift_msg_api_id, 'Send MT760', 'Send Guarantee issuance message (MT760)',
    '{
        "messageType": "MT760",
        "senderBIC": "{{senderBIC}}",
        "receiverBIC": "{{receiverBIC}}",
        "guaranteeNumber": "{{guaranteeNumber}}",
        "guaranteeType": "{{guaranteeType}}",
        "amount": {{amount}},
        "currency": "{{currency}}",
        "applicant": "{{applicant}}",
        "beneficiary": "{{beneficiary}}",
        "expiryDate": "{{expiryDate}}",
        "guaranteeText": "{{guaranteeText}}"
    }',
    '{
        "messageType": "MT760",
        "senderBIC": "GLOBALCMXEC",
        "receiverBIC": "DEUTDEFFXXX",
        "guaranteeNumber": "GAR-2024-000001",
        "guaranteeType": "PERFORMANCE_BOND",
        "amount": 50000.00,
        "currency": "USD",
        "applicant": "ABC Exports S.A.",
        "beneficiary": "German Buyer GmbH",
        "expiryDate": "2024-12-31",
        "guaranteeText": "We hereby issue our irrevocable guarantee..."
    }',
    FALSE, TRUE);

INSERT INTO external_api_response_config (api_config_id, success_codes, response_type, success_field_path, success_expected_value, transaction_id_path, extraction_mappings_json)
VALUES (@swift_msg_api_id, '200,202', 'JSON', 'json.status', 'SENT', 'json.swiftReference',
    '{"ackStatus": "json.ackStatus", "deliveryStatus": "json.deliveryStatus", "uetr": "json.uetr"}');

-- =====================================================
-- MOCK RESPONSE SIMULATOR TABLE
-- This table stores pre-configured mock responses for testing
-- =====================================================
CREATE TABLE IF NOT EXISTS mock_api_response_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_code VARCHAR(50) NOT NULL,
    scenario_name VARCHAR(100) NOT NULL,
    scenario_description VARCHAR(500),

    -- Request Matching
    match_field VARCHAR(100),
    match_value VARCHAR(255),
    match_operator VARCHAR(20) DEFAULT 'EQUALS',

    -- Mock Response
    response_status_code INT DEFAULT 200,
    response_body TEXT NOT NULL,
    response_delay_ms INT DEFAULT 0,

    -- Probability (for random failures simulation)
    probability_percent INT DEFAULT 100,

    is_default BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_mock_response_api (api_code),
    INDEX idx_mock_response_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert mock responses for testing scenarios
INSERT INTO mock_api_response_config (api_code, scenario_name, scenario_description, match_field, match_value, response_status_code, response_body, is_default) VALUES

-- Currency Exchange Rate - Success
('CURRENCY_EXCHANGE_RATE', 'Success Response', 'Standard successful exchange rate response', NULL, NULL, 200,
'{
    "success": true,
    "base": "USD",
    "target": "EUR",
    "rate": 0.92,
    "convertedAmount": 92000.00,
    "timestamp": "2024-01-15T10:30:00Z"
}', TRUE),

-- Client Credit Check - Approved
('CLIENT_CREDIT_CHECK', 'Credit Approved', 'Client credit check passes', 'clientId', 'CLI-001', 200,
'{
    "status": "APPROVED",
    "clientId": "CLI-001",
    "creditScore": 750,
    "availableLimit": 500000.00,
    "currency": "USD",
    "riskLevel": "LOW",
    "approvalCode": "CRED-2024-12345",
    "validUntil": "2024-12-31"
}', TRUE),

-- Client Credit Check - Rejected
('CLIENT_CREDIT_CHECK', 'Credit Rejected', 'Client credit check fails', 'clientId', 'CLI-RISKY', 200,
'{
    "status": "REJECTED",
    "clientId": "CLI-RISKY",
    "creditScore": 450,
    "availableLimit": 0,
    "currency": "USD",
    "riskLevel": "HIGH",
    "errorMessage": "Credit limit exceeded. Current exposure exceeds maximum allowed.",
    "rejectionCode": "CRED-REJ-001"
}', FALSE),

-- Client Credit Check - Pending Review
('CLIENT_CREDIT_CHECK', 'Credit Pending', 'Credit check requires manual review', 'requestedAmount', '1000000', 200,
'{
    "status": "PENDING_REVIEW",
    "clientId": "CLI-001",
    "creditScore": 680,
    "availableLimit": 200000.00,
    "currency": "USD",
    "riskLevel": "MEDIUM",
    "message": "Amount exceeds automatic approval threshold. Manual review required.",
    "reviewCode": "CRED-REV-2024-001"
}', FALSE),

-- SWIFT Validation - Valid Code
('SWIFT_BIC_VALIDATION', 'Valid SWIFT Code', 'SWIFT code is valid', NULL, NULL, 200,
'{
    "isValid": true,
    "swiftCode": "CHASUS33XXX",
    "bankName": "JPMorgan Chase Bank, N.A.",
    "bankAddress": "383 Madison Avenue",
    "city": "New York",
    "country": "United States",
    "countryCode": "US",
    "branchCode": "XXX"
}', TRUE),

-- SWIFT Validation - Invalid Code
('SWIFT_BIC_VALIDATION', 'Invalid SWIFT Code', 'SWIFT code is invalid', 'swiftCode', 'INVALID123', 200,
'{
    "isValid": false,
    "swiftCode": "INVALID123",
    "errorMessage": "Invalid SWIFT/BIC code format",
    "suggestion": "SWIFT codes must be 8 or 11 characters"
}', FALSE),

-- KYC/AML Screening - Clear
('KYC_AML_SCREENING', 'Screening Clear', 'No matches found', NULL, NULL, 200,
'{
    "screeningResult": "CLEAR",
    "matchCount": 0,
    "riskScore": 15,
    "screeningId": "SCR-2024-12345",
    "completedAt": "2024-01-15T10:30:00Z",
    "alerts": [],
    "nextReviewDate": "2025-01-15"
}', TRUE),

-- KYC/AML Screening - Potential Match
('KYC_AML_SCREENING', 'Potential Match', 'Potential match found', 'name', 'Suspicious Company', 200,
'{
    "screeningResult": "POTENTIAL_MATCH",
    "matchCount": 2,
    "riskScore": 75,
    "screeningId": "SCR-2024-12346",
    "completedAt": "2024-01-15T10:30:00Z",
    "alerts": [
        {"type": "SANCTIONS", "source": "OFAC", "matchScore": 85, "details": "Name similarity with SDN list entry"},
        {"type": "ADVERSE_MEDIA", "source": "NEWS", "matchScore": 60, "details": "Mentioned in corruption investigation"}
    ],
    "requiresManualReview": true
}', FALSE),

-- Country Risk - Low Risk
('COUNTRY_RISK_ASSESSMENT', 'Low Risk Country', 'Country has low risk', 'countryCode', 'US', 200,
'{
    "countryCode": "US",
    "countryName": "United States",
    "riskLevel": "LOW",
    "riskScore": 15,
    "sanctioned": false,
    "restrictions": [],
    "lastUpdated": "2024-01-01"
}', TRUE),

-- Country Risk - High Risk
('COUNTRY_RISK_ASSESSMENT', 'High Risk Country', 'Country has high risk', 'countryCode', 'IR', 200,
'{
    "countryCode": "IR",
    "countryName": "Iran",
    "riskLevel": "PROHIBITED",
    "riskScore": 100,
    "sanctioned": true,
    "restrictions": ["FULL_EMBARGO", "NO_TRADE_FINANCE", "OFAC_SDN"],
    "lastUpdated": "2024-01-01"
}', FALSE),

-- Core Banking - Account Valid
('CORE_BANKING_INTEGRATION', 'Account Valid', 'Account validation success', 'operation', 'VALIDATE_ACCOUNT', 200,
'{
    "status": "SUCCESS",
    "transactionId": "CBS-TXN-2024-12345",
    "accountValid": true,
    "accountNumber": "1234567890",
    "accountType": "CHECKING",
    "accountStatus": "ACTIVE",
    "accountHolderName": "ABC Exports S.A.",
    "availableBalance": 150000.00,
    "currency": "USD"
}', TRUE),

-- Core Banking - Create Hold Success
('CORE_BANKING_INTEGRATION', 'Hold Created', 'Balance hold created successfully', 'operation', 'CREATE_HOLD', 200,
'{
    "status": "SUCCESS",
    "transactionId": "CBS-TXN-2024-12346",
    "holdId": "HOLD-2024-00001",
    "accountNumber": "1234567890",
    "holdAmount": 50000.00,
    "currency": "USD",
    "expirationDate": "2024-12-31",
    "message": "Balance hold created successfully"
}', FALSE),

-- Trade Finance Pricing
('TRADE_FINANCE_PRICING', 'Standard Pricing', 'Standard pricing calculation', NULL, NULL, 200,
'{
    "productType": "GUARANTEE",
    "subType": "BID_BOND",
    "amount": 100000.00,
    "currency": "USD",
    "tenor": 90,
    "tenorUnit": "DAYS",
    "issuanceFee": 100.00,
    "commissionRate": 0.015,
    "commissionAmount": 375.00,
    "swiftFee": 35.00,
    "totalFees": 510.00,
    "effectiveRate": 0.0051,
    "breakdown": {
        "quarterlyCommission": 375.00,
        "annualizedRate": 0.06
    }
}', TRUE),

-- Email Notification
('EMAIL_NOTIFICATION_SERVICE', 'Email Sent', 'Email sent successfully', NULL, NULL, 200,
'{
    "status": "SENT",
    "messageId": "MSG-2024-12345-ABCDE",
    "to": "maria.garcia@abcexports.com",
    "subject": "Your request has been approved",
    "sentAt": "2024-01-15T10:30:00Z"
}', TRUE),

-- SMS Notification
('SMS_NOTIFICATION_SERVICE', 'SMS Sent', 'SMS sent successfully', NULL, NULL, 200,
'{
    "status": "SENT",
    "messageId": "SMS-2024-12345",
    "to": "+593987654321",
    "sentAt": "2024-01-15T10:30:00Z"
}', TRUE),

-- SWIFT Message Sent
('CORRESPONDENT_BANK_SWIFT', 'MT700 Sent', 'LC issuance message sent', 'messageType', 'MT700', 200,
'{
    "status": "SENT",
    "messageType": "MT700",
    "swiftReference": "SWIFT-2024-700-12345",
    "uetr": "97ed4827-7b6f-4491-a06f-b548d5a7512d",
    "ackStatus": "ACK",
    "deliveryStatus": "DELIVERED",
    "sentAt": "2024-01-15T10:30:00Z",
    "receiverBIC": "CHASUS33XXX"
}', TRUE),

-- SWIFT Message - MT760 Sent
('CORRESPONDENT_BANK_SWIFT', 'MT760 Sent', 'Guarantee message sent', 'messageType', 'MT760', 200,
'{
    "status": "SENT",
    "messageType": "MT760",
    "swiftReference": "SWIFT-2024-760-12345",
    "uetr": "87ed4827-7b6f-4491-a06f-b548d5a7512e",
    "ackStatus": "ACK",
    "deliveryStatus": "DELIVERED",
    "sentAt": "2024-01-15T10:30:00Z",
    "receiverBIC": "DEUTDEFFXXX"
}', FALSE);

-- =====================================================
-- EVENT FLOW INTEGRATION - Link APIs to request events
-- =====================================================
CREATE TABLE IF NOT EXISTS client_request_api_trigger (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    api_code VARCHAR(50) NOT NULL,
    template_name VARCHAR(100),

    execution_order INT DEFAULT 1,
    is_blocking BOOLEAN DEFAULT FALSE,
    retry_on_failure BOOLEAN DEFAULT TRUE,

    -- Conditions
    condition_expression TEXT,

    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_trigger_event (event_type),
    INDEX idx_trigger_api (api_code),
    UNIQUE KEY uk_trigger_event_api_template (event_type, api_code, template_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configure API triggers for client request events
INSERT INTO client_request_api_trigger (event_type, api_code, template_name, execution_order, is_blocking, condition_expression) VALUES

-- When request is submitted
('CLIENT_REQUEST_SUBMITTED', 'CLIENT_CREDIT_CHECK', 'Check Client Credit', 1, TRUE, NULL),
('CLIENT_REQUEST_SUBMITTED', 'KYC_AML_SCREENING', 'Screen Entity', 2, TRUE, 'amount >= 10000'),

-- When request is assigned
('CLIENT_REQUEST_ASSIGNED', 'EMAIL_NOTIFICATION_SERVICE', 'Send Email', 1, FALSE, NULL),

-- When request is approved
('CLIENT_REQUEST_APPROVED', 'CORE_BANKING_INTEGRATION', 'Create Hold', 1, TRUE, NULL),
('CLIENT_REQUEST_APPROVED', 'TRADE_FINANCE_PRICING', 'Calculate Pricing', 2, FALSE, NULL),
('CLIENT_REQUEST_APPROVED', 'EMAIL_NOTIFICATION_SERVICE', 'Send Email', 3, FALSE, NULL),
('CLIENT_REQUEST_APPROVED', 'SMS_NOTIFICATION_SERVICE', 'Send SMS', 4, FALSE, 'client.smsEnabled = true'),

-- When request is rejected
('CLIENT_REQUEST_REJECTED', 'EMAIL_NOTIFICATION_SERVICE', 'Send Email', 1, FALSE, NULL),

-- When operation is created from approved request
('CLIENT_OPERATION_CREATED', 'CORRESPONDENT_BANK_SWIFT', 'Send MT700', 1, FALSE, 'productType = LC_IMPORT'),
('CLIENT_OPERATION_CREATED', 'CORRESPONDENT_BANK_SWIFT', 'Send MT760', 1, FALSE, 'productType = GUARANTEE'),
('CLIENT_OPERATION_CREATED', 'REGULATORY_REPORTING', 'Submit Report', 2, FALSE, NULL);

-- =====================================================
-- Add test payload column to request template (if not exists)
-- =====================================================
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'external_api_request_template'
    AND COLUMN_NAME = 'test_payload_example');

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE external_api_request_template ADD COLUMN test_payload_example TEXT AFTER body_template',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- API Configuration Categories for UI organization
-- =====================================================
CREATE TABLE IF NOT EXISTS external_api_category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_es VARCHAR(100),
    description VARCHAR(500),
    description_es VARCHAR(500),
    icon VARCHAR(50),
    color VARCHAR(20),
    display_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO external_api_category (code, name, name_es, description, description_es, icon, color, display_order) VALUES
('COMPLIANCE', 'Compliance & Risk', 'Cumplimiento y Riesgo', 'KYC, AML, sanctions screening, and country risk', 'KYC, AML, listas de sanciones y riesgo país', 'Shield', 'purple', 1),
('BANKING', 'Core Banking', 'Core Bancario', 'Account validation, balances, and transactions', 'Validación de cuentas, saldos y transacciones', 'Building', 'blue', 2),
('MESSAGING', 'SWIFT Messaging', 'Mensajería SWIFT', 'SWIFT message exchange with correspondent banks', 'Intercambio de mensajes SWIFT con bancos corresponsales', 'Mail', 'green', 3),
('NOTIFICATIONS', 'Notifications', 'Notificaciones', 'Email and SMS notification services', 'Servicios de notificación por email y SMS', 'Bell', 'yellow', 4),
('PRICING', 'Pricing & Rates', 'Precios y Tasas', 'Exchange rates and fee calculations', 'Tipos de cambio y cálculo de comisiones', 'Calculator', 'orange', 5),
('DOCUMENTS', 'Document Services', 'Servicios de Documentos', 'OCR, validation, and document processing', 'OCR, validación y procesamiento de documentos', 'FileText', 'teal', 6),
('REGULATORY', 'Regulatory', 'Regulatorio', 'Reports to central bank and regulatory bodies', 'Reportes a banco central y entes reguladores', 'Landmark', 'red', 7);

-- Add category to API config (if not exists)
SET @column_exists2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'external_api_config_read_model'
    AND COLUMN_NAME = 'category_code');

SET @sql2 = IF(@column_exists2 = 0,
    'ALTER TABLE external_api_config_read_model ADD COLUMN category_code VARCHAR(50) AFTER environment',
    'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Assign categories to APIs
UPDATE external_api_config_read_model SET category_code = 'PRICING' WHERE code = 'CURRENCY_EXCHANGE_RATE';
UPDATE external_api_config_read_model SET category_code = 'COMPLIANCE' WHERE code = 'CLIENT_CREDIT_CHECK';
UPDATE external_api_config_read_model SET category_code = 'MESSAGING' WHERE code = 'SWIFT_BIC_VALIDATION';
UPDATE external_api_config_read_model SET category_code = 'COMPLIANCE' WHERE code = 'KYC_AML_SCREENING';
UPDATE external_api_config_read_model SET category_code = 'COMPLIANCE' WHERE code = 'COUNTRY_RISK_ASSESSMENT';
UPDATE external_api_config_read_model SET category_code = 'DOCUMENTS' WHERE code = 'DOCUMENT_OCR_VALIDATION';
UPDATE external_api_config_read_model SET category_code = 'BANKING' WHERE code = 'CORE_BANKING_INTEGRATION';
UPDATE external_api_config_read_model SET category_code = 'NOTIFICATIONS' WHERE code = 'EMAIL_NOTIFICATION_SERVICE';
UPDATE external_api_config_read_model SET category_code = 'NOTIFICATIONS' WHERE code = 'SMS_NOTIFICATION_SERVICE';
UPDATE external_api_config_read_model SET category_code = 'PRICING' WHERE code = 'TRADE_FINANCE_PRICING';
UPDATE external_api_config_read_model SET category_code = 'REGULATORY' WHERE code = 'REGULATORY_REPORTING';
UPDATE external_api_config_read_model SET category_code = 'MESSAGING' WHERE code = 'CORRESPONDENT_BANK_SWIFT';

-- =====================================================
-- Permissions for Mock API Testing
-- =====================================================
INSERT INTO permission_read_model (code, name, description, module, created_at) VALUES
    ('MOCK_API_VIEW', 'View Mock API Config', 'View mock API response configurations', 'API_CONFIG', NOW()),
    ('MOCK_API_EDIT', 'Edit Mock API Config', 'Create and edit mock API responses', 'API_CONFIG', NOW()),
    ('MOCK_API_TEST', 'Test Mock APIs', 'Execute mock API tests', 'API_CONFIG', NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Assign mock API permissions to admin
INSERT INTO role_permission_read_model (role_id, permission_code)
SELECT r.id, p.code
FROM role_read_model r, permission_read_model p
WHERE r.name = 'ROLE_ADMIN' AND p.code IN ('MOCK_API_VIEW', 'MOCK_API_EDIT', 'MOCK_API_TEST')
ON DUPLICATE KEY UPDATE permission_code = VALUES(permission_code);
