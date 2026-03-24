package com.globalcmx.api.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MensajeSwift {
    private Long id;
    private String operacionTipo;
    private Long operacionId;
    private String tipoMensaje;
    private String direccion;
    private String bicSender;
    private String bicReceiver;
    private String referencia;
    private String contenidoSwift;
    private LocalDateTime fechaEnvio;
    private LocalDateTime fechaRecepcion;
    private String estado;
    private Long mensajeRelacionadoId;
    private LocalDateTime createdAt;
}
