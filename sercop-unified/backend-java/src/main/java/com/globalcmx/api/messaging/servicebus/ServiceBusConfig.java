package com.globalcmx.api.messaging.servicebus;

import com.azure.messaging.servicebus.ServiceBusClientBuilder;
import com.azure.messaging.servicebus.ServiceBusSenderClient;
import com.globalcmx.api.messaging.MessagingProperties;
import com.globalcmx.api.messaging.MessagingProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * Configuración de Azure Service Bus.
 * Solo se activa cuando messaging.provider=SERVICEBUS
 */
@Configuration
@ConditionalOnProperty(name = "messaging.provider", havingValue = "SERVICEBUS")
@Slf4j
public class ServiceBusConfig {

    private final MessagingProperties messagingProperties;

    public ServiceBusConfig(MessagingProperties messagingProperties) {
        this.messagingProperties = messagingProperties;
        log.info("Service Bus configuration initialized");
    }

    /**
     * Crea un mapa de Service Bus senders para todos los topics configurados.
     * Cada topic tiene su propio sender client.
     */
    @Bean
    public Map<String, ServiceBusSenderClient> serviceBusSenders() {
        String connectionString = messagingProperties.getServicebus().getConnectionString();

        if (connectionString == null || connectionString.isEmpty()) {
            log.error("Service Bus connection string is not configured. Please set AZURE_SERVICEBUS_CONNECTION_STRING");
            return new HashMap<>();
        }

        Map<String, ServiceBusSenderClient> senders = new HashMap<>();

        // Crear un sender para cada topic configurado
        messagingProperties.getTopics().forEach((logicalName, physicalName) -> {
            try {
                log.info("Creating Service Bus sender for topic: {} ({})", logicalName, physicalName);

                ServiceBusSenderClient sender = new ServiceBusClientBuilder()
                    .connectionString(connectionString)
                    .sender()
                    .topicName(physicalName)
                    .buildClient();

                senders.put(physicalName, sender);
                log.info("Service Bus sender created successfully for topic: {}", physicalName);
            } catch (Exception e) {
                log.error("Failed to create Service Bus sender for topic {}: {}", physicalName, e.getMessage(), e);
            }
        });

        return senders;
    }
}
