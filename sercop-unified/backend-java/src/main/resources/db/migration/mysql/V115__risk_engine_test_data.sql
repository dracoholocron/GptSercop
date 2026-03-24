-- =====================================================
-- V115: Risk Engine Test Data
-- Sample data for testing and demonstrations
-- =====================================================

-- User Risk Profiles (sample users with established patterns)
INSERT INTO user_risk_profile (user_id, usual_ip_addresses, usual_login_hours, usual_device_fingerprints, avg_daily_operations, avg_operation_amount, last_known_location, created_at) VALUES
(1, '["192.168.1.100", "10.0.0.50", "189.203.45.67"]', '[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]', '["fp_chrome_win_abc123", "fp_safari_mac_def456"]', 12, 50000.00, 'MX', NOW()),
(2, '["192.168.1.101", "10.0.0.51"]', '[9, 10, 11, 12, 13, 14, 15, 16, 17]', '["fp_firefox_win_ghi789"]', 8, 75000.00, 'MX', NOW()),
(3, '["192.168.1.102", "172.16.0.25"]', '[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]', '["fp_chrome_mac_jkl012", "fp_edge_win_mno345"]', 20, 120000.00, 'US', NOW()),
(4, '["10.0.0.100"]', '[8, 9, 10, 11, 12, 13, 14, 15, 16, 17]', '["fp_chrome_win_pqr678"]', 5, 25000.00, 'MX', NOW()),
(5, '["192.168.1.105", "10.0.0.55", "200.33.44.55"]', '[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]', '["fp_safari_ios_stu901", "fp_chrome_android_vwx234"]', 15, 85000.00, 'MX', NOW());

-- Risk Events - Last 7 days of sample activity
-- Day 1: Normal operations
INSERT INTO risk_event (user_id, username, event_type, ip_address, device_fingerprint, user_agent, location_country, location_city, operation_type, operation_amount, total_risk_score, triggered_rules, action_taken, created_at) VALUES
(1, 'juan.perez', 'LOGIN', '192.168.1.100', 'fp_chrome_win_abc123', 'Mozilla/5.0 Chrome/120.0', 'MX', 'Ciudad de México', NULL, NULL, 0, '[]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 9 HOUR),
(1, 'juan.perez', 'OPERATION', '192.168.1.100', 'fp_chrome_win_abc123', 'Mozilla/5.0 Chrome/120.0', 'MX', 'Ciudad de México', 'LC_IMPORT:CREATE', 45000.00, 0, '[]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR),
(2, 'maria.garcia', 'LOGIN', '192.168.1.101', 'fp_firefox_win_ghi789', 'Mozilla/5.0 Firefox/121.0', 'MX', 'Monterrey', NULL, NULL, 0, '[]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 9 HOUR + INTERVAL 30 MINUTE),
(2, 'maria.garcia', 'APPROVAL', '192.168.1.101', 'fp_firefox_win_ghi789', 'Mozilla/5.0 Firefox/121.0', 'MX', 'Monterrey', 'LC_IMPORT:APPROVE', 45000.00, 0, '[]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 11 HOUR);

-- Day 2: Some medium risk events
INSERT INTO risk_event (user_id, username, event_type, ip_address, device_fingerprint, user_agent, location_country, location_city, operation_type, operation_amount, total_risk_score, triggered_rules, action_taken, created_at) VALUES
(3, 'carlos.lopez', 'LOGIN', '45.67.89.100', 'fp_chrome_mac_new001', 'Mozilla/5.0 Chrome/120.0', 'US', 'Miami', NULL, NULL, 45, '[{"ruleCode":"UNKNOWN_IP","ruleName":"IP Desconocida","points":20,"reason":"IP 45.67.89.100 no reconocida"},{"ruleCode":"NEW_DEVICE","ruleName":"Dispositivo Nuevo","points":25,"reason":"Dispositivo no reconocido"}]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 14 HOUR),
(3, 'carlos.lopez', 'OPERATION', '45.67.89.100', 'fp_chrome_mac_new001', 'Mozilla/5.0 Chrome/120.0', 'US', 'Miami', 'GUARANTEE:CREATE', 250000.00, 65, '[{"ruleCode":"UNKNOWN_IP","ruleName":"IP Desconocida","points":20,"reason":"IP no reconocida"},{"ruleCode":"NEW_DEVICE","ruleName":"Dispositivo Nuevo","points":25,"reason":"Dispositivo no reconocido"},{"ruleCode":"HIGH_AMOUNT","ruleName":"Monto Alto","points":20,"reason":"Monto alto: 250000"}]', 'MFA_REQUESTED', DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 15 HOUR);

-- Day 3: Weekend access (lower risk but flagged)
INSERT INTO risk_event (user_id, username, event_type, ip_address, device_fingerprint, user_agent, location_country, location_city, operation_type, operation_amount, total_risk_score, triggered_rules, action_taken, created_at) VALUES
(1, 'juan.perez', 'LOGIN', '189.203.45.67', 'fp_safari_mac_def456', 'Mozilla/5.0 Safari/17.0', 'MX', 'Cancún', NULL, NULL, 30, '[{"ruleCode":"UNKNOWN_IP","ruleName":"IP Desconocida","points":20,"reason":"IP 189.203.45.67 primera vez"},{"ruleCode":"WEEKEND_ACCESS","ruleName":"Acceso Fin de Semana","points":10,"reason":"Acceso en día no laborable"}]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 11 HOUR);

-- Day 4: High risk event - blocked
INSERT INTO risk_event (user_id, username, event_type, ip_address, device_fingerprint, user_agent, location_country, location_city, operation_type, operation_amount, total_risk_score, triggered_rules, action_taken, created_at) VALUES
(4, 'ana.martinez', 'LOGIN', '91.234.56.78', 'fp_unknown_device', 'curl/7.68.0', 'RU', 'Moscow', NULL, NULL, 95, '[{"ruleCode":"NEW_COUNTRY","ruleName":"País Diferente","points":30,"reason":"Acceso desde país no autorizado: RU"},{"ruleCode":"UNKNOWN_IP","ruleName":"IP Desconocida","points":20,"reason":"IP no reconocida"},{"ruleCode":"NEW_DEVICE","ruleName":"Dispositivo Nuevo","points":25,"reason":"Dispositivo no reconocido"},{"ruleCode":"SUSPICIOUS_USER_AGENT","ruleName":"User Agent Sospechoso","points":35,"reason":"User agent indica herramienta automatizada"}]', 'BLOCKED', DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 3 HOUR);

-- Day 5: Normal with some flags
INSERT INTO risk_event (user_id, username, event_type, ip_address, device_fingerprint, user_agent, location_country, location_city, operation_type, operation_amount, total_risk_score, triggered_rules, action_taken, created_at) VALUES
(5, 'roberto.sanchez', 'LOGIN', '200.33.44.55', 'fp_safari_ios_stu901', 'Mozilla/5.0 iPhone Safari', 'MX', 'Guadalajara', NULL, NULL, 0, '[]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 8 HOUR),
(5, 'roberto.sanchez', 'OPERATION', '200.33.44.55', 'fp_safari_ios_stu901', 'Mozilla/5.0 iPhone Safari', 'MX', 'Guadalajara', 'LC_EXPORT:CREATE', 180000.00, 20, '[{"ruleCode":"HIGH_AMOUNT","ruleName":"Monto Alto","points":20,"reason":"Monto alto: 180000"}]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 9 HOUR),
(2, 'maria.garcia', 'LOGIN', '192.168.1.101', 'fp_firefox_win_ghi789', 'Mozilla/5.0 Firefox/121.0', 'MX', 'Monterrey', NULL, NULL, 15, '[{"ruleCode":"OFF_HOURS","ruleName":"Fuera de Horario","points":15,"reason":"Operación fuera de horario laboral"}]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 21 HOUR);

-- Day 6: Multiple operations - velocity check
INSERT INTO risk_event (user_id, username, event_type, ip_address, device_fingerprint, user_agent, location_country, location_city, operation_type, operation_amount, total_risk_score, triggered_rules, action_taken, created_at) VALUES
(1, 'juan.perez', 'LOGIN', '192.168.1.100', 'fp_chrome_win_abc123', 'Mozilla/5.0 Chrome/120.0', 'MX', 'Ciudad de México', NULL, NULL, 0, '[]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 9 HOUR),
(1, 'juan.perez', 'OPERATION', '192.168.1.100', 'fp_chrome_win_abc123', 'Mozilla/5.0 Chrome/120.0', 'MX', 'Ciudad de México', 'LC_IMPORT:CREATE', 55000.00, 0, '[]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 9 HOUR + INTERVAL 15 MINUTE),
(1, 'juan.perez', 'OPERATION', '192.168.1.100', 'fp_chrome_win_abc123', 'Mozilla/5.0 Chrome/120.0', 'MX', 'Ciudad de México', 'LC_IMPORT:CREATE', 62000.00, 0, '[]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 9 HOUR + INTERVAL 30 MINUTE),
(1, 'juan.perez', 'OPERATION', '192.168.1.100', 'fp_chrome_win_abc123', 'Mozilla/5.0 Chrome/120.0', 'MX', 'Ciudad de México', 'LC_IMPORT:CREATE', 48000.00, 0, '[]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 10 HOUR),
(1, 'juan.perez', 'DATA_ACCESS', '192.168.1.100', 'fp_chrome_win_abc123', 'Mozilla/5.0 Chrome/120.0', 'MX', 'Ciudad de México', 'AUDIT:VIEW', NULL, 15, '[{"ruleCode":"SENSITIVE_DATA_ACCESS","ruleName":"Acceso a Datos Sensibles","points":15,"reason":"Acceso a información clasificada como sensible"}]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 11 HOUR);

-- Day 7 (Today): Mixed activity
INSERT INTO risk_event (user_id, username, event_type, ip_address, device_fingerprint, user_agent, location_country, location_city, operation_type, operation_amount, total_risk_score, triggered_rules, action_taken, created_at) VALUES
(2, 'maria.garcia', 'LOGIN', '192.168.1.101', 'fp_firefox_win_ghi789', 'Mozilla/5.0 Firefox/121.0', 'MX', 'Monterrey', NULL, NULL, 0, '[]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR),
(3, 'carlos.lopez', 'LOGIN', '172.16.0.25', 'fp_edge_win_mno345', 'Mozilla/5.0 Edge/120.0', 'US', 'New York', NULL, NULL, 0, '[]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 10 HOUR),
(3, 'carlos.lopez', 'OPERATION', '172.16.0.25', 'fp_edge_win_mno345', 'Mozilla/5.0 Edge/120.0', 'US', 'New York', 'GUARANTEE:CREATE', 500000.00, 45, '[{"ruleCode":"HIGH_AMOUNT","ruleName":"Monto Alto","points":20,"reason":"Monto alto: 500000"},{"ruleCode":"UNUSUAL_AMOUNT","ruleName":"Monto Inusual","points":25,"reason":"Monto mayor al promedio del usuario"}]', 'ALLOWED', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 11 HOUR),
(5, 'roberto.sanchez', 'LOGIN', '192.168.1.105', 'fp_chrome_android_vwx234', 'Mozilla/5.0 Android Chrome', 'MX', 'Ciudad de México', NULL, NULL, 25, '[{"ruleCode":"NEW_DEVICE","ruleName":"Dispositivo Nuevo","points":25,"reason":"Dispositivo no reconocido"}]', 'ALLOWED', NOW() - INTERVAL 2 HOUR),
(4, 'ana.martinez', 'LOGIN', '10.0.0.100', 'fp_chrome_win_pqr678', 'Mozilla/5.0 Chrome/120.0', 'MX', 'Ciudad de México', NULL, NULL, 0, '[]', 'ALLOWED', NOW() - INTERVAL 1 HOUR),
(4, 'ana.martinez', 'OPERATION', '10.0.0.100', 'fp_chrome_win_pqr678', 'Mozilla/5.0 Chrome/120.0', 'MX', 'Ciudad de México', 'LC_IMPORT:CREATE', 35000.00, 0, '[]', 'ALLOWED', NOW() - INTERVAL 30 MINUTE);
