-- =============================================================================
-- Migration V180: Client Portal - Dashboard Widgets and Reports Configuration
-- Creates configurable dashboard widgets and report definitions for client portal
-- All configurations are database-driven, no hardcoded values
-- =============================================================================

-- ============================================
-- 1. Dashboard Configuration Table
-- ============================================

CREATE TABLE IF NOT EXISTS dashboard_config (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    dashboard_code VARCHAR(50) NOT NULL,
    dashboard_name_key VARCHAR(100) NOT NULL COMMENT 'i18n key',
    description_key VARCHAR(200) NULL COMMENT 'i18n key',

    -- Scope
    user_type VARCHAR(20) NOT NULL COMMENT 'INTERNAL or CLIENT',
    tenant_id CHAR(36) NULL COMMENT 'NULL for global',

    -- Layout configuration
    layout_type VARCHAR(30) DEFAULT 'GRID' COMMENT 'GRID, MASONRY, FLEX',
    columns INT DEFAULT 4 COMMENT 'Number of columns in grid',
    row_height INT DEFAULT 100 COMMENT 'Base row height in pixels',
    gap INT DEFAULT 16 COMMENT 'Gap between widgets in pixels',

    -- Features
    is_customizable BOOLEAN DEFAULT TRUE COMMENT 'Users can customize',
    allow_widget_add BOOLEAN DEFAULT TRUE,
    allow_widget_remove BOOLEAN DEFAULT TRUE,
    allow_widget_resize BOOLEAN DEFAULT TRUE,
    allow_widget_move BOOLEAN DEFAULT TRUE,

    -- Refresh configuration
    auto_refresh BOOLEAN DEFAULT TRUE,
    refresh_interval_seconds INT DEFAULT 300 COMMENT '5 minutes default',

    -- Status
    is_default BOOLEAN DEFAULT FALSE COMMENT 'Default dashboard for this user type',
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE KEY uk_dashboard_code_type (dashboard_code, user_type, tenant_id),

    -- Indexes
    INDEX idx_user_type (user_type),
    INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dashboard configuration for different user types';

-- Seed dashboard configurations
INSERT INTO dashboard_config (
    dashboard_code, dashboard_name_key, description_key, user_type,
    layout_type, columns, row_height, gap,
    is_customizable, allow_widget_add, allow_widget_remove, allow_widget_resize, allow_widget_move,
    auto_refresh, refresh_interval_seconds, is_default, is_active
) VALUES
-- Client Portal Dashboard
('CLIENT_MAIN', 'dashboard.client.main.name', 'dashboard.client.main.desc', 'CLIENT',
 'GRID', 4, 100, 16,
 TRUE, TRUE, TRUE, TRUE, TRUE,
 TRUE, 300, TRUE, TRUE),

-- Internal Backoffice Dashboard for Client Requests
('BACKOFFICE_CLIENT_REQUESTS', 'dashboard.backoffice.clientRequests.name', 'dashboard.backoffice.clientRequests.desc', 'INTERNAL',
 'GRID', 4, 100, 16,
 TRUE, TRUE, TRUE, TRUE, TRUE,
 TRUE, 60, FALSE, TRUE);

-- ============================================
-- 2. Dashboard Widget Configuration Table
-- ============================================

CREATE TABLE IF NOT EXISTS dashboard_widget_config (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    widget_code VARCHAR(50) NOT NULL,
    widget_name_key VARCHAR(100) NOT NULL COMMENT 'i18n key',
    description_key VARCHAR(200) NULL COMMENT 'i18n key',

    -- Widget type
    widget_type VARCHAR(30) NOT NULL COMMENT 'KPI_CARD, CHART, TABLE, LIST, ACTIVITY_FEED, CALENDAR, PROGRESS, STAT_GROUP',
    component_name VARCHAR(100) NOT NULL COMMENT 'React component name',

    -- Scope
    user_type VARCHAR(20) NOT NULL COMMENT 'INTERNAL or CLIENT',
    applicable_dashboards JSON COMMENT 'Array of dashboard codes',

    -- Data configuration
    data_source_type VARCHAR(30) NOT NULL COMMENT 'API, QUERY, STATIC',
    data_source_config JSON NOT NULL COMMENT 'API endpoint, query, or static data',
    refresh_interval_seconds INT NULL COMMENT 'Override dashboard default',

    -- Layout defaults
    default_width INT DEFAULT 1 COMMENT 'Width in grid units',
    default_height INT DEFAULT 2 COMMENT 'Height in grid units',
    min_width INT DEFAULT 1,
    min_height INT DEFAULT 1,
    max_width INT DEFAULT 4,
    max_height INT DEFAULT 6,

    -- Display configuration
    display_config JSON COMMENT 'Icon, colors, format options',
    chart_config JSON NULL COMMENT 'Chart-specific configuration',

    -- Permissions
    required_permission VARCHAR(50) NULL COMMENT 'Permission needed to view',

    -- Visibility
    default_visible BOOLEAN DEFAULT TRUE,
    default_position JSON COMMENT '{"x": 0, "y": 0}',
    display_order INT DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE KEY uk_widget_code_type (widget_code, user_type),

    -- Indexes
    INDEX idx_widget_type (widget_type),
    INDEX idx_user_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Widget configuration for dashboards';

-- ============================================
-- 3. Client Portal Widgets
-- ============================================

INSERT INTO dashboard_widget_config (
    widget_code, widget_name_key, description_key, widget_type, component_name,
    user_type, applicable_dashboards, data_source_type, data_source_config,
    default_width, default_height, min_width, min_height, max_width, max_height,
    display_config, required_permission, default_visible, default_position, display_order, is_active
) VALUES
-- KPI: Active Operations Count
('CLIENT_ACTIVE_OPERATIONS', 'widget.client.activeOperations.name', 'widget.client.activeOperations.desc',
 'KPI_CARD', 'KpiCard', 'CLIENT', '["CLIENT_MAIN"]',
 'API', '{"endpoint": "/api/client-portal/stats/active-operations", "method": "GET", "params": {"clienteId": "{{user.clientId}}"}}',
 1, 2, 1, 1, 2, 3,
 '{"icon": "Briefcase", "color": "blue", "format": "number", "trend": true}',
 'CLIENT_OPERATION_VIEW', TRUE, '{"x": 0, "y": 0}', 1, TRUE),

-- KPI: Pending Requests Count
('CLIENT_PENDING_REQUESTS', 'widget.client.pendingRequests.name', 'widget.client.pendingRequests.desc',
 'KPI_CARD', 'KpiCard', 'CLIENT', '["CLIENT_MAIN"]',
 'API', '{"endpoint": "/api/client-portal/stats/pending-requests", "method": "GET", "params": {"clienteId": "{{user.clientId}}"}}',
 1, 2, 1, 1, 2, 3,
 '{"icon": "Clock", "color": "yellow", "format": "number", "trend": true}',
 'CLIENT_REQUEST_VIEW', TRUE, '{"x": 1, "y": 0}', 2, TRUE),

-- KPI: Total Amount in Operations
('CLIENT_TOTAL_AMOUNT', 'widget.client.totalAmount.name', 'widget.client.totalAmount.desc',
 'KPI_CARD', 'KpiCard', 'CLIENT', '["CLIENT_MAIN"]',
 'API', '{"endpoint": "/api/client-portal/stats/total-amount", "method": "GET", "params": {"clienteId": "{{user.clientId}}"}}',
 1, 2, 1, 1, 2, 3,
 '{"icon": "DollarSign", "color": "green", "format": "currency", "currency": "USD"}',
 'CLIENT_OPERATION_VIEW', TRUE, '{"x": 2, "y": 0}', 3, TRUE),

-- KPI: Documents Pending
('CLIENT_DOCUMENTS_PENDING', 'widget.client.documentsPending.name', 'widget.client.documentsPending.desc',
 'KPI_CARD', 'KpiCard', 'CLIENT', '["CLIENT_MAIN"]',
 'API', '{"endpoint": "/api/client-portal/stats/documents-pending", "method": "GET", "params": {"clienteId": "{{user.clientId}}"}}',
 1, 2, 1, 1, 2, 3,
 '{"icon": "FileText", "color": "orange", "format": "number", "alertThreshold": 1}',
 'CLIENT_DOCUMENT_VIEW', TRUE, '{"x": 3, "y": 0}', 4, TRUE),

-- Chart: Operations by Product Type
('CLIENT_OPERATIONS_BY_TYPE', 'widget.client.operationsByType.name', 'widget.client.operationsByType.desc',
 'CHART', 'PieChart', 'CLIENT', '["CLIENT_MAIN"]',
 'API', '{"endpoint": "/api/client-portal/stats/operations-by-type", "method": "GET", "params": {"clienteId": "{{user.clientId}}"}}',
 2, 3, 1, 2, 4, 4,
 '{"showLegend": true, "showLabels": true}',
 'CLIENT_OPERATION_VIEW', TRUE, '{"x": 0, "y": 2}', 5, TRUE),

-- Chart: Monthly Request Volume
('CLIENT_MONTHLY_VOLUME', 'widget.client.monthlyVolume.name', 'widget.client.monthlyVolume.desc',
 'CHART', 'BarChart', 'CLIENT', '["CLIENT_MAIN"]',
 'API', '{"endpoint": "/api/client-portal/stats/monthly-volume", "method": "GET", "params": {"clienteId": "{{user.clientId}}", "months": 6}}',
 2, 3, 2, 2, 4, 4,
 '{"xAxis": "month", "yAxis": "count", "showGrid": true}',
 'CLIENT_REPORTS_VIEW', TRUE, '{"x": 2, "y": 2}', 6, TRUE),

-- Table: Recent Requests
('CLIENT_RECENT_REQUESTS', 'widget.client.recentRequests.name', 'widget.client.recentRequests.desc',
 'TABLE', 'DataTable', 'CLIENT', '["CLIENT_MAIN"]',
 'API', '{"endpoint": "/api/client-portal/requests", "method": "GET", "params": {"clienteId": "{{user.clientId}}", "limit": 5, "sortBy": "fechaCreacion", "sortOrder": "DESC"}}',
 2, 3, 2, 2, 4, 5,
 '{"columns": ["requestNumber", "productoType", "estado", "monto", "fechaCreacion"], "showPagination": false, "rowLink": "/client/requests/{{id}}"}',
 'CLIENT_REQUEST_VIEW', TRUE, '{"x": 0, "y": 5}', 7, TRUE),

-- Table: Recent Operations
('CLIENT_RECENT_OPERATIONS', 'widget.client.recentOperations.name', 'widget.client.recentOperations.desc',
 'TABLE', 'DataTable', 'CLIENT', '["CLIENT_MAIN"]',
 'API', '{"endpoint": "/api/client-portal/operations", "method": "GET", "params": {"clienteId": "{{user.clientId}}", "limit": 5, "sortBy": "createdAt", "sortOrder": "DESC"}}',
 2, 3, 2, 2, 4, 5,
 '{"columns": ["referenceNumber", "productType", "status", "amount", "expiryDate"], "showPagination": false, "rowLink": "/client/operations/{{id}}"}',
 'CLIENT_OPERATION_VIEW', TRUE, '{"x": 2, "y": 5}', 8, TRUE),

-- Activity Feed
('CLIENT_ACTIVITY_FEED', 'widget.client.activityFeed.name', 'widget.client.activityFeed.desc',
 'ACTIVITY_FEED', 'ActivityFeed', 'CLIENT', '["CLIENT_MAIN"]',
 'API', '{"endpoint": "/api/client-portal/activity", "method": "GET", "params": {"clienteId": "{{user.clientId}}", "limit": 10}}',
 2, 4, 1, 2, 4, 6,
 '{"showTimestamp": true, "showAvatar": true, "groupByDate": true}',
 'CLIENT_NOTIFICATION_VIEW', TRUE, '{"x": 0, "y": 8}', 9, TRUE),

-- Upcoming Expirations
('CLIENT_UPCOMING_EXPIRATIONS', 'widget.client.upcomingExpirations.name', 'widget.client.upcomingExpirations.desc',
 'LIST', 'ExpirationList', 'CLIENT', '["CLIENT_MAIN"]',
 'API', '{"endpoint": "/api/client-portal/operations/expiring", "method": "GET", "params": {"clienteId": "{{user.clientId}}", "days": 30, "limit": 5}}',
 2, 4, 1, 2, 4, 6,
 '{"showCountdown": true, "alertDays": 7, "criticalDays": 3}',
 'CLIENT_OPERATION_VIEW', TRUE, '{"x": 2, "y": 8}', 10, TRUE);

-- ============================================
-- 4. Backoffice Widgets for Client Requests
-- ============================================

INSERT INTO dashboard_widget_config (
    widget_code, widget_name_key, description_key, widget_type, component_name,
    user_type, applicable_dashboards, data_source_type, data_source_config,
    default_width, default_height, min_width, min_height, max_width, max_height,
    display_config, required_permission, default_visible, default_position, display_order, is_active
) VALUES
-- KPI: Total Pending Requests
('BACKOFFICE_PENDING_TOTAL', 'widget.backoffice.pendingTotal.name', 'widget.backoffice.pendingTotal.desc',
 'KPI_CARD', 'KpiCard', 'INTERNAL', '["BACKOFFICE_CLIENT_REQUESTS"]',
 'API', '{"endpoint": "/api/backoffice/client-requests/stats/pending", "method": "GET"}',
 1, 2, 1, 1, 2, 3,
 '{"icon": "Inbox", "color": "blue", "format": "number"}',
 'CLIENT_REQUEST_VIEW_ALL', TRUE, '{"x": 0, "y": 0}', 1, TRUE),

-- KPI: My Assigned Count
('BACKOFFICE_MY_ASSIGNED', 'widget.backoffice.myAssigned.name', 'widget.backoffice.myAssigned.desc',
 'KPI_CARD', 'KpiCard', 'INTERNAL', '["BACKOFFICE_CLIENT_REQUESTS"]',
 'API', '{"endpoint": "/api/backoffice/client-requests/stats/my-assigned", "method": "GET", "params": {"userId": "{{user.id}}"}}',
 1, 2, 1, 1, 2, 3,
 '{"icon": "User", "color": "green", "format": "number"}',
 'CLIENT_REQUEST_PROCESS', TRUE, '{"x": 1, "y": 0}', 2, TRUE),

-- KPI: SLA At Risk
('BACKOFFICE_SLA_AT_RISK', 'widget.backoffice.slaAtRisk.name', 'widget.backoffice.slaAtRisk.desc',
 'KPI_CARD', 'KpiCard', 'INTERNAL', '["BACKOFFICE_CLIENT_REQUESTS"]',
 'API', '{"endpoint": "/api/backoffice/client-requests/stats/sla-at-risk", "method": "GET"}',
 1, 2, 1, 1, 2, 3,
 '{"icon": "AlertTriangle", "color": "orange", "format": "number", "alertThreshold": 1}',
 'CLIENT_REQUEST_VIEW_ALL', TRUE, '{"x": 2, "y": 0}', 3, TRUE),

-- KPI: SLA Breached
('BACKOFFICE_SLA_BREACHED', 'widget.backoffice.slaBreached.name', 'widget.backoffice.slaBreached.desc',
 'KPI_CARD', 'KpiCard', 'INTERNAL', '["BACKOFFICE_CLIENT_REQUESTS"]',
 'API', '{"endpoint": "/api/backoffice/client-requests/stats/sla-breached", "method": "GET"}',
 1, 2, 1, 1, 2, 3,
 '{"icon": "AlertOctagon", "color": "red", "format": "number", "alertThreshold": 1}',
 'CLIENT_REQUEST_VIEW_ALL', TRUE, '{"x": 3, "y": 0}', 4, TRUE),

-- Chart: Requests by Status
('BACKOFFICE_REQUESTS_BY_STATUS', 'widget.backoffice.requestsByStatus.name', 'widget.backoffice.requestsByStatus.desc',
 'CHART', 'DonutChart', 'INTERNAL', '["BACKOFFICE_CLIENT_REQUESTS"]',
 'API', '{"endpoint": "/api/backoffice/client-requests/stats/by-status", "method": "GET"}',
 2, 3, 1, 2, 4, 4,
 '{"showLegend": true, "centerLabel": "Total"}',
 'CLIENT_REQUEST_VIEW_ALL', TRUE, '{"x": 0, "y": 2}', 5, TRUE),

-- Chart: Processing Time Trend
('BACKOFFICE_PROCESSING_TREND', 'widget.backoffice.processingTrend.name', 'widget.backoffice.processingTrend.desc',
 'CHART', 'LineChart', 'INTERNAL', '["BACKOFFICE_CLIENT_REQUESTS"]',
 'API', '{"endpoint": "/api/backoffice/client-requests/stats/processing-time", "method": "GET", "params": {"days": 30}}',
 2, 3, 2, 2, 4, 4,
 '{"xAxis": "date", "yAxis": "hours", "showGrid": true, "showArea": true}',
 'CLIENT_REQUEST_VIEW_ALL', TRUE, '{"x": 2, "y": 2}', 6, TRUE),

-- Table: Urgent Requests
('BACKOFFICE_URGENT_REQUESTS', 'widget.backoffice.urgentRequests.name', 'widget.backoffice.urgentRequests.desc',
 'TABLE', 'DataTable', 'INTERNAL', '["BACKOFFICE_CLIENT_REQUESTS"]',
 'API', '{"endpoint": "/api/backoffice/client-requests", "method": "GET", "params": {"slaStatus": "CRITICAL,BREACHED", "limit": 10, "sortBy": "slaDeadline", "sortOrder": "ASC"}}',
 4, 3, 2, 2, 4, 5,
 '{"columns": ["requestNumber", "clienteName", "productoType", "slaDeadline", "slaStatus", "assignedTo"], "showPagination": false, "rowHighlight": "slaStatus", "rowLink": "/operations/client-requests/{{id}}"}',
 'CLIENT_REQUEST_VIEW_ALL', TRUE, '{"x": 0, "y": 5}', 7, TRUE);

-- ============================================
-- 5. Report Configuration Table
-- ============================================

CREATE TABLE IF NOT EXISTS report_config (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    report_code VARCHAR(50) NOT NULL,
    report_name_key VARCHAR(100) NOT NULL COMMENT 'i18n key',
    description_key VARCHAR(200) NULL COMMENT 'i18n key',

    -- Report type
    report_type VARCHAR(30) NOT NULL COMMENT 'LIST, SUMMARY, CHART, EXPORT',
    category VARCHAR(50) NOT NULL COMMENT 'OPERATIONS, REQUESTS, DOCUMENTS, FINANCIAL',

    -- Scope
    user_type VARCHAR(20) NOT NULL COMMENT 'INTERNAL or CLIENT',

    -- Data configuration
    data_source_endpoint VARCHAR(200) NOT NULL,
    default_parameters JSON COMMENT 'Default filter parameters',

    -- Available filters
    available_filters JSON COMMENT 'Array of filter definitions',

    -- Columns/Fields
    available_columns JSON COMMENT 'Array of column definitions',
    default_columns JSON COMMENT 'Default visible columns',

    -- Sorting
    default_sort_field VARCHAR(50) NULL,
    default_sort_order VARCHAR(10) DEFAULT 'DESC',

    -- Export options
    export_formats JSON NULL COMMENT 'Default: PDF, EXCEL, CSV',
    max_export_rows INT DEFAULT 10000,

    -- UI configuration
    icon VARCHAR(50) DEFAULT 'FiFileText',
    color VARCHAR(30) DEFAULT 'blue',
    display_order INT DEFAULT 0,

    -- Permissions
    required_permission VARCHAR(50) NOT NULL,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE KEY uk_report_code_type (report_code, user_type),

    -- Indexes
    INDEX idx_category (category),
    INDEX idx_user_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Report configuration for different user types';

-- ============================================
-- 6. Client Portal Reports
-- ============================================

INSERT INTO report_config (
    report_code, report_name_key, description_key, report_type, category,
    user_type, data_source_endpoint, default_parameters,
    available_filters, available_columns, default_columns,
    default_sort_field, default_sort_order, export_formats, max_export_rows,
    icon, color, display_order, required_permission, is_active
) VALUES
-- Account Statement Report
('CLIENT_ACCOUNT_STATEMENT', 'report.client.accountStatement.name', 'report.client.accountStatement.desc',
 'LIST', 'FINANCIAL', 'CLIENT',
 '/api/client-portal/reports/account-statement',
 '{"dateFrom": "{{date.startOfMonth}}", "dateTo": "{{date.today}}"}',
 '[
    {"code": "dateFrom", "type": "DATE", "labelKey": "filter.dateFrom", "required": true},
    {"code": "dateTo", "type": "DATE", "labelKey": "filter.dateTo", "required": true},
    {"code": "productType", "type": "SELECT", "labelKey": "filter.productType", "options": "PRODUCT_TYPES"},
    {"code": "currency", "type": "SELECT", "labelKey": "filter.currency", "options": "CURRENCIES"}
 ]',
 '[
    {"code": "date", "labelKey": "column.date", "type": "DATE", "sortable": true},
    {"code": "referenceNumber", "labelKey": "column.reference", "type": "STRING", "sortable": true},
    {"code": "productType", "labelKey": "column.productType", "type": "STRING", "sortable": true},
    {"code": "description", "labelKey": "column.description", "type": "STRING"},
    {"code": "debit", "labelKey": "column.debit", "type": "CURRENCY"},
    {"code": "credit", "labelKey": "column.credit", "type": "CURRENCY"},
    {"code": "balance", "labelKey": "column.balance", "type": "CURRENCY"}
 ]',
 '["date", "referenceNumber", "productType", "description", "debit", "credit", "balance"]',
 'date', 'DESC', '["PDF", "EXCEL", "CSV"]', 5000,
 'FiFileText', 'blue', 1, 'CLIENT_REPORTS_VIEW', TRUE),

-- Active Operations Report
('CLIENT_ACTIVE_OPERATIONS_REPORT', 'report.client.activeOperations.name', 'report.client.activeOperations.desc',
 'LIST', 'OPERATIONS', 'CLIENT',
 '/api/client-portal/reports/active-operations',
 '{"status": "ACTIVE"}',
 '[
    {"code": "productType", "type": "SELECT", "labelKey": "filter.productType", "options": "PRODUCT_TYPES"},
    {"code": "currency", "type": "SELECT", "labelKey": "filter.currency", "options": "CURRENCIES"},
    {"code": "expiryFrom", "type": "DATE", "labelKey": "filter.expiryFrom"},
    {"code": "expiryTo", "type": "DATE", "labelKey": "filter.expiryTo"}
 ]',
 '[
    {"code": "referenceNumber", "labelKey": "column.reference", "type": "STRING", "sortable": true, "link": "/client/operations/{{id}}"},
    {"code": "productType", "labelKey": "column.productType", "type": "STRING", "sortable": true},
    {"code": "beneficiary", "labelKey": "column.beneficiary", "type": "STRING"},
    {"code": "amount", "labelKey": "column.amount", "type": "CURRENCY", "sortable": true},
    {"code": "currency", "labelKey": "column.currency", "type": "STRING"},
    {"code": "issueDate", "labelKey": "column.issueDate", "type": "DATE", "sortable": true},
    {"code": "expiryDate", "labelKey": "column.expiryDate", "type": "DATE", "sortable": true},
    {"code": "status", "labelKey": "column.status", "type": "BADGE"}
 ]',
 '["referenceNumber", "productType", "beneficiary", "amount", "currency", "expiryDate", "status"]',
 'expiryDate', 'ASC', '["PDF", "EXCEL", "CSV"]', 10000,
 'FiBriefcase', 'green', 2, 'CLIENT_REPORTS_VIEW', TRUE),

-- Request History Report
('CLIENT_REQUEST_HISTORY', 'report.client.requestHistory.name', 'report.client.requestHistory.desc',
 'LIST', 'REQUESTS', 'CLIENT',
 '/api/client-portal/reports/request-history',
 '{"dateFrom": "{{date.startOfYear}}", "dateTo": "{{date.today}}"}',
 '[
    {"code": "dateFrom", "type": "DATE", "labelKey": "filter.dateFrom"},
    {"code": "dateTo", "type": "DATE", "labelKey": "filter.dateTo"},
    {"code": "productType", "type": "SELECT", "labelKey": "filter.productType", "options": "PRODUCT_TYPES"},
    {"code": "status", "type": "MULTI_SELECT", "labelKey": "filter.status", "options": "REQUEST_STATUSES"}
 ]',
 '[
    {"code": "requestNumber", "labelKey": "column.requestNumber", "type": "STRING", "sortable": true, "link": "/client/requests/{{id}}"},
    {"code": "productType", "labelKey": "column.productType", "type": "STRING", "sortable": true},
    {"code": "amount", "labelKey": "column.amount", "type": "CURRENCY", "sortable": true},
    {"code": "createdAt", "labelKey": "column.createdAt", "type": "DATETIME", "sortable": true},
    {"code": "submittedAt", "labelKey": "column.submittedAt", "type": "DATETIME", "sortable": true},
    {"code": "status", "labelKey": "column.status", "type": "BADGE"},
    {"code": "processingDays", "labelKey": "column.processingDays", "type": "NUMBER"},
    {"code": "operationReference", "labelKey": "column.operationReference", "type": "STRING", "link": "/client/operations/{{operationId}}"}
 ]',
 '["requestNumber", "productType", "amount", "createdAt", "status", "processingDays", "operationReference"]',
 'createdAt', 'DESC', '["PDF", "EXCEL", "CSV"]', 10000,
 'FiClipboard', 'yellow', 3, 'CLIENT_REPORTS_VIEW', TRUE),

-- Commissions Report
('CLIENT_COMMISSIONS_REPORT', 'report.client.commissions.name', 'report.client.commissions.desc',
 'LIST', 'FINANCIAL', 'CLIENT',
 '/api/client-portal/reports/commissions',
 '{"dateFrom": "{{date.startOfMonth}}", "dateTo": "{{date.today}}"}',
 '[
    {"code": "dateFrom", "type": "DATE", "labelKey": "filter.dateFrom", "required": true},
    {"code": "dateTo", "type": "DATE", "labelKey": "filter.dateTo", "required": true},
    {"code": "productType", "type": "SELECT", "labelKey": "filter.productType", "options": "PRODUCT_TYPES"},
    {"code": "commissionType", "type": "SELECT", "labelKey": "filter.commissionType", "options": "COMMISSION_TYPES"}
 ]',
 '[
    {"code": "date", "labelKey": "column.date", "type": "DATE", "sortable": true},
    {"code": "referenceNumber", "labelKey": "column.reference", "type": "STRING", "sortable": true},
    {"code": "productType", "labelKey": "column.productType", "type": "STRING"},
    {"code": "commissionType", "labelKey": "column.commissionType", "type": "STRING"},
    {"code": "baseAmount", "labelKey": "column.baseAmount", "type": "CURRENCY"},
    {"code": "rate", "labelKey": "column.rate", "type": "PERCENTAGE"},
    {"code": "commissionAmount", "labelKey": "column.commissionAmount", "type": "CURRENCY", "sortable": true},
    {"code": "currency", "labelKey": "column.currency", "type": "STRING"}
 ]',
 '["date", "referenceNumber", "productType", "commissionType", "baseAmount", "rate", "commissionAmount"]',
 'date', 'DESC', '["PDF", "EXCEL", "CSV"]', 5000,
 'FiDollarSign', 'purple', 4, 'CLIENT_REPORTS_VIEW', TRUE);

-- ============================================
-- 7. User Dashboard Preferences Table
-- ============================================

CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    user_id CHAR(36) NOT NULL,
    dashboard_code VARCHAR(50) NOT NULL,

    -- Widget positions and visibility
    widget_layout JSON NOT NULL COMMENT 'Array of widget positions and visibility',

    -- Preferences
    auto_refresh BOOLEAN DEFAULT TRUE,
    refresh_interval_seconds INT NULL,
    theme VARCHAR(20) DEFAULT 'LIGHT',

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE KEY uk_user_dashboard (user_id, dashboard_code),

    -- Indexes
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User-specific dashboard customizations';
