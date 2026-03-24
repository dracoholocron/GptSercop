-- Field change log: tracks individual field-level changes for visual diff / track changes
CREATE TABLE IF NOT EXISTS cp_paa_field_change_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    department_plan_id BIGINT NOT NULL,
    field_code VARCHAR(100) NOT NULL,
    phase_index INT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by_user_id VARCHAR(100) NOT NULL,
    changed_by_name VARCHAR(200) NOT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_field_change_dept (department_plan_id, field_code, phase_index),
    INDEX idx_field_change_ws (workspace_id, department_plan_id),
    CONSTRAINT fk_field_change_ws FOREIGN KEY (workspace_id) REFERENCES cp_paa_workspace(id) ON DELETE CASCADE,
    CONSTRAINT fk_field_change_dept FOREIGN KEY (department_plan_id) REFERENCES cp_paa_department_plan(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
