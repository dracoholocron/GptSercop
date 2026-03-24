package com.globalcmx.api.kafka.producer;

import com.globalcmx.api.dto.event.FinanciamientoCxEvent;
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
public class FinanciamientoCxEventProducer {
    private final KafkaTemplate<String, FinanciamientoCxEvent> kafkaTemplate;
    @Value("${messaging.topics.financiamiento-cx-events:financiamiento-cx-events}")
    private String topic;
    public void sendFinanciamientoCxEvent(FinanciamientoCxEvent event) {
        log.info("Sending FinanciamientoCx Event: {} to topic: {}", event, topic);
        CompletableFuture<SendResult<String, FinanciamientoCxEvent>> future =
            kafkaTemplate.send(topic, String.valueOf(event.getFinanciamientoCxId()), event);
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
