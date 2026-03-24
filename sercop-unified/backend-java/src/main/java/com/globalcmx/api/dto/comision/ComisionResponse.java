package com.globalcmx.api.dto.comision;

import com.globalcmx.api.dto.swift.MensajeSWIFT;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO de respuesta con el cálculo de comisión
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComisionResponse {

    /**
     * Mensaje SWIFT recibido
     */
    private MensajeSWIFT mensaje;

    /**
     * Configuración aplicada
     */
    private ConfiguracionComision configuracion;

    /**
     * Comisión calculada final (aplicando fija, porcentaje, min y max)
     */
    private Double comisionCalculada;

    /**
     * Moneda de la comisión
     */
    private String moneda;

    /**
     * Detalle del cálculo realizado
     */
    private String detalleCalculo;

    /**
     * Indica si se encontró una regla aplicable
     */
    private Boolean reglaAplicada;

    /**
     * Timestamp del cálculo
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * Calcula la comisión final basándose en la configuración
     */
    public void calcularComisionFinal(Double montoOperacion) {
        if (configuracion == null) {
            this.comisionCalculada = 0.0;
            this.reglaAplicada = false;
            this.detalleCalculo = "No se encontró regla aplicable";
            return;
        }

        this.reglaAplicada = true;
        double comision = 0.0;
        StringBuilder detalle = new StringBuilder();

        // Aplicar comisión fija
        if (configuracion.getComisionFija() != null && configuracion.getComisionFija() > 0) {
            comision = configuracion.getComisionFija();
            detalle.append(String.format("Comisión fija: %.2f %s", comision, moneda));
        }

        // Aplicar comisión porcentual
        if (configuracion.getComisionPorcentaje() != null && configuracion.getComisionPorcentaje() > 0) {
            double comisionPorcentual = (montoOperacion * configuracion.getComisionPorcentaje()) / 100;
            comision += comisionPorcentual;
            if (detalle.length() > 0) {
                detalle.append(" + ");
            }
            detalle.append(String.format("%.2f%% de %.2f = %.2f %s",
                configuracion.getComisionPorcentaje(),
                montoOperacion,
                comisionPorcentual,
                moneda));
        }

        // Aplicar comisión mínima
        if (configuracion.getComisionMinima() != null && comision < configuracion.getComisionMinima()) {
            detalle.append(String.format(" → Aplicando mínimo: %.2f %s", configuracion.getComisionMinima(), moneda));
            comision = configuracion.getComisionMinima();
        }

        // Aplicar comisión máxima
        if (configuracion.getComisionMaxima() != null && comision > configuracion.getComisionMaxima()) {
            detalle.append(String.format(" → Aplicando máximo: %.2f %s", configuracion.getComisionMaxima(), moneda));
            comision = configuracion.getComisionMaxima();
        }

        this.comisionCalculada = comision;
        this.detalleCalculo = detalle.toString();
    }
}
