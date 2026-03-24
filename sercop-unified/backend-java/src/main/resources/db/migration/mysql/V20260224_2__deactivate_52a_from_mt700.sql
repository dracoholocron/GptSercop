-- Deactivate field :52a: from MT700
-- Per SWIFT MT700 specification, field 52a (Issuing Bank) does NOT exist in MT700.
-- The issuing bank is implicitly the sender of the MT700 message.
-- MT700 bank fields per spec: 51a (Applicant Bank), 53a (Reimbursing Bank),
-- 57a (Advise Through Bank), 58a (Requested Confirmation Party).
-- Field :52a: was incorrectly added in the original seed data.

UPDATE swift_field_config_readmodel
SET is_active = false
WHERE field_code = ':52a:' AND message_type = 'MT700';
