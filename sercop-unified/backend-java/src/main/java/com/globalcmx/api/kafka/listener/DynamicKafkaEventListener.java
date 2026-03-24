package com.globalcmx.api.kafka.listener;

import com.globalcmx.api.service.events.DynamicEventListenerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

/**
 * Listener dinámico de eventos de Kafka para el sistema de reglas por eventos.
 *
 * Este componente escucha eventos desde múltiples tópicos de Kafka y delega
 * el procesamiento al DynamicEventListenerService, que se encarga de:
 * - Buscar reglas activas que coincidan con el evento
 * - Evaluar las reglas usando Drools
 * - Ejecutar las acciones configuradas si la regla se dispara
 *
 * Tópicos soportados:
 * - plantilla-events: Eventos de plantillas
 * - lc-importacion-events: Eventos de cartas de crédito de importación
 * - lc-exportacion-events: Eventos de cartas de crédito de exportación
 * - garantia-events: Eventos de garantías
 * - cobranza-events: Eventos de cobranzas
 *
 * Cada listener maneja errores de forma independiente para evitar que un
 * evento fallido afecte el procesamiento de otros eventos.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DynamicKafkaEventListener {

    private final DynamicEventListenerService eventListenerService;

    /**
     * Listener para eventos de plantillas
     *
     * @param message JSON del evento
     * @param topic Nombre del tópico
     * @param partition Partición de Kafka
     * @param offset Offset del mensaje
     */
    @KafkaListener(
        topics = "plantilla-events",
        groupId = "reglas-eventos-listener",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void listenPlantillaEvents(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {

        log.info("Recibido evento de plantilla: topic={}, partition={}, offset={}",
            topic, partition, offset);

        try {
            eventListenerService.handleEvent(message, topic);
        } catch (Exception e) {
            log.error("Error al procesar evento de plantilla: topic={}, partition={}, offset={}, error={}",
                topic, partition, offset, e.getMessage(), e);
            // No lanzar excepción para evitar reintentos automáticos
            // Si se requiere dead letter queue, configurarlo en application.yml
        }
    }

    /**
     * Listener para eventos de LC Importación
     *
     * @param message JSON del evento
     * @param topic Nombre del tópico
     * @param partition Partición de Kafka
     * @param offset Offset del mensaje
     */
    @KafkaListener(
        topics = "lc-importacion-events",
        groupId = "reglas-eventos-listener",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void listenLCImportacionEvents(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {

        log.info("Recibido evento de LC Importación: topic={}, partition={}, offset={}",
            topic, partition, offset);

        try {
            eventListenerService.handleEvent(message, topic);
        } catch (Exception e) {
            log.error("Error al procesar evento de LC Importación: topic={}, partition={}, offset={}, error={}",
                topic, partition, offset, e.getMessage(), e);
        }
    }

    /**
     * Listener para eventos de LC Exportación
     *
     * @param message JSON del evento
     * @param topic Nombre del tópico
     * @param partition Partición de Kafka
     * @param offset Offset del mensaje
     */
    @KafkaListener(
        topics = "lc-exportacion-events",
        groupId = "reglas-eventos-listener",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void listenLCExportacionEvents(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {

        log.info("Recibido evento de LC Exportación: topic={}, partition={}, offset={}",
            topic, partition, offset);

        try {
            eventListenerService.handleEvent(message, topic);
        } catch (Exception e) {
            log.error("Error al procesar evento de LC Exportación: topic={}, partition={}, offset={}, error={}",
                topic, partition, offset, e.getMessage(), e);
        }
    }

    /**
     * Listener para eventos de Garantías
     *
     * @param message JSON del evento
     * @param topic Nombre del tópico
     * @param partition Partición de Kafka
     * @param offset Offset del mensaje
     */
    @KafkaListener(
        topics = "garantia-events",
        groupId = "reglas-eventos-listener",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void listenGarantiaEvents(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {

        log.info("Recibido evento de Garantía: topic={}, partition={}, offset={}",
            topic, partition, offset);

        try {
            eventListenerService.handleEvent(message, topic);
        } catch (Exception e) {
            log.error("Error al procesar evento de Garantía: topic={}, partition={}, offset={}, error={}",
                topic, partition, offset, e.getMessage(), e);
        }
    }

    /**
     * Listener para eventos de Cobranzas
     *
     * @param message JSON del evento
     * @param topic Nombre del tópico
     * @param partition Partición de Kafka
     * @param offset Offset del mensaje
     */
    @KafkaListener(
        topics = "cobranza-events",
        groupId = "reglas-eventos-listener",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void listenCobranzaEvents(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {

        log.info("Recibido evento de Cobranza: topic={}, partition={}, offset={}",
            topic, partition, offset);

        try {
            eventListenerService.handleEvent(message, topic);
        } catch (Exception e) {
            log.error("Error al procesar evento de Cobranza: topic={}, partition={}, offset={}, error={}",
                topic, partition, offset, e.getMessage(), e);
        }
    }

    /**
     * Listener genérico para eventos de otros tópicos configurados dinámicamente
     * Este listener puede configurarse en application.yml con:
     * spring.kafka.consumer.topics.generic=topic1,topic2,topic3
     *
     * IMPORTANTE: Deshabilitado por defecto para evitar errores cuando no hay tópicos configurados.
     * Para habilitarlo, agregar la propiedad spring.kafka.consumer.topics.generic en application.yml
     *
     * @param message JSON del evento
     * @param topic Nombre del tópico
     * @param partition Partición de Kafka
     * @param offset Offset del mensaje
     */
    /*
    @KafkaListener(
        topics = "${spring.kafka.consumer.topics.generic}",
        groupId = "reglas-eventos-listener-generic",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void listenGenericEvents(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {

        log.info("Recibido evento genérico: topic={}, partition={}, offset={}",
            topic, partition, offset);

        try {
            eventListenerService.handleEvent(message, topic);
        } catch (Exception e) {
            log.error("Error al procesar evento genérico: topic={}, partition={}, offset={}, error={}",
                topic, partition, offset, e.getMessage(), e);
        }
    }
    */

    /**
     * Listener para dead letter queue (DLQ)
     * Este listener procesa mensajes que fallaron en los listeners principales
     * y fueron enviados a un tópico de DLQ para análisis o reprocesamiento manual
     *
     * @param message JSON del evento fallido
     * @param topic Nombre del tópico DLQ
     * @param partition Partición de Kafka
     * @param offset Offset del mensaje
     */
    @KafkaListener(
        topics = "reglas-eventos-dlq",
        groupId = "reglas-eventos-dlq-listener",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void listenDeadLetterQueue(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            @Header(value = "kafka_original-topic", required = false) String originalTopic) {

        log.warn("Mensaje recibido en DLQ: originalTopic={}, dlqTopic={}, partition={}, offset={}",
            originalTopic, topic, partition, offset);

        log.warn("Mensaje DLQ: {}", message);

        // Aquí se puede implementar lógica para:
        // - Almacenar el mensaje en una base de datos de auditoría
        // - Enviar alertas a administradores
        // - Intentar reprocesamiento después de un tiempo
        // - Análisis de errores recurrentes

        try {
            // Por ahora solo logueamos el mensaje para análisis manual
            log.warn("Mensaje en DLQ requiere atención manual. Topic original: {}", originalTopic);
        } catch (Exception e) {
            log.error("Error al procesar mensaje de DLQ", e);
        }
    }
}
