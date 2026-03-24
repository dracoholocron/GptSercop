package com.globalcmx.api.messaging.servicebus;

import com.azure.messaging.servicebus.ServiceBusClientBuilder;
import com.azure.messaging.servicebus.ServiceBusProcessorClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.event.*;
import com.globalcmx.api.messaging.MessagingProperties;
import com.globalcmx.api.readmodel.projection.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.annotation.PreDestroy;
import java.util.ArrayList;
import java.util.List;

/**
 * Listener genérico de eventos de Azure Service Bus.
 *
 * Este componente escucha eventos desde múltiples tópicos de Service Bus y delega
 * el procesamiento a los Projections correspondientes para actualizar el ReadModel.
 *
 * Solo se activa cuando messaging.provider=SERVICEBUS
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "messaging.provider", havingValue = "SERVICEBUS")
public class ServiceBusEventListener {

    private final MessagingProperties messagingProperties;
    private final ObjectMapper objectMapper;
    private final MonedaProjection monedaProjection;
    private final CotizacionProjection cotizacionProjection;
    private final ParticipanteProjection participanteProjection;
    private final CuentaBancariaProjection cuentaBancariaProjection;
    private final FinancialInstitutionProjection financialInstitutionProjection;
    private final List<ServiceBusProcessorClient> processors = new ArrayList<>();

    public ServiceBusEventListener(
            MessagingProperties messagingProperties,
            ObjectMapper objectMapper,
            MonedaProjection monedaProjection,
            CotizacionProjection cotizacionProjection,
            ParticipanteProjection participanteProjection,
            CuentaBancariaProjection cuentaBancariaProjection,
            FinancialInstitutionProjection financialInstitutionProjection) {
        this.messagingProperties = messagingProperties;
        this.objectMapper = objectMapper;
        this.monedaProjection = monedaProjection;
        this.cotizacionProjection = cotizacionProjection;
        this.participanteProjection = participanteProjection;
        this.cuentaBancariaProjection = cuentaBancariaProjection;
        this.financialInstitutionProjection = financialInstitutionProjection;

        log.info("Service Bus Event Listener initialized");
    }

    /**
     * Inicia los processors de Service Bus después de que la aplicación esté lista.
     * Esto se ejecuta automáticamente después del arranque de Spring Boot.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void startListeners() {
        String connectionString = messagingProperties.getServicebus().getConnectionString();

        if (connectionString == null || connectionString.isEmpty()) {
            log.error("Service Bus connection string is not configured. Listeners will not start.");
            return;
        }

        // Crear processor para moneda-events
        createProcessor(connectionString, "moneda-events", this::handleMonedaEvent);

        // Crear processor para cotizacion-events
        createProcessor(connectionString, "cotizacion-events", this::handleCotizacionEvent);

        // Crear processor para participante-events
        createProcessor(connectionString, "participante-events", this::handleParticipantEvent);

        // Crear processor para cuenta-bancaria-events
        createProcessor(connectionString, "cuenta-bancaria-events", this::handleCuentaBancariaEvent);

        // Crear processor para institucion-financiera-events
        createProcessor(connectionString, "institucion-financiera-events", this::handleFinancialInstitutionEvent);

        log.info("Service Bus listeners started successfully");
    }

    /**
     * Crea un processor de Service Bus para un topic específico
     */
    private void createProcessor(String connectionString, String topicName, java.util.function.Consumer<String> messageHandler) {
        try {
            log.info("Creating Service Bus processor for topic: {}", topicName);

            ServiceBusProcessorClient processor = new ServiceBusClientBuilder()
                .connectionString(connectionString)
                .processor()
                .topicName(topicName)
                .subscriptionName("globalcmx-subscription")
                .processMessage(context -> {
                    try {
                        String messageBody = context.getMessage().getBody().toString();
                        log.debug("Received message from topic {}: {}", topicName, messageBody);
                        messageHandler.accept(messageBody);
                        context.complete();
                    } catch (Exception e) {
                        log.error("Error processing message from topic {}: {}", topicName, e.getMessage(), e);
                        // No complete the message so it goes to dead-letter queue after max delivery attempts
                    }
                })
                .processError(context -> {
                    log.error("Error occurred in Service Bus processor for topic {}: {}",
                        topicName, context.getException().getMessage(), context.getException());
                })
                .buildProcessorClient();

            processor.start();
            processors.add(processor);

            log.info("Service Bus processor started for topic: {}", topicName);
        } catch (Exception e) {
            log.error("Failed to create Service Bus processor for topic {}: {}", topicName, e.getMessage(), e);
        }
    }

    /**
     * Maneja eventos de monedas
     */
    private void handleMonedaEvent(String messageBody) {
        try {
            MonedaEvent event = objectMapper.readValue(messageBody, MonedaEvent.class);
            monedaProjection.handleMonedaEvent(event);
        } catch (Exception e) {
            log.error("Error parsing MonedaEvent: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse MonedaEvent", e);
        }
    }

    /**
     * Maneja eventos de cotizaciones
     */
    private void handleCotizacionEvent(String messageBody) {
        try {
            CotizacionEvent event = objectMapper.readValue(messageBody, CotizacionEvent.class);
            cotizacionProjection.handleCotizacionEvent(event);
        } catch (Exception e) {
            log.error("Error parsing CotizacionEvent: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse CotizacionEvent", e);
        }
    }

    /**
     * Maneja eventos de participantes
     */
    private void handleParticipantEvent(String messageBody) {
        try {
            ParticipanteEvent event = objectMapper.readValue(messageBody, ParticipanteEvent.class);
            participanteProjection.handleParticipanteEvent(event);
        } catch (Exception e) {
            log.error("Error parsing ParticipanteEvent: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse ParticipanteEvent", e);
        }
    }

    /**
     * Maneja eventos de cuentas bancarias
     */
    private void handleCuentaBancariaEvent(String messageBody) {
        try {
            CuentaBancariaEvent event = objectMapper.readValue(messageBody, CuentaBancariaEvent.class);
            cuentaBancariaProjection.handleCuentaBancariaEvent(event);
        } catch (Exception e) {
            log.error("Error parsing CuentaBancariaEvent: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse CuentaBancariaEvent", e);
        }
    }

    /**
     * Maneja eventos de instituciones financieras
     */
    private void handleFinancialInstitutionEvent(String messageBody) {
        try {
            FinancialInstitutionEvent event = objectMapper.readValue(messageBody, FinancialInstitutionEvent.class);
            financialInstitutionProjection.handleFinancialInstitutionEvent(event);
        } catch (Exception e) {
            log.error("Error parsing FinancialInstitutionEvent: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse FinancialInstitutionEvent", e);
        }
    }

    /**
     * Cierra todos los processors cuando la aplicación se detiene
     */
    @PreDestroy
    public void stopListeners() {
        log.info("Stopping Service Bus processors...");
        processors.forEach(processor -> {
            try {
                processor.close();
            } catch (Exception e) {
                log.error("Error closing processor: {}", e.getMessage(), e);
            }
        });
        log.info("Service Bus processors stopped");
    }
}
