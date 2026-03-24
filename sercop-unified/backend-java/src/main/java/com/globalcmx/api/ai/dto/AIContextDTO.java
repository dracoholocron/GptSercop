package com.globalcmx.api.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para representar un contexto de IA disponible.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIContextDTO {

    private Long id;
    private String code;
    private String name;
    private String description;
    private String contextType;
    private Boolean enabled;
    private Integer displayOrder;
}





