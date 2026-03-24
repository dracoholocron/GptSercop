package com.globalcmx.api.externalapi.dto.command;

import lombok.*;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestApiConnectionCommand {

    private Map<String, Object> testData;
    private String templateName;
    private Boolean validateOnly;
    private String testedBy;
}
