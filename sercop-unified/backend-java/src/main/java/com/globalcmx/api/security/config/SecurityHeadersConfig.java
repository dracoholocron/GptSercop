package com.globalcmx.api.security.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuración de headers de seguridad HTTP.
 * Añade headers de protección contra XSS, Clickjacking, MIME sniffing, etc.
 */
@Configuration
public class SecurityHeadersConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SecurityHeadersInterceptor());
    }

    private static class SecurityHeadersInterceptor implements HandlerInterceptor {

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
            // Content Security Policy - Previene XSS y ataques de inyección
            response.setHeader("Content-Security-Policy",
                    "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                    "style-src 'self' 'unsafe-inline'; " +
                    "img-src 'self' data: https:; " +
                    "font-src 'self' data:; " +
                    "connect-src 'self' http://localhost:8080 https://*.globalcmx.com; " +
                    "frame-ancestors 'none';");

            // X-Content-Type-Options - Previene MIME sniffing
            response.setHeader("X-Content-Type-Options", "nosniff");

            // X-Frame-Options - Previene clickjacking
            response.setHeader("X-Frame-Options", "DENY");

            // X-XSS-Protection - Protección XSS del navegador
            response.setHeader("X-XSS-Protection", "1; mode=block");

            // Referrer-Policy - Controla información de referrer
            response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

            // Permissions-Policy - Controla características del navegador
            response.setHeader("Permissions-Policy",
                    "geolocation=(), " +
                    "microphone=(), " +
                    "camera=(), " +
                    "payment=()");

            // Cache-Control para respuestas sensibles
            if (request.getRequestURI().contains("/auth/") ||
                request.getRequestURI().contains("/user")) {
                response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
                response.setHeader("Pragma", "no-cache");
            }

            return true;
        }
    }
}
