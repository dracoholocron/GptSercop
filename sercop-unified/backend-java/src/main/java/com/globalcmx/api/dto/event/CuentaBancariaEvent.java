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
public class CuentaBancariaEvent {
    private Long cuentaBancariaId;
    private String identificacionParticipante;
    private String nombresParticipante;
    private String apellidosParticipante;
    private String numeroCuenta;
    private String identificacionCuenta;
    private String tipo;
    private Boolean activo;
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
