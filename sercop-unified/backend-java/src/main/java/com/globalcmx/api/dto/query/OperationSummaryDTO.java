package com.globalcmx.api.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO que representa el resumen completo del estado actual de una operación,
 * calculado a partir del análisis de todos los mensajes SWIFT asociados.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationSummaryDTO {

    // ==================== IDENTIFICACIÓN ====================
    private String operationId;
    private String reference;
    private String productType;
    private String messageType;

    // ==================== ESTADO ACTUAL ====================
    private String stage;
    private String status;

    // ==================== RESÚMENES ====================
    private AmountSummary amounts;
    private DateSummary dates;
    private PartySummary parties;

    // ==================== HISTORIAL ====================
    private List<MessageSummary> messageHistory;
    private List<AmendmentSummary> amendments;

    // ==================== ALERTAS ====================
    private List<AlertDTO> alerts;

    // ==================== ESTADÍSTICAS ====================
    private int totalMessages;
    private int totalAmendments;
    private LocalDateTime lastUpdated;

    // ==================== CLASES ANIDADAS ====================

    /**
     * Resumen de montos de la operación
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AmountSummary {
        private String currency;
        private BigDecimal originalAmount;
        private BigDecimal currentAmount;
        private BigDecimal utilizedAmount;
        private BigDecimal availableAmount;
        private BigDecimal utilizationPercentage;

        /**
         * Calcula el porcentaje de utilización
         */
        public void calculateUtilization() {
            if (currentAmount != null && currentAmount.compareTo(BigDecimal.ZERO) > 0) {
                if (utilizedAmount == null) {
                    utilizedAmount = BigDecimal.ZERO;
                }
                availableAmount = currentAmount.subtract(utilizedAmount);
                utilizationPercentage = utilizedAmount
                        .multiply(new BigDecimal("100"))
                        .divide(currentAmount, 2, java.math.RoundingMode.HALF_UP);
            } else {
                availableAmount = BigDecimal.ZERO;
                utilizationPercentage = BigDecimal.ZERO;
            }
        }
    }

    /**
     * Resumen de fechas de la operación
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DateSummary {
        private LocalDate issueDate;
        private LocalDate originalExpiryDate;
        private LocalDate currentExpiryDate;
        private LocalDate latestShipmentDate;
        private LocalDate presentationDate;
        private Integer daysToExpiry;
        private boolean expired;

        /**
         * Calcula los días hasta el vencimiento
         */
        public void calculateDaysToExpiry() {
            if (currentExpiryDate != null) {
                long days = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), currentExpiryDate);
                daysToExpiry = (int) days;
                expired = days < 0;
            }
        }
    }

    /**
     * Resumen de las partes involucradas
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartySummary {
        private String applicantName;
        private String applicantAddress;
        private String beneficiaryName;
        private String beneficiaryAddress;
        private String issuingBankName;
        private String issuingBankBic;
        private String advisingBankName;
        private String advisingBankBic;
        private String confirmingBankName;
        private String confirmingBankBic;
    }

    /**
     * Resumen de un mensaje SWIFT individual
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageSummary {
        private String messageId;
        private String messageType;
        private String direction;
        private String status;
        private String reference;
        private LocalDateTime createdAt;
        private LocalDateTime sentAt;
        private String senderBic;
        private String receiverBic;
        private String description;
    }

    /**
     * Resumen de una enmienda
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AmendmentSummary {
        private int sequence;
        private LocalDateTime date;
        private String messageType;
        private String messageId;
        private List<FieldChange> changes;
        private String description;
    }

    /**
     * Representa un cambio en un campo específico
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldChange {
        private String fieldCode;
        private String fieldName;
        private String previousValue;
        private String newValue;
    }

    /**
     * Alerta generada por el análisis.
     * Los parámetros se envían para que el frontend los interpole en las traducciones.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlertDTO {
        private String type;      // WARNING, INFO, DANGER, SUCCESS
        private String code;      // EXPIRING_SOON, EXPIRED, HIGH_UTILIZATION, etc.
        private String icon;
        private Map<String, Object> params;  // Parámetros para interpolación i18n
    }
}
