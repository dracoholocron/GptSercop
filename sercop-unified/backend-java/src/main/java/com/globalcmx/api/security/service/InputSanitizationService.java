package com.globalcmx.api.security.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

/**
 * Servicio de sanitización de entrada para prevenir ataques de inyección.
 * Detecta y limpia caracteres potencialmente peligrosos en las entradas del usuario.
 */
@Service
@Slf4j
public class InputSanitizationService {

    // Patrones de detección de inyección SQL
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
            ".*(union\\s+select|insert\\s+into|update\\s+.+\\s+set|delete\\s+from|drop\\s+table|" +
            "exec\\s*\\(|execute\\s*\\(|xp_|sp_|0x[0-9a-fA-F]+).*",
            Pattern.CASE_INSENSITIVE
    );

    // Patrón para detectar scripts maliciosos
    private static final Pattern XSS_PATTERN = Pattern.compile(
            ".*(<script|javascript:|on\\w+\\s*=|<iframe|<object|<embed).*",
            Pattern.CASE_INSENSITIVE
    );

    // Patrón para detectar caracteres de control
    private static final Pattern CONTROL_CHARS_PATTERN = Pattern.compile(
            "[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]"
    );

    /**
     * Sanitiza una cadena de texto eliminando caracteres peligrosos.
     *
     * @param input La cadena a sanitizar
     * @return La cadena sanitizada
     */
    public String sanitize(String input) {
        if (input == null) {
            return null;
        }

        // Eliminar caracteres de control
        String sanitized = CONTROL_CHARS_PATTERN.matcher(input).replaceAll("");

        // Eliminar comentarios SQL
        sanitized = sanitized.replaceAll("--", "");
        sanitized = sanitized.replaceAll("/\\*.*?\\*/", "");

        return sanitized.trim();
    }

    /**
     * Valida si una entrada contiene patrones de inyección SQL.
     *
     * @param input La cadena a validar
     * @return true si la entrada es segura, false si contiene patrones sospechosos
     */
    public boolean isSafeFromSqlInjection(String input) {
        if (input == null || input.isEmpty()) {
            return true;
        }

        boolean isSafe = !SQL_INJECTION_PATTERN.matcher(input).matches();
        if (!isSafe) {
            log.warn("Posible intento de SQL injection detectado: {}",
                    input.substring(0, Math.min(50, input.length())));
        }
        return isSafe;
    }

    /**
     * Valida si una entrada contiene patrones de XSS.
     *
     * @param input La cadena a validar
     * @return true si la entrada es segura, false si contiene patrones sospechosos
     */
    public boolean isSafeFromXss(String input) {
        if (input == null || input.isEmpty()) {
            return true;
        }

        boolean isSafe = !XSS_PATTERN.matcher(input).matches();
        if (!isSafe) {
            log.warn("Posible intento de XSS detectado: {}",
                    input.substring(0, Math.min(50, input.length())));
        }
        return isSafe;
    }

    /**
     * Valida que una entrada sea segura para uso general.
     *
     * @param input La cadena a validar
     * @return true si la entrada es segura
     */
    public boolean isInputSafe(String input) {
        return isSafeFromSqlInjection(input) && isSafeFromXss(input);
    }

    /**
     * Escapa caracteres HTML para prevenir XSS cuando se muestra contenido de usuario.
     *
     * @param input La cadena a escapar
     * @return La cadena con caracteres HTML escapados
     */
    public String escapeHtml(String input) {
        if (input == null) {
            return null;
        }

        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
