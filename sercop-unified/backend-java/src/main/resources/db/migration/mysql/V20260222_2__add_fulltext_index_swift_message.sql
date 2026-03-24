-- Add FULLTEXT index on swift_message for advanced SWIFT field search.
-- Enables efficient text search within SWIFT message content (field codes like :20:, :32B:, :59:, etc.)
-- Used by Business Intelligence dashboard advanced filters.

ALTER TABLE operation_readmodel ADD FULLTEXT INDEX idx_swift_message_ft (swift_message);
