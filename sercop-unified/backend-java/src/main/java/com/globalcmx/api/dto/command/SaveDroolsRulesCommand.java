package com.globalcmx.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveDroolsRulesCommand {
    @NotBlank(message = "El tipo de regla es requerido")
    private String ruleType;

    @NotBlank(message = "El contenido DRL es requerido")
    private String drlContent;

    private String sourceFileName;

    private byte[] sourceFileContent;

    private String performedBy;
}
