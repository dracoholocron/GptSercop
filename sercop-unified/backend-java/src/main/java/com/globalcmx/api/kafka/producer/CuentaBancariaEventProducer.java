package com.globalcmx.api.kafka.producer;

import com.globalcmx.api.dto.event.CuentaBancariaEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
@Profile("!gcp & !azure")
@Service
@RequiredArgsConstructor
@Slf4j
public class CuentaBancariaEventProducer {
    private final KafkaTemplate<String, CuentaBancariaEvent> kafkaTemplate;
    @Value("${messaging.topics.cuenta-bancaria-events}")
    private String cuentaBancariaTopic;
    public void publishCuentaBancariaEvent(CuentaBancariaEvent event) {
        try {
            log.info("Publicando evento de cuenta bancaria: {} para cuentaBancariaId: {}",
                    event.getEventType(), event.getCuentaBancariaId());
            kafkaTemplate.send(cuentaBancariaTopic, event.getCuentaBancariaId().toString(), event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Error al publicar evento de cuenta bancaria: {}", ex.getMessage(), ex);
                        } else {
                            log.info("Evento de cuenta bancaria publicado exitosamente: {} - offset: {}",
                                    event.getEventType(),
                                    result.getRecordMetadata().offset());
                        }
                    });
        } catch (Exception e) {
            log.error("Error al enviar evento de cuenta bancaria a Kafka (sin detener transacción): {}", e.getMessage());
            // No lanzar excepción para permitir que la transacción continúe sin Kafka
        }
    }
}
