package com.globalcmx.api.readmodel.projection;

import com.globalcmx.api.dto.event.DroolsRulesConfigEvent;
import com.globalcmx.api.readmodel.entity.DroolsRulesConfigReadModel;
import com.globalcmx.api.readmodel.repository.DroolsRulesConfigReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DroolsRulesConfigProjection {

    private final DroolsRulesConfigReadModelRepository droolsRulesConfigReadModelRepository;

    @KafkaListener(topics = "droolsrulesconfig-events", groupId = "drools-rules-config-projection-group")
    @Transactional(transactionManager = "readModelTransactionManager")
    public void handleDroolsRulesConfigEvent(DroolsRulesConfigEvent event) {
        log.info("Procesando evento de DroolsRulesConfig: {} para ID: {}",
                event.getEventType(), event.getDroolsRulesConfigId());

        try {
            switch (event.getEventType()) {
                case CREATED:
                    handleCreated(event);
                    break;
                case UPDATED:
                    handleUpdated(event);
                    break;
                default:
                    log.warn("Tipo de evento desconocido: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Error procesando evento de DroolsRulesConfig: {}", e.getMessage(), e);
            throw e;
        }
    }

    private void handleCreated(DroolsRulesConfigEvent event) {
        // Check if the record already exists (saved directly by CommandService with sourceFileContent)
        var existing = droolsRulesConfigReadModelRepository.findById(event.getDroolsRulesConfigId());

        if (existing.isPresent()) {
            // Record already exists - update event fields but preserve sourceFileContent
            DroolsRulesConfigReadModel config = existing.get();
            config.setRuleType(event.getRuleType());
            config.setDrlContent(event.getDrlContent());
            config.setSourceFileName(event.getSourceFileName());
            config.setIsActive(event.getIsActive());
            config.setVersion(event.getVersion());
            config.setCreatedBy(event.getPerformedBy());
            // Do NOT overwrite sourceFileContent - it was saved by CommandService
            droolsRulesConfigReadModelRepository.save(config);
            log.info("DroolsRulesConfig merged en read model (preserving sourceFileContent): {} ruleType: {}",
                    event.getDroolsRulesConfigId(), event.getRuleType());
        } else {
            DroolsRulesConfigReadModel config = DroolsRulesConfigReadModel.builder()
                    .id(event.getDroolsRulesConfigId())
                    .ruleType(event.getRuleType())
                    .drlContent(event.getDrlContent())
                    .sourceFileName(event.getSourceFileName())
                    .isActive(event.getIsActive())
                    .version(event.getVersion())
                    .createdBy(event.getPerformedBy())
                    .build();

            droolsRulesConfigReadModelRepository.save(config);
            log.info("DroolsRulesConfig creado en read model: {} ruleType: {}",
                    event.getDroolsRulesConfigId(), event.getRuleType());
        }
    }

    private void handleUpdated(DroolsRulesConfigEvent event) {
        DroolsRulesConfigReadModel config = droolsRulesConfigReadModelRepository
                .findById(event.getDroolsRulesConfigId())
                .orElseThrow(() -> new RuntimeException(
                        "DroolsRulesConfig no encontrado: " + event.getDroolsRulesConfigId()));

        config.setRuleType(event.getRuleType());
        config.setDrlContent(event.getDrlContent());
        config.setSourceFileName(event.getSourceFileName());
        config.setIsActive(event.getIsActive());
        config.setVersion(event.getVersion());
        config.setUpdatedBy(event.getPerformedBy());
        // Do NOT overwrite sourceFileContent - preserve existing Excel binary

        droolsRulesConfigReadModelRepository.save(config);
        log.info("DroolsRulesConfig actualizado en read model: {} isActive: {}",
                event.getDroolsRulesConfigId(), event.getIsActive());
    }
}
