package com.globalcmx.api.externalapi.handler;

import com.globalcmx.api.externalapi.dto.ExternalApiCallContext;
import com.globalcmx.api.externalapi.dto.ListenerExecutionResult;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.ReflectionUtils;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Handler for UPDATE_ENTITY listener action.
 * Updates any JPA entity based on API response data.
 *
 * Config example:
 * {
 *     "entityClass": "com.globalcmx.api.readmodel.entity.MonedaReadModel",
 *     "findBy": {
 *         "codigo": "#response.currencyCode"
 *     },
 *     "updateFields": {
 *         "tipoCambio": "#response.rate"
 *     }
 * }
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EntityUpdateHandler {

    @PersistenceContext
    private EntityManager entityManager;

    private final ExpressionParser spelParser = new SpelExpressionParser();

    @Transactional
    public ListenerExecutionResult execute(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {

        String entityClassName = (String) config.get("entityClass");
        @SuppressWarnings("unchecked")
        Map<String, String> findBy = (Map<String, String>) config.get("findBy");
        @SuppressWarnings("unchecked")
        Map<String, String> updateFields = (Map<String, String>) config.get("updateFields");

        if (entityClassName == null || findBy == null || updateFields == null) {
            return ListenerExecutionResult.failed(null,
                    "entityClass, findBy, and updateFields are required");
        }

        try {
            // Load the entity class
            Class<?> entityClass = Class.forName(entityClassName);

            // Find the entity
            Object entity = findEntity(entityClass, findBy, context, responseData);

            if (entity == null) {
                return ListenerExecutionResult.failed(null,
                        "Entity not found with criteria: " + findBy);
            }

            // Update fields
            for (Map.Entry<String, String> entry : updateFields.entrySet()) {
                String fieldName = entry.getKey();
                Object value = resolveExpression(entry.getValue(), context, responseData);

                if (value != null) {
                    updateField(entity, fieldName, value);
                }
            }

            // Persist the entity
            entityManager.merge(entity);
            entityManager.flush();

            log.info("Updated entity {} with fields: {}",
                    entityClassName, updateFields.keySet());

            return ListenerExecutionResult.success(null, Map.of(
                    "entityClass", entityClassName,
                    "updatedFields", updateFields.keySet()
            ));
        } catch (ClassNotFoundException e) {
            return ListenerExecutionResult.failed(null,
                    "Entity class not found: " + entityClassName);
        } catch (Exception e) {
            log.error("Error updating entity: {}", e.getMessage());
            return ListenerExecutionResult.failed(null,
                    "Error updating entity: " + e.getMessage());
        }
    }

    private Object findEntity(Class<?> entityClass,
                               Map<String, String> findBy,
                               ExternalApiCallContext context,
                               Map<String, Object> responseData) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<?> query = cb.createQuery(entityClass);
        Root<?> root = query.from(entityClass);

        List<Predicate> predicates = new ArrayList<>();

        for (Map.Entry<String, String> entry : findBy.entrySet()) {
            String fieldName = entry.getKey();
            Object value = resolveExpression(entry.getValue(), context, responseData);

            if (value != null) {
                predicates.add(cb.equal(root.get(fieldName), value));
            }
        }

        query.where(predicates.toArray(new Predicate[0]));

        List<?> results = entityManager.createQuery(query).setMaxResults(1).getResultList();

        return results.isEmpty() ? null : results.get(0);
    }

    private void updateField(Object entity, String fieldName, Object value) {
        Field field = ReflectionUtils.findField(entity.getClass(), fieldName);
        if (field == null) {
            log.warn("Field {} not found in {}", fieldName, entity.getClass().getSimpleName());
            return;
        }

        field.setAccessible(true);
        Object convertedValue = convertValue(value, field.getType());
        ReflectionUtils.setField(field, entity, convertedValue);
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
