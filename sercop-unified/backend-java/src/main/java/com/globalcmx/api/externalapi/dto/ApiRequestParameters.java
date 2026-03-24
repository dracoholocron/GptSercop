package com.globalcmx.api.externalapi.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Holds the resolved parameters for an external API request.
 * Separates parameters by their location (path, query, header, body).
 */
@Data
@NoArgsConstructor
public class ApiRequestParameters {

    /**
     * Path parameters (e.g., /users/{id} -> "id": "123")
     */
    private Map<String, String> pathParameters = new LinkedHashMap<>();

    /**
     * Query parameters (e.g., ?name=value)
     */
    private Map<String, String> queryParameters = new LinkedHashMap<>();

    /**
     * HTTP headers
     */
    private Map<String, String> headers = new LinkedHashMap<>();

    /**
     * Body fields for top-level JSON body
     */
    private Map<String, Object> bodyFields = new LinkedHashMap<>();

    /**
     * JSON path values for nested body fields
     * Key: JSON path (e.g., "$.data.currency")
     * Value: The value to set at that path
     */
    private Map<String, Object> jsonPathValues = new LinkedHashMap<>();

    public void addPathParameter(String name, String value) {
        pathParameters.put(name, value);
    }

    public void addQueryParameter(String name, String value) {
        queryParameters.put(name, value);
    }

    public void addHeader(String name, String value) {
        headers.put(name, value);
    }

    public void addBodyField(String name, Object value) {
        bodyFields.put(name, value);
    }

    public void addJsonPathValue(String jsonPath, Object value) {
        jsonPathValues.put(jsonPath, value);
    }

    /**
     * Checks if there are any body parameters (either direct or JSON path)
     */
    public boolean hasBodyParameters() {
        return !bodyFields.isEmpty() || !jsonPathValues.isEmpty();
    }

    /**
     * Builds the query string for URL
     */
    public String buildQueryString() {
        if (queryParameters.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, String> entry : queryParameters.entrySet()) {
            if (!first) {
                sb.append("&");
            }
            sb.append(java.net.URLEncoder.encode(entry.getKey(), java.nio.charset.StandardCharsets.UTF_8))
              .append("=")
              .append(java.net.URLEncoder.encode(entry.getValue(), java.nio.charset.StandardCharsets.UTF_8));
            first = false;
        }
        return sb.toString();
    }

    /**
     * Replaces path parameters in the URL template
     */
    public String buildPath(String pathTemplate) {
        String result = pathTemplate;
        for (Map.Entry<String, String> entry : pathParameters.entrySet()) {
            result = result.replace("{" + entry.getKey() + "}", entry.getValue());
        }
        return result;
    }
}
