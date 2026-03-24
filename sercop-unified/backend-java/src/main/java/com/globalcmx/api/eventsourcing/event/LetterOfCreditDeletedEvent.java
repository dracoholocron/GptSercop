package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class LetterOfCreditDeletedEvent extends DomainEvent {
    private Long cartaCreditoId;

    public LetterOfCreditDeletedEvent(Long cartaCreditoId, String performedBy) {
        super("CARTA_CREDITO_DELETED", performedBy);
        this.cartaCreditoId = cartaCreditoId;
    }
}
