-- ============================================================================
-- V87: Create operation lock table for pessimistic locking
-- ============================================================================
-- This table stores active locks on operations.
-- Locks expire after a configurable time period (default 15 minutes).
-- Only one user can hold a lock on an operation at a time.
-- ============================================================================

CREATE TABLE IF NOT EXISTS operation_lock_readmodel (
    operation_id VARCHAR(50) PRIMARY KEY COMMENT 'ID of the operation being locked',
    locked_by VARCHAR(50) NOT NULL COMMENT 'Username of the user who acquired the lock',
    locked_by_full_name VARCHAR(100) COMMENT 'Full name of the user for display',
    locked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the lock was acquired',
    expires_at TIMESTAMP NOT NULL COMMENT 'When the lock expires',
    lock_duration_seconds INT NOT NULL DEFAULT 900 COMMENT 'Lock duration in seconds (default 15 min)',
    operation_reference VARCHAR(100) COMMENT 'Reference of the locked operation for display',
    product_type VARCHAR(50) COMMENT 'Product type of the locked operation',

    INDEX idx_lock_locked_by (locked_by),
    INDEX idx_lock_expires_at (expires_at),
    INDEX idx_lock_product_type (product_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores active locks on operations for pessimistic locking';
