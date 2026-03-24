package com.globalcmx.api.dto.command;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeleteEventRuleCommand {
    @NotNull(message = "El ID es requerido")
    private Long id;

    private String deletedBy;
}
