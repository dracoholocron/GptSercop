package com.globalcmx.api.externalapi.service;

import com.globalcmx.api.externalapi.dto.OpenApiParseResponse;
import com.globalcmx.api.externalapi.dto.OpenApiParseResponse.*;
import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.media.*;
import io.swagger.v3.oas.models.parameters.Parameter;
import io.swagger.v3.oas.models.parameters.RequestBody;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import io.swagger.v3.oas.models.security.OAuthFlows;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.parser.OpenAPIV3Parser;
import io.swagger.v3.parser.core.models.ParseOptions;
import io.swagger.v3.parser.core.models.SwaggerParseResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for parsing OpenAPI/Swagger specifications.
 * Supports both OpenAPI 2.0 (Swagger) and OpenAPI 3.0/3.1 specifications.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OpenApiParserService {

    /**
     * Parse an OpenAPI specification from content string.
     * Supports JSON and YAML formats.
     *
     * @param content The OpenAPI specification content (JSON or YAML)
     * @return Parsed specification data
     */
    public OpenApiParseResponse parseSpecification(String content) {
        log.info("Parsing OpenAPI specification");

        ParseOptions options = new ParseOptions();
        options.setResolve(true);
        options.setResolveFully(true);

        SwaggerParseResult result = new OpenAPIV3Parser().readContents(content, null, options);

        List<String> messages = new ArrayList<>();

        if (result.getMessages() != null && !result.getMessages().isEmpty()) {
            messages.addAll(result.getMessages());
        }

        OpenAPI openAPI = result.getOpenAPI();

        if (openAPI == null) {
            return OpenApiParseResponse.builder()
                    .messages(List.of("Failed to parse OpenAPI specification. Please check the format."))
                    .endpoints(List.of())
                    .securitySchemes(List.of())
                    .build();
        }

        return OpenApiParseResponse.builder()
                .title(extractTitle(openAPI))
                .description(extractDescription(openAPI))
                .version(extractVersion(openAPI))
                .openApiVersion(openAPI.getOpenapi())
                .baseUrl(extractBaseUrl(openAPI))
                .endpoints(extractEndpoints(openAPI))
                .securitySchemes(extractSecuritySchemes(openAPI))
                .messages(messages)
                .build();
    }

    private String extractTitle(OpenAPI openAPI) {
        if (openAPI.getInfo() != null) {
            return openAPI.getInfo().getTitle();
        }
        return "Untitled API";
    }

    private String extractDescription(OpenAPI openAPI) {
        if (openAPI.getInfo() != null) {
            return openAPI.getInfo().getDescription();
        }
        return null;
    }

    private String extractVersion(OpenAPI openAPI) {
        if (openAPI.getInfo() != null) {
            return openAPI.getInfo().getVersion();
        }
        return null;
    }

    private String extractBaseUrl(OpenAPI openAPI) {
        List<Server> servers = openAPI.getServers();
        if (servers != null && !servers.isEmpty()) {
            String url = servers.get(0).getUrl();
            // Handle relative URLs
            if (url != null && !url.startsWith("http")) {
                return "https://api.example.com" + url;
            }
            return url;
        }
        return "https://api.example.com";
    }

    private List<OpenApiEndpoint> extractEndpoints(OpenAPI openAPI) {
        List<OpenApiEndpoint> endpoints = new ArrayList<>();

        Paths paths = openAPI.getPaths();
        if (paths == null) {
            return endpoints;
        }

        for (Map.Entry<String, PathItem> pathEntry : paths.entrySet()) {
            String path = pathEntry.getKey();
            PathItem pathItem = pathEntry.getValue();

            // Process each HTTP method
            addEndpointIfPresent(endpoints, path, "GET", pathItem.getGet(), openAPI);
            addEndpointIfPresent(endpoints, path, "POST", pathItem.getPost(), openAPI);
            addEndpointIfPresent(endpoints, path, "PUT", pathItem.getPut(), openAPI);
            addEndpointIfPresent(endpoints, path, "PATCH", pathItem.getPatch(), openAPI);
            addEndpointIfPresent(endpoints, path, "DELETE", pathItem.getDelete(), openAPI);
        }

        return endpoints;
    }

    private void addEndpointIfPresent(List<OpenApiEndpoint> endpoints, String path,
                                       String method, Operation operation, OpenAPI openAPI) {
        if (operation == null) {
            return;
        }

        OpenApiEndpoint endpoint = OpenApiEndpoint.builder()
                .path(path)
                .httpMethod(method)
                .operationId(operation.getOperationId())
                .summary(operation.getSummary())
                .description(operation.getDescription())
                .tags(operation.getTags())
                .contentType(extractContentType(operation))
                .requestBodySchema(extractRequestBodySchema(operation, openAPI))
                .requestBodyTemplate(generateRequestBodyTemplate(operation, openAPI))
                .queryParameters(extractParameters(operation, "query"))
                .headerParameters(extractParameters(operation, "header"))
                .pathParameters(extractParameters(operation, "path"))
                .responseSchemas(extractResponseSchemas(operation, openAPI))
                .successCodes(extractSuccessCodes(operation))
                .security(extractSecurity(operation, openAPI))
                .suggestedCode(generateSuggestedCode(path, method, operation))
                .suggestedName(generateSuggestedName(path, method, operation))
                .build();

        endpoints.add(endpoint);
    }

    private String extractContentType(Operation operation) {
        RequestBody requestBody = operation.getRequestBody();
        if (requestBody != null && requestBody.getContent() != null) {
            if (requestBody.getContent().containsKey("application/json")) {
                return "application/json";
            }
            if (requestBody.getContent().containsKey("application/xml")) {
                return "application/xml";
            }
            // Return first available content type
            return requestBody.getContent().keySet().stream().findFirst().orElse("application/json");
        }
        return "application/json";
    }

    private String extractRequestBodySchema(Operation operation, OpenAPI openAPI) {
        RequestBody requestBody = operation.getRequestBody();
        if (requestBody == null || requestBody.getContent() == null) {
            return null;
        }

        MediaType mediaType = requestBody.getContent().get("application/json");
        if (mediaType == null) {
            mediaType = requestBody.getContent().values().stream().findFirst().orElse(null);
        }

        if (mediaType != null && mediaType.getSchema() != null) {
            return schemaToJson(mediaType.getSchema(), openAPI, new HashSet<>());
        }

        return null;
    }

    private String generateRequestBodyTemplate(Operation operation, OpenAPI openAPI) {
        RequestBody requestBody = operation.getRequestBody();
        if (requestBody == null || requestBody.getContent() == null) {
            return "{}";
        }

        MediaType mediaType = requestBody.getContent().get("application/json");
        if (mediaType == null) {
            mediaType = requestBody.getContent().values().stream().findFirst().orElse(null);
        }

        if (mediaType != null && mediaType.getSchema() != null) {
            return generateTemplateFromSchema(mediaType.getSchema(), openAPI, new HashSet<>());
        }

        return "{}";
    }

    private String schemaToJson(Schema<?> schema, OpenAPI openAPI, Set<String> visited) {
        if (schema == null) {
            return "{}";
        }

        // Handle $ref
        if (schema.get$ref() != null) {
            String refName = extractRefName(schema.get$ref());
            if (visited.contains(refName)) {
                return "\"<circular-ref>\"";
            }
            visited.add(refName);

            Schema<?> refSchema = resolveRef(schema.get$ref(), openAPI);
            if (refSchema != null) {
                return schemaToJson(refSchema, openAPI, visited);
            }
            return "{}";
        }

        String type = schema.getType();

        if ("object".equals(type) || schema.getProperties() != null) {
            StringBuilder sb = new StringBuilder("{\n");
            Map<String, Schema> properties = schema.getProperties();
            if (properties != null) {
                List<String> props = new ArrayList<>();
                for (Map.Entry<String, Schema> prop : properties.entrySet()) {
                    String propValue = schemaToJson(prop.getValue(), openAPI, new HashSet<>(visited));
                    props.add(String.format("  \"%s\": %s", prop.getKey(), propValue));
                }
                sb.append(String.join(",\n", props));
            }
            sb.append("\n}");
            return sb.toString();
        }

        if ("array".equals(type)) {
            Schema<?> items = schema.getItems();
            if (items != null) {
                return "[" + schemaToJson(items, openAPI, visited) + "]";
            }
            return "[]";
        }

        // Primitive types
        if ("string".equals(type)) {
            if (schema.getExample() != null) {
                return "\"" + schema.getExample() + "\"";
            }
            if ("date".equals(schema.getFormat())) {
                return "\"2024-01-15\"";
            }
            if ("date-time".equals(schema.getFormat())) {
                return "\"2024-01-15T10:30:00Z\"";
            }
            if ("email".equals(schema.getFormat())) {
                return "\"user@example.com\"";
            }
            if ("uri".equals(schema.getFormat()) || "url".equals(schema.getFormat())) {
                return "\"https://example.com\"";
            }
            return "\"string\"";
        }

        if ("integer".equals(type) || "number".equals(type)) {
            if (schema.getExample() != null) {
                return schema.getExample().toString();
            }
            return "0";
        }

        if ("boolean".equals(type)) {
            if (schema.getExample() != null) {
                return schema.getExample().toString();
            }
            return "false";
        }

        return "null";
    }

    private String generateTemplateFromSchema(Schema<?> schema, OpenAPI openAPI, Set<String> visited) {
        if (schema == null) {
            return "{}";
        }

        // Handle $ref
        if (schema.get$ref() != null) {
            String refName = extractRefName(schema.get$ref());
            if (visited.contains(refName)) {
                return "\"{{circular_ref}}\"";
            }
            visited.add(refName);

            Schema<?> refSchema = resolveRef(schema.get$ref(), openAPI);
            if (refSchema != null) {
                return generateTemplateFromSchema(refSchema, openAPI, visited);
            }
            return "{}";
        }

        String type = schema.getType();

        if ("object".equals(type) || schema.getProperties() != null) {
            StringBuilder sb = new StringBuilder("{\n");
            Map<String, Schema> properties = schema.getProperties();
            if (properties != null) {
                List<String> props = new ArrayList<>();
                for (Map.Entry<String, Schema> prop : properties.entrySet()) {
                    String propName = prop.getKey();
                    Schema<?> propSchema = prop.getValue();
                    String propValue;

                    // Use mustache template for leaf values
                    if (isLeafType(propSchema, openAPI)) {
                        propValue = "\"{{" + propName + "}}\"";
                        // For numbers/booleans, don't use quotes
                        String propType = getEffectiveType(propSchema, openAPI);
                        if ("integer".equals(propType) || "number".equals(propType)) {
                            propValue = "{{" + propName + "}}";
                        } else if ("boolean".equals(propType)) {
                            propValue = "{{" + propName + "}}";
                        }
                    } else {
                        propValue = generateTemplateFromSchema(propSchema, openAPI, new HashSet<>(visited));
                    }
                    props.add(String.format("  \"%s\": %s", propName, propValue));
                }
                sb.append(String.join(",\n", props));
            }
            sb.append("\n}");
            return sb.toString();
        }

        if ("array".equals(type)) {
            Schema<?> items = schema.getItems();
            if (items != null) {
                return "[" + generateTemplateFromSchema(items, openAPI, visited) + "]";
            }
            return "[]";
        }

        // Primitive types - return placeholder
        return "\"{{value}}\"";
    }

    private boolean isLeafType(Schema<?> schema, OpenAPI openAPI) {
        if (schema.get$ref() != null) {
            Schema<?> refSchema = resolveRef(schema.get$ref(), openAPI);
            if (refSchema != null) {
                return isLeafType(refSchema, openAPI);
            }
        }
        String type = schema.getType();
        return "string".equals(type) || "integer".equals(type) ||
               "number".equals(type) || "boolean".equals(type);
    }

    private String getEffectiveType(Schema<?> schema, OpenAPI openAPI) {
        if (schema.get$ref() != null) {
            Schema<?> refSchema = resolveRef(schema.get$ref(), openAPI);
            if (refSchema != null) {
                return refSchema.getType();
            }
        }
        return schema.getType();
    }

    private String extractRefName(String ref) {
        if (ref == null) return "";
        int lastSlash = ref.lastIndexOf('/');
        return lastSlash >= 0 ? ref.substring(lastSlash + 1) : ref;
    }

    private Schema<?> resolveRef(String ref, OpenAPI openAPI) {
        if (ref == null || openAPI.getComponents() == null ||
            openAPI.getComponents().getSchemas() == null) {
            return null;
        }
        String refName = extractRefName(ref);
        return openAPI.getComponents().getSchemas().get(refName);
    }

    private List<OpenApiParameter> extractParameters(Operation operation, String in) {
        List<Parameter> parameters = operation.getParameters();
        if (parameters == null) {
            return List.of();
        }

        return parameters.stream()
                .filter(p -> in.equals(p.getIn()))
                .map(p -> OpenApiParameter.builder()
                        .name(p.getName())
                        .in(p.getIn())
                        .type(p.getSchema() != null ? p.getSchema().getType() : "string")
                        .format(p.getSchema() != null ? p.getSchema().getFormat() : null)
                        .description(p.getDescription())
                        .required(Boolean.TRUE.equals(p.getRequired()))
                        .defaultValue(p.getSchema() != null && p.getSchema().getDefault() != null
                                ? p.getSchema().getDefault().toString() : null)
                        .example(p.getExample() != null ? p.getExample().toString() : null)
                        .build())
                .collect(Collectors.toList());
    }

    private Map<String, String> extractResponseSchemas(Operation operation, OpenAPI openAPI) {
        ApiResponses responses = operation.getResponses();
        if (responses == null) {
            return Map.of();
        }

        Map<String, String> schemas = new HashMap<>();
        for (Map.Entry<String, ApiResponse> entry : responses.entrySet()) {
            String statusCode = entry.getKey();
            ApiResponse response = entry.getValue();

            if (response.getContent() != null) {
                MediaType mediaType = response.getContent().get("application/json");
                if (mediaType == null) {
                    mediaType = response.getContent().values().stream().findFirst().orElse(null);
                }
                if (mediaType != null && mediaType.getSchema() != null) {
                    schemas.put(statusCode, schemaToJson(mediaType.getSchema(), openAPI, new HashSet<>()));
                }
            }
        }

        return schemas;
    }

    private List<String> extractSuccessCodes(Operation operation) {
        ApiResponses responses = operation.getResponses();
        if (responses == null) {
            return List.of("200");
        }

        return responses.keySet().stream()
                .filter(code -> code.startsWith("2"))
                .collect(Collectors.toList());
    }

    private List<String> extractSecurity(Operation operation, OpenAPI openAPI) {
        List<SecurityRequirement> security = operation.getSecurity();
        if (security == null) {
            security = openAPI.getSecurity();
        }
        if (security == null) {
            return List.of();
        }

        return security.stream()
                .flatMap(req -> req.keySet().stream())
                .distinct()
                .collect(Collectors.toList());
    }

    private List<OpenApiSecurityScheme> extractSecuritySchemes(OpenAPI openAPI) {
        if (openAPI.getComponents() == null ||
            openAPI.getComponents().getSecuritySchemes() == null) {
            return List.of();
        }

        List<OpenApiSecurityScheme> schemes = new ArrayList<>();

        for (Map.Entry<String, SecurityScheme> entry :
             openAPI.getComponents().getSecuritySchemes().entrySet()) {
            String name = entry.getKey();
            SecurityScheme scheme = entry.getValue();

            OpenApiSecurityScheme.OpenApiSecuritySchemeBuilder builder = OpenApiSecurityScheme.builder()
                    .name(name)
                    .type(scheme.getType() != null ? scheme.getType().toString().toLowerCase() : null)
                    .scheme(scheme.getScheme())
                    .bearerFormat(scheme.getBearerFormat())
                    .in(scheme.getIn() != null ? scheme.getIn().toString().toLowerCase() : null)
                    .parameterName(scheme.getName());

            // Extract OAuth2 details
            OAuthFlows flows = scheme.getFlows();
            if (flows != null) {
                if (flows.getClientCredentials() != null) {
                    builder.tokenUrl(flows.getClientCredentials().getTokenUrl());
                    if (flows.getClientCredentials().getScopes() != null) {
                        builder.scopes(new ArrayList<>(flows.getClientCredentials().getScopes().keySet()));
                    }
                }
                if (flows.getAuthorizationCode() != null) {
                    builder.authorizationUrl(flows.getAuthorizationCode().getAuthorizationUrl());
                    builder.tokenUrl(flows.getAuthorizationCode().getTokenUrl());
                    if (flows.getAuthorizationCode().getScopes() != null) {
                        builder.scopes(new ArrayList<>(flows.getAuthorizationCode().getScopes().keySet()));
                    }
                }
            }

            // Map to GlobalCMX auth type
            builder.mappedAuthType(mapToGlobalCmxAuthType(scheme));

            schemes.add(builder.build());
        }

        return schemes;
    }

    private String mapToGlobalCmxAuthType(SecurityScheme scheme) {
        if (scheme.getType() == null) {
            return "NONE";
        }

        switch (scheme.getType()) {
            case APIKEY:
                return "API_KEY";
            case HTTP:
                if ("basic".equalsIgnoreCase(scheme.getScheme())) {
                    return "BASIC_AUTH";
                }
                if ("bearer".equalsIgnoreCase(scheme.getScheme())) {
                    return "BEARER_TOKEN";
                }
                return "CUSTOM_HEADER";
            case OAUTH2:
                OAuthFlows flows = scheme.getFlows();
                if (flows != null) {
                    if (flows.getClientCredentials() != null) {
                        return "OAUTH2_CLIENT_CREDENTIALS";
                    }
                    if (flows.getAuthorizationCode() != null) {
                        return "OAUTH2_AUTHORIZATION_CODE";
                    }
                }
                return "OAUTH2_CLIENT_CREDENTIALS";
            case OPENIDCONNECT:
                return "OAUTH2_CLIENT_CREDENTIALS";
            case MUTUALTLS:
                return "MTLS";
            default:
                return "NONE";
        }
    }

    private String generateSuggestedCode(String path, String method, Operation operation) {
        // Use operationId if available
        if (operation.getOperationId() != null && !operation.getOperationId().isEmpty()) {
            return operation.getOperationId()
                    .replaceAll("[^a-zA-Z0-9_-]", "_")
                    .toUpperCase();
        }

        // Generate from path and method
        String pathPart = path
                .replaceAll("\\{[^}]+}", "")
                .replaceAll("[^a-zA-Z0-9]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");

        return (method + "_" + pathPart).toUpperCase();
    }

    private String generateSuggestedName(String path, String method, Operation operation) {
        if (operation.getSummary() != null && !operation.getSummary().isEmpty()) {
            return operation.getSummary();
        }

        if (operation.getOperationId() != null && !operation.getOperationId().isEmpty()) {
            // Convert camelCase to readable format
            return operation.getOperationId()
                    .replaceAll("([a-z])([A-Z])", "$1 $2")
                    .replaceAll("[_-]", " ");
        }

        return method + " " + path;
    }
}
