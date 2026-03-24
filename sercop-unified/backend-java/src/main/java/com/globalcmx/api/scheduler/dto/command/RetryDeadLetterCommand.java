package com.globalcmx.api.scheduler.dto.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RetryDeadLetterCommand {

    private String retriedBy;
    private String overrideParameters; // JSON string to override parameters for retry

}
