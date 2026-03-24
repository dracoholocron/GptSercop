-- ===========================================================================
-- V20260226: AUDITORÍA COMPLETA — Corregir campos SWIFT por tipo de mensaje
-- ===========================================================================
-- Basado en SWIFT Standards Release SR2018+ (November 2025)
-- Fuentes: Oracle Banking Trade Finance 14.7.3/14.8.0, iotafinance.com
--
-- Acciones por mensaje:
--   1. Desactivar campos que NO pertenecen al mensaje
--   2. Corregir is_required (M=mandatory, O=optional por spec)
--   3. Insertar campos faltantes que SÍ pertenecen al mensaje
-- ===========================================================================

-- =============================================
-- MT700 — Issue of a Documentary Credit
-- =============================================
-- Spec fields (SR2018+, 39): 27,40A,20,23,31C,40E,31D,51a,50,59,32B,39A,39C,
--   41a,42C,42a,42M,42P,43P,43T,44A,44E,44F,44B,44C,44D,45A,46A,47A,
--   49G,49H,71D,48,49,58a,53a,78,57a,72Z

-- :39B: removed in SR2018 (replaced by 39A + 32B interaction)
UPDATE swift_field_config_readmodel SET is_active = false
WHERE message_type = 'MT700' AND field_code = ':39B:' AND is_active = true;

-- Fix is_required: :43P: and :43T: are OPTIONAL per spec (not mandatory)
UPDATE swift_field_config_readmodel SET is_required = false
WHERE message_type = 'MT700' AND field_code IN (':43P:', ':43T:') AND is_required = true;

-- Fix is_required: :41a: and :49: are MANDATORY per spec
UPDATE swift_field_config_readmodel SET is_required = true
WHERE message_type = 'MT700' AND field_code IN (':41a:', ':49:') AND is_required = false;

-- Fix casing: :57A: should be :57a: (option letter is lowercase per SWIFT convention)
-- Note: Only update if :57a: doesn't already exist for MT700
UPDATE swift_field_config_readmodel SET field_code = ':57a:'
WHERE message_type = 'MT700' AND field_code = ':57A:'
  AND NOT EXISTS (SELECT 1 FROM (SELECT id FROM swift_field_config_readmodel WHERE message_type = 'MT700' AND field_code = ':57a:') tmp);

-- =============================================
-- MT707 — Amendment to a Documentary Credit
-- =============================================
-- Spec fields (SR2018+): 27,20,21,21A,23,52a,51a,50,50B,31C,26E,30,22A,23S,
--   40A,40E,31D,59,32B,33B,39A,39C,41a,42C,42a,42M,42P,43P,43T,44A,44E,
--   44F,44B,44C,44D,45B,46B,47B,49M,49N,71D,71N,72Z,57a,78,53a,58a,49,48

-- Fix is_required: :23: is OPTIONAL per spec (conditional on pre-advice)
UPDATE swift_field_config_readmodel SET is_required = false
WHERE message_type = 'MT707' AND field_code = ':23:' AND is_required = true;

-- =============================================
-- MT710 — Advice of a Third Bank's Documentary Credit
-- =============================================
-- Spec mandatory: 27,40B,20,21,31C,40E,31D,52a,50,59,32B,41a,45A,46A,49

-- Fix is_required: :45A:, :46A:, :52a: are MANDATORY
UPDATE swift_field_config_readmodel SET is_required = true
WHERE message_type = 'MT710' AND field_code IN (':45A:', ':46A:', ':52a:') AND is_required = false;

-- =============================================
-- MT720 — Transfer of a Documentary Credit
-- =============================================
-- Spec mandatory: 27,40B,20,21,31C,40E,31D,50,59,32B,41a,45A,46A,49,52a

-- :78D: does NOT belong to MT720 (it belongs to MT710 only)
UPDATE swift_field_config_readmodel SET is_active = false
WHERE message_type = 'MT720' AND field_code = ':78D:' AND is_active = true;

-- Fix is_required: :45A:, :46A:, :52a: are MANDATORY
UPDATE swift_field_config_readmodel SET is_required = true
WHERE message_type = 'MT720' AND field_code IN (':45A:', ':46A:', ':52a:') AND is_required = false;

-- =============================================
-- MT730 — Acknowledgement (Documentary Credit)
-- =============================================
-- Spec fields (9): 20(M),21(M),25(O),30(O),32a(O),57a(O),71D(O),72Z(O),79Z(O)

-- :52a: does NOT belong to MT730
UPDATE swift_field_config_readmodel SET is_active = false
WHERE message_type = 'MT730' AND field_code = ':52a:' AND is_active = true;

-- Insert missing fields for MT730
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':30:', 'swift.mt730.30.fieldName', 'swift.mt730.30.description', 'MT730', 'BASIC', 3, false, true, 'DATE', 'DATE_PICKER', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT730' AND field_code = ':30:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':32a:', 'swift.mt730.32a.fieldName', 'swift.mt730.32a.description', 'MT730', 'AMOUNTS', 4, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT730' AND field_code = ':32a:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':57a:', 'swift.mt730.57a.fieldName', 'swift.mt730.57a.description', 'MT730', 'BANKS', 5, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT730' AND field_code = ':57a:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':71D:', 'swift.mt730.71D.fieldName', 'swift.mt730.71D.description', 'MT730', 'CHARGES', 6, false, true, 'TEXTAREA', 'TEXTAREA', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT730' AND field_code = ':71D:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':72Z:', 'swift.mt730.72Z.fieldName', 'swift.mt730.72Z.description', 'MT730', 'ADDITIONAL', 7, false, true, 'TEXTAREA', 'TEXTAREA', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT730' AND field_code = ':72Z:');

-- =============================================
-- MT740 — Authorisation to Reimburse
-- =============================================
-- Spec fields (17): 20(M),25(O),40F(M),31D(M),58a(M),59(M),32B(M),39A(O),
--   39C(O),41a(M),42C(O),42a(O),42M(O),42P(O),71A(O),71D(O),72Z(O)

-- :59N:, :59P:, :59R:, :59S:, :59T: do NOT belong — should be :59:
UPDATE swift_field_config_readmodel SET is_active = false
WHERE message_type = 'MT740' AND field_code IN (':59N:', ':59P:', ':59R:', ':59S:', ':59T:') AND is_active = true;

-- Insert standard :59: if missing
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':59:', 'swift.mt740.59.fieldName', 'swift.mt740.59.description', 'MT740', 'PARTIES', 6, true, true, 'PARTICIPANT', 'PARTICIPANT_SELECTOR', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT740' AND field_code = ':59:' AND is_active = true);

-- Fix is_required: :31D:, :58a:, :59: are MANDATORY
UPDATE swift_field_config_readmodel SET is_required = true
WHERE message_type = 'MT740' AND field_code IN (':31D:', ':58a:') AND is_required = false;

-- =============================================
-- MT747 — Amendment to an Authorisation to Reimburse
-- =============================================
-- Spec fields (11): 20(M),21(M),30(M),31E(O),32B(O),33B(O),34B(O),39A(O),39C(O),72Z(O),77(O)
-- Currently EMPTY in DB — need full population

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':20:', 'swift.mt747.20.fieldName', 'swift.mt747.20.description', 'MT747', 'BASIC', 1, true, true, 'TEXT', 'TEXT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT747' AND field_code = ':20:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':21:', 'swift.mt747.21.fieldName', 'swift.mt747.21.description', 'MT747', 'BASIC', 2, true, true, 'TEXT', 'TEXT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT747' AND field_code = ':21:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':30:', 'swift.mt747.30.fieldName', 'swift.mt747.30.description', 'MT747', 'DATES', 3, true, true, 'DATE', 'DATE_PICKER', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT747' AND field_code = ':30:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':31E:', 'swift.mt747.31E.fieldName', 'swift.mt747.31E.description', 'MT747', 'DATES', 4, false, true, 'DATE', 'DATE_PICKER', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT747' AND field_code = ':31E:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':32B:', 'swift.mt747.32B.fieldName', 'swift.mt747.32B.description', 'MT747', 'AMOUNTS', 5, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT747' AND field_code = ':32B:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':33B:', 'swift.mt747.33B.fieldName', 'swift.mt747.33B.description', 'MT747', 'AMOUNTS', 6, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT747' AND field_code = ':33B:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':34B:', 'swift.mt747.34B.fieldName', 'swift.mt747.34B.description', 'MT747', 'AMOUNTS', 7, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT747' AND field_code = ':34B:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':39A:', 'swift.mt747.39A.fieldName', 'swift.mt747.39A.description', 'MT747', 'AMOUNTS', 8, false, true, 'NUMBER', 'INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT747' AND field_code = ':39A:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':39C:', 'swift.mt747.39C.fieldName', 'swift.mt747.39C.description', 'MT747', 'AMOUNTS', 9, false, true, 'TEXTAREA', 'TEXTAREA', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT747' AND field_code = ':39C:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':72Z:', 'swift.mt747.72Z.fieldName', 'swift.mt747.72Z.description', 'MT747', 'ADDITIONAL', 10, false, true, 'TEXTAREA', 'TEXTAREA', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT747' AND field_code = ':72Z:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':77:', 'swift.mt747.77.fieldName', 'swift.mt747.77.description', 'MT747', 'ADDITIONAL', 11, false, true, 'TEXTAREA', 'TEXTAREA', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT747' AND field_code = ':77:');

-- =============================================
-- MT760 — Guarantee / Standby Letter of Credit
-- =============================================
-- :41a: does NOT belong to MT760 (it belongs to MT700/710/720/740)
UPDATE swift_field_config_readmodel SET is_active = false
WHERE message_type = 'MT760' AND field_code = ':41a:' AND is_active = true;

-- Fix is_required: Many fields are sequence-dependent in MT760
-- Sequence markers :15A:, :15B:, :15C: should be optional (auto-generated)
UPDATE swift_field_config_readmodel SET is_required = false
WHERE message_type = 'MT760' AND field_code IN (':15A:', ':15B:', ':15C:') AND is_required = true;

-- Fields ONLY in Seq C (not always present): :22K:, :22Y:, :40D:, :77L:
UPDATE swift_field_config_readmodel SET is_required = false
WHERE message_type = 'MT760' AND field_code IN (':22K:', ':22Y:', ':40D:', ':77L:') AND is_required = true;

-- :27: is mandatory in MT760
UPDATE swift_field_config_readmodel SET is_required = true
WHERE message_type = 'MT760' AND field_code = ':27:' AND is_required = false;

-- =============================================
-- MT768 — Acknowledgement of Guarantee/Standby Message
-- =============================================
-- Spec fields (9): 20(M),21(M),25(O),30(O),32a(O),57a(O),71D(O),72Z(O),23X(O)
-- Current DB is SEVERELY wrong — almost all fields are from other MTs

-- Deactivate all incorrect fields
UPDATE swift_field_config_readmodel SET is_active = false
WHERE message_type = 'MT768' AND field_code IN (':23:', ':31D:', ':32B:', ':50:', ':52a:', ':59:', ':72:') AND is_active = true;

-- Insert correct fields
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':25:', 'swift.mt768.25.fieldName', 'swift.mt768.25.description', 'MT768', 'BASIC', 3, false, true, 'TEXT', 'TEXT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT768' AND field_code = ':25:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':30:', 'swift.mt768.30.fieldName', 'swift.mt768.30.description', 'MT768', 'DATES', 4, false, true, 'DATE', 'DATE_PICKER', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT768' AND field_code = ':30:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':32a:', 'swift.mt768.32a.fieldName', 'swift.mt768.32a.description', 'MT768', 'AMOUNTS', 5, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT768' AND field_code = ':32a:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':57a:', 'swift.mt768.57a.fieldName', 'swift.mt768.57a.description', 'MT768', 'BANKS', 6, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT768' AND field_code = ':57a:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':71D:', 'swift.mt768.71D.fieldName', 'swift.mt768.71D.description', 'MT768', 'CHARGES', 7, false, true, 'TEXTAREA', 'TEXTAREA', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT768' AND field_code = ':71D:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':72Z:', 'swift.mt768.72Z.fieldName', 'swift.mt768.72Z.description', 'MT768', 'ADDITIONAL', 8, false, true, 'TEXTAREA', 'TEXTAREA', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT768' AND field_code = ':72Z:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':23X:', 'swift.mt768.23X.fieldName', 'swift.mt768.23X.description', 'MT768', 'BASIC', 9, false, true, 'TEXT', 'TEXT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT768' AND field_code = ':23X:');

-- =============================================
-- MT769 — Advice of Reduction or Release
-- =============================================
-- Spec fields (11): 20(M),21(M),25(O),30(O),32a(O),33B(O),34B(O),39C(O),57a(O),71B(O),72(O)

-- Deactivate incorrect fields
UPDATE swift_field_config_readmodel SET is_active = false
WHERE message_type = 'MT769' AND field_code IN (':23:', ':77C:') AND is_active = true;

-- :32B: should be :32a: (option A/B/K per spec)
UPDATE swift_field_config_readmodel SET field_code = ':32a:'
WHERE message_type = 'MT769' AND field_code = ':32B:'
  AND NOT EXISTS (SELECT 1 FROM (SELECT id FROM swift_field_config_readmodel WHERE message_type = 'MT769' AND field_code = ':32a:') tmp);

-- Insert missing fields
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':25:', 'swift.mt769.25.fieldName', 'swift.mt769.25.description', 'MT769', 'BASIC', 3, false, true, 'TEXT', 'TEXT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT769' AND field_code = ':25:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':34B:', 'swift.mt769.34B.fieldName', 'swift.mt769.34B.description', 'MT769', 'AMOUNTS', 7, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT769' AND field_code = ':34B:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':39C:', 'swift.mt769.39C.fieldName', 'swift.mt769.39C.description', 'MT769', 'AMOUNTS', 8, false, true, 'TEXTAREA', 'TEXTAREA', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT769' AND field_code = ':39C:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':57a:', 'swift.mt769.57a.fieldName', 'swift.mt769.57a.description', 'MT769', 'BANKS', 9, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT769' AND field_code = ':57a:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':71B:', 'swift.mt769.71B.fieldName', 'swift.mt769.71B.description', 'MT769', 'CHARGES', 10, false, true, 'TEXTAREA', 'TEXTAREA', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT769' AND field_code = ':71B:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':72:', 'swift.mt769.72.fieldName', 'swift.mt769.72.description', 'MT769', 'ADDITIONAL', 11, false, true, 'TEXTAREA', 'TEXTAREA', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT769' AND field_code = ':72:');

-- =============================================
-- MT400 — Advice of Payment
-- =============================================
-- Spec fields (12): 20(M),21(M),32a(M),33A(O),52a(O),53a(O),54a(O),57a(O),58a(O),71B(O),72(O),73(O)

-- :59: does NOT belong to MT400
UPDATE swift_field_config_readmodel SET is_active = false
WHERE message_type = 'MT400' AND field_code = ':59:' AND is_active = true;

-- Insert missing fields
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':33A:', 'swift.mt400.33A.fieldName', 'swift.mt400.33A.description', 'MT400', 'AMOUNTS', 4, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT400' AND field_code = ':33A:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':53a:', 'swift.mt400.53a.fieldName', 'swift.mt400.53a.description', 'MT400', 'BANKS', 5, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT400' AND field_code = ':53a:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':54a:', 'swift.mt400.54a.fieldName', 'swift.mt400.54a.description', 'MT400', 'BANKS', 6, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT400' AND field_code = ':54a:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':57a:', 'swift.mt400.57a.fieldName', 'swift.mt400.57a.description', 'MT400', 'BANKS', 7, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT400' AND field_code = ':57a:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':58a:', 'swift.mt400.58a.fieldName', 'swift.mt400.58a.description', 'MT400', 'BANKS', 8, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT400' AND field_code = ':58a:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':71B:', 'swift.mt400.71B.fieldName', 'swift.mt400.71B.description', 'MT400', 'CHARGES', 9, false, true, 'TEXTAREA', 'TEXTAREA', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT400' AND field_code = ':71B:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':73:', 'swift.mt400.73.fieldName', 'swift.mt400.73.description', 'MT400', 'CHARGES', 10, false, true, 'TEXTAREA', 'TEXTAREA', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT400' AND field_code = ':73:');

-- =============================================
-- MT410 — Acknowledgement (Collections)
-- =============================================
-- Spec fields (4): 20(M),21(M),32a(O),72(O)

-- Deactivate fields that don't belong
UPDATE swift_field_config_readmodel SET is_active = false
WHERE message_type = 'MT410' AND field_code IN (':23:', ':52a:', ':59:') AND is_active = true;

-- Insert missing fields
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':32a:', 'swift.mt410.32a.fieldName', 'swift.mt410.32a.description', 'MT410', 'AMOUNTS', 3, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT410' AND field_code = ':32a:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':72:', 'swift.mt410.72.fieldName', 'swift.mt410.72.description', 'MT410', 'ADDITIONAL', 4, false, true, 'TEXTAREA', 'TEXTAREA', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT410' AND field_code = ':72:');

-- =============================================
-- MT412 — Advice of Acceptance
-- =============================================
-- Spec fields (4): 20(M),21(M),32A(M),72(O)

-- Deactivate fields that don't belong
UPDATE swift_field_config_readmodel SET is_active = false
WHERE message_type = 'MT412' AND field_code IN (':33a:', ':52a:', ':59:') AND is_active = true;

-- =============================================
-- MT416 — Advice of Non-Payment/Non-Acceptance
-- =============================================
-- Spec Seq A (7): 20(M),21(M),23E(O),51A(O),53a(O),71F(O),77A(M)
-- Spec Seq B repeating (8): 21A(M),23E(O),21C(O),32a(M),50D(O),59(O),71F(O),77A(O)

-- :52a: should be :51A: (Sending Institution, not Issuing Bank)
UPDATE swift_field_config_readmodel SET is_active = false
WHERE message_type = 'MT416' AND field_code = ':52a:' AND is_active = true;

-- Insert missing Sequence A fields
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':23E:', 'swift.mt416.23E.fieldName', 'swift.mt416.23E.description', 'MT416', 'BASIC', 3, false, true, 'TEXT', 'TEXT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT416' AND field_code = ':23E:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':51A:', 'swift.mt416.51A.fieldName', 'swift.mt416.51A.description', 'MT416', 'BANKS', 4, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT416' AND field_code = ':51A:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':53a:', 'swift.mt416.53a.fieldName', 'swift.mt416.53a.description', 'MT416', 'BANKS', 5, false, true, 'INSTITUTION', 'FINANCIAL_INSTITUTION_SELECTOR', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT416' AND field_code = ':53a:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':71F:', 'swift.mt416.71F.fieldName', 'swift.mt416.71F.description', 'MT416', 'CHARGES', 6, false, true, 'TEXTAREA', 'TEXTAREA', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT416' AND field_code = ':71F:');

-- Insert missing Sequence B fields
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':21A:', 'swift.mt416.21A.fieldName', 'swift.mt416.21A.description', 'MT416', 'REFERENCES', 7, true, true, 'TEXT', 'TEXT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT416' AND field_code = ':21A:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':21C:', 'swift.mt416.21C.fieldName', 'swift.mt416.21C.description', 'MT416', 'REFERENCES', 8, false, true, 'TEXT', 'TEXT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT416' AND field_code = ':21C:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':32a:', 'swift.mt416.32a.fieldName', 'swift.mt416.32a.description', 'MT416', 'AMOUNTS', 9, true, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT416' AND field_code = ':32a:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':50D:', 'swift.mt416.50D.fieldName', 'swift.mt416.50D.description', 'MT416', 'PARTIES', 10, false, true, 'TEXTAREA', 'TEXTAREA', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT416' AND field_code = ':50D:');

-- =============================================
-- MT420 — Tracer (Collections)
-- =============================================
-- Spec fields (6): 20(M),21(M),32a(O),30(O),59(O),72(O)

-- Deactivate fields that don't belong
UPDATE swift_field_config_readmodel SET is_active = false
WHERE message_type = 'MT420' AND field_code IN (':11S:', ':52a:', ':79:') AND is_active = true;

-- Insert missing fields
INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':32a:', 'swift.mt420.32a.fieldName', 'swift.mt420.32a.description', 'MT420', 'AMOUNTS', 3, false, true, 'CURRENCY', 'CURRENCY_AMOUNT_INPUT', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT420' AND field_code = ':32a:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':30:', 'swift.mt420.30.fieldName', 'swift.mt420.30.description', 'MT420', 'DATES', 4, false, true, 'DATE', 'DATE_PICKER', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT420' AND field_code = ':30:');

INSERT INTO swift_field_config_readmodel (id, field_code, field_name_key, description_key, message_type, section, display_order, is_required, is_active, field_type, component_type, spec_version, created_by)
SELECT UUID(), ':72:', 'swift.mt420.72.fieldName', 'swift.mt420.72.description', 'MT420', 'ADDITIONAL', 6, false, true, 'TEXTAREA', 'TEXTAREA', '2025', 'V20260226_AUDIT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM swift_field_config_readmodel WHERE message_type = 'MT420' AND field_code = ':72:');

-- =============================================
-- VERIFICATION QUERY
-- =============================================
SELECT message_type,
       COUNT(*) as total_active,
       SUM(CASE WHEN is_required THEN 1 ELSE 0 END) as mandatory,
       SUM(CASE WHEN NOT is_required THEN 1 ELSE 0 END) as optional
FROM swift_field_config_readmodel
WHERE is_active = true
GROUP BY message_type
ORDER BY message_type;
