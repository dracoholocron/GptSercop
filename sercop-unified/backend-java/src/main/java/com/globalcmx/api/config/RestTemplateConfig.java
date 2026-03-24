package com.globalcmx.api.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Configuración de RestTemplate para llamadas a APIs externas.
 * Usado principalmente por el ApiNotificationActionExecutor.
 */
@Configuration
public class RestTemplateConfig {

    /**
     * Bean de RestTemplate con configuración de timeouts
     *
     * @param builder RestTemplateBuilder inyectado por Spring
     * @return RestTemplate configurado
     */
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
            .setConnectTimeout(Duration.ofSeconds(30))
            .setReadTimeout(Duration.ofSeconds(120))  // Aumentado para llamadas a OpenAI/Claude
            .build();
    }
}
