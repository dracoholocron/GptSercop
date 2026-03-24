-- =============================================================================
-- V94: Create API Access Log table for monitoring
-- =============================================================================
-- This table stores all API access attempts for security monitoring and analytics.
-- Used by the security dashboard to track who accesses which APIs.

CREATE TABLE IF NOT EXISTS api_access_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    url_pattern VARCHAR(500) NOT NULL,
    request_uri VARCHAR(1000) NOT NULL,
    endpoint_code VARCHAR(100),
    access_granted BOOLEAN NOT NULL DEFAULT TRUE,
    denial_reason VARCHAR(500),
    required_permissions VARCHAR(1000),
    user_permissions VARCHAR(2000),
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    response_time_ms BIGINT,
    
    INDEX idx_api_access_username (username),
    INDEX idx_api_access_endpoint (http_method, url_pattern(191)),
    INDEX idx_api_access_timestamp (accessed_at),
    INDEX idx_api_access_status (access_granted),
    INDEX idx_api_access_code (endpoint_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment
ALTER TABLE api_access_log COMMENT = 'Stores API access logs for security monitoring and analytics dashboard';
