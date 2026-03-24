package com.globalcmx.api.compraspublicas.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Request para detección de riesgos en procesos de contratación pública.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CPRiskAnalysisRequest {

    /** Código del proceso SERCOP */
    private String processCode;

    /** Tipo de proceso: CE, SIE, MC, LP, etc. */
    private String processType;

    /** RUC de la entidad contratante */
    private String entityRuc;

    /** Nombre de la entidad contratante */
    private String entityName;

    /** Presupuesto referencial */
    private BigDecimal budget;

    /** Fecha de publicación del proceso */
    private LocalDate publicationDate;

    /** Fecha límite para presentar ofertas */
    private LocalDate deadlineDate;

    /** Lista de oferentes participantes */
    private List<Bidder> bidders;

    /** Indicadores específicos a evaluar (opcional, null = todos) */
    private List<String> indicatorCodes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Bidder {
        private String ruc;
        private String name;
        private BigDecimal offeredPrice;
        private LocalDate offerDate;
    }
}
