-- =============================================================================
-- Migration V129: Add test payload example field to API configuration
-- Stores example test data for each API configuration
-- =============================================================================

-- Add test_payload_example column to request template table
ALTER TABLE external_api_request_template
ADD COLUMN test_payload_example TEXT AFTER body_template;

-- Update existing configurations with example test data

-- JSONPlaceholder Test API
UPDATE external_api_request_template rt
SET rt.test_payload_example = '{
  "title": "Test Post from GlobalCMX",
  "body": "This is a test post to verify API connectivity",
  "userId": 1
}'
WHERE rt.api_config_id = (SELECT id FROM external_api_config_read_model WHERE code = 'JSONPLACEHOLDER_TEST');

-- HTTPBin Echo Service
UPDATE external_api_request_template rt
SET rt.test_payload_example = '{
  "message": "Hello from GlobalCMX",
  "timestamp": "2025-01-14T12:00:00Z",
  "data": {
    "operationId": "OP-12345",
    "type": "LC_IMPORT",
    "amount": 100000.00
  }
}'
WHERE rt.api_config_id = (SELECT id FROM external_api_config_read_model WHERE code = 'HTTPBIN_ECHO');

-- SendGrid Email
UPDATE external_api_request_template rt
SET rt.test_payload_example = '{
  "personalizations": [
    {
      "to": [{"email": "test@example.com", "name": "Test User"}],
      "subject": "Test Email from GlobalCMX"
    }
  ],
  "from": {"email": "noreply@globalcmx.com", "name": "GlobalCMX"},
  "content": [{"type": "text/html", "value": "<h1>Test</h1><p>This is a test email.</p>"}]
}'
WHERE rt.api_config_id = (SELECT id FROM external_api_config_read_model WHERE code = 'SENDGRID_EMAIL');

-- Core Banking Validation
UPDATE external_api_request_template rt
SET rt.test_payload_example = '{
  "operationId": "OP-TEST-001",
  "operationType": "LC_IMPORT",
  "reference": "LC/2025/00001",
  "amount": 50000.00,
  "currency": "USD",
  "applicant": {"id": "CLI-001", "name": "Test Company S.A."},
  "beneficiary": {"id": "BEN-001", "name": "International Supplier Inc."},
  "requestedBy": "test.user@example.com",
  "requestedAt": "2025-01-14T12:00:00Z"
}'
WHERE rt.api_config_id = (SELECT id FROM external_api_config_read_model WHERE code = 'CORE_BANKING_VALIDATION');

-- Mailgun Email
UPDATE external_api_request_template rt
SET rt.test_payload_example = 'from=noreply@yourdomain.com&to=test@example.com&subject=Test Email from GlobalCMX&html=<h1>Test</h1><p>This is a test email via Mailgun.</p>'
WHERE rt.api_config_id = (SELECT id FROM external_api_config_read_model WHERE code = 'MAILGUN_EMAIL');

-- Resend Email
UPDATE external_api_request_template rt
SET rt.test_payload_example = '{
  "from": "GlobalCMX <noreply@yourdomain.com>",
  "to": ["test@example.com"],
  "subject": "Test Email from GlobalCMX via Resend",
  "html": "<h1>Test Email</h1><p>This is a test email sent via Resend.</p>"
}'
WHERE rt.api_config_id = (SELECT id FROM external_api_config_read_model WHERE code = 'RESEND_EMAIL');

-- Mailtrap Sandbox
UPDATE external_api_request_template rt
SET rt.test_payload_example = '{
  "from": {"email": "noreply@test.com", "name": "GlobalCMX Test"},
  "to": [{"email": "recipient@test.com", "name": "Test User"}],
  "subject": "Test Email - Mailtrap Sandbox",
  "html": "<h1>Test</h1><p>This email will appear in your Mailtrap inbox.</p>",
  "category": "GlobalCMX Test"
}'
WHERE rt.api_config_id = (SELECT id FROM external_api_config_read_model WHERE code = 'MAILTRAP_SANDBOX');
