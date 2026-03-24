package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class ReglaEventoDeletedEvent extends DomainEvent {
    private Long reglaEventoId;

    public ReglaEventoDeletedEvent(Long reglaEventoId, String performedBy) {
        super("REGLA_EVENTO_DELETED", performedBy);
        this.reglaEventoId = reglaEventoId;
    }
}
