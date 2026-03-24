package com.globalcmx.api.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportRequestDTO {
    private String tableId;
    private List<String> columnIds;
    private List<ReportFilterDTO> filters;
    private List<String> groupBy; // Columnas para agrupar
    private List<AggregatedColumnDTO> aggregatedColumns; // Columnas calculadas
    private String sortBy;
    private String sortDirection; // ASC, DESC
    private String exportFormat; // EXCEL, CSV, PDF, JSON
    private Integer limit;
}
