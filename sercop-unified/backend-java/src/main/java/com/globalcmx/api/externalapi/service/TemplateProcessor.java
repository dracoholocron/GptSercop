package com.globalcmx.api.externalapi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.drools.RuleContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class TemplateProcessor {

    // Support both ${variable} and {{variable}} patterns
    private static final Pattern DOLLAR_PATTERN = Pattern.compile("\\$\\{([^}]+)}");
    private static final Pattern MUSTACHE_PATTERN = Pattern.compile("\\{\\{([^}]+)}}");

    private final ObjectMapper objectMapper;

    public String process(String template, RuleContext context) {
        if (template == null || template.isEmpty()) {
            return template;
        }

        Map<String, Object> variables = buildVariableMap(context);
        return replaceVariables(template, variables);
    }

    public Object processBody(String bodyTemplate, RuleContext context) {
        if (bodyTemplate == null || bodyTemplate.isEmpty()) {
            return createDefaultBody(context);
        }

        String processedTemplate = process(bodyTemplate, context);

        try {
            return objectMapper.readValue(processedTemplate, Object.class);
        } catch (Exception e) {
            log.warn("Body template is not valid JSON, returning as string");
            return processedTemplate;
        }
    }

    public Map<String, String> processQueryParams(String queryParamsTemplate, RuleContext context) {
        if (queryParamsTemplate == null || queryParamsTemplate.isEmpty()) {
            return new HashMap<>();
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, String> params = objectMapper.readValue(queryParamsTemplate, Map.class);
            Map<String, String> processedParams = new HashMap<>();

            for (Map.Entry<String, String> entry : params.entrySet()) {
                String processedValue = process(entry.getValue(), context);
                processedParams.put(entry.getKey(), processedValue);
            }

            return processedParams;
        } catch (Exception e) {
            log.error("Error processing query params template", e);
            return new HashMap<>();
        }
    }

    private Map<String, Object> buildVariableMap(RuleContext context) {
        Map<String, Object> variables = new HashMap<>();

        if (context == null) {
            return variables;
        }

        variables.put("operationId", context.getOperationId());
        variables.put("operationType", context.getOperationType());
        variables.put("operationAmount", context.getOperationAmount());
        variables.put("currency", context.getCurrency());
        variables.put("operationStatus", context.getOperationStatus());
        variables.put("userCode", context.getUserCode());
        variables.put("userRole", context.getUserRole());
        variables.put("department", context.getUserDepartment());
        variables.put("approverCode", context.getApproverCode());
        variables.put("approvalLevel", context.getApprovalLevel());
        variables.put("counterpartyCode", context.getCounterpartyCode());
        variables.put("counterpartyName", context.getCounterpartyName());
        variables.put("counterpartyCountry", context.getCounterpartyCountry());
        variables.put("counterpartyType", context.getCounterpartyType());
        variables.put("eventType", context.getEventType());
        variables.put("eventDateTime", context.getEventDateTime());

        if (context.getOperationData() != null) {
            variables.putAll(context.getOperationData());
        }

        if (context.getAdditionalData() != null) {
            variables.putAll(context.getAdditionalData());
        }

        return variables;
    }

    private String replaceVariables(String template, Map<String, Object> variables) {
        // First replace ${variable} pattern
        String result = replaceWithPattern(template, DOLLAR_PATTERN, variables);
        // Then replace {{variable}} pattern
        result = replaceWithPattern(result, MUSTACHE_PATTERN, variables);
        return result;
    }

    private String replaceWithPattern(String template, Pattern pattern, Map<String, Object> variables) {
        Matcher matcher = pattern.matcher(template);
        StringBuffer result = new StringBuffer();

        while (matcher.find()) {
            String variableName = matcher.group(1).trim();
            Object value = variables.get(variableName);
            String replacement = value != null ? escapeJsonString(value.toString()) : "";
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }

        matcher.appendTail(result);
        return result.toString();
    }

    private String escapeJsonString(String value) {
        return value.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }

    private Map<String, Object> createDefaultBody(RuleContext context) {
        Map<String, Object> body = new HashMap<>();
        body.put("operationId", context.getOperationId());
        body.put("operationType", context.getOperationType());
        body.put("amount", context.getOperationAmount());
        body.put("currency", context.getCurrency());
        body.put("status", context.getOperationStatus());
        body.put("eventType", context.getEventType());
        body.put("timestamp", context.getEventDateTime());
        return body;
    }
}
