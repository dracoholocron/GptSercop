package com.globalcmx.api.readmodel.entity;

import com.globalcmx.api.readmodel.enums.FieldType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad de configuración de campos SWIFT MT700/MT710/etc.
 * Permite configurar dinámicamente validaciones, dependencias y alertas contextuales
 * sin necesidad de modificar código.
 */
@Entity
@Table(name = "swift_field_config_readmodel", indexes = {
    @Index(name = "idx_field_code_message_type", columnList = "field_code,message_type"),
    @Index(name = "idx_message_type_section", columnList = "message_type,section"),
    @Index(name = "idx_message_type_active", columnList = "message_type,is_active"),
    @Index(name = "idx_swift_spec_version", columnList = "spec_version"),
    @Index(name = "idx_swift_effective_date", columnList = "effective_date"),
    @Index(name = "idx_swift_deprecated", columnList = "deprecated_date")
},
uniqueConstraints = {
    @UniqueConstraint(name = "uk_field_spec_version", columnNames = {"field_code", "message_type", "spec_version"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwiftFieldConfig {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    // ==================== Identificación ====================

    /**
     * Código del campo SWIFT (ej: ":39A:", ":32B:", ":51a:")
     */
    @Column(name = "field_code", nullable = false, length = 50)
    private String fieldCode;

    /**
     * Clave de traducción para el nombre del campo (ej: "swift.mt700.20.fieldName")
     * El frontend resuelve esta clave usando i18n
     */
    @Column(name = "field_name_key", nullable = false, length = 100)
    private String fieldNameKey;

    /**
     * Clave de traducción para la descripción del campo
     */
    @Column(name = "description_key", columnDefinition = "TEXT")
    private String descriptionKey;

    /**
     * Tipo de mensaje SWIFT (ej: "MT700", "MT710", "MT720")
     */
    @Column(name = "message_type", nullable = false, length = 50)
    private String messageType;

    // ==================== Clasificación ====================

    /**
     * Sección donde se agrupa el campo (ej: "MONTOS", "BANCOS", "TRANSPORTE", "DOCUMENTOS")
     */
    @Column(name = "section", nullable = false, length = 50)
    private String section;

    /**
     * Orden de visualización dentro de la sección (menor = primero)
     */
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    /**
     * Indica si el campo es obligatorio según norma SWIFT
     */
    @Column(name = "is_required", nullable = false)
    private Boolean isRequired;

    /**
     * Indica si la configuración está activa
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // ==================== Tipo y Comportamiento ====================

    /**
     * Tipo de dato del campo (TEXT, NUMBER, DATE, SELECT, etc.)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "field_type", nullable = false, length = 20)
    private FieldType fieldType;

    /**
     * Mapeo al campo de SwiftDraftReadModel.
     * Un solo campo: "expiryDate"
     * Múltiples campos: "currency,amount" (para :32B: que tiene moneda y monto)
     */
    @Column(name = "draft_field_mapping", length = 100)
    private String draftFieldMapping;

    /**
     * Tipo de componente UI a renderizar
     * (ej: "INPUT", "TEXTAREA", "SELECT", "FINANCIAL_INSTITUTION_SELECTOR")
     */
    @Column(name = "component_type", nullable = false, length = 50)
    private String componentType;

    /**
     * Clave de traducción para el placeholder
     */
    @Column(name = "placeholder_key", length = 100)
    private String placeholderKey;

    // ==================== Validaciones ====================

    /**
     * Reglas de validación en formato JSON
     * Ejemplo:
     * {
     *   "pattern": "^[+\\-]?\\d+(\\.\\d+)?(%)?([/][+\\-]?\\d+(\\.\\d+)?(%)?)?$",
     *   "minValue": -100,
     *   "maxValue": 100,
     *   "minLength": 0,
     *   "maxLength": 255,
     *   "required": false,
     *   "customValidator": "toleranceValidator",
     *   "errorMessage": "Formato inválido",
     *   "warningMessage": "Valor inusual"
     * }
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "validation_rules", columnDefinition = "json")
    private String validationRules;

    // ==================== Dependencias ====================

    /**
     * Dependencias con otros campos en formato JSON
     * Ejemplo:
     * {
     *   "triggers": ["monto", "toleranciaPorc"],
     *   "revalidates": ["montoMaximo"],
     *   "requiredIf": {
     *     "field": "tipoLC",
     *     "value": "CONFIRMADA",
     *     "requires": "bancoConfirmador"
     *   },
     *   "disabledIf": {
     *     "field": "formaCredito",
     *     "value": "REVOCABLE"
     *   },
     *   "visibleIf": {
     *     "field": "embarquesParciales",
     *     "value": "PERMITIDO"
     *   }
     * }
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dependencies", columnDefinition = "json")
    private String dependencies;

    // ==================== Alertas Contextuales ====================

    /**
     * Alertas contextuales en formato JSON (array)
     * Ejemplo:
     * [{
     *   "showWhen": {
     *     "field": "toleranciaPorcentaje",
     *     "condition": "NOT_EMPTY"
     *   },
     *   "alertType": "WARNING",
     *   "title": "Especifique Monto Máximo",
     *   "message": "Al usar tolerancia porcentual, es ALTAMENTE RECOMENDADO especificar el monto máximo",
     *   "suggestedFields": ["montoMaximo"]
     * }]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "contextual_alerts", columnDefinition = "json")
    private String contextualAlerts;

    // ==================== Opciones (para campos SELECT) ====================

    /**
     * Opciones disponibles para campos tipo SELECT en formato JSON (array)
     * Ejemplo:
     * [{
     *   "value": "IRREVOCABLE",
     *   "label": "Irrevocable",
     *   "description": "No puede ser modificada sin consentimiento"
     * }]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "field_options", columnDefinition = "json")
    private String fieldOptions;

    // ==================== Metadatos ====================

    /**
     * Valor por defecto del campo
     */
    @Column(name = "default_value", length = 255)
    private String defaultValue;

    /**
     * Clave de traducción para el texto de ayuda
     */
    @Column(name = "help_text_key", columnDefinition = "TEXT")
    private String helpTextKey;

    /**
     * URL a documentación externa (norma SWIFT) o texto de documentación completo
     */
    @Column(name = "documentation_url", columnDefinition = "TEXT")
    private String documentationUrl;

    // ==================== Versioning (SRG2026+) ====================

    /**
     * SWIFT specification version (e.g., "2024", "2026")
     * Allows multiple versions of the same field to coexist
     */
    @Column(name = "spec_version", length = 20)
    @Builder.Default
    private String specVersion = "2024";

    /**
     * Date when this specification version became effective
     */
    @Column(name = "effective_date")
    private java.time.LocalDate effectiveDate;

    /**
     * Date when this field was deprecated (null if still active)
     */
    @Column(name = "deprecated_date")
    private java.time.LocalDate deprecatedDate;

    /**
     * Field code that replaces this one in newer versions
     * (e.g., ":50:" deprecated, successor is ":50N:")
     */
    @Column(name = "successor_field_code", length = 50)
    private String successorFieldCode;

    /**
     * Notes about changes in this specification version
     */
    @Column(name = "spec_notes", columnDefinition = "TEXT")
    private String specNotes;

    // ==================== Raw SWIFT Specification ====================

    /**
     * Raw SWIFT format specification from the standard
     * (e.g., "4*35z", "2!a", "6!n29x", "A or D")
     */
    @Column(name = "swift_format", length = 100)
    private String swiftFormat;

    /**
     * Mandatory/Optional status from SWIFT specification
     * M = Mandatory, O = Optional
     */
    @Column(name = "swift_status", length = 1)
    private String swiftStatus;

    /**
     * Usage notes and guidelines from SWIFT standard
     */
    @Column(name = "swift_usage_notes", columnDefinition = "TEXT")
    private String swiftUsageNotes;

    // ==================== AI Assistance ====================

    /**
     * Whether AI assistance is enabled for this field
     */
    @Column(name = "ai_enabled")
    @Builder.Default
    private Boolean aiEnabled = false;

    /**
     * AI prompt for contextual help when user requests assistance on this field
     */
    @Column(name = "ai_help_prompt", columnDefinition = "TEXT")
    private String aiHelpPrompt;

    /**
     * AI prompt for validating the field value
     */
    @Column(name = "ai_validation_prompt", columnDefinition = "TEXT")
    private String aiValidationPrompt;

    // ==================== Auditoría ====================

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
