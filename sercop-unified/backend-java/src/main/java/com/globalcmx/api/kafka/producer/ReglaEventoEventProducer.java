package com.globalcmx.api.kafka.producer;

import com.globalcmx.api.dto.event.ReglaEventoEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;
@Profile("!gcp & !azure")
@Service
@RequiredArgsConstructor
@Slf4j
public class ReglaEventoEventProducer {
    private final KafkaTemplate<String, ReglaEventoEvent> kafkaTemplate;
    @Value("${messaging.topics.regla-evento-events:regla-evento-events}")
    private String reglaEventoEventsTopic;
    public void sendReglaEventoEvent(ReglaEventoEvent event) {
        log.info("Sending ReglaEvento Event: {} to topic: {}", event, reglaEventoEventsTopic);
        CompletableFuture<SendResult<String, ReglaEventoEvent>> future =
            kafkaTemplate.send(reglaEventoEventsTopic, String.valueOf(event.getReglaEventoId()), event);
        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("Event sent successfully: {} with offset: {}",
                    event.getEventType(),
                    result.getRecordMetadata().offset());
            } else {
                log.error("Failed to send event: {}", event.getEventType(), ex);
            }
        });
    }
}
