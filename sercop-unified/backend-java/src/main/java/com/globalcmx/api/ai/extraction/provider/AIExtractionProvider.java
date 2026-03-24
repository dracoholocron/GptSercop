package com.globalcmx.api.ai.extraction.provider;

import com.globalcmx.api.ai.extraction.dto.ExtractionRequest;
import com.globalcmx.api.ai.extraction.dto.ExtractionResponse;
import com.globalcmx.api.ai.extraction.dto.ProviderHealthResponse;

/**
 * Interface para proveedores de IA de extracción de documentos.
 * Implementa el patrón Strategy para permitir cambiar de proveedor fácilmente.
 */
public interface AIExtractionProvider {

    /**
     * Obtiene el código del proveedor (claude, openai, local, etc.)
     */
    String getProviderCode();

    /**
     * Obtiene el nombre para mostrar
     */
    String getDisplayName();

    /**
     * Verifica si el proveedor está disponible y configurado
     */
    ProviderHealthResponse checkHealth();

    /**
     * Ejecuta la extracción de campos del documento
     *
     * @param request Solicitud de extracción
     * @return Respuesta con los campos extraídos
     */
    ExtractionResponse extract(ExtractionRequest request);

    /**
     * Obtiene el modelo por defecto
     */
    String getDefaultModel();

    /**
     * Verifica si soporta un tipo de archivo específico
     */
    boolean supportsFileType(String mimeType);

    /**
     * Estima el costo de una extracción
     */
    default double estimateCost(int inputTokens, int outputTokens) {
        return 0.0;
    }
}
