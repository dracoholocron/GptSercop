# Legacy vs apps Convergence Matrix

| Legacy route | Closest apps/* module | Decision | Notes |
|---|---|---|---|
| `/admin/external-api-audit` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/admin/external-api-config` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/admin/menu-config` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/admin/schedules` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/admin/security-audit` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/admin/security-configuration` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/admin/workflow-config` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/ai-analysis/assistant` | `sercop-admin` | `EXTEND_LEGACY_WITH_GPT` | Embed GPTsercop conversational + analysis endpoints in legacy AI section |
| `/ai-analysis/chat` | `sercop-admin` | `EXTEND_LEGACY_WITH_GPT` | Embed GPTsercop conversational + analysis endpoints in legacy AI section |
| `/ai-analysis/commissions` | `sercop-admin` | `EXTEND_LEGACY_WITH_GPT` | Embed GPTsercop conversational + analysis endpoints in legacy AI section |
| `/ai-analysis/regulatory-reporting` | `sercop-admin` | `EXTEND_LEGACY_WITH_GPT` | Embed GPTsercop conversational + analysis endpoints in legacy AI section |
| `/aval-descuento/expert` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/aval-descuento/wizard` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/business-intelligence` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/accounting-rules` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/action-type-config` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/bank-accounts` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/brand-templates` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/commissions` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/currencies` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/custom` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/custom-fields` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/email-actions` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/email-providers` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/email-queue` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/email-templates` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/event-rules` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/event-types` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/exchange-rates` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/financial-institutions` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/participants` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/product-types` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/reference-number` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/swift-fields` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/swift-responses` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/template-variables` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/catalogs/templates` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/collection-exports/expert` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/collection-exports/wizard` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/collection-imports/expert` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/collection-imports/wizard` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/collections/issuance-expert` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/collections/issuance-wizard` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/collections/payment-notice` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/collections/tracking` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/document-management` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/guarantee-mandataria/expert` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/guarantee-mandataria/wizard` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/guarantees/issuance-client` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/guarantees/issuance-expert` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/guarantees/issuance-wizard` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/guarantees/payment` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/lc-exports/issuance-client` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/lc-exports/issuance-expert` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/lc-exports/issuance-wizard` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/lc-imports/issuance-client` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/lc-imports/issuance-expert` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/lc-imports/issuance-wizard` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/operations/active` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/operations/awaiting-response` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/operations/client-requests/stage/aprobacion` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/operations/client-requests/stage/comisiones` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/operations/client-requests/stage/compliance` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/operations/client-requests/stage/finalizado` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/operations/client-requests/stage/recepcion` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/operations/client-requests/stage/registro` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/operations/client-requests/stage/validacion` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/operations/event-history` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/permissions` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/reports` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/standby-lc/expert` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/standby-lc/wizard` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/swift-message-center` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/trade-financing/expert` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/trade-financing/wizard` | `supplier-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Preserve legacy UX and plug GPT assist panels in forms/wizards |
| `/users` | `public-portal` | `KEEP_LEGACY` | No duplicate portal route; legacy remains source of truth |
| `/workbox/aval-descuento` | `entity-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Keep legacy route and consume GPT risk/summary endpoints in detail views |
| `/workbox/collection-exports` | `entity-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Keep legacy route and consume GPT risk/summary endpoints in detail views |
| `/workbox/collection-imports` | `entity-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Keep legacy route and consume GPT risk/summary endpoints in detail views |
| `/workbox/collections` | `entity-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Keep legacy route and consume GPT risk/summary endpoints in detail views |
| `/workbox/drafts` | `entity-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Keep legacy route and consume GPT risk/summary endpoints in detail views |
| `/workbox/guarantee-mandataria` | `entity-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Keep legacy route and consume GPT risk/summary endpoints in detail views |
| `/workbox/guarantees` | `entity-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Keep legacy route and consume GPT risk/summary endpoints in detail views |
| `/workbox/lc-exports` | `entity-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Keep legacy route and consume GPT risk/summary endpoints in detail views |
| `/workbox/lc-imports` | `entity-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Keep legacy route and consume GPT risk/summary endpoints in detail views |
| `/workbox/pending-approval` | `entity-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Keep legacy route and consume GPT risk/summary endpoints in detail views |
| `/workbox/standby-lc` | `entity-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Keep legacy route and consume GPT risk/summary endpoints in detail views |
| `/workbox/trade-financing` | `entity-portal` | `KEEP_LEGACY_AND_INTEGRATE` | Keep legacy route and consume GPT risk/summary endpoints in detail views |