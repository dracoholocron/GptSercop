package com.globalcmx.api.externalapi.dto.command;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateExternalApiConfigCommand {

    @NotBlank(message = "El nombre es requerido")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    private String name;

    @Size(max = 500, message = "La descripcion no puede exceder 500 caracteres")
    private String description;

    @NotBlank(message = "La URL base es requerida")
    @Pattern(regexp = "^(https?://.*|[#$]\\{.+})$", message = "URL debe comenzar con http:// o https:// o ser un placeholder")
    private String baseUrl;

    private String path;

    @NotNull(message = "El metodo HTTP es requerido")
    private String httpMethod;

    private String contentType;

    @Min(value = 1000, message = "Timeout minimo es 1000ms")
    @Max(value = 300000, message = "Timeout maximo es 300000ms")
    private Integer timeoutMs;

    @Min(value = 0, message = "Retry count minimo es 0")
    @Max(value = 10, message = "Retry count maximo es 10")
    private Integer retryCount;

    private Double retryBackoffMultiplier;
    private Integer retryInitialDelayMs;
    private Integer retryMaxDelayMs;

    private Boolean circuitBreakerEnabled;
    private Integer circuitBreakerThreshold;
    private Integer circuitBreakerTimeoutMs;

    private Boolean active;
    private String environment;

    private Boolean mockEnabled;
    private String mockProvider;
    private String mockCustomUrl;

    @Valid
    private AuthConfigCommand authConfig;

    @Valid
    private List<RequestTemplateCommand> requestTemplates;

    @Valid
    private ResponseConfigCommand responseConfig;

    private String updatedBy;
}
