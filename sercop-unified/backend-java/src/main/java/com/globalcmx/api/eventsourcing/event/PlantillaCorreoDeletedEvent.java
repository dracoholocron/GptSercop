package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class PlantillaCorreoDeletedEvent extends DomainEvent {
    private Long plantillaCorreoId;

    public PlantillaCorreoDeletedEvent(Long plantillaCorreoId, String performedBy) {
        super("PLANTILLA_CORREO_DELETED", performedBy);
        this.plantillaCorreoId = plantillaCorreoId;
    }
}
