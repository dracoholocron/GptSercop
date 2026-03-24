package com.globalcmx.api.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportFilterDTO {
    private String columnId;
    private String operator;
    private String value;
    private String value2; // Para operadores BETWEEN
}
