package com.globalcmx.api.dto.swift;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO para comparación entre versiones de especificación SWIFT
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwiftVersionComparisonDTO {

    private String messageType;
    private String version1;
    private String version2;

    /**
     * Campos que existen solo en version1 (eliminados en version2)
     */
    private List<FieldDifference> removedFields;

    /**
     * Campos que existen solo en version2 (nuevos)
     */
    private List<FieldDifference> newFields;

    /**
     * Campos que existen en ambas versiones pero tienen diferencias
     */
    private List<FieldDifference> modifiedFields;

    /**
     * Campos sin cambios (presentes en ambas versiones con mismos valores)
     */
    private List<FieldDifference> unchangedFields;

    /**
     * Resumen estadístico
     */
    private ComparisonSummary summary;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FieldDifference {
        private String fieldCode;
        private String fieldNameKeyV1;     // Translation key
        private String fieldNameKeyV2;     // Translation key
        private String swiftFormatV1;
        private String swiftFormatV2;
        private String swiftStatusV1;      // M or O
        private String swiftStatusV2;      // M or O
        private Boolean isRequiredV1;
        private Boolean isRequiredV2;
        private String descriptionKeyV1;   // Translation key
        private String descriptionKeyV2;   // Translation key
        private String sectionV1;
        private String sectionV2;
        private String successorFieldCode; // For deprecated fields
        private String specNotes;          // Notes about the change

        /**
         * Lista de campos específicos que cambiaron
         */
        private List<String> changedAttributes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ComparisonSummary {
        private int totalFieldsV1;
        private int totalFieldsV2;
        private int newFieldsCount;
        private int removedFieldsCount;
        private int modifiedFieldsCount;
        private int unchangedFieldsCount;
        private int formatChangesCount;
        private int statusChangesCount;
    }
}
