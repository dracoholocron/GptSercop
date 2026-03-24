package com.globalcmx.api.externalapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Response DTO for parsed OpenAPI/Swagger specification.
 * Contains all extractable information that can be used to auto-configure an external API.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpenApiParseResponse {

    private String title;
    private String description;
    private String version;
    private String openApiVersion;

    /**
     * Base URL extracted from servers[0].url or host+basePath
     */
    private String baseUrl;

    /**
     * List of available endpoints
     */
    private List<OpenApiEndpoint> endpoints;

    /**
     * Security schemes defined in the spec
     */
    private List<OpenApiSecurityScheme> securitySchemes;

    /**
     * Any parsing warnings or info messages
     */
    private List<String> messages;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OpenApiEndpoint {
        private String path;
        private String httpMethod;
        private String operationId;
        private String summary;
        private String description;
        private List<String> tags;
        private String contentType;

        /**
         * Request body schema as JSON string
         */
        private String requestBodySchema;

        /**
         * Generated JSON skeleton from request body schema
         */
        private String requestBodyTemplate;

        /**
         * Query parameters
         */
        private List<OpenApiParameter> queryParameters;

        /**
         * Header parameters
         */
        private List<OpenApiParameter> headerParameters;

        /**
         * Path parameters
         */
        private List<OpenApiParameter> pathParameters;

        /**
         * Response schemas by status code
         */
        private Map<String, String> responseSchemas;

        /**
         * Success status codes (2xx)
         */
        private List<String> successCodes;

        /**
         * Security requirements for this endpoint
         */
        private List<String> security;

        /**
         * Suggested code for this endpoint (derived from operationId or path)
         */
        private String suggestedCode;

        /**
         * Suggested name for this endpoint
         */
        private String suggestedName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OpenApiParameter {
        private String name;
        private String in; // query, header, path, cookie
        private String type;
        private String format;
        private String description;
        private boolean required;
        private String defaultValue;
        private String example;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OpenApiSecurityScheme {
        private String name;
        private String type; // apiKey, http, oauth2, openIdConnect
        private String scheme; // for http: basic, bearer, etc.
        private String bearerFormat; // for bearer tokens
        private String in; // for apiKey: header, query, cookie
        private String parameterName; // for apiKey: the header/query name
        private String authorizationUrl; // for oauth2
        private String tokenUrl; // for oauth2
        private List<String> scopes; // for oauth2

        /**
         * Mapped GlobalCMX auth type
         */
        private String mappedAuthType;
    }
}
