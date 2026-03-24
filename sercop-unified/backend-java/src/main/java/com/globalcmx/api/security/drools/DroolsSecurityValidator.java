package com.globalcmx.api.security.drools;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Validador de seguridad para código DRL (Drools Rule Language).
 * Previene la ejecución de código malicioso en reglas dinámicas.
 */
@Component
@Slf4j
public class DroolsSecurityValidator {

    // Lista blanca de imports permitidos
    private static final List<String> ALLOWED_IMPORT_PACKAGES = Arrays.asList(
            "com.globalcmx.api.dto",
            "com.globalcmx.api.validation",
            "com.globalcmx.api.readmodel.entity",
            "java.lang.String",
            "java.lang.Integer",
            "java.lang.Long",
            "java.lang.Double",
            "java.lang.Boolean",
            "java.math.BigDecimal",
            "java.time.LocalDate",
            "java.time.LocalDateTime",
            "java.util.List",
            "java.util.Map",
            "java.util.Set"
    );

    // Patrones peligrosos que deben ser bloqueados
    private static final List<Pattern> DANGEROUS_PATTERNS = Arrays.asList(
            // Ejecución de comandos del sistema
            Pattern.compile("Runtime\\s*\\.\\s*getRuntime", Pattern.CASE_INSENSITIVE),
            Pattern.compile("ProcessBuilder", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\.exec\\s*\\(", Pattern.CASE_INSENSITIVE),

            // Acceso a archivos
            Pattern.compile("java\\.io\\.File", Pattern.CASE_INSENSITIVE),
            Pattern.compile("FileInputStream", Pattern.CASE_INSENSITIVE),
            Pattern.compile("FileOutputStream", Pattern.CASE_INSENSITIVE),
            Pattern.compile("FileReader", Pattern.CASE_INSENSITIVE),
            Pattern.compile("FileWriter", Pattern.CASE_INSENSITIVE),
            Pattern.compile("RandomAccessFile", Pattern.CASE_INSENSITIVE),

            // Reflexión y carga de clases
            Pattern.compile("Class\\.forName", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\.getClass\\s*\\(\\s*\\)\\s*\\.\\s*getMethod", Pattern.CASE_INSENSITIVE),
            Pattern.compile("ClassLoader", Pattern.CASE_INSENSITIVE),
            Pattern.compile("java\\.lang\\.reflect", Pattern.CASE_INSENSITIVE),

            // Red y sockets
            Pattern.compile("java\\.net\\.", Pattern.CASE_INSENSITIVE),
            Pattern.compile("Socket", Pattern.CASE_INSENSITIVE),
            Pattern.compile("URL\\s*\\(", Pattern.CASE_INSENSITIVE),
            Pattern.compile("HttpURLConnection", Pattern.CASE_INSENSITIVE),

            // Scripts y JavaScript
            Pattern.compile("ScriptEngine", Pattern.CASE_INSENSITIVE),
            Pattern.compile("Nashorn", Pattern.CASE_INSENSITIVE),

            // Sistema y propiedades
            Pattern.compile("System\\.exit", Pattern.CASE_INSENSITIVE),
            Pattern.compile("System\\.getProperty", Pattern.CASE_INSENSITIVE),
            Pattern.compile("System\\.setProperty", Pattern.CASE_INSENSITIVE),
            Pattern.compile("System\\.getenv", Pattern.CASE_INSENSITIVE),

            // Threads (prevenir DoS)
            Pattern.compile("new\\s+Thread", Pattern.CASE_INSENSITIVE),
            Pattern.compile("ExecutorService", Pattern.CASE_INSENSITIVE),
            Pattern.compile("ThreadPoolExecutor", Pattern.CASE_INSENSITIVE),

            // Base de datos directa
            Pattern.compile("DriverManager", Pattern.CASE_INSENSITIVE),
            Pattern.compile("java\\.sql\\.", Pattern.CASE_INSENSITIVE),

            // Serialización peligrosa
            Pattern.compile("ObjectInputStream", Pattern.CASE_INSENSITIVE),
            Pattern.compile("ObjectOutputStream", Pattern.CASE_INSENSITIVE),

            // Bucles infinitos potenciales
            Pattern.compile("while\\s*\\(\\s*true\\s*\\)", Pattern.CASE_INSENSITIVE)
    );

    // Patrón para extraer imports
    private static final Pattern IMPORT_PATTERN = Pattern.compile(
            "import\\s+([a-zA-Z0-9_.]+)\\s*;?",
            Pattern.CASE_INSENSITIVE
    );

    /**
     * Valida que el código DRL sea seguro para ejecutar.
     *
     * @param drlContent El contenido DRL a validar
     * @return DroolsValidationResult con el resultado de la validación
     */
    public DroolsValidationResult validate(String drlContent) {
        DroolsValidationResult result = new DroolsValidationResult();

        if (drlContent == null || drlContent.trim().isEmpty()) {
            result.addError("El contenido DRL está vacío");
            return result;
        }

        // Validar imports
        validateImports(drlContent, result);

        // Validar patrones peligrosos
        validateDangerousPatterns(drlContent, result);

        if (result.hasErrors()) {
            log.warn("Validación de seguridad DRL falló: {}", result.getErrors());
        } else {
            log.debug("Validación de seguridad DRL exitosa");
        }

        return result;
    }

    /**
     * Valida que todos los imports sean de paquetes permitidos.
     */
    private void validateImports(String drlContent, DroolsValidationResult result) {
        Matcher matcher = IMPORT_PATTERN.matcher(drlContent);

        while (matcher.find()) {
            String importPath = matcher.group(1).trim();

            boolean isAllowed = ALLOWED_IMPORT_PACKAGES.stream()
                    .anyMatch(allowed -> importPath.startsWith(allowed) || importPath.equals(allowed));

            if (!isAllowed) {
                result.addError("Import no permitido: " + importPath);
                log.warn("Intento de usar import no permitido en DRL: {}", importPath);
            }
        }
    }

    /**
     * Valida que no existan patrones de código peligroso.
     */
    private void validateDangerousPatterns(String drlContent, DroolsValidationResult result) {
        for (Pattern pattern : DANGEROUS_PATTERNS) {
            Matcher matcher = pattern.matcher(drlContent);
            if (matcher.find()) {
                String matched = matcher.group();
                result.addError("Patrón de código peligroso detectado: " + matched);
                log.warn("Patrón peligroso detectado en DRL: {}", matched);
            }
        }
    }

    /**
     * Valida y lanza excepción si el código no es seguro.
     *
     * @param drlContent El contenido DRL a validar
     * @throws DroolsSecurityException si el código contiene patrones peligrosos
     */
    public void validateAndThrow(String drlContent) {
        DroolsValidationResult result = validate(drlContent);
        if (result.hasErrors()) {
            throw new DroolsSecurityException(
                    "El código DRL contiene patrones de seguridad no permitidos: " +
                    String.join(", ", result.getErrors())
            );
        }
    }

    /**
     * Resultado de la validación de seguridad Drools.
     */
    public static class DroolsValidationResult {
        private final List<String> errors = new java.util.ArrayList<>();

        public void addError(String error) {
            errors.add(error);
        }

        public List<String> getErrors() {
            return errors;
        }

        public boolean hasErrors() {
            return !errors.isEmpty();
        }

        public boolean isValid() {
            return errors.isEmpty();
        }
    }

    /**
     * Excepción lanzada cuando se detecta código DRL inseguro.
     */
    public static class DroolsSecurityException extends RuntimeException {
        public DroolsSecurityException(String message) {
            super(message);
        }
    }
}
