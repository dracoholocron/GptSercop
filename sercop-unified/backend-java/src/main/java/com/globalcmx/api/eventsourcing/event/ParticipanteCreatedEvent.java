package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class ParticipanteCreatedEvent extends DomainEvent {
    private Long participanteId;
    private String identificacion;
    private String tipo;
    private String tipoReferencia;
    private String nombres;
    private String apellidos;
    private String email;
    private String telefono;
    private String direccion;
    private String agencia;
    private String ejecutivoAsignado;
    private String ejecutivoId;
    private String correoEjecutivo;
    private String autenticador;

    public ParticipanteCreatedEvent(Long participanteId, String identificacion, String tipo,
                                    String tipoReferencia, String nombres, String apellidos,
                                    String email, String telefono, String direccion, String agencia,
                                    String ejecutivoAsignado, String ejecutivoId, String correoEjecutivo,
                                    String autenticador, String performedBy) {
        super("PARTICIPANTE_CREATED", performedBy);
        this.participanteId = participanteId;
        this.identificacion = identificacion;
        this.tipo = tipo;
        this.tipoReferencia = tipoReferencia;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.email = email;
        this.telefono = telefono;
        this.direccion = direccion;
        this.agencia = agencia;
        this.ejecutivoAsignado = ejecutivoAsignado;
        this.ejecutivoId = ejecutivoId;
        this.correoEjecutivo = correoEjecutivo;
        this.autenticador = autenticador;
    }
}
