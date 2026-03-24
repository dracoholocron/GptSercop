package com.globalcmx.api.externalapi.dto.command;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequestTemplateCommand {

    private Long id;

    @NotBlank(message = "El nombre del template es requerido")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    private String name;

    @Size(max = 500, message = "La descripcion no puede exceder 500 caracteres")
    private String description;

    private String staticHeadersJson;
    private String queryParamsTemplate;
    private String bodyTemplate;
    private String variableMappingsJson;

    private Boolean isDefault;
    private Boolean active;
}
