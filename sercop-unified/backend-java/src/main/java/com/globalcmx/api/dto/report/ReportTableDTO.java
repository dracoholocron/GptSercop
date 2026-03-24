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
public class ReportTableDTO {
    private String id;
    private String name;
    private String description;
    private List<String> relatedTables;
    private List<ReportColumnDTO> columns;
}
