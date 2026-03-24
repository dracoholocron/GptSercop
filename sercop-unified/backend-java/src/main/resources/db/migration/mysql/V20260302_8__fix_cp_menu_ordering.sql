-- V20260302_8: Fix CP menu ordering - separate from trade finance sections
-- SECTION_CP was at display_order 15 (between Workbox=1 and LC Import=20)
-- Move it to display_order 95 (after AI=80, before Admin=90)

UPDATE menu_item SET display_order = 95 WHERE code = 'SECTION_CP';

-- Also fix icons to match frontend iconMap
-- Use icons that exist in react-icons/lu (Lucide)
UPDATE menu_item SET icon = 'LayoutDashboard' WHERE code = 'CP_DASHBOARD';
UPDATE menu_item SET icon = 'FileText'        WHERE code = 'CP_PROCESSES';
UPDATE menu_item SET icon = 'Calendar'        WHERE code = 'CP_PAA';
UPDATE menu_item SET icon = 'DollarSign'      WHERE code = 'CP_BUDGET';
UPDATE menu_item SET icon = 'TrendingUp'      WHERE code = 'CP_MARKET';
UPDATE menu_item SET icon = 'ShieldAlert'     WHERE code = 'CP_RISK';
UPDATE menu_item SET icon = 'ClipboardCheck'  WHERE code = 'CP_EVALUATIONS';
UPDATE menu_item SET icon = 'FileEdit'        WHERE code = 'CP_CONTRACTS';
UPDATE menu_item SET icon = 'Users'           WHERE code = 'CP_BIDDERS';
UPDATE menu_item SET icon = 'Bot'             WHERE code = 'CP_AI_ASSISTANT';
UPDATE menu_item SET icon = 'BarChart3'       WHERE code = 'CP_REPORTS';
