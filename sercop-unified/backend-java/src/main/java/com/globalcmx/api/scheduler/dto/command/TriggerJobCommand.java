package com.globalcmx.api.scheduler.dto.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TriggerJobCommand {

    private String triggeredBy;
    private String overrideParameters; // JSON string to override job parameters for this execution
    private Boolean async; // If true, return immediately without waiting for completion

}
