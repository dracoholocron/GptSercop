package com.globalcmx.api.config;

import com.globalcmx.api.messaging.MessagingProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Configuración de Kafka.
 * Se activa cuando messaging.provider=KAFKA y messaging.enabled=true
 */
@Configuration
@EnableKafka
@ConditionalOnProperty(name = "messaging.provider", havingValue = "KAFKA", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class KafkaConfig {

    private final MessagingProperties messagingProperties;

    @Bean
    public NewTopic monedaEventsTopic() {
        String topicName = messagingProperties.getTopicName("moneda-events");
        log.info("Creating Kafka topic: {}", topicName);
        return buildTopic(topicName);
    }

    @Bean
    public NewTopic monedaCommandsTopic() {
        String topicName = messagingProperties.getTopicName("moneda-commands");
        log.info("Creating Kafka topic: {}", topicName);
        return buildTopic(topicName);
    }

    @Bean
    public NewTopic cuentaBancariaEventsTopic() {
        String topicName = messagingProperties.getTopicName("cuenta-bancaria-events");
        log.info("Creating Kafka topic: {}", topicName);
        return buildTopic(topicName);
    }

    @Bean
    public NewTopic reglaEventoEventsTopic() {
        String topicName = messagingProperties.getTopicName("regla-evento-events");
        log.info("Creating Kafka topic: {}", topicName);
        return buildTopic(topicName);
    }

    @Bean
    public NewTopic cotizacionEventsTopic() {
        String topicName = messagingProperties.getTopicName("cotizacion-events");
        log.info("Creating Kafka topic: {}", topicName);
        return buildTopic(topicName);
    }

    @Bean
    public NewTopic participanteEventsTopic() {
        String topicName = messagingProperties.getTopicName("participante-events");
        log.info("Creating Kafka topic: {}", topicName);
        return buildTopic(topicName);
    }

    @Bean
    public NewTopic cartaCreditoEventsTopic() {
        String topicName = messagingProperties.getTopicName("carta-credito-events");
        log.info("Creating Kafka topic: {}", topicName);
        return buildTopic(topicName);
    }

    @Bean
    public NewTopic garantiaBancariaEventsTopic() {
        String topicName = messagingProperties.getTopicName("garantia-bancaria-events");
        log.info("Creating Kafka topic: {}", topicName);
        return buildTopic(topicName);
    }

    /**
     * Construye un topic con la configuración por defecto
     */
    private NewTopic buildTopic(String topicName) {
        return TopicBuilder
            .name(topicName)
            .partitions(messagingProperties.getKafka().getDefaultPartitions())
            .replicas(messagingProperties.getKafka().getDefaultReplicas())
            .build();
    }
}
