package com.globalcmx.api.scheduler.dto.command;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AbandonDeadLetterCommand {

    @NotBlank(message = "Abandoned by is required")
    private String abandonedBy;

    private String notes;

}
