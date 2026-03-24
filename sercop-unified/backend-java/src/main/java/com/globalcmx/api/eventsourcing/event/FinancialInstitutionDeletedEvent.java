package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class FinancialInstitutionDeletedEvent extends DomainEvent {
    private Long institucionId;

    public FinancialInstitutionDeletedEvent(Long institucionId, String performedBy) {
        super("INSTITUCION_FINANCIERA_DELETED", performedBy);
        this.institucionId = institucionId;
    }
}
