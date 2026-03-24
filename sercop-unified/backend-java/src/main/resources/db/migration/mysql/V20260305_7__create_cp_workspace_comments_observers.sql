-- ============================================================================
-- V20260305_7: Create workspace comments and observers tables
-- Enables collaborative real-time workspace with observations and external observers
-- ============================================================================

CREATE TABLE IF NOT EXISTS cp_paa_workspace_comment (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    workspace_id    BIGINT NOT NULL COMMENT 'FK to cp_paa_workspace',
    department_plan_id BIGINT NULL COMMENT 'Optional FK - if comment is about a specific department',
    author_user_id  VARCHAR(100) NOT NULL COMMENT 'User ID of the comment author',
    author_user_name VARCHAR(200) NOT NULL COMMENT 'Display name of the author',
    author_role     VARCHAR(30) NOT NULL DEFAULT 'COORDINATOR' COMMENT 'COORDINATOR, DEPARTMENT, OBSERVER',
    content         TEXT NOT NULL COMMENT 'Comment content',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_ws_comment_workspace (workspace_id),
    INDEX idx_ws_comment_dept (department_plan_id),
    INDEX idx_ws_comment_author (author_user_id),

    FOREIGN KEY (workspace_id) REFERENCES cp_paa_workspace(id) ON DELETE CASCADE,
    FOREIGN KEY (department_plan_id) REFERENCES cp_paa_department_plan(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cp_paa_workspace_observer (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    workspace_id    BIGINT NOT NULL COMMENT 'FK to cp_paa_workspace',
    user_id         VARCHAR(100) NOT NULL COMMENT 'Observer user ID',
    user_name       VARCHAR(200) NOT NULL COMMENT 'Observer display name',
    role            VARCHAR(30) NOT NULL DEFAULT 'OBSERVER' COMMENT 'Observer role label',
    added_by        VARCHAR(100) NOT NULL COMMENT 'User who added this observer',
    added_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_ws_observer (workspace_id, user_id),
    INDEX idx_ws_observer_user (user_id),

    FOREIGN KEY (workspace_id) REFERENCES cp_paa_workspace(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
