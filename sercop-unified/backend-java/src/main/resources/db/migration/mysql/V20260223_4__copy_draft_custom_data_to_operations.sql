-- Fix: Copy custom_data from approved drafts to operation_custom_data_readmodel
-- Bug: When a draft was approved, custom_data was not transferred to the operation.
-- This migration retroactively fixes all affected operations.

INSERT INTO operation_custom_data_readmodel (id, operation_id, operation_type, custom_data, version, created_at, updated_at, created_by, updated_by)
SELECT
    UUID() AS id,
    o.operation_id,
    o.product_type AS operation_type,
    d.custom_data,
    1 AS version,
    o.created_at,
    NOW() AS updated_at,
    o.created_by,
    o.created_by AS updated_by
FROM swift_draft_readmodel d
INNER JOIN operation_readmodel o ON o.original_draft_id = d.draft_id
WHERE d.custom_data IS NOT NULL
  AND d.custom_data != ''
  AND d.custom_data != '{}'
  AND d.status = 'APPROVED'
  AND NOT EXISTS (
      SELECT 1 FROM operation_custom_data_readmodel ocd
      WHERE ocd.operation_id = o.operation_id
  );
