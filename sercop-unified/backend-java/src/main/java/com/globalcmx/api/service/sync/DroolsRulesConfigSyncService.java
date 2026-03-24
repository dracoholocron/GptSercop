package com.globalcmx.api.service.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.event.DroolsRulesConfigCreatedEvent;
import com.globalcmx.api.eventsourcing.event.DroolsRulesConfigUpdatedEvent;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.DroolsRulesConfigReadModel;
import com.globalcmx.api.readmodel.repository.DroolsRulesConfigReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DroolsRulesConfigSyncService {

    private final EventStoreService eventStoreService;
    private final DroolsRulesConfigReadModelRepository droolsRulesConfigReadModelRepository;
    private final ObjectMapper objectMapper;

    @Transactional(transactionManager = "readModelTransactionManager")
    public void syncAllDroolsRulesConfigs() {
        log.info("Iniciando sincronización de DroolsRulesConfig desde Event Store");

        // Limpiar read model existente
        droolsRulesConfigReadModelRepository.deleteAll();

        // Obtener todos los eventos de DroolsRulesConfig
        List<EventStoreEntity> allEvents = eventStoreService.getAllEventsByAggregateType("DROOLS_RULES_CONFIG");

        log.info("Encontrados {} eventos de DroolsRulesConfig en Event Store", allEvents.size());

        // Procesar eventos por agregado
        allEvents.stream()
                .map(EventStoreEntity::getAggregateId)
                .distinct()
                .forEach(this::syncDroolsRulesConfig);

        log.info("Sincronización completada. Total DroolsRulesConfig en Read Model: {}",
                droolsRulesConfigReadModelRepository.count());
    }

    private void syncDroolsRulesConfig(String aggregateId) {
        try {
            List<EventStoreEntity> events = eventStoreService.getEvents(aggregateId);

            DroolsRulesConfigReadModel readModel = null;

            for (EventStoreEntity event : events) {
                String eventType = event.getEventType();

                switch (eventType) {
                    case "DROOLS_RULES_CONFIG_CREATED":
                        DroolsRulesConfigCreatedEvent created = objectMapper.readValue(
                                event.getEventData(),
                                DroolsRulesConfigCreatedEvent.class
                        );
                        readModel = applyCreated(created);
                        break;

                    case "DROOLS_RULES_CONFIG_UPDATED":
                        if (readModel != null) {
                            DroolsRulesConfigUpdatedEvent updated = objectMapper.readValue(
                                    event.getEventData(),
                                    DroolsRulesConfigUpdatedEvent.class
                            );
                            readModel = applyUpdated(readModel, updated);
                        }
                        break;
                }
            }

            if (readModel != null) {
                droolsRulesConfigReadModelRepository.save(readModel);
                log.debug("Sincronizado DroolsRulesConfig: {} ruleType: {} isActive: {}",
                        readModel.getId(), readModel.getRuleType(), readModel.getIsActive());
            }

        } catch (Exception e) {
            log.error("Error sincronizando DroolsRulesConfig {}: {}", aggregateId, e.getMessage(), e);
        }
    }

    private DroolsRulesConfigReadModel applyCreated(DroolsRulesConfigCreatedEvent event) {
        return DroolsRulesConfigReadModel.builder()
                .id(event.getDroolsRulesConfigId())
                .ruleType(event.getRuleType())
                .drlContent(event.getDrlContent())
                .sourceFileName(event.getSourceFileName())
                .isActive(event.getIsActive())
                .version(event.getVersion())
                .createdBy(event.getPerformedBy())
                .build();
    }

    private DroolsRulesConfigReadModel applyUpdated(DroolsRulesConfigReadModel model,
                                                     DroolsRulesConfigUpdatedEvent event) {
        model.setRuleType(event.getRuleType());
        model.setDrlContent(event.getDrlContent());
        model.setSourceFileName(event.getSourceFileName());
        model.setIsActive(event.getIsActive());
        model.setVersion(event.getVersion());
        model.setUpdatedBy(event.getPerformedBy());
        return model;
    }
}
