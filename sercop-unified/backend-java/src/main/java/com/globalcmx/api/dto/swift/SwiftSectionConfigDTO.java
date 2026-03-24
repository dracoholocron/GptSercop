package com.globalcmx.api.dto.swift;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para transferir configuración de secciones SWIFT.
 * Los labels se resuelven en el frontend usando i18n.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwiftSectionConfigDTO {

    private String id;
    private String sectionCode;
    private String labelKey;
    private String descriptionKey;
    private String messageType;
    private Integer displayOrder;
    private String icon;
    private Boolean isActive;
}
