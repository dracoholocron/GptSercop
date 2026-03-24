package com.globalcmx.api.dto.event;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipanteEvent {
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
    private EventType eventType;
    private String performedBy;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    public enum EventType {
        CREATED,
        UPDATED,
        DELETED
    }
}
