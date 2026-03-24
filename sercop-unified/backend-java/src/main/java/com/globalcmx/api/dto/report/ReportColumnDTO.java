package com.globalcmx.api.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportColumnDTO {
    private String id;
    private String name;
    private String type;
    private Boolean filterable;
    private Boolean sortable;
}
