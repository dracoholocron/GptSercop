package com.globalcmx.api.email.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.email.dto.EmailActionConfigDTO;
import com.globalcmx.api.email.dto.SendEmailRequest;
import com.globalcmx.api.email.entity.EmailActionConfig;
import com.globalcmx.api.email.repository.EmailActionConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailActionService {

    private final EmailActionConfigRepository repository;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    public List<EmailActionConfig> findAll() { return repository.findAll(); }
    public EmailActionConfig findById(Long id) { return repository.findById(id).orElseThrow(() -> new RuntimeException("Action not found: " + id)); }

    @Transactional
    public EmailActionConfig create(EmailActionConfigDTO dto) { return repository.save(mapToEntity(dto)); }

    @Transactional
    public EmailActionConfig update(Long id, EmailActionConfigDTO dto) {
        EmailActionConfig existing = findById(id);
        updateEntity(existing, dto);
        return repository.save(existing);
    }

    @Transactional
    public void delete(Long id) { repository.deleteById(id); }

    @Transactional
    public void triggerAction(EmailActionConfig.ActionType actionType, String eventTypeCode, String productTypeCode, Map<String, Object> context, String triggeredBy) {
        log.info("Triggering email action: {} for event: {}, product: {}", actionType, eventTypeCode, productTypeCode);
        List<EmailActionConfig> configs = repository.findMatchingConfigs(actionType, eventTypeCode, productTypeCode);
        for (EmailActionConfig config : configs) {
            try { processAction(config, context, triggeredBy); } catch (Exception e) { log.error("Failed to process email action: {}", config.getId(), e); }
        }
    }

    private void processAction(EmailActionConfig config, Map<String, Object> context, String triggeredBy) {
        List<String> recipients = resolveRecipients(config, context);
        if (recipients.isEmpty()) { log.warn("No recipients for action: {}", config.getId()); return; }
        SendEmailRequest request = SendEmailRequest.builder().to(recipients).templateCode(config.getTemplateCode())
                .templateVariables(context).referenceType("EMAIL_ACTION").referenceId(String.valueOf(config.getId())).build();
        emailService.queueEmail(request, triggeredBy);
        log.info("Email queued for action: {}", config.getId());
    }

    @SuppressWarnings("unchecked")
    private List<String> resolveRecipients(EmailActionConfig config, Map<String, Object> context) {
        switch (config.getRecipientType()) {
            case OPERATION_OWNER -> { String owner = (String) context.get("ownerEmail"); return owner != null ? List.of(owner) : List.of(); }
            case APPROVERS -> { Object approvers = context.get("approverEmails"); return approvers instanceof List ? (List<String>) approvers : List.of(); }
            case PARTICIPANTS -> { Object participants = context.get("participantEmails"); return participants instanceof List ? (List<String>) participants : List.of(); }
            case CUSTOM -> { if (config.getCustomRecipients() != null) { try { return objectMapper.readValue(config.getCustomRecipients(), List.class); } catch (Exception e) { log.error("Failed to parse custom recipients", e); } } return List.of(); }
            default -> { return List.of(); }
        }
    }

    private EmailActionConfig mapToEntity(EmailActionConfigDTO dto) {
        try {
            return EmailActionConfig.builder().actionType(EmailActionConfig.ActionType.valueOf(dto.getActionType()))
                    .eventTypeCode(dto.getEventTypeCode()).productTypeCode(dto.getProductTypeCode()).isActive(dto.getIsActive())
                    .templateCode(dto.getTemplateCode()).recipientType(EmailActionConfig.RecipientType.valueOf(dto.getRecipientType()))
                    .customRecipients(dto.getCustomRecipients() != null ? objectMapper.writeValueAsString(dto.getCustomRecipients()) : null)
                    .conditions(dto.getConditions() != null ? objectMapper.writeValueAsString(dto.getConditions()) : null)
                    .createdBy(dto.getCreatedBy()).build();
        } catch (Exception e) { throw new RuntimeException("Failed to map DTO", e); }
    }

    private void updateEntity(EmailActionConfig entity, EmailActionConfigDTO dto) {
        try {
            if (dto.getActionType() != null) entity.setActionType(EmailActionConfig.ActionType.valueOf(dto.getActionType()));
            if (dto.getEventTypeCode() != null) entity.setEventTypeCode(dto.getEventTypeCode());
            if (dto.getProductTypeCode() != null) entity.setProductTypeCode(dto.getProductTypeCode());
            if (dto.getIsActive() != null) entity.setIsActive(dto.getIsActive());
            if (dto.getTemplateCode() != null) entity.setTemplateCode(dto.getTemplateCode());
            if (dto.getRecipientType() != null) entity.setRecipientType(EmailActionConfig.RecipientType.valueOf(dto.getRecipientType()));
            if (dto.getCustomRecipients() != null) entity.setCustomRecipients(objectMapper.writeValueAsString(dto.getCustomRecipients()));
        } catch (Exception e) { throw new RuntimeException("Failed to update entity", e); }
    }
}
