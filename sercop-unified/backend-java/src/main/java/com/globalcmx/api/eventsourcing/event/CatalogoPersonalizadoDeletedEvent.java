package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class CatalogoPersonalizadoDeletedEvent extends DomainEvent {
    private Long catalogoPersonalizadoId;

    public CatalogoPersonalizadoDeletedEvent(Long catalogoPersonalizadoId, String performedBy) {
        super("CATALOGO_PERSONALIZADO_DELETED", performedBy);
        this.catalogoPersonalizadoId = catalogoPersonalizadoId;
    }
}
