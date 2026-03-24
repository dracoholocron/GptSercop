package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class CotizacionDeletedEvent extends DomainEvent {
    private Long cotizacionId;

    public CotizacionDeletedEvent(Long cotizacionId, String performedBy) {
        super("COTIZACION_DELETED", performedBy);
        this.cotizacionId = cotizacionId;
    }
}
