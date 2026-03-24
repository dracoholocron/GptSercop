package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class BankGuaranteeDeletedEvent extends DomainEvent {
    private Long garantiaId;

    public BankGuaranteeDeletedEvent(Long garantiaId, String performedBy) {
        super("GARANTIA_BANCARIA_DELETED", performedBy);
        this.garantiaId = garantiaId;
    }
}
