package com.globalcmx.api.dto.actions;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Clase que encapsula la configuración de una acción a ejecutar.
 * Esta clase se utiliza para parsear el JSON de acciones almacenado en ReglaEvento.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionConfig {

    /**
     * Tipo de acción a ejecutar
     */
    private ActionType tipo;

    /**
     * Configuración específica de la acción en formato Map
     * El contenido varía según el tipo de acción:
     * - EMAIL: {plantillaCorreoCodigo, destinatarios, cc, asunto, variables}
     * - DOCUMENTO: {plantillaCodigo, formato, variables, almacenarEn}
     * - API: {url, method, headers, body}
     * - AUDITORIA: {categoria, severidad, mensaje}
     */
    private Map<String, Object> config;

    /**
     * Orden de ejecución de la acción (opcional)
     */
    private Integer orden;

    /**
     * Indica si la acción debe ejecutarse de forma asíncrona
     */
    @Builder.Default
    private Boolean async = false;

    /**
     * Indica si se debe continuar con las siguientes acciones si esta falla
     */
    @Builder.Default
    private Boolean continueOnError = true;

    /**
     * Enum con los tipos de acción soportados
     */
    public enum ActionType {
        EMAIL,
        DOCUMENTO,
        API,
        AUDITORIA
    }

    /**
     * Crea una instancia de ActionConfig desde un JSON string
     *
     * @param json String JSON con la configuración
     * @return ActionConfig parseado
     * @throws JsonProcessingException si el JSON es inválido
     */
    public static ActionConfig fromJson(String json) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(json, ActionConfig.class);
    }

    /**
     * Crea una instancia de ActionConfig desde un Map
     *
     * @param data Map con los datos de configuración
     * @return ActionConfig construido
     */
    @JsonCreator
    public static ActionConfig fromMap(@JsonProperty("tipo") String tipo,
                                      @JsonProperty("config") Map<String, Object> config,
                                      @JsonProperty("orden") Integer orden,
                                      @JsonProperty("async") Boolean async,
                                      @JsonProperty("continueOnError") Boolean continueOnError) {
        return ActionConfig.builder()
                .tipo(ActionType.valueOf(tipo.toUpperCase()))
                .config(config)
                .orden(orden)
                .async(async != null ? async : false)
                .continueOnError(continueOnError != null ? continueOnError : true)
                .build();
    }

    /**
     * Obtiene un valor de configuración de forma segura
     *
     * @param key Clave del valor
     * @return Valor o null si no existe
     */
    public Object getConfigValue(String key) {
        return config != null ? config.get(key) : null;
    }

    /**
     * Obtiene un valor de configuración como String
     *
     * @param key Clave del valor
     * @return Valor como String o null
     */
    public String getConfigString(String key) {
        Object value = getConfigValue(key);
        return value != null ? value.toString() : null;
    }

    /**
     * Obtiene un valor de configuración como Map
     *
     * @param key Clave del valor
     * @return Valor como Map o null
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getConfigMap(String key) {
        Object value = getConfigValue(key);
        return value instanceof Map ? (Map<String, Object>) value : null;
    }
}
