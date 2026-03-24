package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class CuentaBancariaUpdatedEvent extends DomainEvent {
    private Long cuentaBancariaId;
    private String identificacionParticipante;
    private String nombresParticipante;
    private String apellidosParticipante;
    private String numeroCuenta;
    private String identificacionCuenta;
    private String tipo;
    private Boolean activo;

    public CuentaBancariaUpdatedEvent(Long cuentaBancariaId, String identificacionParticipante,
                                      String nombresParticipante, String apellidosParticipante,
                                      String numeroCuenta, String identificacionCuenta,
                                      String tipo, Boolean activo, String performedBy) {
        super("CUENTA_BANCARIA_UPDATED", performedBy);
        this.cuentaBancariaId = cuentaBancariaId;
        this.identificacionParticipante = identificacionParticipante;
        this.nombresParticipante = nombresParticipante;
        this.apellidosParticipante = apellidosParticipante;
        this.numeroCuenta = numeroCuenta;
        this.identificacionCuenta = identificacionCuenta;
        this.tipo = tipo;
        this.activo = activo;
    }
}
