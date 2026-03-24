package com.globalcmx.api.certification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para estadísticas de certificación.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CertificationStatsResponse {
    private long total;
    private long notTested;
    private long inProgress;
    private long certified;
    private long failed;
    private long blocked;
    private double certifiedPercentage;
}
