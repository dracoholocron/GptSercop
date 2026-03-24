package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class PlantillaDeletedEvent extends DomainEvent {
    private Long plantillaId;

    public PlantillaDeletedEvent(Long plantillaId, String performedBy) {
        super("PLANTILLA_DELETED", performedBy);
        this.plantillaId = plantillaId;
    }
}
