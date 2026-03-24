package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class FinanciamientoCxDeletedEvent extends DomainEvent {
    private Long financiamientoCxId;

    public FinanciamientoCxDeletedEvent() {
        super();
    }

    public FinanciamientoCxDeletedEvent(Long financiamientoCxId, String performedBy) {
        super("FINANCIAMIENTO_CX_DELETED", performedBy);
        this.financiamientoCxId = financiamientoCxId;
    }
}
