package com.globalcmx.api.dto.swift;

import com.globalcmx.api.readmodel.enums.FieldType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO para transferir configuración de campos SWIFT
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwiftFieldConfigDTO {

    private String id;
    private String fieldCode;
    private String fieldNameKey;      // Translation key (e.g., "swift.mt700.20.fieldName")
    private String descriptionKey;    // Translation key
    private String messageType;
    private String section;
    private Integer displayOrder;
    private Boolean isRequired;
    private Boolean isActive;
    private FieldType fieldType;
    private String draftFieldMapping;
    private String componentType;
    private String placeholderKey;    // Translation key
    private String validationRules;   // JSON String
    private String dependencies;      // JSON String
    private String contextualAlerts;  // JSON String
    private String fieldOptions;      // JSON String
    private String defaultValue;
    private String helpTextKey;       // Translation key
    private String documentationUrl;

    // Versioning fields (SRG2026+)
    private String specVersion;           // Versión de especificación (ej: "2024", "2026")
    private LocalDate effectiveDate;      // Fecha en que la especificación entró en vigencia
    private LocalDate deprecatedDate;     // Fecha en que el campo fue deprecado (null si activo)
    private String successorFieldCode;    // Campo sucesor si fue deprecado
    private String specNotes;             // Notas sobre cambios en esta versión

    // Raw SWIFT Specification fields
    private String swiftFormat;           // Formato SWIFT del estándar (ej: "4*35z", "2!a")
    private String swiftStatus;           // M=Mandatory, O=Optional según especificación
    private String swiftUsageNotes;       // Notas de uso del estándar SWIFT

    // AI Assistance
    private Boolean aiEnabled;
    private String aiHelpPrompt;
    private String aiValidationPrompt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
