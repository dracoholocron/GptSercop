package com.globalcmx.api.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LcAmendment {
    private Long id;
    private Long lcId;
    private Integer numeroEnmienda;
    private String tipoEnmienda;
    private String estado;
    private String descripcion;
    private BigDecimal montoAnterior;
    private BigDecimal montoNuevo;
    private LocalDate fechaVencimientoAnterior;
    private LocalDate fechaVencimientoNueva;
    private String swiftMt707;
    private LocalDateTime fechaSolicitud;
    private LocalDateTime fechaAprobacion;
    private String aprobadaPor;
    private LocalDateTime createdAt;
}
