package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class DocumentaryCollectionDeletedEvent extends DomainEvent {
    private Long cobranzaId;

    public DocumentaryCollectionDeletedEvent(Long cobranzaId, String performedBy) {
        super("COBRANZA_DOCUMENTARIA_DELETED", performedBy);
        this.cobranzaId = cobranzaId;
    }
}
