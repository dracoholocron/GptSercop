package com.globalcmx.api.externalapi.handler;

import com.globalcmx.api.externalapi.dto.ExternalApiCallContext;
import com.globalcmx.api.externalapi.dto.ListenerExecutionResult;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;
import org.springframework.util.ReflectionUtils;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Handler for UPDATE_OPERATION listener action.
 * Updates fields in the associated operation based on API response data.
 *
 * Config example:
 * {
 *     "updateFields": {
 *         "exchangeRate": "#response.rate",
 *         "exchangeRateDate": "#response.rateDate"
 *     }
 * }
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OperationUpdateHandler {

    private final OperationReadModelRepository operationRepository;
    private final ExpressionParser spelParser = new SpelExpressionParser();

    public ListenerExecutionResult execute(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {

        if (context.getOperation() == null) {
            return ListenerExecutionResult.failed(null, "No operation associated with this API call");
        }

        @SuppressWarnings("unchecked")
        Map<String, String> updateFields = (Map<String, String>) config.get("updateFields");

        if (updateFields == null || updateFields.isEmpty()) {
            return ListenerExecutionResult.failed(null, "updateFields is required");
        }

        try {
            OperationReadModel operation = context.getOperation();
            Map<String, Object> updatedFields = new HashMap<>();

            for (Map.Entry<String, String> entry : updateFields.entrySet()) {
                String fieldName = entry.getKey();
                Object value = resolveExpression(entry.getValue(), context, responseData);

                if (value != null) {
                    updateField(operation, fieldName, value);
                    updatedFields.put(fieldName, value);
                }
            }

            // Save the operation
            operation.setModifiedAt(LocalDateTime.now());
            operationRepository.save(operation);

            log.info("Updated operation {} with fields: {}", operation.getOperationId(), updatedFields.keySet());

            return ListenerExecutionResult.success(null, Map.of(
                    "operationId", operation.getOperationId(),
                    "updatedFields", updatedFields
            ));
        } catch (Exception e) {
            log.error("Error updating operation: {}", e.getMessage());
            return ListenerExecutionResult.failed(null, "Error updating operation: " + e.getMessage());
        }
    }

    private void updateField(OperationReadModel operation, String fieldName, Object value) {
        Field field = ReflectionUtils.findField(OperationReadModel.class, fieldName);
        if (field == null) {
            log.warn("Field {} not found in OperationReadModel", fieldName);
            return;
        }

        field.setAccessible(true);

        // Convert value if necessary
        Object convertedValue = convertValue(value, field.getType());

        ReflectionUtils.setField(field, operation, convertedValue);
        log.debug("Updated field {} = {}", fieldName, convertedValue);
    }

    private Object convertValue(Object value, Class<?> targetType) {
        if (value == null) return null;

        if (targetType.isAssignableFrom(value.getClass())) {
            return value;
        }

        String strValue = String.valueOf(value);

        if (targetType == String.class) {
            return strValue;
        } else if (targetType == BigDecimal.class) {
            return new BigDecimal(strValue);
        } else if (targetType == Integer.class || targetType == int.class) {
            return Integer.parseInt(strValue);
        } else if (targetType == Long.class || targetType == long.class) {
            return Long.parseLong(strValue);
        } else if (targetType == Double.class || targetType == double.class) {
            return Double.parseDouble(strValue);
        } else if (targetType == Boolean.class || targetType == boolean.class) {
            return Boolean.parseBoolean(strValue);
        } else if (targetType == LocalDate.class) {
            return LocalDate.parse(strValue);
        } else if (targetType == LocalDateTime.class) {
            return LocalDateTime.parse(strValue);
        }

        return value;
    }

    private Object resolveExpression(String expression, ExternalApiCallContext context,
                                      Map<String, Object> responseData) {
        if (expression == null) return null;

        if ("#now".equals(expression)) {
            return LocalDateTime.now();
        }
        if ("#today".equals(expression)) {
            return LocalDate.now();
        }

        if (expression.startsWith("#")) {
            try {
                StandardEvaluationContext evalContext = new StandardEvaluationContext();
                evalContext.setVariable("response", responseData);
                evalContext.setVariable("context", context);
                evalContext.setVariable("operation", context.getOperation());

                return spelParser.parseExpression(expression).getValue(evalContext);
            } catch (Exception e) {
                log.warn("Error resolving expression '{}': {}", expression, e.getMessage());
                return expression;
            }
        }

        return expression;
    }
}
