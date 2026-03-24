package com.globalcmx.api.config;

import com.globalcmx.api.messaging.MessagingProperties;
import com.google.cloud.spring.pubsub.core.PubSubTemplate;
import com.google.cloud.spring.pubsub.integration.inbound.PubSubInboundChannelAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.messaging.MessageChannel;

/**
 * Configuración de Spring Integration con Google Cloud Pub/Sub.
 * Define los canales y adapters para recibir eventos desde Pub/Sub.
 * Se activa cuando messaging.provider=PUBSUB y messaging.enabled=true
 */
@Configuration
@ConditionalOnProperty(name = "messaging.provider", havingValue = "PUBSUB")
@RequiredArgsConstructor
@Slf4j
public class PubSubIntegrationConfig {

    private final MessagingProperties messagingProperties;

    /**
     * Canal de entrada para eventos de Moneda.
     * Los mensajes recibidos desde Pub/Sub se enrutan a este canal.
     */
    @Bean
    public MessageChannel monedaEventsInputChannel() {
        log.info("Creating monedaEventsInputChannel for Pub/Sub");
        return new DirectChannel();
    }

    /**
     * Adapter de entrada que conecta la subscription de Pub/Sub con el canal de Spring Integration.
     * Recibe mensajes de la subscription y los envía al canal.
     *
     * @param inputChannel El canal al que se enviarán los mensajes
     * @param pubSubTemplate El template de Pub/Sub para operaciones de mensajería
     * @return El adapter configurado
     */
    @Bean
    public PubSubInboundChannelAdapter monedaEventsInboundAdapter(
            @Qualifier("monedaEventsInputChannel") MessageChannel inputChannel,
            PubSubTemplate pubSubTemplate) {

        String topicName = messagingProperties.getTopicName("moneda-events");
        String subscriptionName = topicName + messagingProperties.getPubsub().getSubscriptionSuffix();

        log.info("Creating PubSubInboundChannelAdapter for subscription: {}", subscriptionName);

        PubSubInboundChannelAdapter adapter =
                new PubSubInboundChannelAdapter(pubSubTemplate, subscriptionName);
        adapter.setOutputChannel(inputChannel);
        adapter.setPayloadType(String.class);

        log.info("PubSubInboundChannelAdapter configured successfully for subscription: {}", subscriptionName);

        return adapter;
    }
}
