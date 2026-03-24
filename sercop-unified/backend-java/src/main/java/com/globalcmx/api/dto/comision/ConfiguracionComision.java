package com.globalcmx.api.dto.comision;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para almacenar la configuración de comisión calculada por Drools
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracionComision {

    /**
     * Comisión fija a cobrar (en la moneda de la transacción)
     */
    private Double comisionFija;

    /**
     * Comisión en porcentaje a aplicar sobre el monto
     */
    private Double comisionPorcentaje;

    /**
     * Comisión mínima a cobrar
     */
    private Double comisionMinima;

    /**
     * Comisión máxima a cobrar
     */
    private Double comisionMaxima;
}
