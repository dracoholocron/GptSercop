-- Workspace proposals: propose changes to field values with voting
CREATE TABLE cp_paa_workspace_proposal (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  workspace_id BIGINT NOT NULL,
  department_plan_id BIGINT NOT NULL,
  anchor_field VARCHAR(100) NOT NULL,
  anchor_phase_index INT NOT NULL DEFAULT 0,
  proposer_user_id VARCHAR(100) NOT NULL,
  proposer_name VARCHAR(200) NOT NULL,
  current_value TEXT,
  proposed_value TEXT NOT NULL,
  justification TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  votes_required INT NOT NULL DEFAULT 1,
  votes_approve INT NOT NULL DEFAULT 0,
  votes_reject INT NOT NULL DEFAULT 0,
  resolved_at DATETIME NULL,
  resolved_by VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ws_proposal_ws (workspace_id, status),
  INDEX idx_ws_proposal_field (workspace_id, department_plan_id, anchor_field, anchor_phase_index),
  FOREIGN KEY (workspace_id) REFERENCES cp_paa_workspace(id) ON DELETE CASCADE,
  FOREIGN KEY (department_plan_id) REFERENCES cp_paa_department_plan(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Votes on proposals
CREATE TABLE cp_paa_workspace_proposal_vote (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  proposal_id BIGINT NOT NULL,
  voter_user_id VARCHAR(100) NOT NULL,
  voter_name VARCHAR(200) NOT NULL,
  vote_type VARCHAR(10) NOT NULL,
  comment TEXT,
  voted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_proposal_voter (proposal_id, voter_user_id),
  FOREIGN KEY (proposal_id) REFERENCES cp_paa_workspace_proposal(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
