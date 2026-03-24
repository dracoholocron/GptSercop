package com.globalcmx.api.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportMetadataDTO {
    private String version;
    private List<ReportTableDTO> tables;
    private Map<String, List<FilterOperatorDTO>> filterOperators;
    private List<ExportFormatDTO> exportFormats;
    private List<AggregationFunctionDTO> aggregationFunctions;
}
