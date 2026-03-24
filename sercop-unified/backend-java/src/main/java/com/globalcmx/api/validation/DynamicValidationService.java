package com.globalcmx.api.validation;

import com.globalcmx.api.config.DroolsConfig;
import com.globalcmx.api.readmodel.entity.ReglaEventoReadModel;
import com.globalcmx.api.readmodel.repository.ReglaEventoReadModelRepository;
import com.globalcmx.api.security.drools.DroolsSecurityValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kie.api.KieServices;
import org.kie.api.runtime.KieContainer;
import org.kie.api.runtime.KieSession;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Servicio de validación dinámica que carga reglas Drools desde la base de datos.
 * Permite validar comandos utilizando reglas configurables almacenadas en event_rules_read_model.
 *
 * SEGURIDAD: Todas las reglas DRL son validadas por DroolsSecurityValidator antes de su ejecución.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DynamicValidationService {

    private final ReglaEventoReadModelRepository reglaEventoRepository;
    private final KieServices kieServices;
    private final DroolsConfig droolsConfig;
    private final DroolsSecurityValidator droolsSecurityValidator;

    /**
     * Valida un comando utilizando reglas dinámicas desde la base de datos.
     *
     * @param command El comando a validar
     * @param operationType Tipo de operación (ej: LETTER_OF_CREDIT, DRAFT_LC, etc.)
     * @param triggerEvent Evento trigger (ej: PRE_CREATED, PRE_UPDATED, etc.)
     * @return ValidationResult con los resultados de la validación
     */
    public ValidationResult validate(Object command, String operationType, String triggerEvent) {
        log.debug("Iniciando validación dinámica para operationType={}, triggerEvent={}", operationType, triggerEvent);

        ValidationResult validationResult = new ValidationResult();

        // Obtener reglas activas desde la base de datos
        List<ReglaEventoReadModel> reglas = reglaEventoRepository
                .findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                        operationType,
                        triggerEvent,
                        true
                );

        if (reglas.isEmpty()) {
            log.warn("No se encontraron reglas activas para operationType={}, triggerEvent={}", operationType, triggerEvent);
            return validationResult; // Sin errores si no hay reglas
        }

        log.info("Encontradas {} regla(s) activa(s) para validación", reglas.size());

        // Ejecutar cada regla en orden de prioridad
        for (ReglaEventoReadModel regla : reglas) {
            try {
                log.debug("Ejecutando regla: {} (prioridad: {})", regla.getCodigo(), regla.getPrioridad());

                ValidationResult ruleResult = executeRule(command, regla);

                // Acumular errores
                if (ruleResult.hasErrors()) {
                    ruleResult.getErrors().forEach(validationResult::addError);
                    log.debug("Regla {} generó {} error(es)", regla.getCodigo(), ruleResult.getErrors().size());
                }

            } catch (Exception e) {
                log.error("Error al ejecutar regla {}: {}", regla.getCodigo(), e.getMessage(), e);
                validationResult.addError("Error al ejecutar regla de validación: " + regla.getNombre());
            }
        }

        if (validationResult.hasErrors()) {
            log.warn("Validación falló con {} error(es)", validationResult.getErrors().size());
        } else {
            log.debug("Validación exitosa sin errores");
        }

        return validationResult;
    }

    /**
     * Ejecuta una regla DRL específica contra un comando.
     *
     * @param command El comando a validar
     * @param regla La regla a ejecutar
     * @return ValidationResult con los resultados de esta regla
     */
    private ValidationResult executeRule(Object command, ReglaEventoReadModel regla) {
        ValidationResult result = new ValidationResult();

        // Compilar la regla DRL dinámicamente
        String drlContent = regla.getCondicionesDRL();
        String ruleName = regla.getCodigo();

        try {
            // SEGURIDAD: Validar el código DRL antes de compilar/ejecutar
            DroolsSecurityValidator.DroolsValidationResult securityResult =
                    droolsSecurityValidator.validate(drlContent);

            if (securityResult.hasErrors()) {
                log.error("Regla {} bloqueada por seguridad: {}", ruleName, securityResult.getErrors());
                result.addError("Regla bloqueada por políticas de seguridad: " + ruleName);
                return result;
            }

            // Compilar la regla usando DroolsConfig
            KieContainer kieContainer = droolsConfig.compileRule(kieServices, drlContent, ruleName);

            // Crear sesión de Kie
            KieSession kieSession = kieContainer.newKieSession();

            try {
                // Insertar el comando y el resultado en la sesión
                kieSession.insert(command);
                kieSession.insert(result);

                // Ejecutar las reglas
                int firedRules = kieSession.fireAllRules();

                log.debug("Regla {} disparó {} regla(s) Drools", ruleName, firedRules);

            } finally {
                kieSession.dispose();
            }

        } catch (Exception e) {
            log.error("Error al compilar/ejecutar regla DRL {}: {}", ruleName, e.getMessage());
            result.addError("Error al compilar regla: " + regla.getNombre() + " - " + e.getMessage());
        }

        return result;
    }

    /**
     * Valida y lanza excepción si hay errores.
     *
     * @param command El comando a validar
     * @param operationType Tipo de operación
     * @param triggerEvent Evento trigger
     * @throws BusinessValidationException si la validación falla
     */
    public void validateAndThrow(Object command, String operationType, String triggerEvent) {
        ValidationResult result = validate(command, operationType, triggerEvent);

        if (result.hasErrors()) {
            throw new BusinessValidationException(result);
        }
    }
}
