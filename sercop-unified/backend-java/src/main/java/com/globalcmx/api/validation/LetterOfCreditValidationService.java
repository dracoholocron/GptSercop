package com.globalcmx.api.validation;

import com.globalcmx.api.dto.command.CreateLetterOfCreditCommand;
import com.globalcmx.api.dto.command.CreateSwiftDraftCommand;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Servicio de validación de Cartas de Crédito usando Drools.
 * Utiliza DynamicValidationService para cargar reglas dinámicamente desde event_rules_read_model.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LetterOfCreditValidationService {

    private final DynamicValidationService dynamicValidationService;

    private static final String OPERATION_TYPE_LC = "LETTER_OF_CREDIT";
    private static final String OPERATION_TYPE_DRAFT = "SWIFT_DRAFT";
    private static final String TRIGGER_EVENT_PRE_CREATE = "PRE_CREATED";

    /**
     * Valida un comando de creación de carta de crédito usando reglas Drools dinámicas.
     * Las reglas se obtienen de event_rules_read_model con:
     *   - operation_type = "LETTER_OF_CREDIT"
     *   - trigger_event = "PRE_CREATED"
     *
     * @param command Comando de creación
     * @return ValidationResult con errores si los hay
     */
    public ValidationResult validate(CreateLetterOfCreditCommand command) {
        log.debug("Validando carta de crédito con reglas dinámicas: {}", command.getNumeroOperacion());

        return dynamicValidationService.validate(
                command,
                OPERATION_TYPE_LC,
                TRIGGER_EVENT_PRE_CREATE
        );
    }

    /**
     * Valida un borrador SWIFT usando reglas Drools dinámicas.
     * Las reglas se obtienen de event_rules_read_model con:
     *   - operation_type = "SWIFT_DRAFT"
     *   - trigger_event = "PRE_CREATED"
     *
     * @param command Comando de creación de borrador SWIFT
     * @return ValidationResult con errores si los hay
     */
    public ValidationResult validateDraft(CreateSwiftDraftCommand command) {
        log.debug("Validando borrador SWIFT con reglas dinámicas: messageType={}, productType={}",
                command.getMessageType(), command.getProductType());

        return dynamicValidationService.validate(
                command,
                OPERATION_TYPE_DRAFT,
                TRIGGER_EVENT_PRE_CREATE
        );
    }

    /**
     * Valida y lanza excepción si hay errores.
     *
     * @param command Comando de creación
     * @throws BusinessValidationException si la validación falla
     */
    public void validateAndThrow(CreateLetterOfCreditCommand command) {
        dynamicValidationService.validateAndThrow(
                command,
                OPERATION_TYPE_LC,
                TRIGGER_EVENT_PRE_CREATE
        );
    }

    /**
     * Valida borrador SWIFT y lanza excepción si hay errores críticos.
     *
     * @param command Comando de creación de borrador SWIFT
     * @throws BusinessValidationException si la validación falla
     */
    public void validateDraftAndThrow(CreateSwiftDraftCommand command) {
        dynamicValidationService.validateAndThrow(
                command,
                OPERATION_TYPE_DRAFT,
                TRIGGER_EVENT_PRE_CREATE
        );
    }
}
