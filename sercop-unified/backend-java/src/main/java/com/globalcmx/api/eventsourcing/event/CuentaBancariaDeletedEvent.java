package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class CuentaBancariaDeletedEvent extends DomainEvent {
    private Long cuentaBancariaId;

    public CuentaBancariaDeletedEvent(Long cuentaBancariaId, String performedBy) {
        super("CUENTA_BANCARIA_DELETED", performedBy);
        this.cuentaBancariaId = cuentaBancariaId;
    }
}
