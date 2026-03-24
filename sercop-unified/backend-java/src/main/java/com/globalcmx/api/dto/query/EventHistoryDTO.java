package com.globalcmx.api.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventHistoryDTO {
    private String eventId;
    private String eventType;
    private LocalDateTime timestamp;
    private String performedBy;
    private Long version;
    private Map<String, Object> eventData;
}
