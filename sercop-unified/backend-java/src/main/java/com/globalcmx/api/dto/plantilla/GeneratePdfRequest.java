package com.globalcmx.api.dto.plantilla;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO para la solicitud de generación de PDF desde plantilla
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratePdfRequest {

    /**
     * Datos para reemplazar en la plantilla
     * Puede contener:
     * - Variables simples: "nombreCliente": "Juan Pérez"
     * - Listas para th:each: "items": [{"nombre": "Item 1", "precio": 100}, ...]
     */
    private Map<String, Object> data;

    /**
     * Nombre del archivo PDF a generar (opcional)
     */
    private String filename;
}
