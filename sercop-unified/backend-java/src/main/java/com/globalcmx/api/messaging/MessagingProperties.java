package com.globalcmx.api.messaging;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Propiedades de configuración centralizadas para el sistema de mensajería.
 * Permite configurar de forma simple el proveedor (Kafka, Pub/Sub, etc.)
 * y los topics/subscriptions a utilizar.
 *
 * Ejemplo de uso en application.yml:
 * <pre>
 * messaging:
 *   provider: KAFKA  # o PUBSUB
 *   topics:
 *     moneda-events: moneda-events
 *     cuenta-bancaria-events: cuenta-bancaria-events
 * </pre>
 */
@Data
@Component
@ConfigurationProperties(prefix = "messaging")
public class MessagingProperties {

    /**
     * Proveedor de mensajería a utilizar (KAFKA, PUBSUB, NONE)
     * Por defecto: KAFKA
     */
    private MessagingProvider provider = MessagingProvider.KAFKA;

    /**
     * Indica si el sistema de mensajería está habilitado
     * Por defecto: true
     */
    private boolean enabled = true;

    /**
     * Mapa de topics/subscriptions
     * La clave es el nombre lógico, el valor es el nombre físico del topic
     */
    private Map<String, String> topics = new HashMap<>();

    /**
     * Configuración específica de Kafka
     */
    private KafkaSettings kafka = new KafkaSettings();

    /**
     * Configuración específica de Pub/Sub
     */
    private PubSubSettings pubsub = new PubSubSettings();

    /**
     * Configuración específica de Azure Service Bus
     */
    private ServiceBusSettings servicebus = new ServiceBusSettings();

    @Data
    public static class KafkaSettings {
        /**
         * Servidores de Kafka
         */
        private String bootstrapServers = "localhost:9092";

        /**
         * Group ID para consumers
         */
        private String consumerGroupId = "globalcmx-consumer-group";

        /**
         * Número de particiones para topics nuevos
         */
        private int defaultPartitions = 3;

        /**
         * Número de réplicas para topics nuevos
         */
        private int defaultReplicas = 1;
    }

    @Data
    public static class PubSubSettings {
        /**
         * ID del proyecto de GCP
         */
        private String projectId;

        /**
         * Ruta al archivo de credenciales
         */
        private String credentialsLocation;

        /**
         * Sufijo para las subscriptions (se agrega al nombre del topic)
         */
        private String subscriptionSuffix = "-subscription";

        /**
         * Número de threads para procesamiento paralelo
         */
        private int executorThreads = 4;

        /**
         * Tiempo máximo de extensión de ACK en segundos
         */
        private int maxAckExtensionPeriod = 600;
    }

    @Data
    public static class ServiceBusSettings {
        /**
         * Connection string de Azure Service Bus
         */
        private String connectionString;

        /**
         * Namespace de Azure Service Bus
         */
        private String namespace;
    }

    /**
     * Obtiene el nombre físico de un topic dado su nombre lógico
     *
     * @param logicalName Nombre lógico del topic (ej: "moneda-events")
     * @return Nombre físico del topic configurado o el mismo nombre lógico si no está configurado
     */
    public String getTopicName(String logicalName) {
        return topics.getOrDefault(logicalName, logicalName);
    }

    /**
     * Verifica si el proveedor configurado es Kafka
     */
    public boolean isKafkaEnabled() {
        return enabled && provider == MessagingProvider.KAFKA;
    }

    /**
     * Verifica si el proveedor configurado es Pub/Sub
     */
    public boolean isPubSubEnabled() {
        return enabled && provider == MessagingProvider.PUBSUB;
    }
}
