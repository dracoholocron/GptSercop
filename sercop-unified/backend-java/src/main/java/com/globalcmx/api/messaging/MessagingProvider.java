package com.globalcmx.api.messaging;

/**
 * Enumeración de proveedores de mensajería soportados.
 * Permite configurar fácilmente el sistema de mensajería a utilizar.
 */
public enum MessagingProvider {

    /**
     * Apache Kafka - Sistema de mensajería distribuido
     * Ideal para ambientes on-premise o desarrollo local
     */
    KAFKA,

    /**
     * Google Cloud Pub/Sub - Sistema de mensajería en la nube
     * Ideal para despliegues en Google Cloud Platform
     */
    PUBSUB,

    /**
     * Azure Service Bus - Sistema de mensajería en la nube
     * Ideal para despliegues en Microsoft Azure
     */
    SERVICEBUS,

    /**
     * Sin sistema de mensajería (solo para testing)
     */
    NONE
}
