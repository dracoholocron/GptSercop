package com.globalcmx.api.kafka.producer;

import com.globalcmx.api.dto.event.LetterOfCreditEvent;
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
public class LetterOfCreditEventProducer {
    private final KafkaTemplate<String, LetterOfCreditEvent> kafkaTemplate;
    @Value("${messaging.topics.carta-credito-events:carta-credito-events}")
    private String topic;
    public void sendLetterOfCreditEvent(LetterOfCreditEvent event) {
        log.info("Sending LetterOfCredit Event: {} to topic: {}", event, topic);
        CompletableFuture<SendResult<String, LetterOfCreditEvent>> future =
            kafkaTemplate.send(topic, String.valueOf(event.getCartaCreditoId()), event);
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
