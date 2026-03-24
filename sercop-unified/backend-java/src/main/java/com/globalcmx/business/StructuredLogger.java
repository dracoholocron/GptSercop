package com.globalcmx.business;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Utilidad para logging estructurado de eventos de negocio
 * Los logs se envían a Loki para visualización en Grafana
 */
@Component
@Slf4j
public class StructuredLogger {

    /**
     * Log de creación de Carta de Crédito
     */
    public void logLetterOfCreditCreated(String lcId, String type, String currency,
                                         double amount, String institution, String userId) {
        Map<String, String> mdcContext = Map.of(
                "event_type", "LC_CREATED",
                "lc_id", lcId,
                "lc_type", type,
                "currency", currency,
                "amount", String.valueOf(amount),
                "institution", institution,
                "user_id", userId
        );
        try {
            putMDC(mdcContext);
            log.info("Carta de Crédito creada: {} - {} {} - Institution: {}",
                    lcId, amount, currency, institution);
        } finally {
            clearMDC(mdcContext);
        }
    }

    /**
     * Log de aprobación de Carta de Crédito
     */
    public void logLetterOfCreditApproved(String lcId, String approver,
                                          long processingTimeMs) {
        Map<String, String> mdcContext = Map.of(
                "event_type", "LC_APPROVED",
                "lc_id", lcId,
                "approver", approver,
                "processing_time_ms", String.valueOf(processingTimeMs)
        );
        try {
            putMDC(mdcContext);
            log.info("Carta de Crédito aprobada: {} por {} en {}ms",
                    lcId, approver, processingTimeMs);
        } finally {
            clearMDC(mdcContext);
        }
    }

    /**
     * Log de rechazo de Carta de Crédito
     */
    public void logLetterOfCreditRejected(String lcId, String reason, String rejector) {
        Map<String, String> mdcContext = Map.of(
                "event_type", "LC_REJECTED",
                "lc_id", lcId,
                "reason", reason,
                "rejector", rejector
        );
        try {
            putMDC(mdcContext);
            log.warn("Carta de Crédito rechazada: {} - Razón: {} - Por: {}",
                    lcId, reason, rejector);
        } finally {
            clearMDC(mdcContext);
        }
    }

    /**
     * Log de generación de mensaje SWIFT
     */
    public void logSwiftMessageGenerated(String messageId, String messageType,
                                         String lcId, String direction) {
        Map<String, String> mdcContext = Map.of(
                "event_type", "SWIFT_GENERATED",
                "message_id", messageId,
                "message_type", messageType,
                "lc_id", lcId,
                "direction", direction
        );
        try {
            putMDC(mdcContext);
            log.info("Mensaje SWIFT generado: {} - Tipo: {} - Direction: {}",
                    messageId, messageType, direction);
        } finally {
            clearMDC(mdcContext);
        }
    }

    /**
     * Log de operación de financiamiento
     */
    public void logFinancingOperation(String operationId, String type,
                                     double amount, String currency,
                                     String institution) {
        Map<String, String> mdcContext = Map.of(
                "event_type", "FINANCING_OPERATION",
                "operation_id", operationId,
                "financing_type", type,
                "amount", String.valueOf(amount),
                "currency", currency,
                "institution", institution
        );
        try {
            putMDC(mdcContext);
            log.info("Operación de financiamiento: {} - {} {} {} - Institution: {}",
                    operationId, type, amount, currency, institution);
        } finally {
            clearMDC(mdcContext);
        }
    }

    /**
     * Log de error en operación de negocio
     */
    public void logBusinessError(String operation, String entityId,
                                 String errorMessage, Exception exception) {
        Map<String, String> mdcContext = Map.of(
                "event_type", "BUSINESS_ERROR",
                "operation", operation,
                "entity_id", entityId,
                "error_message", errorMessage
        );
        try {
            putMDC(mdcContext);
            log.error("Error en operación de negocio: {} - Entity: {} - Error: {}",
                    operation, entityId, errorMessage, exception);
        } finally {
            clearMDC(mdcContext);
        }
    }

    /**
     * Log de inicio de sesión de usuario
     */
    public void logUserLogin(String username, String role, String ipAddress) {
        Map<String, String> mdcContext = Map.of(
                "event_type", "USER_LOGIN",
                "username", username,
                "role", role,
                "ip_address", ipAddress
        );
        try {
            putMDC(mdcContext);
            log.info("Usuario autenticado: {} - Role: {} - IP: {}",
                    username, role, ipAddress);
        } finally {
            clearMDC(mdcContext);
        }
    }

    /**
     * Log de cambio de estado de entidad
     */
    public void logStatusChange(String entityType, String entityId,
                                String oldStatus, String newStatus, String userId) {
        Map<String, String> mdcContext = Map.of(
                "event_type", "STATUS_CHANGE",
                "entity_type", entityType,
                "entity_id", entityId,
                "old_status", oldStatus,
                "new_status", newStatus,
                "user_id", userId
        );
        try {
            putMDC(mdcContext);
            log.info("Cambio de estado: {} {} - {} -> {} - Por: {}",
                    entityType, entityId, oldStatus, newStatus, userId);
        } finally {
            clearMDC(mdcContext);
        }
    }

    /**
     * Log de operación por institución financiera
     */
    public void logInstitutionOperation(String institution, String operationType,
                                       String operationId, double amount) {
        Map<String, String> mdcContext = Map.of(
                "event_type", "INSTITUTION_OPERATION",
                "institution", institution,
                "operation_type", operationType,
                "operation_id", operationId,
                "amount", String.valueOf(amount)
        );
        try {
            putMDC(mdcContext);
            log.info("Operación de institución: {} - Tipo: {} - ID: {} - Monto: {}",
                    institution, operationType, operationId, amount);
        } finally {
            clearMDC(mdcContext);
        }
    }

    /**
     * Utilidad para agregar múltiples entradas al MDC
     */
    private void putMDC(Map<String, String> entries) {
        entries.forEach(MDC::put);
    }

    /**
     * Utilidad para limpiar entradas del MDC
     */
    private void clearMDC(Map<String, String> entries) {
        entries.keySet().forEach(MDC::remove);
    }
}
