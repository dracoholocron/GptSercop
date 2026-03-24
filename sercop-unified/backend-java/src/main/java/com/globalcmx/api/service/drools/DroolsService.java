package com.globalcmx.api.service.drools;

import com.globalcmx.api.config.DroolsConfig;
import com.globalcmx.api.dto.drools.RuleContext;
import com.globalcmx.api.dto.drools.RuleExecutionResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kie.api.KieServices;
import org.kie.api.builder.KieBuilder;
import org.kie.api.builder.KieFileSystem;
import org.kie.api.builder.Message;
import org.kie.api.runtime.KieContainer;
import org.kie.api.runtime.KieSession;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Servicio para la ejecución y validación de reglas DRL usando Drools 8.x
 * Proporciona métodos thread-safe para compilar, validar y ejecutar reglas dinámicas
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DroolsService {

    private final KieServices kieServices;
    private final DroolsConfig droolsConfig;

    // Cache de KieContainers compilados (opcional, para optimización)
    private final Map<String, KieContainer> containerCache = new ConcurrentHashMap<>();

    /**
     * Ejecuta una regla DRL con un contexto específico
     *
     * @param drlContent Contenido de la regla DRL
     * @param fact Objeto que será insertado en la sesión (generalmente RuleContext)
     * @return Resultado de la ejecución con detalles
     */
    public RuleExecutionResult executeRule(String drlContent, Object fact) {
        long startTime = System.currentTimeMillis();

        try {
            log.debug("Iniciando ejecución de regla DRL");

            // Validar entrada
            if (drlContent == null || drlContent.trim().isEmpty()) {
                return RuleExecutionResult.error("El contenido DRL no puede estar vacío");
            }

            if (fact == null) {
                return RuleExecutionResult.error("El contexto/fact no puede ser nulo");
            }

            // Crear sesión Kie con la regla compilada
            KieSession kieSession = createKieSession(drlContent);

            // Insertar el fact en la sesión
            kieSession.insert(fact);

            // Ejecutar las reglas
            int firedRules = kieSession.fireAllRules();
            log.debug("Se dispararon {} reglas", firedRules);

            // Construir resultado
            RuleExecutionResult result;

            if (fact instanceof RuleContext) {
                // Si el fact es un RuleContext, extraer la información de él
                RuleContext context = (RuleContext) fact;
                result = RuleExecutionResult.fromContext(context);
                result.setFiredRulesCount(firedRules);
            } else {
                // Para otros tipos de facts, crear un resultado básico
                result = RuleExecutionResult.builder()
                    .ruleMatched(firedRules > 0)
                    .firedRulesCount(firedRules)
                    .build();
            }

            // Calcular tiempo de ejecución
            long executionTime = System.currentTimeMillis() - startTime;
            result.setExecutionTimeMs(executionTime);

            // Cerrar sesión
            kieSession.dispose();

            log.debug("Ejecución de regla completada en {} ms", executionTime);
            return result;

        } catch (Exception e) {
            log.error("Error al ejecutar regla DRL: {}", e.getMessage(), e);
            long executionTime = System.currentTimeMillis() - startTime;

            RuleExecutionResult result = RuleExecutionResult.error(
                "Error al ejecutar regla: " + e.getMessage()
            );
            result.setExecutionTimeMs(executionTime);
            return result;
        }
    }

    /**
     * Ejecuta una regla DRL creando un RuleContext desde un Map
     *
     * @param drlContent Contenido de la regla DRL
     * @param contextData Datos del contexto en formato Map
     * @return Resultado de la ejecución
     */
    public RuleExecutionResult executeRuleWithMap(String drlContent, Map<String, Object> contextData) {
        try {
            // Crear RuleContext desde el Map
            RuleContext context = RuleContext.fromMap(contextData);

            // Ejecutar la regla
            return executeRule(drlContent, context);

        } catch (Exception e) {
            log.error("Error al ejecutar regla con Map: {}", e.getMessage(), e);
            return RuleExecutionResult.error("Error al crear contexto desde Map: " + e.getMessage());
        }
    }

    /**
     * Valida la sintaxis de un contenido DRL sin ejecutarlo
     *
     * @param drlContent Contenido de la regla DRL
     * @return Lista de errores de compilación (vacía si es válido)
     */
    public List<String> validateDrlSyntax(String drlContent) {
        log.debug("Validando sintaxis DRL");

        try {
            if (drlContent == null || drlContent.trim().isEmpty()) {
                return List.of("El contenido DRL no puede estar vacío");
            }

            // Usar el método de validación de DroolsConfig
            return droolsConfig.validateDrlSyntax(kieServices, drlContent);

        } catch (Exception e) {
            log.error("Error al validar sintaxis DRL: {}", e.getMessage(), e);
            return List.of("Error al validar DRL: " + e.getMessage());
        }
    }

    /**
     * Valida la sintaxis DRL y retorna un resultado estructurado
     *
     * @param drlContent Contenido de la regla DRL
     * @return Map con el resultado de la validación
     */
    public Map<String, Object> validateDrlSyntaxDetailed(String drlContent) {
        List<String> errors = validateDrlSyntax(drlContent);

        Map<String, Object> result = new ConcurrentHashMap<>();
        result.put("valid", errors.isEmpty());
        result.put("errors", errors);
        result.put("errorCount", errors.size());

        if (errors.isEmpty()) {
            result.put("message", "Sintaxis DRL válida");
        } else {
            result.put("message", "Se encontraron " + errors.size() + " errores de sintaxis");
        }

        return result;
    }

    /**
     * Crea una sesión Kie con la regla DRL compilada
     * Este método es thread-safe y crea una nueva sesión cada vez
     *
     * @param drlContent Contenido de la regla DRL
     * @return KieSession lista para ejecutar
     * @throws RuntimeException si hay errores de compilación
     */
    public KieSession createKieSession(String drlContent) {
        try {
            // Generar un nombre único para la regla
            String ruleName = "rule-" + UUID.randomUUID().toString();

            log.debug("Creando KieSession para regla: {}", ruleName);

            // Crear un nuevo KieFileSystem para esta regla
            KieFileSystem kfs = kieServices.newKieFileSystem();

            // Agregar la regla al KieFileSystem
            String resourcePath = "src/main/resources/rules/" + ruleName + ".drl";
            kfs.write(resourcePath, drlContent);

            // Compilar la regla
            KieBuilder kieBuilder = kieServices.newKieBuilder(kfs);
            kieBuilder.buildAll();

            // Verificar errores de compilación
            if (kieBuilder.getResults().hasMessages(Message.Level.ERROR)) {
                List<String> errors = kieBuilder.getResults()
                    .getMessages(Message.Level.ERROR)
                    .stream()
                    .map(Message::getText)
                    .collect(Collectors.toList());

                String errorMsg = "Error al compilar regla DRL: " + String.join("; ", errors);
                log.error(errorMsg);
                throw new RuntimeException(errorMsg);
            }

            // Crear KieContainer con la regla compilada
            KieContainer kieContainer = kieServices.newKieContainer(
                kieServices.getRepository().getDefaultReleaseId()
            );

            // Crear y retornar la sesión
            KieSession kieSession = kieContainer.newKieSession();

            log.debug("KieSession creada exitosamente para: {}", ruleName);
            return kieSession;

        } catch (Exception e) {
            log.error("Error al crear KieSession: {}", e.getMessage(), e);
            throw new RuntimeException("Error al crear sesión Kie: " + e.getMessage(), e);
        }
    }

    /**
     * Compila una regla y retorna los errores si existen
     *
     * @param drlContent Contenido de la regla DRL
     * @return Lista de errores de compilación (vacía si compiló correctamente)
     */
    public List<String> compileRule(String drlContent) {
        log.debug("Compilando regla DRL");

        try {
            if (drlContent == null || drlContent.trim().isEmpty()) {
                return List.of("El contenido DRL no puede estar vacío");
            }

            // Crear un KieFileSystem temporal
            KieFileSystem kfs = kieServices.newKieFileSystem();

            // Agregar la regla
            String resourcePath = "src/main/resources/rules/compile-test.drl";
            kfs.write(resourcePath, drlContent);

            // Compilar
            KieBuilder kieBuilder = kieServices.newKieBuilder(kfs);
            kieBuilder.buildAll();

            // Retornar errores si existen
            if (kieBuilder.getResults().hasMessages(Message.Level.ERROR)) {
                List<String> errors = kieBuilder.getResults()
                    .getMessages(Message.Level.ERROR)
                    .stream()
                    .map(Message::getText)
                    .collect(Collectors.toList());

                log.debug("Errores de compilación encontrados: {}", errors.size());
                return errors;
            }

            // También incluir warnings para información
            if (kieBuilder.getResults().hasMessages(Message.Level.WARNING)) {
                List<String> warnings = kieBuilder.getResults()
                    .getMessages(Message.Level.WARNING)
                    .stream()
                    .map(msg -> "WARNING: " + msg.getText())
                    .collect(Collectors.toList());

                log.debug("Warnings de compilación: {}", warnings.size());
                // Los warnings no son errores, solo los registramos
            }

            log.debug("Regla compilada exitosamente sin errores");
            return List.of(); // Sin errores

        } catch (Exception e) {
            log.error("Error al compilar regla: {}", e.getMessage(), e);
            return List.of("Error al compilar: " + e.getMessage());
        }
    }

    /**
     * Compila una regla y retorna información detallada
     *
     * @param drlContent Contenido de la regla DRL
     * @return Map con información de compilación
     */
    public Map<String, Object> compileRuleDetailed(String drlContent) {
        long startTime = System.currentTimeMillis();
        List<String> errors = compileRule(drlContent);
        long compilationTime = System.currentTimeMillis() - startTime;

        Map<String, Object> result = new ConcurrentHashMap<>();
        result.put("success", errors.isEmpty());
        result.put("errors", errors);
        result.put("errorCount", errors.size());
        result.put("compilationTimeMs", compilationTime);

        if (errors.isEmpty()) {
            result.put("message", "Regla compilada exitosamente");
        } else {
            result.put("message", "Compilación fallida con " + errors.size() + " errores");
        }

        return result;
    }

    /**
     * Ejecuta una regla con timeout (para prevenir reglas infinitas)
     *
     * @param drlContent Contenido de la regla DRL
     * @param fact Objeto a evaluar
     * @param maxRuleFirings Número máximo de disparos de reglas
     * @return Resultado de la ejecución
     */
    public RuleExecutionResult executeRuleWithLimit(String drlContent, Object fact, int maxRuleFirings) {
        long startTime = System.currentTimeMillis();

        try {
            log.debug("Ejecutando regla DRL con límite de {} disparos", maxRuleFirings);

            if (drlContent == null || drlContent.trim().isEmpty()) {
                return RuleExecutionResult.error("El contenido DRL no puede estar vacío");
            }

            if (fact == null) {
                return RuleExecutionResult.error("El contexto/fact no puede ser nulo");
            }

            // Crear sesión Kie
            KieSession kieSession = createKieSession(drlContent);

            // Insertar el fact
            kieSession.insert(fact);

            // Ejecutar las reglas con límite
            int firedRules = kieSession.fireAllRules(maxRuleFirings);
            log.debug("Se dispararon {} reglas (límite: {})", firedRules, maxRuleFirings);

            // Construir resultado
            RuleExecutionResult result;

            if (fact instanceof RuleContext) {
                RuleContext context = (RuleContext) fact;
                result = RuleExecutionResult.fromContext(context);
                result.setFiredRulesCount(firedRules);

                // Agregar warning si se alcanzó el límite
                if (firedRules >= maxRuleFirings) {
                    result.addMessage("ADVERTENCIA: Se alcanzó el límite de disparos de reglas (" +
                        maxRuleFirings + "). Posible bucle infinito.");
                }
            } else {
                result = RuleExecutionResult.builder()
                    .ruleMatched(firedRules > 0)
                    .firedRulesCount(firedRules)
                    .build();
            }

            long executionTime = System.currentTimeMillis() - startTime;
            result.setExecutionTimeMs(executionTime);

            kieSession.dispose();

            return result;

        } catch (Exception e) {
            log.error("Error al ejecutar regla con límite: {}", e.getMessage(), e);
            long executionTime = System.currentTimeMillis() - startTime;

            RuleExecutionResult result = RuleExecutionResult.error(
                "Error al ejecutar regla: " + e.getMessage()
            );
            result.setExecutionTimeMs(executionTime);
            return result;
        }
    }

    /**
     * Limpia el cache de contenedores (si se implementa caching en el futuro)
     */
    public void clearCache() {
        log.info("Limpiando cache de KieContainers");
        containerCache.clear();
    }

    /**
     * Retorna estadísticas del servicio
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new ConcurrentHashMap<>();
        stats.put("cachedContainers", containerCache.size());
        stats.put("kieServicesVersion", kieServices.getClass().getPackage().getImplementationVersion());
        return stats;
    }
}
