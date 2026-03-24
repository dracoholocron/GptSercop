package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class LineaCreditoDeletedEvent extends DomainEvent {
    private Long lineaCreditoId;

    public LineaCreditoDeletedEvent(Long lineaCreditoId, String performedBy) {
        super("LINEA_CREDITO_DELETED", performedBy);
        this.lineaCreditoId = lineaCreditoId;
    }
}
