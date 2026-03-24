-- ============================================================================
-- V20260203_2__add_screening_mock_responses.sql
-- Agrega mock responses para las APIs de screening de compliance
-- ============================================================================

-- SCREENING_OFAC_SDN - Mock response (CLEAR)
INSERT INTO mock_api_response_config (api_code, scenario_name, match_field, match_value, response_status_code, response_body, is_default, active, created_at)
VALUES
('SCREENING_OFAC_SDN', 'default_clear', NULL, NULL, 200,
'{
  "searchComplete": true,
  "matchFound": false,
  "matchScore": 0,
  "matchCount": 0,
  "matches": [],
  "riskLevel": "LOW",
  "screeningId": "OFAC-SCR-001",
  "timestamp": "2026-02-03T10:00:00Z"
}', TRUE, TRUE, NOW())
ON DUPLICATE KEY UPDATE response_body = VALUES(response_body), is_default = VALUES(is_default);

-- SCREENING_OFAC_SDN - Mock response (MATCH) for specific name
INSERT INTO mock_api_response_config (api_code, scenario_name, match_field, match_value, response_status_code, response_body, is_default, active, created_at)
VALUES
('SCREENING_OFAC_SDN', 'match_found', 'clientName', 'SUSPICIOUS', 200,
'{
  "searchComplete": true,
  "matchFound": true,
  "matchScore": 92,
  "matchCount": 1,
  "matches": [{"name": "SUSPICIOUS COMPANY LTD", "source": "OFAC SDN", "score": 92, "listDate": "2020-01-15"}],
  "riskLevel": "HIGH",
  "screeningId": "OFAC-SCR-002",
  "timestamp": "2026-02-03T10:00:00Z"
}', FALSE, TRUE, NOW())
ON DUPLICATE KEY UPDATE response_body = VALUES(response_body);

-- SCREENING_UN_CONSOLIDATED - Mock response (CLEAR)
INSERT INTO mock_api_response_config (api_code, scenario_name, match_field, match_value, response_status_code, response_body, is_default, active, created_at)
VALUES
('SCREENING_UN_CONSOLIDATED', 'default_clear', NULL, NULL, 200,
'{
  "searchComplete": true,
  "matchFound": false,
  "matchScore": 0,
  "matchCount": 0,
  "matches": [],
  "riskLevel": "LOW",
  "screeningId": "UN-SCR-001",
  "timestamp": "2026-02-03T10:00:00Z"
}', TRUE, TRUE, NOW())
ON DUPLICATE KEY UPDATE response_body = VALUES(response_body), is_default = VALUES(is_default);

-- SCREENING_UAFE_NACIONAL - Mock response (CLEAR)
INSERT INTO mock_api_response_config (api_code, scenario_name, match_field, match_value, response_status_code, response_body, is_default, active, created_at)
VALUES
('SCREENING_UAFE_NACIONAL', 'default_clear', NULL, NULL, 200,
'{
  "searchComplete": true,
  "matchFound": false,
  "matchScore": 0,
  "matchCount": 0,
  "matches": [],
  "riskLevel": "LOW",
  "screeningId": "UAFE-SCR-001",
  "timestamp": "2026-02-03T10:00:00Z"
}', TRUE, TRUE, NOW())
ON DUPLICATE KEY UPDATE response_body = VALUES(response_body), is_default = VALUES(is_default);

-- SCREENING_INTERNAL_LIST - Mock response (CLEAR)
INSERT INTO mock_api_response_config (api_code, scenario_name, match_field, match_value, response_status_code, response_body, is_default, active, created_at)
VALUES
('SCREENING_INTERNAL_LIST', 'default_clear', NULL, NULL, 200,
'{
  "searchComplete": true,
  "matchFound": false,
  "matchScore": 0,
  "matchCount": 0,
  "matches": [],
  "riskLevel": "LOW",
  "screeningId": "INT-SCR-001",
  "timestamp": "2026-02-03T10:00:00Z"
}', TRUE, TRUE, NOW())
ON DUPLICATE KEY UPDATE response_body = VALUES(response_body), is_default = VALUES(is_default);

-- SCREENING_PEPS - Mock response (CLEAR)
INSERT INTO mock_api_response_config (api_code, scenario_name, match_field, match_value, response_status_code, response_body, is_default, active, created_at)
VALUES
('SCREENING_PEPS', 'default_clear', NULL, NULL, 200,
'{
  "searchComplete": true,
  "matchFound": false,
  "matchScore": 0,
  "matchCount": 0,
  "matches": [],
  "riskLevel": "LOW",
  "screeningId": "PEP-SCR-001",
  "timestamp": "2026-02-03T10:00:00Z"
}', TRUE, TRUE, NOW())
ON DUPLICATE KEY UPDATE response_body = VALUES(response_body), is_default = VALUES(is_default);

-- SCREENING_ADVERSE_MEDIA - Mock response (CLEAR)
INSERT INTO mock_api_response_config (api_code, scenario_name, match_field, match_value, response_status_code, response_body, is_default, active, created_at)
VALUES
('SCREENING_ADVERSE_MEDIA', 'default_clear', NULL, NULL, 200,
'{
  "searchComplete": true,
  "matchFound": false,
  "matchScore": 0,
  "matchCount": 0,
  "matches": [],
  "riskLevel": "LOW",
  "screeningId": "AM-SCR-001",
  "timestamp": "2026-02-03T10:00:00Z"
}', TRUE, TRUE, NOW())
ON DUPLICATE KEY UPDATE response_body = VALUES(response_body), is_default = VALUES(is_default);
