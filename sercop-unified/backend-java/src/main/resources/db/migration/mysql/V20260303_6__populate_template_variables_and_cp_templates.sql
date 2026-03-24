-- =============================================================================
-- V20260303_6: Populate template_variable_read_model with base + CP variables
-- and create CP document templates in template_read_model
-- =============================================================================
-- template_variable_read_model: Catalog of #{variable} placeholders for emails,
--   documents, and API calls. Each variable maps to a source table/column.
-- template_read_model: Document templates that use these variables.
-- swift_field_config_readmodel: Defines field configurations that CP variables reference.
-- =============================================================================

-- =============================================================================
-- 1. RE-POPULATE BASE VARIABLES (were lost, originally from V134)
-- =============================================================================

-- Category: OPERATION (blue) - from operation_readmodel
INSERT INTO template_variable_read_model (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order)
VALUES
('operationId', 'templateVar.operation.operationId', 'templateVar.operation.operationId.desc', 'OPERATION', 'blue', 'operation_readmodel', 'operation_id', 'STRING', 1),
('reference', 'templateVar.operation.reference', 'templateVar.operation.reference.desc', 'OPERATION', 'blue', 'operation_readmodel', 'reference', 'STRING', 2),
('productType', 'templateVar.operation.productType', 'templateVar.operation.productType.desc', 'OPERATION', 'blue', 'operation_readmodel', 'product_type', 'STRING', 3),
('messageType', 'templateVar.operation.messageType', 'templateVar.operation.messageType.desc', 'OPERATION', 'blue', 'operation_readmodel', 'message_type', 'STRING', 4),
('stage', 'templateVar.operation.stage', 'templateVar.operation.stage.desc', 'OPERATION', 'blue', 'operation_readmodel', 'stage', 'STRING', 5),
('status', 'templateVar.operation.status', 'templateVar.operation.status.desc', 'OPERATION', 'blue', 'operation_readmodel', 'status', 'STRING', 6),
('creationMode', 'templateVar.operation.creationMode', 'templateVar.operation.creationMode.desc', 'OPERATION', 'blue', 'operation_readmodel', 'creation_mode', 'STRING', 7),
('amendmentCount', 'templateVar.operation.amendmentCount', 'templateVar.operation.amendmentCount.desc', 'OPERATION', 'blue', 'operation_readmodel', 'amendment_count', 'NUMBER', 8),
('messageCount', 'templateVar.operation.messageCount', 'templateVar.operation.messageCount.desc', 'OPERATION', 'blue', 'operation_readmodel', 'message_count', 'NUMBER', 9),
('version', 'templateVar.operation.version', 'templateVar.operation.version.desc', 'OPERATION', 'blue', 'operation_readmodel', 'version', 'NUMBER', 10)
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), description_key = VALUES(description_key);

-- Category: AMOUNTS (green)
INSERT INTO template_variable_read_model (code, label_key, description_key, category, color, source_table, source_column, data_type, format_pattern, display_order)
VALUES
('currency', 'templateVar.amounts.currency', 'templateVar.amounts.currency.desc', 'AMOUNTS', 'green', 'operation_readmodel', 'currency', 'STRING', NULL, 1),
('amount', 'templateVar.amounts.amount', 'templateVar.amounts.amount.desc', 'AMOUNTS', 'green', 'operation_readmodel', 'amount', 'NUMBER', '#,##0.00', 2),
('formattedAmount', 'templateVar.amounts.formattedAmount', 'templateVar.amounts.formattedAmount.desc', 'AMOUNTS', 'green', 'operation_readmodel', 'amount', 'STRING', NULL, 3)
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), description_key = VALUES(description_key);

-- Category: APPLICANT (purple)
INSERT INTO template_variable_read_model (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order)
VALUES
('applicantId', 'templateVar.applicant.id', 'templateVar.applicant.id.desc', 'APPLICANT', 'purple', 'participant_read_model', 'id', 'NUMBER', 1),
('applicantIdentification', 'templateVar.applicant.identification', 'templateVar.applicant.identification.desc', 'APPLICANT', 'purple', 'participant_read_model', 'identification', 'STRING', 2),
('applicantName', 'templateVar.applicant.name', 'templateVar.applicant.name.desc', 'APPLICANT', 'purple', 'operation_readmodel', 'applicant_name', 'STRING', 3),
('applicantFirstNames', 'templateVar.applicant.firstNames', 'templateVar.applicant.firstNames.desc', 'APPLICANT', 'purple', 'participant_read_model', 'first_names', 'STRING', 4),
('applicantLastNames', 'templateVar.applicant.lastNames', 'templateVar.applicant.lastNames.desc', 'APPLICANT', 'purple', 'participant_read_model', 'last_names', 'STRING', 5),
('applicantEmail', 'templateVar.applicant.email', 'templateVar.applicant.email.desc', 'APPLICANT', 'purple', 'participant_read_model', 'email', 'STRING', 6),
('applicantPhone', 'templateVar.applicant.phone', 'templateVar.applicant.phone.desc', 'APPLICANT', 'purple', 'participant_read_model', 'phone', 'STRING', 7),
('applicantAddress', 'templateVar.applicant.address', 'templateVar.applicant.address.desc', 'APPLICANT', 'purple', 'participant_read_model', 'address', 'STRING', 8),
('applicantAgency', 'templateVar.applicant.agency', 'templateVar.applicant.agency.desc', 'APPLICANT', 'purple', 'participant_read_model', 'agency', 'STRING', 9),
('applicantExecutive', 'templateVar.applicant.executive', 'templateVar.applicant.executive.desc', 'APPLICANT', 'purple', 'participant_read_model', 'assigned_executive', 'STRING', 10),
('applicantExecutiveEmail', 'templateVar.applicant.executiveEmail', 'templateVar.applicant.executiveEmail.desc', 'APPLICANT', 'purple', 'participant_read_model', 'executive_email', 'STRING', 11)
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), description_key = VALUES(description_key);

-- Category: BENEFICIARY (orange)
INSERT INTO template_variable_read_model (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order)
VALUES
('beneficiaryId', 'templateVar.beneficiary.id', 'templateVar.beneficiary.id.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'id', 'NUMBER', 1),
('beneficiaryIdentification', 'templateVar.beneficiary.identification', 'templateVar.beneficiary.identification.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'identification', 'STRING', 2),
('beneficiaryName', 'templateVar.beneficiary.name', 'templateVar.beneficiary.name.desc', 'BENEFICIARY', 'orange', 'operation_readmodel', 'beneficiary_name', 'STRING', 3),
('beneficiaryFirstNames', 'templateVar.beneficiary.firstNames', 'templateVar.beneficiary.firstNames.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'first_names', 'STRING', 4),
('beneficiaryLastNames', 'templateVar.beneficiary.lastNames', 'templateVar.beneficiary.lastNames.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'last_names', 'STRING', 5),
('beneficiaryEmail', 'templateVar.beneficiary.email', 'templateVar.beneficiary.email.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'email', 'STRING', 6),
('beneficiaryPhone', 'templateVar.beneficiary.phone', 'templateVar.beneficiary.phone.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'phone', 'STRING', 7),
('beneficiaryAddress', 'templateVar.beneficiary.address', 'templateVar.beneficiary.address.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'address', 'STRING', 8),
('beneficiaryAgency', 'templateVar.beneficiary.agency', 'templateVar.beneficiary.agency.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'agency', 'STRING', 9),
('beneficiaryExecutive', 'templateVar.beneficiary.executive', 'templateVar.beneficiary.executive.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'assigned_executive', 'STRING', 10),
('beneficiaryExecutiveEmail', 'templateVar.beneficiary.executiveEmail', 'templateVar.beneficiary.executiveEmail.desc', 'BENEFICIARY', 'orange', 'participant_read_model', 'executive_email', 'STRING', 11)
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), description_key = VALUES(description_key);

-- Category: BANKS (cyan)
INSERT INTO template_variable_read_model (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order)
VALUES
('issuingBankId', 'templateVar.banks.issuingBankId', 'templateVar.banks.issuingBankId.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'id', 'NUMBER', 1),
('issuingBankName', 'templateVar.banks.issuingBankName', 'templateVar.banks.issuingBankName.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'name', 'STRING', 2),
('issuingBankBic', 'templateVar.banks.issuingBankBic', 'templateVar.banks.issuingBankBic.desc', 'BANKS', 'cyan', 'operation_readmodel', 'issuing_bank_bic', 'STRING', 3),
('issuingBankCode', 'templateVar.banks.issuingBankCode', 'templateVar.banks.issuingBankCode.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'code', 'STRING', 4),
('issuingBankCountry', 'templateVar.banks.issuingBankCountry', 'templateVar.banks.issuingBankCountry.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'country', 'STRING', 5),
('issuingBankCity', 'templateVar.banks.issuingBankCity', 'templateVar.banks.issuingBankCity.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'city', 'STRING', 6),
('issuingBankAddress', 'templateVar.banks.issuingBankAddress', 'templateVar.banks.issuingBankAddress.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'address', 'STRING', 7),
('advisingBankId', 'templateVar.banks.advisingBankId', 'templateVar.banks.advisingBankId.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'id', 'NUMBER', 8),
('advisingBankName', 'templateVar.banks.advisingBankName', 'templateVar.banks.advisingBankName.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'name', 'STRING', 9),
('advisingBankBic', 'templateVar.banks.advisingBankBic', 'templateVar.banks.advisingBankBic.desc', 'BANKS', 'cyan', 'operation_readmodel', 'advising_bank_bic', 'STRING', 10),
('advisingBankCode', 'templateVar.banks.advisingBankCode', 'templateVar.banks.advisingBankCode.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'code', 'STRING', 11),
('advisingBankCountry', 'templateVar.banks.advisingBankCountry', 'templateVar.banks.advisingBankCountry.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'country', 'STRING', 12),
('advisingBankCity', 'templateVar.banks.advisingBankCity', 'templateVar.banks.advisingBankCity.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'city', 'STRING', 13),
('advisingBankAddress', 'templateVar.banks.advisingBankAddress', 'templateVar.banks.advisingBankAddress.desc', 'BANKS', 'cyan', 'financial_institution_readmodel', 'address', 'STRING', 14)
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), description_key = VALUES(description_key);

-- Category: DATES (red)
INSERT INTO template_variable_read_model (code, label_key, description_key, category, color, source_table, source_column, data_type, format_pattern, display_order)
VALUES
('issueDate', 'templateVar.dates.issueDate', 'templateVar.dates.issueDate.desc', 'DATES', 'red', 'operation_readmodel', 'issue_date', 'DATE', 'dd/MM/yyyy', 1),
('expiryDate', 'templateVar.dates.expiryDate', 'templateVar.dates.expiryDate.desc', 'DATES', 'red', 'operation_readmodel', 'expiry_date', 'DATE', 'dd/MM/yyyy', 2),
('responseDueDate', 'templateVar.dates.responseDueDate', 'templateVar.dates.responseDueDate.desc', 'DATES', 'red', 'operation_readmodel', 'response_due_date', 'DATE', 'dd/MM/yyyy', 3),
('createdAt', 'templateVar.dates.createdAt', 'templateVar.dates.createdAt.desc', 'DATES', 'red', 'operation_readmodel', 'created_at', 'DATETIME', 'dd/MM/yyyy HH:mm', 4),
('approvedAt', 'templateVar.dates.approvedAt', 'templateVar.dates.approvedAt.desc', 'DATES', 'red', 'operation_readmodel', 'approved_at', 'DATETIME', 'dd/MM/yyyy HH:mm', 5),
('modifiedAt', 'templateVar.dates.modifiedAt', 'templateVar.dates.modifiedAt.desc', 'DATES', 'red', 'operation_readmodel', 'modified_at', 'DATETIME', 'dd/MM/yyyy HH:mm', 6),
('eventDate', 'templateVar.dates.eventDate', 'templateVar.dates.eventDate.desc', 'DATES', 'red', 'system', 'current_timestamp', 'DATETIME', 'dd/MM/yyyy HH:mm', 7)
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), description_key = VALUES(description_key);

-- Category: USER (gray)
INSERT INTO template_variable_read_model (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order)
VALUES
('createdBy', 'templateVar.user.createdBy', 'templateVar.user.createdBy.desc', 'USER', 'gray', 'operation_readmodel', 'created_by', 'STRING', 1),
('approvedBy', 'templateVar.user.approvedBy', 'templateVar.user.approvedBy.desc', 'USER', 'gray', 'operation_readmodel', 'approved_by', 'STRING', 2),
('modifiedBy', 'templateVar.user.modifiedBy', 'templateVar.user.modifiedBy.desc', 'USER', 'gray', 'operation_readmodel', 'modified_by', 'STRING', 3),
('executingUser', 'templateVar.user.executingUser', 'templateVar.user.executingUser.desc', 'USER', 'gray', 'security_context', 'username', 'STRING', 4),
('executingUserEmail', 'templateVar.user.executingUserEmail', 'templateVar.user.executingUserEmail.desc', 'USER', 'gray', 'security_context', 'email', 'STRING', 5),
('executingUserFullName', 'templateVar.user.executingUserFullName', 'templateVar.user.executingUserFullName.desc', 'USER', 'gray', 'security_context', 'full_name', 'STRING', 6),
('executingUserRole', 'templateVar.user.executingUserRole', 'templateVar.user.executingUserRole.desc', 'USER', 'gray', 'security_context', 'role', 'STRING', 7)
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), description_key = VALUES(description_key);

-- Category: SWIFT (teal)
INSERT INTO template_variable_read_model (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order)
VALUES
('swiftMessageId', 'templateVar.swift.messageId', 'templateVar.swift.messageId.desc', 'SWIFT', 'teal', 'swift_message_readmodel', 'message_id', 'STRING', 1),
('swiftMessageType', 'templateVar.swift.messageType', 'templateVar.swift.messageType.desc', 'SWIFT', 'teal', 'swift_message_readmodel', 'message_type', 'STRING', 2),
('swiftDirection', 'templateVar.swift.direction', 'templateVar.swift.direction.desc', 'SWIFT', 'teal', 'swift_message_readmodel', 'direction', 'STRING', 3),
('swiftSenderBic', 'templateVar.swift.senderBic', 'templateVar.swift.senderBic.desc', 'SWIFT', 'teal', 'swift_message_readmodel', 'sender_bic', 'STRING', 4),
('swiftReceiverBic', 'templateVar.swift.receiverBic', 'templateVar.swift.receiverBic.desc', 'SWIFT', 'teal', 'swift_message_readmodel', 'receiver_bic', 'STRING', 5),
('swiftField20', 'templateVar.swift.field20', 'templateVar.swift.field20.desc', 'SWIFT', 'teal', 'swift_message_readmodel', 'field_20_reference', 'STRING', 6),
('swiftField21', 'templateVar.swift.field21', 'templateVar.swift.field21.desc', 'SWIFT', 'teal', 'swift_message_readmodel', 'field_21_related_ref', 'STRING', 7),
('swiftStatus', 'templateVar.swift.status', 'templateVar.swift.status.desc', 'SWIFT', 'teal', 'swift_message_readmodel', 'status', 'STRING', 8)
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), description_key = VALUES(description_key);


-- =============================================================================
-- 2. CP-SPECIFIC VARIABLES (Compras Publicas)
-- Sourced from swift_field_config_readmodel field values
-- These variables are resolved from the operation's custom field data
-- =============================================================================

-- Category: CP_PREPARACION (green) - Fase preparatoria
INSERT INTO template_variable_read_model (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order)
VALUES
('cpObjeto', 'templateVar.cp.objeto', 'templateVar.cp.objeto.desc', 'CP_PREPARACION', 'green', 'swift_field_config_readmodel', ':CP_OBJETO:', 'STRING', 1),
('cpCpc', 'templateVar.cp.cpc', 'templateVar.cp.cpc.desc', 'CP_PREPARACION', 'green', 'swift_field_config_readmodel', ':CP_CPC:', 'STRING', 2),
('cpPresupuesto', 'templateVar.cp.presupuesto', 'templateVar.cp.presupuesto.desc', 'CP_PREPARACION', 'green', 'swift_field_config_readmodel', ':CP_PRESUPUESTO:', 'NUMBER', 3),
('cpCertPresup', 'templateVar.cp.certPresup', 'templateVar.cp.certPresup.desc', 'CP_PREPARACION', 'green', 'swift_field_config_readmodel', ':CP_CERT_PRESUP:', 'STRING', 4),
('cpResolucionInicio', 'templateVar.cp.resolucionInicio', 'templateVar.cp.resolucionInicio.desc', 'CP_PREPARACION', 'green', 'swift_field_config_readmodel', ':CP_RESOLUCION_INICIO:', 'STRING', 5),
('cpPartidaPresup', 'templateVar.cp.partidaPresup', 'templateVar.cp.partidaPresup.desc', 'CP_PREPARACION', 'green', 'swift_field_config_readmodel', ':CP_PARTIDA:', 'STRING', 6),
('cpFuenteFinanc', 'templateVar.cp.fuenteFinanc', 'templateVar.cp.fuenteFinanc.desc', 'CP_PREPARACION', 'green', 'swift_field_config_readmodel', ':CP_FUENTE_FINANC:', 'STRING', 7),
('cpJustificacion', 'templateVar.cp.justificacion', 'templateVar.cp.justificacion.desc', 'CP_PREPARACION', 'green', 'swift_field_config_readmodel', ':CP_JUSTIFICACION:', 'STRING', 8),
('cpTdr', 'templateVar.cp.tdr', 'templateVar.cp.tdr.desc', 'CP_PREPARACION', 'green', 'swift_field_config_readmodel', ':CP_TDR:', 'STRING', 9),
('cpInformeNecesidad', 'templateVar.cp.informeNecesidad', 'templateVar.cp.informeNecesidad.desc', 'CP_PREPARACION', 'green', 'swift_field_config_readmodel', ':CP_INFORME_NECESIDAD:', 'STRING', 10),
('cpJustificacionDirecta', 'templateVar.cp.justificacionDirecta', 'templateVar.cp.justificacionDirecta.desc', 'CP_PREPARACION', 'green', 'swift_field_config_readmodel', ':CP_JUSTIFICACION_DIRECTA:', 'STRING', 11)
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), description_key = VALUES(description_key);

-- Category: CP_CONVOCATORIA (cyan) - Fase de convocatoria
INSERT INTO template_variable_read_model (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order)
VALUES
('cpFechaPublicacion', 'templateVar.cp.fechaPublicacion', 'templateVar.cp.fechaPublicacion.desc', 'CP_CONVOCATORIA', 'cyan', 'swift_field_config_readmodel', ':CP_FECHA_PUBLICACION:', 'DATE', 1),
('cpPlazoOfertas', 'templateVar.cp.plazoOfertas', 'templateVar.cp.plazoOfertas.desc', 'CP_CONVOCATORIA', 'cyan', 'swift_field_config_readmodel', ':CP_PLAZO_OFERTAS:', 'STRING', 2),
('cpComisionTecnica', 'templateVar.cp.comisionTecnica', 'templateVar.cp.comisionTecnica.desc', 'CP_CONVOCATORIA', 'cyan', 'swift_field_config_readmodel', ':CP_COMISION_TECNICA:', 'STRING', 3),
('cpRequisitosMinimos', 'templateVar.cp.requisitosMinimos', 'templateVar.cp.requisitosMinimos.desc', 'CP_CONVOCATORIA', 'cyan', 'swift_field_config_readmodel', ':CP_REQUISITOS_MINIMOS:', 'STRING', 4),
('cpCoberturasRequeridas', 'templateVar.cp.coberturasRequeridas', 'templateVar.cp.coberturasRequeridas.desc', 'CP_CONVOCATORIA', 'cyan', 'swift_field_config_readmodel', ':CP_COBERTURAS_REQUERIDAS:', 'STRING', 5),
('cpFechaInvitacion', 'templateVar.cp.fechaInvitacion', 'templateVar.cp.fechaInvitacion.desc', 'CP_CONVOCATORIA', 'cyan', 'swift_field_config_readmodel', ':CP_FECHA_INVITACION:', 'DATE', 6)
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), description_key = VALUES(description_key);

-- Category: CP_EVALUACION (purple) - Fase de evaluacion
INSERT INTO template_variable_read_model (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order)
VALUES
('cpCriterioEvaluacion', 'templateVar.cp.criterioEvaluacion', 'templateVar.cp.criterioEvaluacion.desc', 'CP_EVALUACION', 'purple', 'swift_field_config_readmodel', ':CP_CRITERIO_EVALUACION:', 'STRING', 1),
('cpNumOfertasRecibidas', 'templateVar.cp.numOfertasRecibidas', 'templateVar.cp.numOfertasRecibidas.desc', 'CP_EVALUACION', 'purple', 'swift_field_config_readmodel', ':CP_NUM_OFERTAS_RECIBIDAS:', 'NUMBER', 2),
('cpPrecioReferencial', 'templateVar.cp.precioReferencial', 'templateVar.cp.precioReferencial.desc', 'CP_EVALUACION', 'purple', 'swift_field_config_readmodel', ':CP_PRECIO_REFERENCIAL:', 'NUMBER', 3),
('cpPuntajeTecnico', 'templateVar.cp.puntajeTecnico', 'templateVar.cp.puntajeTecnico.desc', 'CP_EVALUACION', 'purple', 'swift_field_config_readmodel', ':CP_PUNTAJE_TECNICO:', 'NUMBER', 4)
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), description_key = VALUES(description_key);

-- Category: CP_ADJUDICACION (orange) - Fase de adjudicacion
INSERT INTO template_variable_read_model (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order)
VALUES
('cpAdjudicatarioNombre', 'templateVar.cp.adjudicatarioNombre', 'templateVar.cp.adjudicatarioNombre.desc', 'CP_ADJUDICACION', 'orange', 'swift_field_config_readmodel', ':CP_ADJUDICATARIO_NOMBRE:', 'STRING', 1),
('cpAdjudicatarioRuc', 'templateVar.cp.adjudicatarioRuc', 'templateVar.cp.adjudicatarioRuc.desc', 'CP_ADJUDICACION', 'orange', 'swift_field_config_readmodel', ':CP_ADJUDICATARIO_RUC:', 'STRING', 2),
('cpMontoAdjudicado', 'templateVar.cp.montoAdjudicado', 'templateVar.cp.montoAdjudicado.desc', 'CP_ADJUDICACION', 'orange', 'swift_field_config_readmodel', ':CP_MONTO_ADJUDICADO:', 'NUMBER', 3),
('cpResolucionAdjudicacion', 'templateVar.cp.resolucionAdjudicacion', 'templateVar.cp.resolucionAdjudicacion.desc', 'CP_ADJUDICACION', 'orange', 'swift_field_config_readmodel', ':CP_RESOLUCION_ADJUDICACION:', 'STRING', 4),
('cpAseguradoraNombre', 'templateVar.cp.aseguradoraNombre', 'templateVar.cp.aseguradoraNombre.desc', 'CP_ADJUDICACION', 'orange', 'swift_field_config_readmodel', ':CP_ASEGURADORA_NOMBRE:', 'STRING', 5),
('cpMontoPrima', 'templateVar.cp.montoPrima', 'templateVar.cp.montoPrima.desc', 'CP_ADJUDICACION', 'orange', 'swift_field_config_readmodel', ':CP_MONTO_PRIMA:', 'NUMBER', 6),
('cpProveedorNombre', 'templateVar.cp.proveedorNombre', 'templateVar.cp.proveedorNombre.desc', 'CP_ADJUDICACION', 'orange', 'swift_field_config_readmodel', ':CP_PROVEEDOR_NOMBRE:', 'STRING', 7),
('cpProveedorRuc', 'templateVar.cp.proveedorRuc', 'templateVar.cp.proveedorRuc.desc', 'CP_ADJUDICACION', 'orange', 'swift_field_config_readmodel', ':CP_PROVEEDOR_RUC:', 'STRING', 8)
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), description_key = VALUES(description_key);

-- Category: CP_CONTRATACION (red) - Fase de contratacion
INSERT INTO template_variable_read_model (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order)
VALUES
('cpNumeroContrato', 'templateVar.cp.numeroContrato', 'templateVar.cp.numeroContrato.desc', 'CP_CONTRATACION', 'red', 'swift_field_config_readmodel', ':CP_NUMERO_CONTRATO:', 'STRING', 1),
('cpFechaContrato', 'templateVar.cp.fechaContrato', 'templateVar.cp.fechaContrato.desc', 'CP_CONTRATACION', 'red', 'swift_field_config_readmodel', ':CP_FECHA_CONTRATO:', 'DATE', 2),
('cpMontoContrato', 'templateVar.cp.montoContrato', 'templateVar.cp.montoContrato.desc', 'CP_CONTRATACION', 'red', 'swift_field_config_readmodel', ':CP_MONTO_CONTRATO:', 'NUMBER', 3),
('cpPlazoContrato', 'templateVar.cp.plazoContrato', 'templateVar.cp.plazoContrato.desc', 'CP_CONTRATACION', 'red', 'swift_field_config_readmodel', ':CP_PLAZO_CONTRATO:', 'STRING', 4),
('cpGarantiaFielCumplimiento', 'templateVar.cp.garantiaFielCumplimiento', 'templateVar.cp.garantiaFielCumplimiento.desc', 'CP_CONTRATACION', 'red', 'swift_field_config_readmodel', ':CP_GARANTIA_FIEL_CUMPLIMIENTO:', 'STRING', 5),
('cpNumeroPoliza', 'templateVar.cp.numeroPoliza', 'templateVar.cp.numeroPoliza.desc', 'CP_CONTRATACION', 'red', 'swift_field_config_readmodel', ':CP_NUMERO_POLIZA:', 'STRING', 6),
('cpFechaInicioVigencia', 'templateVar.cp.fechaInicioVigencia', 'templateVar.cp.fechaInicioVigencia.desc', 'CP_CONTRATACION', 'red', 'swift_field_config_readmodel', ':CP_FECHA_INICIO_VIGENCIA:', 'DATE', 7),
('cpFechaFinVigencia', 'templateVar.cp.fechaFinVigencia', 'templateVar.cp.fechaFinVigencia.desc', 'CP_CONTRATACION', 'red', 'swift_field_config_readmodel', ':CP_FECHA_FIN_VIGENCIA:', 'DATE', 8),
('cpCanonMensual', 'templateVar.cp.canonMensual', 'templateVar.cp.canonMensual.desc', 'CP_CONTRATACION', 'red', 'swift_field_config_readmodel', ':CP_CANON_MENSUAL:', 'NUMBER', 9),
('cpPlazoArrendamiento', 'templateVar.cp.plazoArrendamiento', 'templateVar.cp.plazoArrendamiento.desc', 'CP_CONTRATACION', 'red', 'swift_field_config_readmodel', ':CP_PLAZO_ARRENDAMIENTO:', 'STRING', 10)
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), description_key = VALUES(description_key);

-- Category: CP_EJECUCION (teal) - Fase de ejecucion
INSERT INTO template_variable_read_model (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order)
VALUES
('cpActaRecepcion', 'templateVar.cp.actaRecepcion', 'templateVar.cp.actaRecepcion.desc', 'CP_EJECUCION', 'teal', 'swift_field_config_readmodel', ':CP_ACTA_RECEPCION:', 'STRING', 1),
('cpFechaRecepcion', 'templateVar.cp.fechaRecepcion', 'templateVar.cp.fechaRecepcion.desc', 'CP_EJECUCION', 'teal', 'swift_field_config_readmodel', ':CP_FECHA_RECEPCION:', 'DATE', 2),
('cpObservacionesRecepcion', 'templateVar.cp.observacionesRecepcion', 'templateVar.cp.observacionesRecepcion.desc', 'CP_EJECUCION', 'teal', 'swift_field_config_readmodel', ':CP_OBSERVACIONES_RECEPCION:', 'STRING', 3),
('cpActaEntrega', 'templateVar.cp.actaEntrega', 'templateVar.cp.actaEntrega.desc', 'CP_EJECUCION', 'teal', 'swift_field_config_readmodel', ':CP_ACTA_ENTREGA:', 'STRING', 4),
('cpFechaInicioOcupacion', 'templateVar.cp.fechaInicioOcupacion', 'templateVar.cp.fechaInicioOcupacion.desc', 'CP_EJECUCION', 'teal', 'swift_field_config_readmodel', ':CP_FECHA_INICIO_OCUPACION:', 'DATE', 5),
('cpFactura', 'templateVar.cp.factura', 'templateVar.cp.factura.desc', 'CP_EJECUCION', 'teal', 'swift_field_config_readmodel', ':CP_FACTURA:', 'STRING', 6),
('cpFechaFactura', 'templateVar.cp.fechaFactura', 'templateVar.cp.fechaFactura.desc', 'CP_EJECUCION', 'teal', 'swift_field_config_readmodel', ':CP_FECHA_FACTURA:', 'DATE', 7)
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), description_key = VALUES(description_key);

-- Category: CP_INMUEBLE (gray) - Datos de inmueble (arrendamiento)
INSERT INTO template_variable_read_model (code, label_key, description_key, category, color, source_table, source_column, data_type, display_order)
VALUES
('cpDireccionInmueble', 'templateVar.cp.direccionInmueble', 'templateVar.cp.direccionInmueble.desc', 'CP_INMUEBLE', 'gray', 'swift_field_config_readmodel', ':CP_DIRECCION_INMUEBLE:', 'STRING', 1),
('cpAreaM2', 'templateVar.cp.areaM2', 'templateVar.cp.areaM2.desc', 'CP_INMUEBLE', 'gray', 'swift_field_config_readmodel', ':CP_AREA_M2:', 'NUMBER', 2),
('cpAvaluoCatastral', 'templateVar.cp.avaluoCatastral', 'templateVar.cp.avaluoCatastral.desc', 'CP_INMUEBLE', 'gray', 'swift_field_config_readmodel', ':CP_AVALUO_CATASTRAL:', 'NUMBER', 3),
('cpPropietarioNombre', 'templateVar.cp.propietarioNombre', 'templateVar.cp.propietarioNombre.desc', 'CP_INMUEBLE', 'gray', 'swift_field_config_readmodel', ':CP_PROPIETARIO_NOMBRE:', 'STRING', 4),
('cpValorAsegurado', 'templateVar.cp.valorAsegurado', 'templateVar.cp.valorAsegurado.desc', 'CP_INMUEBLE', 'gray', 'swift_field_config_readmodel', ':CP_VALOR_ASEGURADO:', 'NUMBER', 5),
('cpTipoPoliza', 'templateVar.cp.tipoPoliza', 'templateVar.cp.tipoPoliza.desc', 'CP_INMUEBLE', 'gray', 'swift_field_config_readmodel', ':CP_TIPO_POLIZA:', 'STRING', 6)
ON DUPLICATE KEY UPDATE label_key = VALUES(label_key), description_key = VALUES(description_key);


-- =============================================================================
-- 3. CP DOCUMENT TEMPLATES (template_read_model)
-- These define reusable document/email templates for procurement processes
-- Variables field contains JSON array of variable codes used in the template
-- =============================================================================

-- Notification email templates for CP processes
INSERT INTO template_read_model (id, code, name, description, document_type, active, created_at, created_by, variables)
VALUES
(2001, 'CP_EMAIL_RESOLUCION_INICIO', 'Notificación de Resolución de Inicio',
 'Email enviado cuando se aprueba la resolución de inicio de un proceso de contratación pública',
 'EMAIL', 1, NOW(), 'system',
 '["cpObjeto","cpPresupuesto","cpCertPresup","cpResolucionInicio","reference","productType","executingUser","eventDate"]'),

(2002, 'CP_EMAIL_CONVOCATORIA', 'Notificación de Convocatoria',
 'Email enviado cuando se publica la convocatoria del proceso en el portal SERCOP',
 'EMAIL', 1, NOW(), 'system',
 '["cpObjeto","cpPresupuesto","cpFechaPublicacion","cpPlazoOfertas","reference","productType","eventDate"]'),

(2003, 'CP_EMAIL_ADJUDICACION', 'Notificación de Adjudicación',
 'Email enviado al proveedor adjudicado con los detalles de la adjudicación',
 'EMAIL', 1, NOW(), 'system',
 '["cpObjeto","cpAdjudicatarioNombre","cpAdjudicatarioRuc","cpMontoAdjudicado","cpResolucionAdjudicacion","reference","productType","eventDate"]'),

(2004, 'CP_EMAIL_CONTRATO_FIRMADO', 'Notificación de Contrato Firmado',
 'Email enviado cuando se firma el contrato con el proveedor adjudicado',
 'EMAIL', 1, NOW(), 'system',
 '["cpObjeto","cpNumeroContrato","cpFechaContrato","cpMontoContrato","cpPlazoContrato","cpAdjudicatarioNombre","reference","productType","eventDate"]'),

(2005, 'CP_EMAIL_RECEPCION', 'Notificación de Recepción',
 'Email enviado cuando se recibe el bien/servicio/obra contratado',
 'EMAIL', 1, NOW(), 'system',
 '["cpObjeto","cpActaRecepcion","cpFechaRecepcion","cpObservacionesRecepcion","cpNumeroContrato","reference","productType","eventDate"]')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), variables = VALUES(variables);

-- Document generation templates
INSERT INTO template_read_model (id, code, name, description, document_type, active, created_at, created_by, variables)
VALUES
(2010, 'CP_DOC_RESOLUCION_INICIO', 'Resolución de Inicio de Proceso',
 'Documento PDF de resolución de inicio que aprueba pliegos y cronograma del proceso',
 'PDF', 1, NOW(), 'system',
 '["cpObjeto","cpCpc","cpPresupuesto","cpCertPresup","cpPartidaPresup","cpFuenteFinanc","cpResolucionInicio","reference","productType","applicantName","executingUser","eventDate"]'),

(2011, 'CP_DOC_PLIEGO', 'Pliego del Proceso',
 'Documento PDF con los pliegos/términos de referencia del proceso de contratación',
 'PDF', 1, NOW(), 'system',
 '["cpObjeto","cpCpc","cpPresupuesto","cpTdr","cpRequisitosMinimos","cpComisionTecnica","cpPlazoOfertas","reference","productType","applicantName","eventDate"]'),

(2012, 'CP_DOC_ACTA_EVALUACION', 'Acta de Evaluación de Ofertas',
 'Documento PDF con el resultado de la evaluación técnica y económica de ofertas',
 'PDF', 1, NOW(), 'system',
 '["cpObjeto","cpCriterioEvaluacion","cpNumOfertasRecibidas","cpPuntajeTecnico","cpAdjudicatarioNombre","cpMontoAdjudicado","reference","productType","eventDate"]'),

(2013, 'CP_DOC_RESOLUCION_ADJUDICACION', 'Resolución de Adjudicación',
 'Documento PDF de resolución de adjudicación del proceso',
 'PDF', 1, NOW(), 'system',
 '["cpObjeto","cpAdjudicatarioNombre","cpAdjudicatarioRuc","cpMontoAdjudicado","cpResolucionAdjudicacion","cpPresupuesto","reference","productType","applicantName","executingUser","eventDate"]'),

(2014, 'CP_DOC_CONTRATO', 'Contrato de Contratación Pública',
 'Documento PDF del contrato entre la entidad contratante y el proveedor adjudicado',
 'PDF', 1, NOW(), 'system',
 '["cpObjeto","cpNumeroContrato","cpFechaContrato","cpMontoContrato","cpPlazoContrato","cpGarantiaFielCumplimiento","cpAdjudicatarioNombre","cpAdjudicatarioRuc","reference","productType","applicantName","eventDate"]'),

(2015, 'CP_DOC_ACTA_RECEPCION', 'Acta de Entrega-Recepción',
 'Documento PDF del acta de recepción definitiva o provisional del bien/servicio/obra',
 'PDF', 1, NOW(), 'system',
 '["cpObjeto","cpActaRecepcion","cpFechaRecepcion","cpObservacionesRecepcion","cpNumeroContrato","cpMontoContrato","cpAdjudicatarioNombre","reference","productType","eventDate"]'),

(2016, 'CP_DOC_CONTRATO_ARRENDAMIENTO', 'Contrato de Arrendamiento',
 'Documento PDF del contrato de arrendamiento de inmueble para la entidad pública',
 'PDF', 1, NOW(), 'system',
 '["cpObjeto","cpNumeroContrato","cpFechaContrato","cpMontoContrato","cpCanonMensual","cpPlazoArrendamiento","cpDireccionInmueble","cpAreaM2","cpAvaluoCatastral","cpPropietarioNombre","reference","productType","applicantName","eventDate"]'),

(2017, 'CP_DOC_POLIZA_SEGURO', 'Registro de Póliza de Seguro',
 'Documento PDF con los detalles de la póliza de seguro contratada',
 'PDF', 1, NOW(), 'system',
 '["cpObjeto","cpNumeroPoliza","cpFechaInicioVigencia","cpFechaFinVigencia","cpMontoContrato","cpAseguradoraNombre","cpMontoPrima","cpValorAsegurado","cpTipoPoliza","cpCoberturasRequeridas","reference","productType","applicantName","eventDate"]')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), variables = VALUES(variables);

-- API call templates for SERCOP integration and open data
INSERT INTO template_read_model (id, code, name, description, document_type, active, created_at, created_by, variables)
VALUES
(2020, 'CP_API_PUBLICAR_SERCOP', 'Publicar Proceso en SERCOP',
 'Template para la llamada API al portal de SERCOP para publicar el proceso de contratación',
 'API_CALL', 1, NOW(), 'system',
 '["cpObjeto","cpCpc","cpPresupuesto","cpFechaPublicacion","cpPlazoOfertas","reference","productType","applicantName"]'),

(2021, 'CP_API_NOTIFICAR_ADJUDICACION_SERCOP', 'Notificar Adjudicación a SERCOP',
 'Template para notificar la adjudicación al portal SERCOP',
 'API_CALL', 1, NOW(), 'system',
 '["cpObjeto","cpAdjudicatarioNombre","cpAdjudicatarioRuc","cpMontoAdjudicado","cpResolucionAdjudicacion","reference","productType"]'),

(2022, 'CP_API_REGISTRAR_CONTRATO_SERCOP', 'Registrar Contrato en SERCOP',
 'Template para registrar el contrato firmado en el portal SERCOP',
 'API_CALL', 1, NOW(), 'system',
 '["cpNumeroContrato","cpFechaContrato","cpMontoContrato","cpPlazoContrato","cpAdjudicatarioNombre","cpAdjudicatarioRuc","reference","productType"]'),

(2023, 'CP_API_DATOS_ABIERTOS', 'Publicar en Portal de Datos Abiertos',
 'Template para publicar información del proceso en el portal de datos abiertos del Ecuador para transparencia',
 'API_CALL', 1, NOW(), 'system',
 '["cpObjeto","cpCpc","cpPresupuesto","cpAdjudicatarioNombre","cpAdjudicatarioRuc","cpMontoAdjudicado","cpNumeroContrato","cpFechaContrato","cpMontoContrato","reference","productType","applicantName","eventDate"]'),

(2024, 'CP_API_CONTRALORIA', 'Reportar a Contraloría General del Estado',
 'Template para enviar información del proceso a la Contraloría General del Estado',
 'API_CALL', 1, NOW(), 'system',
 '["cpObjeto","cpPresupuesto","cpMontoAdjudicado","cpNumeroContrato","cpMontoContrato","cpAdjudicatarioNombre","cpAdjudicatarioRuc","reference","productType","applicantName"]')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), variables = VALUES(variables);
