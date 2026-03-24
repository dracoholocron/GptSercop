-- Add field anchor columns to comments for inline (field-level) comments
-- Backward-compatible: existing comments keep anchor_field = NULL (workspace-level)

ALTER TABLE cp_paa_workspace_comment
  ADD COLUMN anchor_field VARCHAR(100) NULL AFTER content,
  ADD COLUMN anchor_phase_index INT NULL AFTER anchor_field,
  ADD COLUMN parent_comment_id BIGINT NULL AFTER anchor_phase_index;

ALTER TABLE cp_paa_workspace_comment
  ADD INDEX idx_ws_comment_anchor (workspace_id, department_plan_id, anchor_field, anchor_phase_index),
  ADD CONSTRAINT fk_ws_comment_parent
    FOREIGN KEY (parent_comment_id) REFERENCES cp_paa_workspace_comment(id) ON DELETE CASCADE;
