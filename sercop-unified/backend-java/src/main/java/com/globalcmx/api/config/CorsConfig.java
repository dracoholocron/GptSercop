package com.globalcmx.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Permitir credenciales
        config.setAllowCredentials(true);

        // Permitir origenes especificos + patrones para redes LAN
        config.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://34.30.32.157",
            // Azure AKS LoadBalancer IPs
            "http://20.83.75.157",       // Frontend LoadBalancer
            "http://172.179.170.2"       // Kong LoadBalancer (for SSE cross-origin)
        ));

        // Patrones para permitir toda la red LAN (192.168.*, 10.*, 172.16-31.*)
        config.setAllowedOriginPatterns(Arrays.asList(
            "http://192.168.*:*",
            "http://10.*:*",
            "http://172.1[6-9].*:*",
            "http://172.2[0-9].*:*",
            "http://172.3[0-1].*:*",
            "http://100.*:*"
        ));

        // Permitir headers específicos (incluido X-User-Timezone para horarios)
        config.setAllowedHeaders(Arrays.asList(
            "Authorization", "Content-Type", "Accept", "Origin",
            "X-Requested-With", "X-User-Timezone", "Cache-Control",
            "X-User-Id", "X-User-Name", "X-Client-Id"
        ));

        // Permitir todos los métodos HTTP
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Exponer headers específicos
        config.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));

        // Aplicar configuración a todas las rutas
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
