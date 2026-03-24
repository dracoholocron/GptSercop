package com.globalcmx.api.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AggregatedColumnDTO {
    private String function; // COUNT, SUM, AVG, MAX, MIN
    private String columnId;
    private String alias; // Nombre personalizado para la columna calculada
}
