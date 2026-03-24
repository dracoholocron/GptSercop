package com.globalcmx.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI globalCmxOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("GlobalCMX API")
                        .description("API REST para GlobalCMX - Sistema de Trade Finance con CQRS y Event Sourcing")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("GlobalCMX Team")
                                .email("support@globalcmx.com"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://globalcmx.com")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT token for API authentication")));
    }
}
