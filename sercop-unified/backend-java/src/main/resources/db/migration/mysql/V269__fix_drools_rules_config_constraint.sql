-- Fix: Remove UNIQUE constraint that prevents multiple inactive records per rule_type
-- The uniqueness of active records is handled in application code
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'drools_rules_config' AND index_name = 'uk_rule_type_active');

SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE drools_rules_config DROP INDEX uk_rule_type_active', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add non-unique index for query performance
SET @idx_exist := (SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'drools_rules_config' AND index_name = 'idx_rule_type_active');

SET @sqlstmt2 := IF(@idx_exist = 0, 'ALTER TABLE drools_rules_config ADD INDEX idx_rule_type_active (rule_type, is_active)', 'SELECT 1');
PREPARE stmt2 FROM @sqlstmt2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
