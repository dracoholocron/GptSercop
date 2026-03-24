/**
 * Centralized API Routes Configuration
 * =====================================
 *
 * All API endpoints are defined here for better maintainability and control.
 * Import these constants in services instead of hardcoding routes.
 *
 * IMPORTANT:
 * - Routes should NOT include the /api prefix
 * - The API_BASE_URL in api.config.ts already includes it
 * - apiClient automatically prepends the base URL to all routes
 *
 * ORGANIZATION:
 * - Routes are grouped by domain/module
 * - Each group has a BASE route and specific endpoints
 * - Dynamic routes use functions: BY_ID: (id) => `/path/${id}`
 */

// =============================================================================
// AUTHENTICATION & AUTHORIZATION
// =============================================================================

export const AUTH_ROUTES = {
  // Local authentication
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  PROVIDERS: '/auth/providers',

  // OAuth2 SSO
  OAUTH2_INITIATE: (providerId: string) => `/auth/oauth2/${providerId}`,
  OAUTH2_CALLBACK: (provider: string) => `/auth/callback/${provider}`,

  // Current user permissions
  MY_PERMISSIONS: '/admin/permissions/me',
} as const;

// =============================================================================
// USER MANAGEMENT
// =============================================================================

export const USER_ROUTES = {
  BASE: '/users',
  BY_ID: (id: number | string) => `/users/${id}`,
  PROFILE: '/users/profile',
  CHANGE_PASSWORD: '/users/change-password',
  HISTORY: (id: number | string) => `/users/${id}/history`,

  // Roles (basic)
  ROLES: '/roles',
} as const;

// =============================================================================
// =============================================================================
// BRAND TEMPLATES
// =============================================================================

export const BRAND_TEMPLATE_ROUTES = {
  BASE: '/brand-templates',
  BY_ID: (id: string | number) => `/brand-templates/${id}`,
  ACTIVE: '/brand-templates/active',
  ACTIVATE: (id: string | number) => `/brand-templates/${id}/activate`,
  CLONE: (id: string | number) => `/brand-templates/${id}/clone`,
} as const;

// ADMIN - PERMISSIONS, ROLES, AUDIT
// =============================================================================

export const ADMIN_ROUTES = {
  // Permissions
  PERMISSIONS: {
    BASE: '/admin/permissions',
    MODULES: '/admin/permissions/modules',
    MATRIX: '/admin/permissions/matrix',
    BY_USER: (username: string) => `/admin/permissions/user/${encodeURIComponent(username)}`,
    ROLE_ASSIGN: (roleId: number) => `/admin/permissions/role/${roleId}/assign`,
    ROLE_REVOKE: (roleId: number, code: string) => `/admin/permissions/role/${roleId}/revoke/${encodeURIComponent(code)}`,
    ROLE_BULK_ASSIGN: (roleId: number) => `/admin/permissions/role/${roleId}/bulk-assign`,
    ROLE_BULK_REVOKE: (roleId: number) => `/admin/permissions/role/${roleId}/bulk-revoke`,
    ROLE_SYNC: (roleId: number) => `/admin/permissions/role/${roleId}/sync`,
  },

  // Roles (admin)
  ROLES: {
    BASE: '/roles',
    BY_ID: (id: number) => `/roles/${id}`,
  },

  // Security Audit
  AUDIT: {
    BASE: '/admin/audit',
    ALERTS: '/admin/audit/alerts',
    ALERT_ACKNOWLEDGE: (id: number) => `/admin/audit/alerts/${id}/acknowledge`,
    CRITICAL: '/admin/audit/critical',
    STATISTICS: '/admin/audit/statistics',
    EXPORT: '/admin/audit/export',
  },

  // Users (admin extended)
  USERS: {
    BASE: '/users',
    BY_ID: (id: number) => `/users/${id}`,
    LOCK: (id: number) => `/users/${id}/lock`,
    UNLOCK: (id: number) => `/users/${id}/unlock`,
    RESET_PASSWORD: (id: number) => `/users/${id}/reset-password`,
    FORCE_LOGOUT: (id: number) => `/users/${id}/force-logout`,
    ROLES: (id: number) => `/users/${id}/roles`,
    PENDING: '/users/pending',
    APPROVE: (id: number) => `/users/${id}/approve`,
    REJECT: (id: number) => `/users/${id}/reject`,
  },

  // Menu Configuration
  MENU: {
    USER: '/menu/user',
    ADMIN_ITEMS: '/menu/admin/items',
    ADMIN_ITEM_BY_ID: (id: number) => `/menu/admin/items/${id}`,
    ADMIN_ENDPOINTS: '/menu/admin/endpoints',
    ADMIN_ENDPOINT_BY_ID: (id: number) => `/menu/admin/endpoints/${id}`,
    ADMIN_ENDPOINT_MODULES: '/menu/admin/endpoints/modules',
    ADMIN_ITEMS_REORDER: '/menu/admin/items/reorder',
  },
  MONITORING: {
    STATS: '/monitoring/stats',
    LOGS: '/monitoring/logs',
    LOGS_DENIED: '/monitoring/logs/denied',
    LOGS_BY_USER: (username: string) => `/monitoring/logs/user/${username}`,
    TOP_USERS: '/monitoring/top-users',
    TOP_ENDPOINTS: '/monitoring/top-endpoints',
    SECURITY_ALERTS: '/monitoring/security-alerts',
    HOURLY: '/monitoring/hourly',
  },
} as const;

// =============================================================================
// OPERATIONS (v1)
// =============================================================================

export const OPERATIONS_ROUTES = {
  BASE: '/v1/operations',
  BY_ID: (operationId: string) => `/v1/operations/${operationId}`,
  BY_PRODUCT_TYPE: (productType: string) => `/v1/operations/product/${productType}`,
  SEARCH: '/v1/operations/search',
  AWAITING_RESPONSE: '/v1/operations/awaiting-response',
  OVERDUE_RESPONSES: '/v1/operations/overdue-responses',
  EXPIRING_SOON: '/v1/operations/expiring-soon',
  WITH_ALERTS: '/v1/operations/with-alerts',

  // Counts
  COUNT_BY_PRODUCT: (productType: string) => `/v1/operations/count/product/${productType}`,
  COUNT_AWAITING_RESPONSE: '/v1/operations/count/awaiting-response',
  COUNT_WITH_ALERTS: '/v1/operations/count/with-alerts',

  // Summary & Alerts
  SUMMARY: (operationId: string) => `/v1/operations/${operationId}/summary`,
  SUMMARY_REFRESH: (operationId: string) => `/v1/operations/${operationId}/summary/refresh`,
  ALERTS: (operationId: string) => `/v1/operations/${operationId}/alerts`,

  // Commands
  APPROVE: '/v1/operations/approve',
  EXECUTE_EVENT: (operationId: string) => `/v1/operations/${operationId}/execute-event`,
  RESPONSE_RECEIVED: (operationId: string) => `/v1/operations/${operationId}/response-received`,
} as const;

// =============================================================================
// SWIFT MESSAGES (v1)
// =============================================================================

export const SWIFT_MESSAGES_ROUTES = {
  BASE: '/v1/swift-messages',
  BY_ID: (messageId: string) => `/v1/swift-messages/${messageId}`,
  BY_OPERATION: (operationId: string) => `/v1/swift-messages/operation/${operationId}`,

  // Queries
  PENDING_RESPONSES: '/v1/swift-messages/pending-responses',
  OVERDUE_RESPONSES: '/v1/swift-messages/overdue-responses',
  PENDING_ACK: '/v1/swift-messages/pending-ack',
  SEARCH: '/v1/swift-messages/search',
  SEARCH_CONTENT: '/v1/swift-messages/search-content',

  // Counts
  COUNT_BY_DIRECTION: (direction: 'OUTBOUND' | 'INBOUND') => `/v1/swift-messages/count/direction/${direction}`,
  COUNT_PENDING_RESPONSES: '/v1/swift-messages/count/pending-responses',

  // Commands
  SEND: '/v1/swift-messages/send',
  RECEIVE: '/v1/swift-messages/receive',
  ACK: (messageId: string) => `/v1/swift-messages/${messageId}/ack`,
  PROCESSED: (messageId: string) => `/v1/swift-messages/${messageId}/processed`,
} as const;

// =============================================================================
// EVENT CONFIGURATION (v1)
// =============================================================================

export const EVENT_CONFIG_ROUTES = {
  // Event Types
  TYPES: {
    BASE: '/v1/event-config/types',
    BY_OPERATION: (operationType: string) => `/v1/event-config/types/${operationType}`,
    BY_OPERATION_AND_CODE: (operationType: string, eventCode: string) =>
      `/v1/event-config/types/${operationType}/${eventCode}`,
  },

  // Event Flows
  FLOWS: {
    BASE: '/v1/event-config/flows',
    BY_OPERATION: (operationType: string) => `/v1/event-config/flows/${operationType}`,
    AVAILABLE: (operationType: string) => `/v1/event-config/flows/${operationType}/available`,
    AVAILABLE_FOR_OPERATION: (operationId: string) => `/v1/event-config/flows/operation/${operationId}/available`,
    INITIAL: (operationType: string) => `/v1/event-config/flows/${operationType}/initial`,
  },

  // Response Configs
  RESPONSES: {
    BASE: '/v1/event-config/responses',
    BY_OPERATION: (operationType: string) => `/v1/event-config/responses/${operationType}`,
  },

  // Alert Templates
  ALERT_TEMPLATES: {
    BASE: '/v1/event-config/alert-templates',
    BY_OPERATION: (operationType: string) => `/v1/event-config/alert-templates/${operationType}`,
    BY_EVENT: (operationType: string, eventCode: string) => `/v1/event-config/alert-templates/${operationType}/event/${eventCode}`,
    GENERATE_FOR_EVENT: (operationType: string, eventCode: string) => `/v1/event-config/alert-templates/generate/${operationType}/${eventCode}`,
    GENERATE_FOR_ALL: (operationType: string) => `/v1/event-config/alert-templates/generate/${operationType}`,
  },

  // Operation Types
  OPERATION_TYPES: '/v1/event-config/operation-types',

  // Stages (dynamic)
  STAGES: '/v1/event-config/stages',
  STAGES_BY_OPERATION: (operationType: string) => `/v1/event-config/stages/${operationType}`,

  // SWIFT Message Types (dynamic)
  SWIFT_MESSAGE_TYPES: '/v1/event-config/swift-message-types',
} as const;

// =============================================================================
// EVENT LOGS (v1)
// =============================================================================

export const EVENT_LOG_ROUTES = {
  BY_OPERATION: (operationId: string) => `/v1/event-logs/operation/${operationId}`,
  RECENT: (operationId: string) => `/v1/event-logs/operation/${operationId}/recent`,
  LAST: (operationId: string) => `/v1/event-logs/operation/${operationId}/last`,
  TRANSITIONS: (operationId: string) => `/v1/event-logs/operation/${operationId}/transitions`,
  BY_MESSAGE: (swiftMessageId: string) => `/v1/event-logs/message/${swiftMessageId}`,
  COUNT_BY_OPERATION: (operationId: string) => `/v1/event-logs/count/operation/${operationId}`,
} as const;

// =============================================================================
// OPERATION LOCKS (v1)
// =============================================================================

export const OPERATION_LOCK_ROUTES = {
  BASE: '/v1/operation-locks',
  BY_ID: (operationId: string) => `/v1/operation-locks/${operationId}`,
  EXTEND: (operationId: string) => `/v1/operation-locks/${operationId}/extend`,
  FORCE_RELEASE: (operationId: string) => `/v1/operation-locks/${operationId}/force`,
  CAN_OPERATE: (operationId: string) => `/v1/operation-locks/${operationId}/can-operate`,
  ACTIVE: '/v1/operation-locks/active',
  BULK: '/v1/operation-locks/bulk',
  STATISTICS: '/v1/operation-locks/statistics',
} as const;

// =============================================================================
// GENERAL LEDGER ENTRIES (GLE)
// =============================================================================

export const GLE_ROUTES = {
  BASE: '/gle',
  SUMMARY: '/gle/summary',
  AI_STATS: '/gle/ai-stats',
  MONTHLY: '/gle/monthly',
  BY_ACCOUNT: '/gle/by-account',
  BY_ACCOUNT_NUMBER: (account: string) => `/gle/by-account/${encodeURIComponent(account)}`,
  BY_ACCOUNT_PREFIX: (prefix: string) => `/gle/by-account-prefix/${encodeURIComponent(prefix)}`,
  BY_CURRENCY: (currency: string) => `/gle/by-currency/${encodeURIComponent(currency)}`,
  BY_DATE_RANGE: '/gle/by-date-range',
  BY_REFERENCE: (reference: string) => `/gle/by-reference/${encodeURIComponent(reference)}`,
  RECENT: '/gle/recent',
  SEARCH: '/gle/search',
  SEARCH_REFERENCE: '/gle/search-reference',
  BALANCE: (reference: string) => `/gle/balance/${encodeURIComponent(reference)}`,
  GLOBAL_ACCOUNT_REPORT: '/gle/global-account-report',
  COMMISSIONS: '/gle/commissions',
  COMMISSIONS_PENDING: '/gle/commissions/pending',
  ACCOUNT_TRANSACTIONS: '/gle/account-transactions',
} as const;

// =============================================================================
// DASHBOARD (Business Intelligence)
// =============================================================================

export const DASHBOARD_ROUTES = {
  BASE: '/dashboard',
  SUMMARY: '/dashboard/summary',
  VOLUME_BY_PRODUCT: '/dashboard/volume-by-product',
  CURRENCY_DISTRIBUTION: '/dashboard/currency-distribution',
  TREND: '/dashboard/trend',
  STATUS_BREAKDOWN: '/dashboard/status-breakdown',
  TOP_CLIENTS: '/dashboard/top-clients',
  ACTIVITY_HEATMAP: '/dashboard/activity-heatmap',
  UPCOMING_EXPIRIES: '/dashboard/upcoming-expiries',
  PRODUCT_COMPARISON: '/dashboard/product-comparison',
  FILTERS: '/dashboard/filters',
} as const;

// =============================================================================
// FOREIGN TRADE - LETTERS OF CREDIT
// =============================================================================

export const LETTER_OF_CREDIT_ROUTES = {
  BASE: '/foreign-trade/letters-of-credit',
  QUERIES: '/foreign-trade/letters-of-credit/queries',
  DRAFTS: '/foreign-trade/letters-of-credit/drafts',
  BY_ID: (id: string | number) => `/foreign-trade/letters-of-credit/${id}`,
  DRAFT_BY_ID: (id: string | number) => `/foreign-trade/letters-of-credit/drafts/${id}`,
  CONVERT_TO_PERMANENT: (id: string | number) => `/foreign-trade/letters-of-credit/drafts/${id}/convert`,
  HISTORY: (id: string | number) => `/foreign-trade/letters-of-credit/${id}/history`,
  EVENTS: (aggregateId: string) => `/foreign-trade/letters-of-credit/events/${aggregateId}`,
} as const;

// =============================================================================
// FOREIGN TRADE - GUARANTEES
// =============================================================================

export const GUARANTEE_ROUTES = {
  BASE: '/foreign-trade/guarantees',
  DRAFTS: '/foreign-trade/guarantees/drafts',
  BY_ID: (id: string | number) => `/foreign-trade/guarantees/${id}`,
  DRAFT_BY_ID: (id: string | number) => `/foreign-trade/guarantees/drafts/${id}`,
  CONVERT_TO_PERMANENT: (id: string | number) => `/foreign-trade/guarantees/drafts/${id}/convert`,
} as const;

// =============================================================================
// FOREIGN TRADE - OPERATIONS (Legacy endpoint)
// =============================================================================

export const FOREIGN_TRADE_ROUTES = {
  OPERATIONS: '/foreign-trade/operations',
  BANK_GUARANTEES: '/foreign-trade/bank-guarantees',
} as const;

// =============================================================================
// PARTICIPANTS
// =============================================================================

export const PARTICIPANT_ROUTES = {
  BASE: '/participants',
  BY_ID: (id: string | number) => `/participants/${id}`,
  SEARCH: '/participants/search',
} as const;

// =============================================================================
// CURRENCIES & EXCHANGE RATES
// =============================================================================

export const CURRENCY_ROUTES = {
  BASE: '/currencies',
  BY_CODE: (code: string) => `/currencies/${code}`,
} as const;

export const EXCHANGE_RATE_ROUTES = {
  BASE: '/exchange-rates',
  LATEST: '/exchange-rates/latest',
  BY_DATE: (date: string) => `/exchange-rates/${date}`,
  CONVERT: '/exchange-rates/convert',
} as const;

// =============================================================================
// REFERENCE NUMBERS
// =============================================================================

export const REFERENCE_NUMBER_ROUTES = {
  GENERATE: '/reference-numbers/generate',
  PREVIEW: '/reference-numbers/preview',
  CONFIGURATIONS: '/reference-numbers/configurations',
  CONFIGURATION_BY_ID: (clientId: string, productCode: string, countryCode: string) =>
    `/reference-numbers/configurations/${clientId}/${productCode}/${countryCode}`,
  HISTORY_BY_NUMBER: (referenceNumber: string) => `/reference-numbers/history/${referenceNumber}`,
  HISTORY_BY_ENTITY: '/reference-numbers/history/entity',
} as const;

// =============================================================================
// SWIFT FIELD CONFIGURATION
// =============================================================================

export const SWIFT_FIELD_CONFIG_ROUTES = {
  BASE: '/swift-field-configs',
  BY_ID: (id: string) => `/swift-field-configs/${id}`,
  BY_MESSAGE_TYPE: (messageType: string) => `/swift-field-configs/message-type/${messageType}`,
} as const;

// =============================================================================
// SWIFT VALIDATION
// =============================================================================

export const SWIFT_VALIDATION_ROUTES = {
  VALIDATE_MESSAGE: '/swift/validate/message',
  VALIDATE_FIELD: '/swift/validate/field',
  VALIDATE_FORMAT: '/swift/validate/format',
} as const;

// =============================================================================
// TEMPLATES
// =============================================================================

export const TEMPLATE_ROUTES = {
  BASE: '/templates',
  BY_ID: (id: string | number) => `/templates/${id}`,
  BY_TYPE: (type: string) => `/templates/type/${type}`,
  CLONE: (id: string | number) => `/templates/${id}/clone`,
} as const;

export const EMAIL_TEMPLATE_ROUTES = {
  BASE: '/email-templates',
  BY_ID: (id: string | number) => `/email-templates/${id}`,
  BY_CODE: (code: string) => `/email-templates/code/${code}`,
  PREVIEW: '/email-templates/preview',
  SEND: '/email-templates/send',
} as const;

// =============================================================================
// COMMISSIONS
// =============================================================================

export const COMMISSION_ROUTES = {
  BASE: '/commissions',
  BY_ID: (id: string | number) => `/commissions/${id}`,
  CALCULATE: '/commissions/calculate',
  DEFERRED: '/commissions/deferred',
} as const;

// =============================================================================
// BANK ACCOUNTS
// =============================================================================

export const BANK_ACCOUNT_ROUTES = {
  BASE: '/bank-accounts',
  BY_ID: (id: string | number) => `/bank-accounts/${id}`,
  BY_ENTITY: (entityType: string, entityId: string) =>
    `/bank-accounts/entity/${entityType}/${entityId}`,
} as const;

// =============================================================================
// FINANCIAL INSTITUTIONS
// =============================================================================

export const FINANCIAL_INSTITUTION_ROUTES = {
  BASE: '/financial-institutions',
  BY_ID: (id: string | number) => `/financial-institutions/${id}`,
  BY_SWIFT_CODE: (swiftCode: string) => `/financial-institutions/swift/${swiftCode}`,
  SEARCH: '/financial-institutions/search',
} as const;

// =============================================================================
// EVENT RULES
// =============================================================================

export const EVENT_RULE_ROUTES = {
  BASE: '/event-rules',
  BY_ID: (id: string | number) => `/event-rules/${id}`,
  BY_EVENT_TYPE: (eventType: string) => `/event-rules/event-type/${eventType}`,
  EXECUTE: '/event-rules/execute',
} as const;

// =============================================================================
// CUSTOM CATALOGS
// =============================================================================

export const CUSTOM_CATALOG_ROUTES = {
  BASE: '/custom-catalogs',
  BY_ID: (id: string | number) => `/custom-catalogs/${id}`,
  BY_TYPE: (type: string) => `/custom-catalogs/type/${type}`,
  ITEMS: (catalogId: string | number) => `/custom-catalogs/${catalogId}/items`,
} as const;

// =============================================================================
// ACCOUNTING
// =============================================================================

export const ACCOUNTING_ROUTES = {
  BASE: '/accounting',
  ENTRIES: '/accounting/entries',
  ENTRY_BY_ID: (id: string | number) => `/accounting/entries/${id}`,
  RULES: '/accounting/rules',
  RULE_BY_ID: (id: string | number) => `/accounting/rules/${id}`,
  GENERATE_ENTRY: '/accounting/generate-entry',
  VALIDATE_ENTRY: '/accounting/validate-entry',
} as const;

// =============================================================================
// PENDING APPROVALS
// =============================================================================

export const PENDING_APPROVAL_ROUTES = {
  BASE: '/v1/pending-approvals',
  BY_ID: (id: string | number) => `/v1/pending-approvals/${id}`,
  APPROVE: (id: string | number) => `/v1/pending-approvals/${id}/approve`,
  REJECT: (id: string | number) => `/v1/pending-approvals/${id}/reject`,
  MY_PENDING: '/v1/pending-approvals/my-pending',
  COUNT: '/v1/pending-approvals/count',
} as const;

// =============================================================================
// DRAFTS
// =============================================================================

export const DRAFTS_ROUTES = {
  BASE: '/v1/drafts',
  BY_ID: (id: string | number) => `/v1/drafts/${id}`,
  BY_PRODUCT_TYPE: (productType: string) => `/v1/drafts/product/${productType}`,
  SUBMIT_FOR_APPROVAL: (id: string | number) => `/v1/drafts/${id}/submit`,
} as const;

// =============================================================================
// DOCUMENTS
// =============================================================================

export const DOCUMENT_ROUTES = {
  BASE: '/v1/documents',
  BY_ID: (id: string | number) => `/v1/documents/${id}`,
  BY_OPERATION: (operationId: string) => `/v1/documents/operation/${operationId}`,
  UPLOAD: '/v1/documents/upload',
  DOWNLOAD: (id: string | number) => `/v1/documents/${id}/download`,
} as const;

// =============================================================================
// AI ASSISTANT
// =============================================================================

export const AI_ROUTES = {
  CHAT: '/ai/chat',
  ANALYZE: '/ai/analyze',
  EXPORT: '/ai/export',
} as const;

// =============================================================================
// PRODUCT TYPE CONFIGURATION
// =============================================================================

export const PRODUCT_TYPE_CONFIG_ROUTES = {
  BASE: '/product-type-config',
  BY_CODE: (code: string) => `/product-type-config/${code}`,
  BY_CATEGORY: (category: string) => `/product-type-config/category/${category}`,
  ROUTING_MAP: '/product-type-config/routing-map',
} as const;

// =============================================================================
// SECURITY CONFIGURATION
// =============================================================================

export const SECURITY_CONFIG_ROUTES = {
  BASE: '/v1/admin/security-configuration',
  CONFIG: '/v1/admin/security-configuration/config',
  CONFIG_BY_TYPE: (type: string) => `/v1/admin/security-configuration/config/${type}`,
  PRESETS: '/v1/admin/security-configuration/presets',
  SYSTEM_PRESETS: '/v1/admin/security-configuration/presets/system',
  APPLY_PRESET: (code: string) => `/v1/admin/security-configuration/presets/${code}/apply`,
  FOUR_EYES: '/v1/admin/security-configuration/four-eyes',
  FOUR_EYES_BY_ENTITY: (entityType: string) => `/v1/admin/security-configuration/four-eyes/${entityType}`,
  FOUR_EYES_BY_ID: (id: number) => `/v1/admin/security-configuration/four-eyes/${id}`,
  AUDIT_LOG: '/v1/admin/security-configuration/audit-log',
  RISK_RULES: '/v1/admin/security-configuration/risk-rules',
  REFRESH: '/v1/admin/security-configuration/refresh',
} as const;

// =============================================================================
// RISK ENGINE
// =============================================================================

export const RISK_ENGINE_ROUTES = {
  BASE: '/v1/admin/risk-engine',
  // Rules
  RULES: '/v1/admin/risk-engine/rules',
  RULE_BY_ID: (id: number) => `/v1/admin/risk-engine/rules/${id}`,
  RULE_TOGGLE: (id: number) => `/v1/admin/risk-engine/rules/${id}/toggle`,
  RULE_POINTS: (id: number) => `/v1/admin/risk-engine/rules/${id}/points`,
  // Thresholds
  THRESHOLDS: '/v1/admin/risk-engine/thresholds',
  THRESHOLD_BY_ID: (id: number) => `/v1/admin/risk-engine/thresholds/${id}`,
  THRESHOLD_TOGGLE: (id: number) => `/v1/admin/risk-engine/thresholds/${id}/toggle`,
  // Events
  EVENTS: '/v1/admin/risk-engine/events',
  STATS: '/v1/admin/risk-engine/stats',
} as const;

// =============================================================================
// SYSTEM SCHEDULES
// =============================================================================

export const SCHEDULE_ROUTES = {
  // Current user status
  CURRENT_STATUS: '/schedules/current-status',

  // Global schedules (admin)
  GLOBAL: {
    BASE: '/admin/schedules/global',
    BY_ID: (id: number) => `/admin/schedules/global/${id}`,
    SET_DEFAULT: (id: number) => `/admin/schedules/global/${id}/set-default`,
  },

  // Holidays (admin)
  HOLIDAYS: {
    BASE: '/admin/schedules/holidays',
    BY_ID: (id: number) => `/admin/schedules/holidays/${id}`,
    UPCOMING: '/admin/schedules/holidays/upcoming',
  },

  // Exceptions (admin)
  EXCEPTIONS: {
    BASE: '/admin/schedules/exceptions',
    BY_ID: (id: number) => `/admin/schedules/exceptions/${id}`,
    PENDING: '/admin/schedules/exceptions/pending',
    APPROVE: (id: number) => `/admin/schedules/exceptions/${id}/approve`,
    REJECT: (id: number) => `/admin/schedules/exceptions/${id}/reject`,
  },

  // Access logs (admin)
  ACCESS_LOGS: {
    BASE: '/admin/schedules/access-logs',
    DENIED: '/admin/schedules/access-logs/denied',
  },

  // Permanent exemptions (admin)
  EXEMPTIONS: {
    USERS: {
      BASE: '/admin/schedule-exemptions/users',
      BY_ID: (id: number) => `/admin/schedule-exemptions/users/${id}`,
      TOGGLE: (id: number) => `/admin/schedule-exemptions/users/${id}/toggle`,
    },
    ROLES: {
      BASE: '/admin/schedule-exemptions/roles',
      BY_ID: (id: number) => `/admin/schedule-exemptions/roles/${id}`,
      TOGGLE: (id: number) => `/admin/schedule-exemptions/roles/${id}/toggle`,
    },
  },
} as const;

// =============================================================================
// CLIENT PORTAL CONFIG (Facade endpoints for CLIENT users)
// =============================================================================

export const CLIENT_PORTAL_CONFIG_ROUTES = {
  BRAND_TEMPLATES_ACTIVE: '/client-portal/config/brand-templates/active',
  SCHEDULES_STATUS: '/client-portal/config/schedules/current-status',
  SWIFT_SPEC_VERSIONS: '/client-portal/config/swift/spec-versions',
  MENU_USER: '/client-portal/config/menu/user',
  DASHBOARD_FILTERS: '/client-portal/config/dashboard/filters',
  DASHBOARD_SUMMARY: '/client-portal/config/dashboard/summary',
  PRODUCT_TYPE_CONFIG: '/client-portal/config/product-type-config',
  PRODUCT_TYPE_CONFIG_BY_CODE: (code: string) => `/client-portal/config/product-type-config/${code}`,
} as const;

// =============================================================================
// ALERTS & FOLLOW-UP
// =============================================================================

export const ALERT_ROUTES = {
  BASE: '/alerts',
  BY_ID: (alertId: string) => `/alerts/${alertId}`,
  AGENDA: '/alerts/agenda',
  CALENDAR: '/alerts/calendar',
  TODAY: '/alerts/today',
  UPCOMING: '/alerts/upcoming',
  OVERDUE: '/alerts/overdue',
  WIDGET: '/alerts/widget',
  COUNTS: '/alerts/counts',
  SEARCH: '/alerts/search',
  HISTORY: (alertId: string) => `/alerts/${alertId}/history`,
  COMPLETE: (alertId: string) => `/alerts/${alertId}/complete`,
  RESCHEDULE: (alertId: string) => `/alerts/${alertId}/reschedule`,
  SNOOZE: (alertId: string) => `/alerts/${alertId}/snooze`,
  CANCEL: (alertId: string) => `/alerts/${alertId}/cancel`,
  REASSIGN: (alertId: string) => `/alerts/${alertId}/reassign`,
  START: (alertId: string) => `/alerts/${alertId}/start`,
  PROGRESS: (alertId: string) => `/alerts/${alertId}/progress`,
  BY_OPERATION: (operationId: string) => `/alerts/by-operation/${operationId}`,
  BY_CLIENT: (clientId: string) => `/alerts/by-client/${clientId}`,
  TYPES: '/alerts/types',
  ROLES: '/alerts/roles',
  // Advanced search
  ADVANCED_SEARCH: '/alerts/search/advanced',
  ASSIGNED_BY_ME: '/alerts/assigned-by-me',
  ALL_ALERTS: '/alerts/all',
  SEARCH_COUNTS: '/alerts/search/counts',
  BY_TAG: (tag: string) => `/alerts/by-tag/${tag}`,
  UPDATE_TAGS: (alertId: string) => `/alerts/${alertId}/tags`,
  // Tags CRUD
  TAGS: '/alerts/tags',
  TAG_BY_ID: (id: number) => `/alerts/tags/${id}`,
} as const;

// =============================================================================
// FEATURE CERTIFICATION (Admin only)
// =============================================================================

export const FEATURE_CERTIFICATION_ROUTES = {
  BASE: '/admin/feature-certification',
  FLAT: '/admin/feature-certification/flat',
  STATS: '/admin/feature-certification/stats',
  BY_CODE: (code: string) => `/admin/feature-certification/code/${code}`,
  BY_STATUS: (status: string) => `/admin/feature-certification/status/${status}`,
  BY_ALERT_TAG: (tag: string) => `/admin/feature-certification/by-alert-tag/${tag}`,
} as const;

export const BUSINESS_REQUEST_ROUTES = {
  BASE: '/business-requests',
  BY_ID: (requestId: string) => `/business-requests/${requestId}`,
  BY_NUMBER: (requestNumber: string) => `/business-requests/by-number/${requestNumber}`,
  PENDING: '/business-requests/pending',
  PENDING_PAGED: '/business-requests/pending/paged',
  MY_PENDING: '/business-requests/my-pending',
  SEARCH: '/business-requests/search',
  COUNT: '/business-requests/count',
  APPROVE: (requestId: string) => `/business-requests/${requestId}/approve`,
  REJECT: (requestId: string) => `/business-requests/${requestId}/reject`,
  CANCEL: (requestId: string) => `/business-requests/${requestId}/cancel`,
  ALERTS_CONFIG: (requestId: string) => `/business-requests/${requestId}/alerts-config`,
} as const;

// =============================================================================
// VIDEO CONFERENCE
// =============================================================================

export const VIDEO_CONFERENCE_ROUTES = {
  // Providers
  PROVIDERS: '/video-conference/providers',

  // OAuth
  OAUTH_AUTHORIZE: (provider: string) => `/video-conference/oauth/${provider}/authorize`,
  OAUTH_CALLBACK: (provider: string) => `/video-conference/oauth/${provider}/callback`,
  OAUTH_STATUS: (provider: string) => `/video-conference/oauth/${provider}/status`,

  // Meetings
  MEETINGS: '/video-conference/meetings',
  MEETING_BY_ID: (id: number) => `/video-conference/meetings/${id}`,
  MEETING_CANCEL: (id: number) => `/video-conference/meetings/${id}/cancel`,
  MEETING_HISTORY: (id: number) => `/video-conference/meetings/${id}/history`,

  // Queries
  MEETINGS_BY_OPERATION: (operationId: string) =>
    `/video-conference/meetings/by-operation/${operationId}`,
  MEETINGS_UPCOMING: '/video-conference/meetings/upcoming',
  MEETINGS_UPCOMING_PAGED: '/video-conference/meetings/upcoming/paged',
  MEETINGS_SEARCH: '/video-conference/meetings/search',
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Helper function to build URL with query parameters
 *
 * @param route Base route
 * @param params Query parameters object
 * @returns Full URL with query string
 *
 * @example
 * buildUrlWithParams('/dashboard/summary', { period: 'month', currency: 'USD' })
 * // Returns: '/dashboard/summary?period=month&currency=USD'
 */
export const buildUrlWithParams = (route: string, params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${route}?${queryString}` : route;
};

/**
 * All routes exported as a single object for easy reference
 */
export const API_ROUTES = {
  AUTH: AUTH_ROUTES,
  USER: USER_ROUTES,
  ADMIN: ADMIN_ROUTES,
  OPERATIONS: OPERATIONS_ROUTES,
  SWIFT_MESSAGES: SWIFT_MESSAGES_ROUTES,
  EVENT_CONFIG: EVENT_CONFIG_ROUTES,
  EVENT_LOG: EVENT_LOG_ROUTES,
  OPERATION_LOCK: OPERATION_LOCK_ROUTES,
  GLE: GLE_ROUTES,
  DASHBOARD: DASHBOARD_ROUTES,
  LETTER_OF_CREDIT: LETTER_OF_CREDIT_ROUTES,
  GUARANTEE: GUARANTEE_ROUTES,
  FOREIGN_TRADE: FOREIGN_TRADE_ROUTES,
  PARTICIPANT: PARTICIPANT_ROUTES,
  CURRENCY: CURRENCY_ROUTES,
  EXCHANGE_RATE: EXCHANGE_RATE_ROUTES,
  REFERENCE_NUMBER: REFERENCE_NUMBER_ROUTES,
  SWIFT_FIELD_CONFIG: SWIFT_FIELD_CONFIG_ROUTES,
  SWIFT_VALIDATION: SWIFT_VALIDATION_ROUTES,
  TEMPLATE: TEMPLATE_ROUTES,
  EMAIL_TEMPLATE: EMAIL_TEMPLATE_ROUTES,
  COMMISSION: COMMISSION_ROUTES,
  BANK_ACCOUNT: BANK_ACCOUNT_ROUTES,
  FINANCIAL_INSTITUTION: FINANCIAL_INSTITUTION_ROUTES,
  EVENT_RULE: EVENT_RULE_ROUTES,
  CUSTOM_CATALOG: CUSTOM_CATALOG_ROUTES,
  ACCOUNTING: ACCOUNTING_ROUTES,
  PENDING_APPROVAL: PENDING_APPROVAL_ROUTES,
  DRAFTS: DRAFTS_ROUTES,
  DOCUMENT: DOCUMENT_ROUTES,
  AI: AI_ROUTES,
  PRODUCT_TYPE_CONFIG: PRODUCT_TYPE_CONFIG_ROUTES,
  BRAND_TEMPLATE: BRAND_TEMPLATE_ROUTES,
  SECURITY_CONFIG: SECURITY_CONFIG_ROUTES,
  RISK_ENGINE: RISK_ENGINE_ROUTES,
  SCHEDULE: SCHEDULE_ROUTES,
  ALERTS: ALERT_ROUTES,
  BUSINESS_REQUESTS: BUSINESS_REQUEST_ROUTES,
  VIDEO_CONFERENCE: VIDEO_CONFERENCE_ROUTES,
  FEATURE_CERTIFICATION: FEATURE_CERTIFICATION_ROUTES,
} as const;

