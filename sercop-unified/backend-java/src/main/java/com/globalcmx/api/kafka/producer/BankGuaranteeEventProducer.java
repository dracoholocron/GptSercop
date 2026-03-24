package com.globalcmx.api.kafka.producer;

import com.globalcmx.api.dto.event.BankGuaranteeEvent;
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
public class BankGuaranteeEventProducer {
    private final KafkaTemplate<String, BankGuaranteeEvent> kafkaTemplate;
    @Value("${messaging.topics.garantia-bancaria-events:garantia-bancaria-events}")
    private String topic;
    public void sendBankGuaranteeEvent(BankGuaranteeEvent event) {
        log.info("Sending BankGuarantee Event: {} to topic: {}", event, topic);
        CompletableFuture<SendResult<String, BankGuaranteeEvent>> future =
            kafkaTemplate.send(topic, String.valueOf(event.getGarantiaId()), event);
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
