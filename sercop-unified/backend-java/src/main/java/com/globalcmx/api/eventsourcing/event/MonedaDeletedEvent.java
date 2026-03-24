package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class MonedaDeletedEvent extends DomainEvent {
    private Long monedaId;

    public MonedaDeletedEvent(Long monedaId, String performedBy) {
        super("MONEDA_DELETED", performedBy);
        this.monedaId = monedaId;
    }
}
