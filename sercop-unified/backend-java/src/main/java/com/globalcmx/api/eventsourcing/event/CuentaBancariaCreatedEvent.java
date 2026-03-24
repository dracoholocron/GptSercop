package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class CuentaBancariaCreatedEvent extends DomainEvent {
    private Long cuentaBancariaId;
    private String identificacionParticipante;
    private String nombresParticipante;
    private String apellidosParticipante;
    private String numeroCuenta;
    private String identificacionCuenta;
    private String tipo;
    private Boolean activo;

    public CuentaBancariaCreatedEvent(Long cuentaBancariaId, String identificacionParticipante,
                                      String nombresParticipante, String apellidosParticipante,
                                      String numeroCuenta, String identificacionCuenta,
                                      String tipo, Boolean activo, String performedBy) {
        super("CUENTA_BANCARIA_CREATED", performedBy);
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
