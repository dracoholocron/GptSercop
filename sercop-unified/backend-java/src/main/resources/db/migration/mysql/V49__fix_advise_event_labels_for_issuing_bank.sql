-- V49: Fix ADVISE event labels for LC_IMPORT
-- The label "Advise to Beneficiary" is misleading when acting as Issuing Bank
-- The Issuing Bank sends the LC to the Advising Bank, not directly to the beneficiary
-- This migration corrects the labels to reflect the actual role

-- =============================================
-- LC_IMPORT: Fix ADVISE event labels (Issuing Bank perspective)
-- =============================================

-- English: Change "Advise to Beneficiary" to "Transmit to Advising Bank"
UPDATE event_type_config_readmodel
SET event_name = 'Transmit to Advising Bank',
    event_description = 'Transmit the Letter of Credit to the Advising Bank via SWIFT MT710'
WHERE event_code = 'ADVISE'
  AND operation_type = 'LC_IMPORT'
  AND language = 'en';

-- Spanish: Change "Avisar al Beneficiario" to "Transmitir al Banco Avisador"
UPDATE event_type_config_readmodel
SET event_name = 'Transmitir al Banco Avisador',
    event_description = 'Transmitir la Carta de Credito al Banco Avisador via SWIFT MT710'
WHERE event_code = 'ADVISE'
  AND operation_type = 'LC_IMPORT'
  AND language = 'es';

-- =============================================
-- Update flow config labels to match
-- =============================================

-- English: Update flow transition label
UPDATE event_flow_config_readmodel
SET transition_label = 'Transmit to Advising Bank',
    transition_help = 'Send the LC to the Advising Bank who will notify the beneficiary'
WHERE to_event_code = 'ADVISE'
  AND operation_type = 'LC_IMPORT'
  AND language = 'en';

-- Spanish: Update flow transition label
UPDATE event_flow_config_readmodel
SET transition_label = 'Transmitir al Banco Avisador',
    transition_help = 'Enviar la LC al Banco Avisador quien notificara al beneficiario'
WHERE to_event_code = 'ADVISE'
  AND operation_type = 'LC_IMPORT'
  AND language = 'es';
