package com.globalcmx.api.email.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailStatsDTO {
    private long pending;
    private long processing;
    private long sent;
    private long failed;
    private long retry;
    private long cancelled;
    private long total;
}
