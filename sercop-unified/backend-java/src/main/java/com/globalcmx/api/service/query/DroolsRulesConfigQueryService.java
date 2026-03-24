package com.globalcmx.api.service.query;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.query.EventHistoryDTO;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.DroolsRulesConfigReadModel;
import com.globalcmx.api.readmodel.repository.DroolsRulesConfigReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DroolsRulesConfigQueryService {

    private final DroolsRulesConfigReadModelRepository droolsRulesConfigReadModelRepository;
    private final EventStoreService eventStoreService;
    private final ObjectMapper objectMapper;

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public Optional<DroolsRulesConfigReadModel> getActiveByRuleType(String ruleType) {
        log.info("Obteniendo DroolsRulesConfig activo para ruleType: {}", ruleType);
        return droolsRulesConfigReadModelRepository.findByRuleTypeAndIsActiveTrue(ruleType);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<DroolsRulesConfigReadModel> getHistoryByRuleType(String ruleType) {
        log.info("Obteniendo historial de DroolsRulesConfig para ruleType: {}", ruleType);
        return droolsRulesConfigReadModelRepository.findByRuleTypeOrderByVersionDesc(ruleType);
    }

    @Transactional(transactionManager = "eventStoreTransactionManager", readOnly = true)
    public List<EventHistoryDTO> getEventHistory(Long id) {
        log.info("Obteniendo historial de eventos para DroolsRulesConfig: {}", id);
        String aggregateId = "DROOLS_RULES_CONFIG-" + id;

        return eventStoreService.getEvents(aggregateId)
                .stream()
                .map(event -> {
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> eventData = objectMapper.readValue(event.getEventData(), Map.class);

                        return EventHistoryDTO.builder()
                                .eventId(event.getEventId())
                                .eventType(event.getEventType())
                                .timestamp(event.getTimestamp())
                                .performedBy(event.getPerformedBy())
                                .version(event.getVersion())
                                .eventData(eventData)
                                .build();
                    } catch (Exception e) {
                        log.error("Error parsing event data for event: {}", event.getEventId(), e);
                        return null;
                    }
                })
                .filter(event -> event != null)
                .collect(Collectors.toList());
    }
}
