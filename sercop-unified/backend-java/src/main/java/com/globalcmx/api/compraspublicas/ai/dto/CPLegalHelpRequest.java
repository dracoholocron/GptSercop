package com.globalcmx.api.compraspublicas.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request para obtener ayuda legal contextual en procesos de contratación pública.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CPLegalHelpRequest {

    /** Tipo de proceso: CE, SIE, MC, LP, IC, RE, FI */
    private String processType;

    /** Etapa actual del proceso: preparacion, pliegos, convocatoria, evaluacion, adjudicacion */
    private String currentStep;

    /** ID del campo que está editando el usuario */
    private String fieldId;

    /** Presupuesto referencial del proceso */
    private BigDecimal budget;

    /** Pregunta específica del usuario (opcional) */
    private String question;

    /** Código CPC del bien/servicio (opcional) */
    private String cpcCode;

    /** Idioma de respuesta: es, en */
    @Builder.Default
    private String language = "es";
}
