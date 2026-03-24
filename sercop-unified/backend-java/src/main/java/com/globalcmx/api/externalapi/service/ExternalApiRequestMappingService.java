package com.globalcmx.api.externalapi.service;

import com.globalcmx.api.externalapi.dto.ApiRequestParameters;
import com.globalcmx.api.externalapi.dto.ExternalApiCallContext;
import com.globalcmx.api.externalapi.entity.ExternalApiRequestMapping;
import com.globalcmx.api.externalapi.entity.ExternalApiRequestMapping.ParameterLocation;
import com.globalcmx.api.externalapi.entity.ExternalApiRequestMapping.TransformationType;
import com.globalcmx.api.externalapi.exception.ApiMappingException;
import com.globalcmx.api.externalapi.repository.ExternalApiRequestMappingRepository;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.service.TemplateVariableResolverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Service;

import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Service for resolving external API request mappings.
 * Transforms system variables into API request parameters.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalApiRequestMappingService {

    private final ExternalApiRequestMappingRepository mappingRepository;
    private final TemplateVariableResolverService variableResolverService;

    private final ExpressionParser spelParser = new SpelExpressionParser();

    /**
     * Resolves all configured request mappings for an API and builds the request parameters.
     *
     * @param apiConfigId The API configuration ID
     * @param context The API call context containing operation and user info
     * @return ApiRequestParameters with all resolved parameters
     */
    public ApiRequestParameters resolveRequestParameters(Long apiConfigId, ExternalApiCallContext context) {
        List<ExternalApiRequestMapping> mappings = mappingRepository
                .findByApiConfigIdAndIsActiveTrueOrderByDisplayOrderAsc(apiConfigId);

        ApiRequestParameters params = new ApiRequestParameters();

        for (ExternalApiRequestMapping mapping : mappings) {
            try {
                processMapping(mapping, context, params);
            } catch (Exception e) {
                log.error("Error processing mapping for variable {}: {}",
                        mapping.getVariableCode(), e.getMessage());
                if (Boolean.TRUE.equals(mapping.getIsRequired())) {
                    throw e;
                }
            }
        }

        return params;
    }

    /**
     * Processes a single mapping and adds it to the parameters.
     */
    private void processMapping(ExternalApiRequestMapping mapping,
                                 ExternalApiCallContext context,
                                 ApiRequestParameters params) {
        // Resolve the value based on source type
        Object value = resolveValueBySourceType(mapping, context);

        // Apply transformation if configured
        value = applyTransformation(value, mapping);

        // Use default value if null and default is configured
        if (value == null && mapping.getDefaultValue() != null) {
            value = mapping.getDefaultValue();
        }

        // Check if required
        if (value == null && Boolean.TRUE.equals(mapping.getIsRequired())) {
            throw ApiMappingException.requiredVariableNull(
                    mapping.getVariableCode(), mapping.getEffectiveParameterName());
        }

        // Skip if null and not required
        if (value == null) {
            log.debug("Skipping null optional variable: {}", mapping.getVariableCode());
            return;
        }

        // Add to appropriate parameter collection
        String paramName = mapping.getEffectiveParameterName();
        addParameter(params, mapping.getParameterLocation(), paramName, value, mapping.getJsonPath());

        log.debug("Resolved mapping: {} -> {} = {}",
                mapping.getVariableCode(), paramName, value);
    }

    /**
     * Resolves the value based on the source type.
     */
    private Object resolveValueBySourceType(ExternalApiRequestMapping mapping, ExternalApiCallContext context) {
        ExternalApiRequestMapping.SourceType sourceType = mapping.getSourceType();
        if (sourceType == null) {
            sourceType = ExternalApiRequestMapping.SourceType.TEMPLATE_VARIABLE;
        }

        return switch (sourceType) {
            case CONSTANT -> mapping.getConstantValue();
            case CALCULATED -> evaluateCalculatedExpression(mapping.getCalculatedExpression(), context);
            case TEMPLATE_VARIABLE -> resolveVariable(mapping.getVariableCode(), context);
        };
    }

    /**
     * Evaluates a calculated expression using SpEL.
     */
    private Object evaluateCalculatedExpression(String expression, ExternalApiCallContext context) {
        if (expression == null || expression.isBlank()) {
            return null;
        }

        try {
            StandardEvaluationContext evalContext = new StandardEvaluationContext();
            evalContext.setVariable("context", context);
            evalContext.setVariable("operation", context.getOperation());
            evalContext.setVariable("now", LocalDateTime.now());
            evalContext.setVariable("today", LocalDate.now());
            if (context.getAdditionalContext() != null) {
                evalContext.setVariable("params", context.getAdditionalContext());
            }

            return spelParser.parseExpression(expression).getValue(evalContext);
        } catch (Exception e) {
            log.error("Error evaluating expression '{}': {}", expression, e.getMessage());
            throw new ApiMappingException("Failed to evaluate expression: " + expression, e);
        }
    }

    /**
     * Resolves a variable value from the context.
     */
    private Object resolveVariable(String variableCode, ExternalApiCallContext context) {
        // First check additional context
        if (context.getAdditionalContext() != null &&
            context.getAdditionalContext().containsKey(variableCode)) {
            return context.getAdditionalContext().get(variableCode);
        }

        // Use the template variable resolver
        if (context.getOperation() != null) {
            Map<String, String> variables = variableResolverService.getAllVariables(
                    context.getOperation(), context.getExecutingUser());

            if (variables.containsKey(variableCode)) {
                String value = variables.get(variableCode);
                return (value != null && !value.isEmpty()) ? value : null;
            }
        }

        // Try to resolve from operation directly for common fields
        return resolveFromOperation(variableCode, context.getOperation());
    }

    /**
     * Resolves a variable directly from operation fields.
     */
    private Object resolveFromOperation(String variableCode, OperationReadModel operation) {
        if (operation == null) {
            return null;
        }

        return switch (variableCode) {
            case "operationId" -> operation.getOperationId();
            case "reference" -> operation.getReference();
            case "productType" -> operation.getProductType();
            case "currency" -> operation.getCurrency();
            case "amount" -> operation.getAmount();
            case "issueDate" -> operation.getIssueDate();
            case "expiryDate" -> operation.getExpiryDate();
            case "applicantId" -> operation.getApplicantId();
            case "applicantName" -> operation.getApplicantName();
            case "beneficiaryId" -> operation.getBeneficiaryId();
            case "beneficiaryName" -> operation.getBeneficiaryName();
            case "issuingBankBic" -> operation.getIssuingBankBic();
            case "advisingBankBic" -> operation.getAdvisingBankBic();
            case "status" -> operation.getStatus();
            case "stage" -> operation.getStage();
            default -> null;
        };
    }

    /**
     * Applies transformation to a value.
     */
    private Object applyTransformation(Object value, ExternalApiRequestMapping mapping) {
        if (value == null || mapping.getTransformationType() == TransformationType.NONE) {
            return value;
        }

        try {
            return switch (mapping.getTransformationType()) {
                case UPPERCASE -> String.valueOf(value).toUpperCase();
                case LOWERCASE -> String.valueOf(value).toLowerCase();
                case DATE_FORMAT -> formatDate(value, mapping.getTransformationPattern());
                case NUMBER_FORMAT -> formatNumber(value, mapping.getTransformationPattern());
                case CUSTOM -> applyCustomTransformation(value, mapping.getTransformationPattern());
                default -> value;
            };
        } catch (Exception e) {
            throw ApiMappingException.transformationFailed(
                    mapping.getVariableCode(), mapping.getTransformationType().name(), e);
        }
    }

    /**
     * Formats a date value using the specified pattern.
     */
    private Object formatDate(Object value, String pattern) {
        if (value == null) return null;

        String formatPattern = pattern != null ? pattern : "yyyy-MM-dd";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(formatPattern);

        if (value instanceof LocalDateTime) {
            return ((LocalDateTime) value).format(formatter);
        } else if (value instanceof LocalDate) {
            return ((LocalDate) value).format(formatter);
        } else {
            // Try to parse as string and reformat
            try {
                LocalDate date = LocalDate.parse(String.valueOf(value));
                return date.format(formatter);
            } catch (Exception e) {
                return String.valueOf(value);
            }
        }
    }

    /**
     * Formats a number value using the specified pattern.
     */
    private Object formatNumber(Object value, String pattern) {
        if (value == null) return null;

        String formatPattern = pattern != null ? pattern : "#,##0.00";
        DecimalFormat formatter = new DecimalFormat(formatPattern);

        if (value instanceof Number) {
            return formatter.format(value);
        } else {
            try {
                double d = Double.parseDouble(String.valueOf(value));
                return formatter.format(d);
            } catch (Exception e) {
                return String.valueOf(value);
            }
        }
    }

    /**
     * Applies a custom SpEL transformation.
     */
    private Object applyCustomTransformation(Object value, String expression) {
        if (expression == null || expression.isBlank()) {
            return value;
        }

        StandardEvaluationContext evalContext = new StandardEvaluationContext();
        evalContext.setVariable("value", value);

        return spelParser.parseExpression(expression).getValue(evalContext);
    }

    /**
     * Adds a parameter to the appropriate collection.
     */
    private void addParameter(ApiRequestParameters params,
                               ParameterLocation location,
                               String name,
                               Object value,
                               String jsonPath) {
        switch (location) {
            case PATH -> params.addPathParameter(name, String.valueOf(value));
            case QUERY -> params.addQueryParameter(name, String.valueOf(value));
            case HEADER -> params.addHeader(name, String.valueOf(value));
            case BODY -> params.addBodyField(name, value);
            case BODY_JSON_PATH -> {
                if (jsonPath != null && !jsonPath.isBlank()) {
                    params.addJsonPathValue(jsonPath, value);
                } else {
                    params.addBodyField(name, value);
                }
            }
        }
    }

    /**
     * Gets all mappings for an API config (for admin UI).
     */
    public List<ExternalApiRequestMapping> getMappings(Long apiConfigId) {
        return mappingRepository.findByApiConfigIdOrderByDisplayOrderAsc(apiConfigId);
    }

    /**
     * Saves a mapping.
     */
    public ExternalApiRequestMapping saveMapping(ExternalApiRequestMapping mapping) {
        return mappingRepository.save(mapping);
    }

    /**
     * Deletes a mapping.
     */
    public void deleteMapping(Long mappingId) {
        mappingRepository.deleteById(mappingId);
    }

    /**
     * Deletes all mappings for an API config.
     */
    public void deleteMappings(Long apiConfigId) {
        mappingRepository.deleteByApiConfigId(apiConfigId);
    }
}
