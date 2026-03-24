package com.globalcmx.api.compraspublicas.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request para análisis de precios de contratación pública.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CPPriceAnalysisRequest {

    /** Código CPC del bien/servicio */
    private String cpcCode;

    /** Descripción del item */
    private String itemDescription;

    /** Precio unitario propuesto */
    private BigDecimal proposedPrice;

    /** Unidad de medida */
    private String unit;

    /** Cantidad */
    private BigDecimal quantity;

    /** ID del proceso (opcional) */
    private String processId;

    /** Provincia para análisis regional (opcional) */
    private String province;
}
