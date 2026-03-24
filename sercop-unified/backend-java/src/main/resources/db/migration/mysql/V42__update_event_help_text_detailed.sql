-- V41: Update event help_text with detailed explanations (when, why, effect)

-- =============================================
-- LC_IMPORT Events - English
-- =============================================

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** After receiving the original LC (MT700) from the issuing bank and verifying its authenticity.

**Why:** The advising bank must formally notify the beneficiary about the LC terms, confirming the credit authenticity without adding any commitment.

**Effect:**
- Generates MT710 to the beneficiary
- Changes stage from ISSUED to ADVISED
- Beneficiary can now prepare shipment and documents'
WHERE event_code = 'ADVISE' AND operation_type = 'LC_IMPORT' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When the applicant or beneficiary requests changes to the LC terms (amount, dates, documents, etc.).

**Why:** Commercial terms may need adjustment due to shipping delays, quantity changes, or negotiation updates.

**Effect:**
- Generates MT707 amendment message
- Stage changes to PENDING_AMENDMENT
- Requires counterparty acceptance (MT730) to become effective
- Amendment is not valid until acknowledged'
WHERE event_code = 'AMEND' AND operation_type = 'LC_IMPORT' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When the confirming bank agrees to add their commitment to honor the LC.

**Why:** Adds an additional layer of payment security for the beneficiary, especially in high-risk countries or when requested by the beneficiary.

**Effect:**
- Generates MT730 confirmation message
- Stage changes from ADVISED to CONFIRMED
- Confirming bank assumes irrevocable payment obligation
- Higher fees may apply for confirmation'
WHERE event_code = 'CONFIRM' AND operation_type = 'LC_IMPORT' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When the beneficiary submits shipping and commercial documents for examination.

**Why:** Documents must be examined to verify compliance with LC terms according to UCP 600 rules within 5 banking days.

**Effect:**
- Records document presentation date (critical for deadline calculations)
- Stage changes to DOCUMENTS_PRESENTED
- Starts the 5-day examination period
- Triggers document compliance review workflow'
WHERE event_code = 'PRESENT_DOCS' AND operation_type = 'LC_IMPORT' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When document examination reveals discrepancies with LC terms.

**Why:** UCP 600 Article 16 requires banks to notify discrepancies within 5 banking days. Failure to notify may result in losing the right to refuse documents.

**Effect:**
- Generates MT734 discrepancy notification
- Stage changes to DISCREPANT
- Lists all discrepancies found
- Beneficiary/applicant must decide: correct, waive, or refuse'
WHERE event_code = 'DISCREPANCY' AND operation_type = 'LC_IMPORT' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** After documents pass examination (compliant) or discrepancies are waived by the applicant.

**Why:** Accepting documents creates an irrevocable commitment to pay at maturity or on demand.

**Effect:**
- Generates MT730 document acceptance
- Stage changes to DOCUMENTS_ACCEPTED
- Creates payment obligation
- Applicant can now collect documents against payment/acceptance'
WHERE event_code = 'ACCEPT_DOCS' AND operation_type = 'LC_IMPORT' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** Upon maturity date for usance LCs, or immediately for sight LCs after document acceptance.

**Why:** Fulfills the bank''s payment commitment under the LC. Late payment may incur interest and damage bank reputation.

**Effect:**
- Generates MT756 payment advice
- Stage changes to PAID
- Transfers funds to beneficiary/negotiating bank
- Updates accounting entries
- Creates payment record for reconciliation'
WHERE event_code = 'PAYMENT' AND operation_type = 'LC_IMPORT' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** After full utilization of the LC amount, or when the LC expires unused.

**Why:** Proper closure releases contingent liabilities and archives the transaction for record-keeping and audit purposes.

**Effect:**
- Stage changes to CLOSED
- Releases any remaining unutilized amount
- Archives the LC record
- No further operations possible on this LC'
WHERE event_code = 'CLOSE' AND operation_type = 'LC_IMPORT' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When receiving MT730 acknowledgment confirming the amendment was accepted by the counterparty.

**Why:** Amendments are only effective once accepted by all parties. This records the acceptance.

**Effect:**
- Stage returns to ADVISED
- Amendment terms become effective
- LC record is updated with new terms'
WHERE event_code = 'AMEND_ACCEPTED' AND operation_type = 'LC_IMPORT' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When the counterparty refuses to accept the proposed amendment.

**Why:** Records the rejection of amendment, keeping the original LC terms in effect.

**Effect:**
- Stage returns to ADVISED
- Original LC terms remain unchanged
- May require new amendment proposal or negotiation'
WHERE event_code = 'AMEND_REJECTED' AND operation_type = 'LC_IMPORT' AND language = 'en';

-- =============================================
-- LC_IMPORT Events - Spanish
-- =============================================

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Después de recibir la LC original (MT700) del banco emisor y verificar su autenticidad.

**Por qué:** El banco avisador debe notificar formalmente al beneficiario sobre los términos de la LC, confirmando la autenticidad del crédito sin agregar ningún compromiso.

**Efecto:**
- Genera MT710 al beneficiario
- Cambia la etapa de EMITIDA a AVISADA
- El beneficiario puede preparar el embarque y documentos'
WHERE event_code = 'ADVISE' AND operation_type = 'LC_IMPORT' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Cuando el ordenante o beneficiario solicita cambios en los términos de la LC (monto, fechas, documentos, etc.).

**Por qué:** Los términos comerciales pueden necesitar ajustes por retrasos en el embarque, cambios de cantidad o actualizaciones de negociación.

**Efecto:**
- Genera mensaje de enmienda MT707
- La etapa cambia a ENMIENDA_PENDIENTE
- Requiere aceptación de la contraparte (MT730) para hacerse efectiva
- La enmienda no es válida hasta que se acuse recibo'
WHERE event_code = 'AMEND' AND operation_type = 'LC_IMPORT' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Cuando el banco confirmador acepta agregar su compromiso de honrar la LC.

**Por qué:** Agrega una capa adicional de seguridad de pago para el beneficiario, especialmente en países de alto riesgo o cuando lo solicita el beneficiario.

**Efecto:**
- Genera mensaje de confirmación MT730
- La etapa cambia de AVISADA a CONFIRMADA
- El banco confirmador asume obligación irrevocable de pago
- Pueden aplicarse comisiones más altas por la confirmación'
WHERE event_code = 'CONFIRM' AND operation_type = 'LC_IMPORT' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Cuando el beneficiario presenta documentos de embarque y comerciales para examen.

**Por qué:** Los documentos deben examinarse para verificar conformidad con los términos de la LC según las reglas UCP 600 dentro de 5 días bancarios.

**Efecto:**
- Registra la fecha de presentación de documentos (crítica para cálculo de plazos)
- La etapa cambia a DOCUMENTOS_PRESENTADOS
- Inicia el período de examen de 5 días
- Activa el flujo de revisión de conformidad documental'
WHERE event_code = 'PRESENT_DOCS' AND operation_type = 'LC_IMPORT' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Cuando el examen de documentos revela discrepancias con los términos de la LC.

**Por qué:** El Artículo 16 de UCP 600 requiere que los bancos notifiquen discrepancias dentro de 5 días bancarios. No notificar puede resultar en perder el derecho de rechazar documentos.

**Efecto:**
- Genera notificación de discrepancia MT734
- La etapa cambia a DISCREPANTE
- Lista todas las discrepancias encontradas
- El beneficiario/ordenante debe decidir: corregir, dispensar o rechazar'
WHERE event_code = 'DISCREPANCY' AND operation_type = 'LC_IMPORT' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Después de que los documentos pasan el examen (conformes) o las discrepancias son dispensadas por el ordenante.

**Por qué:** Aceptar documentos crea un compromiso irrevocable de pagar al vencimiento o a la vista.

**Efecto:**
- Genera MT730 de aceptación de documentos
- La etapa cambia a DOCUMENTOS_ACEPTADOS
- Crea obligación de pago
- El ordenante puede recoger documentos contra pago/aceptación'
WHERE event_code = 'ACCEPT_DOCS' AND operation_type = 'LC_IMPORT' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** En la fecha de vencimiento para LC a plazo, o inmediatamente para LC a la vista después de aceptación de documentos.

**Por qué:** Cumple el compromiso de pago del banco bajo la LC. El pago tardío puede generar intereses y dañar la reputación del banco.

**Efecto:**
- Genera aviso de pago MT756
- La etapa cambia a PAGADA
- Transfiere fondos al beneficiario/banco negociador
- Actualiza asientos contables
- Crea registro de pago para conciliación'
WHERE event_code = 'PAYMENT' AND operation_type = 'LC_IMPORT' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Después de utilización total del monto de la LC, o cuando la LC expira sin usar.

**Por qué:** El cierre adecuado libera pasivos contingentes y archiva la transacción para mantenimiento de registros y auditoría.

**Efecto:**
- La etapa cambia a CERRADA
- Libera cualquier monto no utilizado restante
- Archiva el registro de la LC
- No son posibles más operaciones en esta LC'
WHERE event_code = 'CLOSE' AND operation_type = 'LC_IMPORT' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Al recibir acuse MT730 confirmando que la enmienda fue aceptada por la contraparte.

**Por qué:** Las enmiendas solo son efectivas una vez aceptadas por todas las partes. Esto registra la aceptación.

**Efecto:**
- La etapa vuelve a AVISADA
- Los términos de la enmienda se hacen efectivos
- El registro de la LC se actualiza con los nuevos términos'
WHERE event_code = 'AMEND_ACCEPTED' AND operation_type = 'LC_IMPORT' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Cuando la contraparte rechaza aceptar la enmienda propuesta.

**Por qué:** Registra el rechazo de la enmienda, manteniendo los términos originales de la LC en vigor.

**Efecto:**
- La etapa vuelve a AVISADA
- Los términos originales de la LC permanecen sin cambios
- Puede requerir nueva propuesta de enmienda o negociación'
WHERE event_code = 'AMEND_REJECTED' AND operation_type = 'LC_IMPORT' AND language = 'es';

-- =============================================
-- GUARANTEE Events - English
-- =============================================

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** After guarantee application is approved and all conditions are met.

**Why:** Formal issuance creates the bank''s irrevocable commitment. The beneficiary requires this to proceed with the underlying contract.

**Effect:**
- Generates MT760 guarantee issuance
- Stage changes from DRAFT to ISSUED
- Creates contingent liability on bank''s books
- Triggers fee collection from applicant'
WHERE event_code = 'ISSUE' AND operation_type = 'GUARANTEE' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When terms need modification (amount, dates, conditions, text).

**Why:** Contract changes may require corresponding guarantee modifications. All amendments need beneficiary consent.

**Effect:**
- Generates MT767 amendment message
- Stage changes to PENDING_AMENDMENT
- Requires beneficiary acknowledgment to be effective
- May affect fee calculations'
WHERE event_code = 'AMEND' AND operation_type = 'GUARANTEE' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When validity period needs extension, usually before expiry.

**Why:** Underlying contract delays or extensions require corresponding guarantee validity extension. Pay-or-extend clauses may mandate this.

**Effect:**
- Generates MT767 extension request
- Stage changes to EXTENDED
- New expiry date recorded
- Extends contingent liability period
- Additional fees may apply for extension period'
WHERE event_code = 'EXTEND' AND operation_type = 'GUARANTEE' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When receiving a valid demand for payment (claim) from the beneficiary.

**Why:** The beneficiary is exercising their right under the guarantee. Claim must be examined for compliance with guarantee terms.

**Effect:**
- Records MT765 claim receipt
- Stage changes to CLAIMED
- Starts claim examination period
- May require applicant notification
- Creates immediate payment obligation if claim is compliant'
WHERE event_code = 'CLAIM' AND operation_type = 'GUARANTEE' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** After determining the claim is valid and compliant with guarantee terms.

**Why:** The bank must honor its commitment. Late payment or unjustified refusal damages bank reputation and may result in legal action.

**Effect:**
- Generates MT756 payment advice
- Stage changes to PAID
- Transfers funds to beneficiary
- Debits applicant account
- May trigger recourse actions against applicant'
WHERE event_code = 'PAY_CLAIM' AND operation_type = 'GUARANTEE' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When beneficiary provides release or waiver, indicating they no longer require the guarantee.

**Why:** Release eliminates the contingent liability before expiry. May be due to contract completion, alternative security, or mutual agreement.

**Effect:**
- Records release notification
- Stage changes to RELEASED
- Status becomes CLOSED
- Eliminates contingent liability
- No further claims can be made'
WHERE event_code = 'RELEASE' AND operation_type = 'GUARANTEE' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When guarantee validity period ends without claim or release.

**Why:** Automatic expiry ends the bank''s commitment. Proper recording is essential for contingent liability management.

**Effect:**
- Stage changes to EXPIRED
- Status becomes CLOSED
- Removes contingent liability from books
- Archives guarantee record
- No further claims can be made (subject to local law)'
WHERE event_code = 'EXPIRE' AND operation_type = 'GUARANTEE' AND language = 'en';

-- =============================================
-- GUARANTEE Events - Spanish
-- =============================================

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Después de que la solicitud de garantía es aprobada y todas las condiciones se cumplen.

**Por qué:** La emisión formal crea el compromiso irrevocable del banco. El beneficiario requiere esto para proceder con el contrato subyacente.

**Efecto:**
- Genera MT760 de emisión de garantía
- La etapa cambia de BORRADOR a EMITIDA
- Crea pasivo contingente en los libros del banco
- Activa cobro de comisiones al solicitante'
WHERE event_code = 'ISSUE' AND operation_type = 'GUARANTEE' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Cuando los términos necesitan modificación (monto, fechas, condiciones, texto).

**Por qué:** Los cambios contractuales pueden requerir modificaciones correspondientes a la garantía. Todas las enmiendas necesitan consentimiento del beneficiario.

**Efecto:**
- Genera mensaje de enmienda MT767
- La etapa cambia a ENMIENDA_PENDIENTE
- Requiere acuse del beneficiario para ser efectiva
- Puede afectar cálculos de comisiones'
WHERE event_code = 'AMEND' AND operation_type = 'GUARANTEE' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Cuando el período de vigencia necesita extensión, usualmente antes del vencimiento.

**Por qué:** Los retrasos o extensiones del contrato subyacente requieren extensión correspondiente de vigencia de la garantía. Las cláusulas de pagar-o-extender pueden exigir esto.

**Efecto:**
- Genera solicitud de extensión MT767
- La etapa cambia a EXTENDIDA
- Nueva fecha de vencimiento registrada
- Extiende período de pasivo contingente
- Pueden aplicarse comisiones adicionales por el período de extensión'
WHERE event_code = 'EXTEND' AND operation_type = 'GUARANTEE' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Al recibir una demanda válida de pago (reclamo) del beneficiario.

**Por qué:** El beneficiario está ejerciendo su derecho bajo la garantía. El reclamo debe examinarse para cumplimiento con los términos de la garantía.

**Efecto:**
- Registra recepción de reclamo MT765
- La etapa cambia a RECLAMADA
- Inicia período de examen del reclamo
- Puede requerir notificación al solicitante
- Crea obligación de pago inmediata si el reclamo es conforme'
WHERE event_code = 'CLAIM' AND operation_type = 'GUARANTEE' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Después de determinar que el reclamo es válido y conforme con los términos de la garantía.

**Por qué:** El banco debe honrar su compromiso. El pago tardío o rechazo injustificado daña la reputación del banco y puede resultar en acción legal.

**Efecto:**
- Genera aviso de pago MT756
- La etapa cambia a PAGADA
- Transfiere fondos al beneficiario
- Debita cuenta del solicitante
- Puede activar acciones de recurso contra el solicitante'
WHERE event_code = 'PAY_CLAIM' AND operation_type = 'GUARANTEE' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Cuando el beneficiario proporciona liberación o renuncia, indicando que ya no requiere la garantía.

**Por qué:** La liberación elimina el pasivo contingente antes del vencimiento. Puede deberse a terminación del contrato, garantía alternativa o acuerdo mutuo.

**Efecto:**
- Registra notificación de liberación
- La etapa cambia a LIBERADA
- El estado se vuelve CERRADA
- Elimina pasivo contingente
- No se pueden hacer más reclamos'
WHERE event_code = 'RELEASE' AND operation_type = 'GUARANTEE' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Cuando el período de vigencia de la garantía termina sin reclamo ni liberación.

**Por qué:** El vencimiento automático termina el compromiso del banco. El registro adecuado es esencial para la gestión de pasivos contingentes.

**Efecto:**
- La etapa cambia a EXPIRADA
- El estado se vuelve CERRADA
- Elimina pasivo contingente de los libros
- Archiva registro de garantía
- No se pueden hacer más reclamos (sujeto a ley local)'
WHERE event_code = 'EXPIRE' AND operation_type = 'GUARANTEE' AND language = 'es';

-- =============================================
-- COLLECTION Events - English
-- =============================================

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** After receiving collection documents from the principal and preparing the collection instruction.

**Why:** The remitting bank must forward documents to the collecting bank with clear instructions per URC 522 rules.

**Effect:**
- Generates MT400 collection instruction
- Stage changes from ISSUED to SENT
- Starts the collection process
- Documents dispatched to collecting bank'
WHERE event_code = 'SEND_COLLECTION' AND operation_type = 'COLLECTION' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When the collecting bank presents documents to the drawee for acceptance/payment.

**Why:** URC 522 requires timely presentation. Delay may result in goods storage charges or perishable goods loss.

**Effect:**
- Records presentation date
- Stage changes to PRESENTED
- Starts payment/acceptance waiting period
- Drawee must respond: accept, pay, or refuse'
WHERE event_code = 'PRESENT_DRAWEE' AND operation_type = 'COLLECTION' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When the drawee formally accepts the documents (for D/A collections) or draft.

**Why:** Acceptance creates a binding payment obligation by the drawee. Documents may be released after acceptance.

**Effect:**
- Records MT412 acceptance
- Stage changes to ACCEPTED
- Creates payment receivable at maturity
- Documents released to drawee (for D/A)
- Payment due at maturity date'
WHERE event_code = 'ACCEPT' AND operation_type = 'COLLECTION' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When the drawee refuses to accept or pay the collection.

**Why:** Refusal must be promptly reported to allow principal to take protective action (protest, alternative buyers, return).

**Effect:**
- Records MT416 refusal
- Stage changes to REFUSED
- Immediately notifies remitting bank
- Principal must decide: protest, return documents, or seek alternative'
WHERE event_code = 'REFUSE' AND operation_type = 'COLLECTION' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When receiving payment from the drawee (D/P) or at maturity (D/A after acceptance).

**Why:** Payment completes the collection successfully. Funds must be remitted promptly to the principal.

**Effect:**
- Generates MT400 payment advice
- Stage changes to PAID
- Funds remitted to remitting bank
- Collection successfully completed
- Documents released to drawee (if not already)'
WHERE event_code = 'PAYMENT' AND operation_type = 'COLLECTION' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When documents must be returned to the remitting bank due to non-payment or non-acceptance.

**Why:** Documents still hold value and may be used with alternative buyers or for legal action.

**Effect:**
- Generates MT410 document return
- Stage changes to RETURNED
- Documents dispatched back to remitting bank
- Collection unsuccessful'
WHERE event_code = 'RETURN_DOCS' AND operation_type = 'COLLECTION' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** After collection is fully settled (paid or returned and closed).

**Why:** Proper closure archives the transaction and releases any pending tracking or alerts.

**Effect:**
- Stage changes to CLOSED
- Status becomes CLOSED
- Archives collection record
- No further actions required
- Releases tracking alerts'
WHERE event_code = 'CLOSE' AND operation_type = 'COLLECTION' AND language = 'en';

-- =============================================
-- COLLECTION Events - Spanish
-- =============================================

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Después de recibir documentos de cobranza del principal y preparar la instrucción de cobranza.

**Por qué:** El banco remitente debe enviar documentos al banco cobrador con instrucciones claras según las reglas URC 522.

**Efecto:**
- Genera instrucción de cobranza MT400
- La etapa cambia de EMITIDA a ENVIADA
- Inicia el proceso de cobranza
- Documentos despachados al banco cobrador'
WHERE event_code = 'SEND_COLLECTION' AND operation_type = 'COLLECTION' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Cuando el banco cobrador presenta documentos al girado para aceptación/pago.

**Por qué:** URC 522 requiere presentación oportuna. El retraso puede resultar en cargos de almacenaje o pérdida de mercancía perecedera.

**Efecto:**
- Registra fecha de presentación
- La etapa cambia a PRESENTADA
- Inicia período de espera de pago/aceptación
- El girado debe responder: aceptar, pagar o rechazar'
WHERE event_code = 'PRESENT_DRAWEE' AND operation_type = 'COLLECTION' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Cuando el girado acepta formalmente los documentos (para cobranzas D/A) o la letra.

**Por qué:** La aceptación crea una obligación vinculante de pago por el girado. Los documentos pueden liberarse después de la aceptación.

**Efecto:**
- Registra aceptación MT412
- La etapa cambia a ACEPTADA
- Crea cuenta por cobrar al vencimiento
- Documentos liberados al girado (para D/A)
- Pago debido en fecha de vencimiento'
WHERE event_code = 'ACCEPT' AND operation_type = 'COLLECTION' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Cuando el girado rechaza aceptar o pagar la cobranza.

**Por qué:** El rechazo debe reportarse prontamente para permitir al principal tomar acción protectiva (protesto, compradores alternativos, devolución).

**Efecto:**
- Registra rechazo MT416
- La etapa cambia a RECHAZADA
- Notifica inmediatamente al banco remitente
- El principal debe decidir: protestar, devolver documentos o buscar alternativa'
WHERE event_code = 'REFUSE' AND operation_type = 'COLLECTION' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Al recibir pago del girado (D/P) o al vencimiento (D/A después de aceptación).

**Por qué:** El pago completa la cobranza exitosamente. Los fondos deben remitirse prontamente al principal.

**Efecto:**
- Genera aviso de pago MT400
- La etapa cambia a PAGADA
- Fondos remitidos al banco remitente
- Cobranza completada exitosamente
- Documentos liberados al girado (si no lo estaban)'
WHERE event_code = 'PAYMENT' AND operation_type = 'COLLECTION' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Cuando los documentos deben devolverse al banco remitente por impago o no aceptación.

**Por qué:** Los documentos aún tienen valor y pueden usarse con compradores alternativos o para acción legal.

**Efecto:**
- Genera devolución de documentos MT410
- La etapa cambia a DEVUELTA
- Documentos despachados de vuelta al banco remitente
- Cobranza sin éxito'
WHERE event_code = 'RETURN_DOCS' AND operation_type = 'COLLECTION' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Después de que la cobranza está completamente liquidada (pagada o devuelta y cerrada).

**Por qué:** El cierre adecuado archiva la transacción y libera cualquier seguimiento o alertas pendientes.

**Efecto:**
- La etapa cambia a CERRADA
- El estado se vuelve CERRADO
- Archiva registro de cobranza
- No se requieren más acciones
- Libera alertas de seguimiento'
WHERE event_code = 'CLOSE' AND operation_type = 'COLLECTION' AND language = 'es';

-- =============================================
-- LC_EXPORT Events - English
-- =============================================

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** After LC application is approved and all issuance requirements are met.

**Why:** Issuance creates the bank''s irrevocable commitment. The MT700 must be sent to the advising bank to initiate the credit.

**Effect:**
- Generates MT700 documentary credit issuance
- Stage changes from DRAFT to ISSUED
- Creates contingent liability
- Advising bank notified to advise beneficiary
- Applicant''s credit line affected'
WHERE event_code = 'ISSUE' AND operation_type = 'LC_EXPORT' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When LC terms need modification at applicant request.

**Why:** Commercial changes (quantities, dates, terms) require formal LC amendment. All amendments need beneficiary consent.

**Effect:**
- Generates MT707 amendment
- Stage changes to PENDING_AMENDMENT
- Requires beneficiary acceptance
- May affect fees and credit line'
WHERE event_code = 'AMEND' AND operation_type = 'LC_EXPORT' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When receiving documents from the advising/negotiating bank.

**Why:** Document receipt starts the examination clock. UCP 600 allows 5 banking days for examination.

**Effect:**
- Records document receipt date
- Stage changes to DOCUMENTS_RECEIVED
- Starts 5-day examination period
- Documents queued for examination'
WHERE event_code = 'RECEIVE_DOCS' AND operation_type = 'LC_EXPORT' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** To begin formal document examination process.

**Why:** Systematic examination ensures compliance with LC terms per UCP 600. Proper examination protects the bank from liability.

**Effect:**
- Stage changes to UNDER_EXAMINATION
- Documents under detailed review
- Compliance checklist initiated
- Examiner assigned'
WHERE event_code = 'EXAMINE_DOCS' AND operation_type = 'LC_EXPORT' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** When document examination reveals non-compliance with LC terms.

**Why:** UCP 600 Article 16 requires prompt notification of discrepancies. Failure to notify timely may obligate payment despite discrepancies.

**Effect:**
- Generates MT734 refusal notice
- Stage changes to DISCREPANT
- Beneficiary/presenter notified
- Awaiting instructions: waiver, correction, or return'
WHERE event_code = 'DISCREPANCY' AND operation_type = 'LC_EXPORT' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** After documents pass examination or applicant waives discrepancies.

**Why:** Acceptance creates irrevocable payment obligation. Documents must be forwarded to applicant.

**Effect:**
- Generates MT730 acceptance
- Stage changes to DOCUMENTS_ACCEPTED
- Payment scheduled (sight or usance)
- Documents released to applicant'
WHERE event_code = 'ACCEPT_DOCS' AND operation_type = 'LC_EXPORT' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** At sight or maturity date after document acceptance.

**Why:** Fulfills the issuing bank''s commitment. Payment must be made as per LC terms.

**Effect:**
- Generates MT756 payment advice
- Stage changes to PAID
- Funds transferred to presenting bank
- Accounting entries posted
- Credit line released'
WHERE event_code = 'PAYMENT' AND operation_type = 'LC_EXPORT' AND language = 'en';

UPDATE event_type_config_readmodel SET help_text =
'**When to execute:** After full utilization or expiry of the LC.

**Why:** Proper closure releases contingent liability and archives the transaction.

**Effect:**
- Stage changes to CLOSED
- Contingent liability removed
- LC archived
- No further drawings possible'
WHERE event_code = 'CLOSE' AND operation_type = 'LC_EXPORT' AND language = 'en';

-- =============================================
-- LC_EXPORT Events - Spanish
-- =============================================

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Después de que la solicitud de LC es aprobada y todos los requisitos de emisión se cumplen.

**Por qué:** La emisión crea el compromiso irrevocable del banco. El MT700 debe enviarse al banco avisador para iniciar el crédito.

**Efecto:**
- Genera emisión de crédito documentario MT700
- La etapa cambia de BORRADOR a EMITIDA
- Crea pasivo contingente
- Banco avisador notificado para avisar al beneficiario
- Línea de crédito del ordenante afectada'
WHERE event_code = 'ISSUE' AND operation_type = 'LC_EXPORT' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Cuando los términos de la LC necesitan modificación a solicitud del ordenante.

**Por qué:** Los cambios comerciales (cantidades, fechas, términos) requieren enmienda formal de LC. Todas las enmiendas necesitan consentimiento del beneficiario.

**Efecto:**
- Genera enmienda MT707
- La etapa cambia a ENMIENDA_PENDIENTE
- Requiere aceptación del beneficiario
- Puede afectar comisiones y línea de crédito'
WHERE event_code = 'AMEND' AND operation_type = 'LC_EXPORT' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Al recibir documentos del banco avisador/negociador.

**Por qué:** La recepción de documentos inicia el reloj de examen. UCP 600 permite 5 días bancarios para examen.

**Efecto:**
- Registra fecha de recepción de documentos
- La etapa cambia a DOCUMENTOS_RECIBIDOS
- Inicia período de examen de 5 días
- Documentos en cola para examen'
WHERE event_code = 'RECEIVE_DOCS' AND operation_type = 'LC_EXPORT' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Para iniciar el proceso formal de examen de documentos.

**Por qué:** El examen sistemático asegura cumplimiento con los términos de la LC según UCP 600. El examen adecuado protege al banco de responsabilidad.

**Efecto:**
- La etapa cambia a BAJO_EXAMEN
- Documentos bajo revisión detallada
- Lista de verificación de conformidad iniciada
- Examinador asignado'
WHERE event_code = 'EXAMINE_DOCS' AND operation_type = 'LC_EXPORT' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Cuando el examen de documentos revela incumplimiento con los términos de la LC.

**Por qué:** El Artículo 16 de UCP 600 requiere notificación pronta de discrepancias. No notificar oportunamente puede obligar al pago a pesar de las discrepancias.

**Efecto:**
- Genera aviso de rechazo MT734
- La etapa cambia a DISCREPANTE
- Beneficiario/presentador notificado
- Esperando instrucciones: dispensa, corrección o devolución'
WHERE event_code = 'DISCREPANCY' AND operation_type = 'LC_EXPORT' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Después de que los documentos pasan el examen o el ordenante dispensa las discrepancias.

**Por qué:** La aceptación crea obligación irrevocable de pago. Los documentos deben enviarse al ordenante.

**Efecto:**
- Genera aceptación MT730
- La etapa cambia a DOCUMENTOS_ACEPTADOS
- Pago programado (vista o plazo)
- Documentos liberados al ordenante'
WHERE event_code = 'ACCEPT_DOCS' AND operation_type = 'LC_EXPORT' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** A la vista o en fecha de vencimiento después de aceptación de documentos.

**Por qué:** Cumple el compromiso del banco emisor. El pago debe hacerse según los términos de la LC.

**Efecto:**
- Genera aviso de pago MT756
- La etapa cambia a PAGADA
- Fondos transferidos al banco presentador
- Asientos contables registrados
- Línea de crédito liberada'
WHERE event_code = 'PAYMENT' AND operation_type = 'LC_EXPORT' AND language = 'es';

UPDATE event_type_config_readmodel SET help_text =
'**Cuándo ejecutar:** Después de utilización total o vencimiento de la LC.

**Por qué:** El cierre adecuado libera el pasivo contingente y archiva la transacción.

**Efecto:**
- La etapa cambia a CERRADA
- Pasivo contingente eliminado
- LC archivada
- No son posibles más utilizaciones'
WHERE event_code = 'CLOSE' AND operation_type = 'LC_EXPORT' AND language = 'es';
