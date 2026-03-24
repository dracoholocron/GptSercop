package com.globalcmx.api.service;

import com.globalcmx.api.dto.command.EventTypeConfigCommand;
import com.globalcmx.api.dto.command.EventFlowConfigCommand;
import com.globalcmx.api.dto.command.SwiftResponseConfigCommand;
import com.globalcmx.api.readmodel.entity.EventTypeConfigReadModel;
import com.globalcmx.api.readmodel.entity.EventFlowConfigReadModel;
import com.globalcmx.api.readmodel.entity.SwiftResponseConfigReadModel;
import com.globalcmx.api.readmodel.entity.EventAlertTemplate;
import com.globalcmx.api.readmodel.repository.EventTypeConfigReadModelRepository;
import com.globalcmx.api.readmodel.repository.EventFlowConfigReadModelRepository;
import com.globalcmx.api.readmodel.repository.SwiftResponseConfigReadModelRepository;
import com.globalcmx.api.readmodel.repository.EventAlertTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Command service for event configuration CRUD operations.
 * Handles create, update, and delete operations following CQRS pattern.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventConfigCommandService {

    private final EventTypeConfigReadModelRepository eventTypeRepository;
    private final EventFlowConfigReadModelRepository eventFlowRepository;
    private final SwiftResponseConfigReadModelRepository responseConfigRepository;
    private final EventAlertTemplateRepository alertTemplateRepository;

    // ==================== Event Type Config ====================

    @Transactional
    public EventTypeConfigReadModel createEventType(EventTypeConfigCommand command) {
        log.info("Creating event type: {} for operation: {}", command.getEventCode(), command.getOperationType());

        // Check for duplicates
        Optional<EventTypeConfigReadModel> existing = eventTypeRepository
                .findByEventCodeAndOperationTypeAndLanguage(
                        command.getEventCode(),
                        command.getOperationType(),
                        command.getLanguage()
                );

        if (existing.isPresent()) {
            throw new IllegalArgumentException(
                    String.format("Event type %s already exists for operation %s in language %s",
                            command.getEventCode(), command.getOperationType(), command.getLanguage()));
        }

        EventTypeConfigReadModel entity = mapToEventTypeEntity(command, new EventTypeConfigReadModel());
        entity.setCreatedAt(LocalDateTime.now());
        entity.setModifiedAt(LocalDateTime.now());
        entity.setVersion(1);

        return eventTypeRepository.save(entity);
    }

    @Transactional
    public EventTypeConfigReadModel updateEventType(Long id, EventTypeConfigCommand command) {
        log.info("Updating event type ID: {}", id);

        EventTypeConfigReadModel entity = eventTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event type not found: " + id));

        // Check if changing key fields would create a duplicate
        if (!entity.getEventCode().equals(command.getEventCode()) ||
            !entity.getOperationType().equals(command.getOperationType()) ||
            !entity.getLanguage().equals(command.getLanguage())) {

            Optional<EventTypeConfigReadModel> duplicate = eventTypeRepository
                    .findByEventCodeAndOperationTypeAndLanguage(
                            command.getEventCode(),
                            command.getOperationType(),
                            command.getLanguage()
                    );

            if (duplicate.isPresent() && !duplicate.get().getId().equals(id)) {
                throw new IllegalArgumentException(
                        String.format("Event type %s already exists for operation %s in language %s",
                                command.getEventCode(), command.getOperationType(), command.getLanguage()));
            }
        }

        mapToEventTypeEntity(command, entity);
        entity.setModifiedAt(LocalDateTime.now());
        entity.setVersion(entity.getVersion() + 1);

        return eventTypeRepository.save(entity);
    }

    @Transactional
    public void deleteEventType(Long id) {
        log.info("Deleting event type ID: {}", id);

        EventTypeConfigReadModel entity = eventTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event type not found: " + id));

        // Check if event type is used in any flows
        List<EventFlowConfigReadModel> referencingFlows = eventFlowRepository
                .findByOperationTypeAndToEventCode(entity.getOperationType(), entity.getEventCode());

        if (!referencingFlows.isEmpty()) {
            throw new IllegalStateException(
                    String.format("Cannot delete event type %s: it is referenced by %d flow configurations",
                            entity.getEventCode(), referencingFlows.size()));
        }

        eventTypeRepository.delete(entity);
    }

    private EventTypeConfigReadModel mapToEventTypeEntity(EventTypeConfigCommand cmd, EventTypeConfigReadModel entity) {
        entity.setEventCode(cmd.getEventCode());
        entity.setOperationType(cmd.getOperationType());
        entity.setLanguage(cmd.getLanguage());
        entity.setEventName(cmd.getEventName());
        entity.setEventDescription(cmd.getEventDescription());
        entity.setHelpText(cmd.getHelpText());
        entity.setOutboundMessageType(cmd.getOutboundMessageType());
        entity.setInboundMessageType(cmd.getInboundMessageType());
        entity.setValidFromStages(cmd.getValidFromStages());
        entity.setValidFromStatuses(cmd.getValidFromStatuses());
        entity.setResultingStage(cmd.getResultingStage());
        entity.setResultingStatus(cmd.getResultingStatus());
        entity.setIcon(cmd.getIcon());
        entity.setColor(cmd.getColor());
        entity.setDisplayOrder(cmd.getDisplayOrder() != null ? cmd.getDisplayOrder() : 0);
        entity.setIsActive(cmd.getIsActive());
        entity.setRequiresApproval(cmd.getRequiresApproval() != null ? cmd.getRequiresApproval() : false);
        entity.setApprovalLevels(cmd.getApprovalLevels() != null ? cmd.getApprovalLevels() : 1);
        entity.setIsReversible(cmd.getIsReversible() != null ? cmd.getIsReversible() : false);
        entity.setGeneratesNotification(cmd.getGeneratesNotification() != null ? cmd.getGeneratesNotification() : true);
        entity.setAllowedRoles(cmd.getAllowedRoles());
        // Message direction fields
        entity.setMessageSender(cmd.getMessageSender());
        entity.setMessageReceiver(cmd.getMessageReceiver());
        entity.setOurRole(cmd.getOurRole());
        entity.setRequiresSwiftMessage(cmd.getRequiresSwiftMessage() != null ? cmd.getRequiresSwiftMessage() : false);
        entity.setEventCategory(cmd.getEventCategory());
        // Initial event configuration
        entity.setIsInitialEvent(cmd.getIsInitialEvent() != null ? cmd.getIsInitialEvent() : false);
        entity.setInitialEventRole(cmd.getInitialEventRole());
        return entity;
    }

    // ==================== Event Flow Config ====================

    @Transactional
    public EventFlowConfigReadModel createEventFlow(EventFlowConfigCommand command) {
        log.info("Creating event flow: {} -> {} for operation: {}",
                command.getFromEventCode(), command.getToEventCode(), command.getOperationType());

        // Validate that toEventCode exists
        validateEventCodeExists(command.getOperationType(), command.getToEventCode(), command.getLanguage());

        // Validate fromEventCode if provided
        if (command.getFromEventCode() != null && !command.getFromEventCode().isEmpty()) {
            validateEventCodeExists(command.getOperationType(), command.getFromEventCode(), command.getLanguage());
        }

        EventFlowConfigReadModel entity = mapToEventFlowEntity(command, new EventFlowConfigReadModel());
        return eventFlowRepository.save(entity);
    }

    @Transactional
    public EventFlowConfigReadModel updateEventFlow(Long id, EventFlowConfigCommand command) {
        log.info("Updating event flow ID: {}", id);

        EventFlowConfigReadModel entity = eventFlowRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event flow not found: " + id));

        // Validate that toEventCode exists
        validateEventCodeExists(command.getOperationType(), command.getToEventCode(), command.getLanguage());

        // Validate fromEventCode if provided
        if (command.getFromEventCode() != null && !command.getFromEventCode().isEmpty()) {
            validateEventCodeExists(command.getOperationType(), command.getFromEventCode(), command.getLanguage());
        }

        mapToEventFlowEntity(command, entity);
        return eventFlowRepository.save(entity);
    }

    @Transactional
    public void deleteEventFlow(Long id) {
        log.info("Deleting event flow ID: {}", id);

        EventFlowConfigReadModel entity = eventFlowRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event flow not found: " + id));

        eventFlowRepository.delete(entity);
    }

    private void validateEventCodeExists(String operationType, String eventCode, String language) {
        String lang = language != null ? language : "en";
        Optional<EventTypeConfigReadModel> eventType = eventTypeRepository
                .findByEventCodeAndOperationTypeAndLanguage(eventCode, operationType, lang);

        if (eventType.isEmpty()) {
            throw new IllegalArgumentException(
                    String.format("Event type %s does not exist for operation %s", eventCode, operationType));
        }
    }

    private EventFlowConfigReadModel mapToEventFlowEntity(EventFlowConfigCommand cmd, EventFlowConfigReadModel entity) {
        entity.setOperationType(cmd.getOperationType());
        entity.setFromEventCode(cmd.getFromEventCode());
        entity.setFromStage(cmd.getFromStage());
        entity.setToEventCode(cmd.getToEventCode());
        entity.setConditions(cmd.getConditions());
        entity.setIsRequired(cmd.getIsRequired());
        entity.setIsOptional(cmd.getIsOptional());
        entity.setSequenceOrder(cmd.getSequenceOrder() != null ? cmd.getSequenceOrder() : 0);
        entity.setLanguage(cmd.getLanguage() != null ? cmd.getLanguage() : "en");
        entity.setTransitionLabel(cmd.getTransitionLabel());
        entity.setTransitionHelp(cmd.getTransitionHelp());
        entity.setIsActive(cmd.getIsActive());
        return entity;
    }

    // ==================== SWIFT Response Config ====================

    @Transactional
    public SwiftResponseConfigReadModel createResponseConfig(SwiftResponseConfigCommand command) {
        log.info("Creating response config: {} -> {} for operation: {}",
                command.getSentMessageType(), command.getExpectedResponseType(), command.getOperationType());

        // Check for duplicates
        Optional<SwiftResponseConfigReadModel> existing = responseConfigRepository
                .findBySentMessageTypeAndOperationTypeAndLanguage(
                        command.getSentMessageType(),
                        command.getOperationType(),
                        command.getLanguage() != null ? command.getLanguage() : "en"
                );

        if (existing.isPresent()) {
            throw new IllegalArgumentException(
                    String.format("Response config for %s already exists for operation %s",
                            command.getSentMessageType(), command.getOperationType()));
        }

        SwiftResponseConfigReadModel entity = mapToResponseConfigEntity(command, new SwiftResponseConfigReadModel());
        return responseConfigRepository.save(entity);
    }

    @Transactional
    public SwiftResponseConfigReadModel updateResponseConfig(Long id, SwiftResponseConfigCommand command) {
        log.info("Updating response config ID: {}", id);

        SwiftResponseConfigReadModel entity = responseConfigRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Response config not found: " + id));

        // Check if changing key fields would create a duplicate
        String newLang = command.getLanguage() != null ? command.getLanguage() : "en";
        if (!entity.getSentMessageType().equals(command.getSentMessageType()) ||
            !entity.getOperationType().equals(command.getOperationType()) ||
            !entity.getLanguage().equals(newLang)) {

            Optional<SwiftResponseConfigReadModel> duplicate = responseConfigRepository
                    .findBySentMessageTypeAndOperationTypeAndLanguage(
                            command.getSentMessageType(),
                            command.getOperationType(),
                            newLang
                    );

            if (duplicate.isPresent() && !duplicate.get().getId().equals(id)) {
                throw new IllegalArgumentException(
                        String.format("Response config for %s already exists for operation %s",
                                command.getSentMessageType(), command.getOperationType()));
            }
        }

        mapToResponseConfigEntity(command, entity);
        return responseConfigRepository.save(entity);
    }

    @Transactional
    public void deleteResponseConfig(Long id) {
        log.info("Deleting response config ID: {}", id);

        SwiftResponseConfigReadModel entity = responseConfigRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Response config not found: " + id));

        responseConfigRepository.delete(entity);
    }

    private SwiftResponseConfigReadModel mapToResponseConfigEntity(SwiftResponseConfigCommand cmd, SwiftResponseConfigReadModel entity) {
        entity.setSentMessageType(cmd.getSentMessageType());
        entity.setOperationType(cmd.getOperationType());
        entity.setExpectedResponseType(cmd.getExpectedResponseType());
        entity.setResponseEventCode(cmd.getResponseEventCode());
        entity.setExpectedResponseDays(cmd.getExpectedResponseDays() != null ? cmd.getExpectedResponseDays() : 5);
        entity.setAlertAfterDays(cmd.getAlertAfterDays() != null ? cmd.getAlertAfterDays() : 3);
        entity.setEscalateAfterDays(cmd.getEscalateAfterDays() != null ? cmd.getEscalateAfterDays() : 7);
        entity.setLanguage(cmd.getLanguage() != null ? cmd.getLanguage() : "en");
        entity.setResponseDescription(cmd.getResponseDescription());
        entity.setTimeoutMessage(cmd.getTimeoutMessage());
        entity.setIsActive(cmd.getIsActive());
        return entity;
    }

    // ==================== Event Alert Template CRUD ====================

    @Transactional
    public EventAlertTemplate createAlertTemplate(EventAlertTemplate template) {
        log.info("Creating alert template for event: {} operation: {}", template.getEventCode(), template.getOperationType());
        return alertTemplateRepository.save(template);
    }

    @Transactional
    public EventAlertTemplate updateAlertTemplate(Long id, EventAlertTemplate updated) {
        log.info("Updating alert template ID: {}", id);
        EventAlertTemplate entity = alertTemplateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Alert template not found: " + id));

        entity.setOperationType(updated.getOperationType());
        entity.setEventCode(updated.getEventCode());
        entity.setAlertType(updated.getAlertType());
        entity.setRequirementLevel(updated.getRequirementLevel());
        entity.setTitleTemplate(updated.getTitleTemplate());
        entity.setDescriptionTemplate(updated.getDescriptionTemplate());
        entity.setDefaultPriority(updated.getDefaultPriority());
        entity.setAssignedRole(updated.getAssignedRole());
        entity.setDueDaysOffset(updated.getDueDaysOffset());
        entity.setTags(updated.getTags());
        entity.setLanguage(updated.getLanguage());
        entity.setDisplayOrder(updated.getDisplayOrder());
        entity.setIsActive(updated.getIsActive());
        entity.setEmailTemplateId(updated.getEmailTemplateId());
        entity.setDocumentTemplateId(updated.getDocumentTemplateId());
        entity.setEmailSubject(updated.getEmailSubject());
        entity.setEmailRecipients(updated.getEmailRecipients());
        entity.setDueDateReference(updated.getDueDateReference());

        return alertTemplateRepository.save(entity);
    }

    @Transactional
    public void deleteAlertTemplate(Long id) {
        log.info("Deleting alert template ID: {}", id);
        EventAlertTemplate entity = alertTemplateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Alert template not found: " + id));
        alertTemplateRepository.delete(entity);
    }

    @Transactional(readOnly = true)
    public List<EventAlertTemplate> getAlertTemplates(String operationType, String language) {
        return alertTemplateRepository.findByOperationTypeAndLanguageOrderByEventCodeAscDisplayOrderAsc(operationType, language);
    }

    @Transactional(readOnly = true)
    public List<EventAlertTemplate> getAlertTemplatesForEvent(String operationType, String eventCode, String language) {
        return alertTemplateRepository.findByOperationTypeAndEventCodeAndLanguageAndIsActiveTrueOrderByDisplayOrderAsc(
                operationType, eventCode, language);
    }

    // ==================== Alert Template Generation ====================

    /**
     * Generates default alert templates for a single event based on its properties.
     * No hardcoded event codes - uses event characteristics (name, category, SWIFT, approval, etc.)
     */
    @Transactional
    public List<EventAlertTemplate> generateDefaultTemplates(String operationType, String eventCode, String language) {
        log.info("Generating default alert templates for {}/{} lang={}", operationType, eventCode, language);

        EventTypeConfigReadModel event = eventTypeRepository
                .findByEventCodeAndOperationTypeAndLanguage(eventCode, operationType, language)
                .orElseThrow(() -> new IllegalArgumentException(
                        String.format("Event %s not found for operation %s language %s", eventCode, operationType, language)));

        // Delete existing templates for this event+language before regenerating
        List<EventAlertTemplate> existing = alertTemplateRepository
                .findByOperationTypeAndLanguageOrderByEventCodeAscDisplayOrderAsc(operationType, language)
                .stream()
                .filter(t -> t.getEventCode().equals(eventCode))
                .collect(Collectors.toList());
        if (!existing.isEmpty()) {
            alertTemplateRepository.deleteAll(existing);
            log.info("Deleted {} existing templates for {}/{}", existing.size(), operationType, eventCode);
        }

        List<EventAlertTemplate> generated = buildTemplatesFromEventProperties(event, language);
        List<EventAlertTemplate> saved = alertTemplateRepository.saveAll(generated);
        log.info("Generated {} templates for {}/{}", saved.size(), operationType, eventCode);
        return saved;
    }

    /**
     * Generates default alert templates for ALL events of an operation type.
     */
    @Transactional
    public List<EventAlertTemplate> generateDefaultTemplatesForAll(String operationType, String language) {
        log.info("Generating default alert templates for ALL events of {} lang={}", operationType, language);

        List<EventTypeConfigReadModel> events = eventTypeRepository
                .findByOperationTypeAndLanguageAndIsActiveTrueOrderByDisplayOrderAsc(operationType, language);

        if (events.isEmpty()) {
            throw new IllegalArgumentException("No events found for operation " + operationType);
        }

        // Delete all existing templates for this operation+language
        List<EventAlertTemplate> existing = alertTemplateRepository
                .findByOperationTypeAndLanguageOrderByEventCodeAscDisplayOrderAsc(operationType, language);
        if (!existing.isEmpty()) {
            alertTemplateRepository.deleteAll(existing);
            log.info("Deleted {} existing templates for {}", existing.size(), operationType);
        }

        List<EventAlertTemplate> allGenerated = new ArrayList<>();
        for (EventTypeConfigReadModel event : events) {
            allGenerated.addAll(buildTemplatesFromEventProperties(event, language));
        }

        List<EventAlertTemplate> saved = alertTemplateRepository.saveAll(allGenerated);
        log.info("Generated {} total templates for {} ({} events)", saved.size(), operationType, events.size());
        return saved;
    }

    /**
     * Core generation logic: reads event properties and creates appropriate templates.
     * Uses keyword detection on eventName/eventDescription and boolean flags.
     */
    private List<EventAlertTemplate> buildTemplatesFromEventProperties(EventTypeConfigReadModel event, String language) {
        List<EventAlertTemplate> templates = new ArrayList<>();
        String name = (event.getEventName() != null ? event.getEventName() : "").toLowerCase();
        String desc = (event.getEventDescription() != null ? event.getEventDescription() : "").toLowerCase();
        String combined = name + " " + desc;
        boolean isEs = "es".equals(language);
        int order = 1;

        // --- 1. Every event: basic FOLLOW_UP ---
        templates.add(buildTemplate(event, language, order++,
                "FOLLOW_UP", "RECOMMENDED", "NORMAL", "ROLE_OPERATOR", 3,
                isEs ? "Seguimiento: " + event.getEventName()
                      : "Follow up: " + event.getEventName(),
                isEs ? "Dar seguimiento a la ejecución del evento '" + event.getEventName() + "' en la operación #{operationReference}"
                      : "Follow up on '" + event.getEventName() + "' execution for operation #{operationReference}",
                "[\"seguimiento\"]"));

        // --- 2. SWIFT events: verify message delivery ---
        if (Boolean.TRUE.equals(event.getRequiresSwiftMessage())) {
            String swiftType = event.getOutboundMessageType() != null ? event.getOutboundMessageType() : "SWIFT";
            templates.add(buildTemplate(event, language, order++,
                    "TASK", "MANDATORY", "HIGH", "ROLE_OPERATOR", 1,
                    isEs ? "Verificar envío " + swiftType
                          : "Verify " + swiftType + " delivery",
                    isEs ? "Confirmar que el mensaje " + swiftType + " fue enviado y entregado correctamente para #{operationReference}"
                          : "Confirm that " + swiftType + " message was sent and delivered for #{operationReference}",
                    "[\"swift\",\"verificacion\"]"));

            if (event.getInboundMessageType() != null && !event.getInboundMessageType().isEmpty()) {
                templates.add(buildTemplate(event, language, order++,
                        "REMINDER", "RECOMMENDED", "NORMAL", "ROLE_OPERATOR", 5,
                        isEs ? "Esperar respuesta " + event.getInboundMessageType()
                              : "Await " + event.getInboundMessageType() + " response",
                        isEs ? "Dar seguimiento a la respuesta " + event.getInboundMessageType() + " esperada para #{operationReference}"
                              : "Follow up on expected " + event.getInboundMessageType() + " response for #{operationReference}",
                        "[\"swift\",\"respuesta\"]"));
            }
        }

        // --- 3. Approval events: approval tracking ---
        if (Boolean.TRUE.equals(event.getRequiresApproval())) {
            templates.add(buildTemplate(event, language, order++,
                    "TASK", "MANDATORY", "HIGH", "ROLE_MANAGER", 1,
                    isEs ? "Aprobar: " + event.getEventName()
                          : "Approve: " + event.getEventName(),
                    isEs ? "Revisar y aprobar la ejecución de '" + event.getEventName() + "' para #{operationReference}"
                          : "Review and approve '" + event.getEventName() + "' execution for #{operationReference}",
                    "[\"aprobacion\"]"));
        }

        // --- 4. Document-related keywords ---
        if (matchesAny(combined, "documento", "document", "presentar", "present", "examinar", "examine",
                "revisión", "review", "cotejo", "recibir doc", "receive doc", "envío doc")) {
            templates.add(buildTemplate(event, language, order++,
                    "DEADLINE", "MANDATORY", "URGENT", "ROLE_OPERATOR", 5,
                    isEs ? "Plazo de revisión documental"
                          : "Document review deadline",
                    isEs ? "Completar revisión de documentos para #{operationReference} dentro del plazo bancario"
                          : "Complete document review for #{operationReference} within banking deadline",
                    "[\"documentacion\",\"urgente\"]"));
            templates.add(buildTemplate(event, language, order++,
                    "COMPLIANCE_CHECK", "RECOMMENDED", "HIGH", "ROLE_MANAGER", 3,
                    isEs ? "Verificación de compliance"
                          : "Compliance verification",
                    isEs ? "Validar que los documentos de #{operationReference} cumplen con regulaciones AML/KYC"
                          : "Validate documents for #{operationReference} comply with AML/KYC regulations",
                    "[\"compliance\",\"documentacion\"]"));
        }

        // --- 5. Payment-related keywords ---
        if (matchesAny(combined, "pago", "payment", "pay", "débito", "debit", "transferi", "transfer",
                "reembolso", "reimbursement", "cobr")) {
            templates.add(buildTemplate(event, language, order++,
                    "TASK", "MANDATORY", "HIGH", "ROLE_MANAGER", 1,
                    isEs ? "Confirmar aplicación contable"
                          : "Confirm accounting entry",
                    isEs ? "Verificar que el pago de #{operationReference} por #{formattedAmount} #{currency} fue registrado en contabilidad"
                          : "Verify payment for #{operationReference} of #{formattedAmount} #{currency} was recorded in accounting",
                    "[\"pago\",\"contabilidad\"]"));
            templates.add(buildTemplate(event, language, order++,
                    "CLIENT_CONTACT", "RECOMMENDED", "NORMAL", "ROLE_OPERATOR", 1,
                    isEs ? "Notificar pago al cliente"
                          : "Notify payment to client",
                    isEs ? "Comunicar a #{applicantName} sobre el pago de #{operationReference} por #{formattedAmount} #{currency}"
                          : "Notify #{applicantName} about payment for #{operationReference} of #{formattedAmount} #{currency}",
                    "[\"cliente\",\"pago\",\"notificacion\"]"));
        }

        // --- 6. Amendment-related keywords ---
        if (matchesAny(combined, "enmienda", "amend", "modificación", "modif")) {
            templates.add(buildTemplate(event, language, order++,
                    "FOLLOW_UP", "MANDATORY", "HIGH", "ROLE_OPERATOR", 2,
                    isEs ? "Seguimiento a respuesta de enmienda"
                          : "Follow up on amendment response",
                    isEs ? "Verificar la aceptación/rechazo de la enmienda de #{operationReference}"
                          : "Verify acceptance/rejection of amendment for #{operationReference}",
                    "[\"enmienda\",\"seguimiento\"]"));
        }

        // --- 7. Claim/dispute-related keywords ---
        if (matchesAny(combined, "reclamo", "claim", "disputa", "dispute", "discrepancia", "discrepancy")) {
            templates.add(buildTemplate(event, language, order++,
                    "TASK", "MANDATORY", "URGENT", "ROLE_MANAGER", 1,
                    isEs ? "Evaluar y resolver"
                          : "Evaluate and resolve",
                    isEs ? "Evaluar la validez y tomar acción sobre #{operationReference}. Revisar documentación de respaldo."
                          : "Evaluate validity and take action on #{operationReference}. Review supporting documentation.",
                    "[\"urgente\",\"evaluacion\"]"));
            templates.add(buildTemplate(event, language, order++,
                    "CLIENT_CONTACT", "MANDATORY", "URGENT", "ROLE_OPERATOR", 0,
                    isEs ? "Notificar al cliente URGENTE"
                          : "URGENT client notification",
                    isEs ? "Comunicar de inmediato a #{applicantName} sobre #{operationReference}"
                          : "Immediately notify #{applicantName} about #{operationReference}",
                    "[\"cliente\",\"urgente\"]"));
        }

        // --- 8. Closing/archiving events ---
        if (matchesAny(combined, "cerrar", "close", "archivar", "archive", "cancelar", "cancel",
                "liberar", "release", "expirar", "expire", "vencimiento")) {
            templates.add(buildTemplate(event, language, order++,
                    "TASK", "RECOMMENDED", "LOW", "ROLE_OPERATOR", 5,
                    isEs ? "Archivar expediente"
                          : "Archive case file",
                    isEs ? "Archivar documentación completa de #{operationReference} y verificar que no hay saldos pendientes"
                          : "Archive complete documentation for #{operationReference} and verify no outstanding balances",
                    "[\"archivo\",\"cierre\"]"));
        }

        // --- 9. Notification-generating events: always notify ---
        if (Boolean.TRUE.equals(event.getGeneratesNotification()) && !matchesAny(combined, "pago", "payment", "reclamo", "claim", "discrepancia", "discrepancy")) {
            // Only add client contact if not already added by payment/claim patterns
            templates.add(buildTemplate(event, language, order++,
                    "OPERATION_UPDATE", "OPTIONAL", "LOW", "ROLE_OPERATOR", 1,
                    isEs ? "Actualizar estado de operación"
                          : "Update operation status",
                    isEs ? "Registrar actualización de estado para #{operationReference} tras '" + event.getEventName() + "'"
                          : "Record status update for #{operationReference} after '" + event.getEventName() + "'",
                    "[\"actualizacion\"]"));
        }

        return templates;
    }

    private EventAlertTemplate buildTemplate(EventTypeConfigReadModel event, String language, int order,
            String alertType, String requirementLevel, String priority, String role, int dueDays,
            String title, String description, String tags) {
        return EventAlertTemplate.builder()
                .operationType(event.getOperationType())
                .eventCode(event.getEventCode())
                .alertType(alertType)
                .requirementLevel(requirementLevel)
                .titleTemplate(title)
                .descriptionTemplate(description)
                .defaultPriority(priority)
                .assignedRole(role)
                .dueDaysOffset(dueDays)
                .tags(tags)
                .language(language)
                .displayOrder(order)
                .isActive(true)
                .build();
    }

    private boolean matchesAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword.toLowerCase())) return true;
        }
        return false;
    }

}
