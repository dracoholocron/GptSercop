package com.globalcmx.api.externalapi.handler;

import com.globalcmx.api.externalapi.dto.ExternalApiCallContext;
import com.globalcmx.api.externalapi.dto.ListenerExecutionResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Handler for UPDATE_CATALOG listener action.
 * Updates or inserts records in catalog tables based on API response data.
 *
 * Config example for UPDATE:
 * {
 *     "catalogTable": "moneda_read_model",
 *     "catalogKeyField": "codigo",
 *     "catalogKeyValue": "#response.currencyCode",
 *     "updateFields": {
 *         "tipo_cambio": "#response.exchangeRate",
 *         "fecha_actualizacion": "#now"
 *     }
 * }
 *
 * Config example for UPSERT:
 * {
 *     "catalogTable": "exchange_rate_read_model",
 *     "operation": "UPSERT",
 *     "matchCondition": {
 *         "currency_code": "#response.currencyCode",
 *         "date": "#response.rateDate"
 *     },
 *     "updateFields": {
 *         "buy_rate": "#response.rate",
 *         "updated_at": "#now"
 *     },
 *     "insertFields": {
 *         "currency_code": "#response.currencyCode",
 *         "date": "#response.rateDate",
 *         "buy_rate": "#response.rate",
 *         "sell_rate": "#response.rate",
 *         "created_at": "#now"
 *     }
 * }
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CatalogUpdateHandler {

    private final JdbcTemplate jdbcTemplate;
    private final ExpressionParser spelParser = new SpelExpressionParser();

    public ListenerExecutionResult execute(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {

        log.info("CatalogUpdateHandler.execute called with config: {}, responseData: {}", config, responseData);

        String tableName = (String) config.get("catalogTable");
        String operation = (String) config.getOrDefault("operation", "UPDATE");

        if (tableName == null) {
            return ListenerExecutionResult.failed(null, "catalogTable is required");
        }

        try {
            return switch (operation.toUpperCase()) {
                case "UPSERT" -> executeUpsert(tableName, config, context, responseData);
                case "INSERT" -> executeInsert(tableName, config, context, responseData);
                default -> executeUpdate(tableName, config, context, responseData);
            };
        } catch (Exception e) {
            log.error("Error executing {} on catalog {}: {}", operation, tableName, e.getMessage());
            return ListenerExecutionResult.failed(null, "Error executing " + operation + ": " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private ListenerExecutionResult executeUpdate(String tableName, Map<String, Object> config,
                                                   ExternalApiCallContext context, Map<String, Object> responseData) {
        String keyField = (String) config.get("catalogKeyField");
        String keyValueExpr = (String) config.get("catalogKeyValue");
        Map<String, Object> updateFields = (Map<String, Object>) config.get("updateFields");

        if (keyField == null || updateFields == null || updateFields.isEmpty()) {
            return ListenerExecutionResult.failed(null,
                    "catalogKeyField and updateFields are required for UPDATE");
        }

        Object keyValue = resolveExpression(keyValueExpr, context, responseData);
        if (keyValue == null) {
            return ListenerExecutionResult.failed(null, "Key value resolved to null");
        }

        StringBuilder sql = new StringBuilder("UPDATE ").append(sanitizeTableName(tableName)).append(" SET ");
        List<Object> params = new ArrayList<>();

        boolean first = true;
        for (Map.Entry<String, Object> entry : updateFields.entrySet()) {
            if (!first) sql.append(", ");
            sql.append(sanitizeColumnName(entry.getKey())).append(" = ?");
            params.add(resolveExpression(entry.getValue(), context, responseData));
            first = false;
        }

        sql.append(" WHERE ").append(sanitizeColumnName(keyField)).append(" = ?");
        params.add(keyValue);

        log.debug("Executing catalog UPDATE: {} with params: {}", sql, params);
        int updated = jdbcTemplate.update(sql.toString(), params.toArray());

        log.info("Updated {} rows in {} where {} = {}", updated, tableName, keyField, keyValue);
        return ListenerExecutionResult.success(null, Map.of(
                "operation", "UPDATE",
                "rowsAffected", updated,
                "table", tableName
        ));
    }

    @SuppressWarnings("unchecked")
    private ListenerExecutionResult executeUpsert(String tableName, Map<String, Object> config,
                                                   ExternalApiCallContext context, Map<String, Object> responseData) {
        Map<String, Object> matchCondition = (Map<String, Object>) config.get("matchCondition");
        Map<String, Object> updateFields = (Map<String, Object>) config.get("updateFields");
        Map<String, Object> insertFields = (Map<String, Object>) config.get("insertFields");

        if (matchCondition == null || matchCondition.isEmpty()) {
            return ListenerExecutionResult.failed(null, "matchCondition is required for UPSERT");
        }
        if (insertFields == null || insertFields.isEmpty()) {
            return ListenerExecutionResult.failed(null, "insertFields is required for UPSERT");
        }

        // First check if record exists
        StringBuilder selectSql = new StringBuilder("SELECT COUNT(*) FROM ").append(sanitizeTableName(tableName)).append(" WHERE ");
        List<Object> matchParams = new ArrayList<>();

        boolean first = true;
        for (Map.Entry<String, Object> entry : matchCondition.entrySet()) {
            if (!first) selectSql.append(" AND ");
            selectSql.append(sanitizeColumnName(entry.getKey())).append(" = ?");
            matchParams.add(resolveExpression(entry.getValue(), context, responseData));
            first = false;
        }

        Integer count = jdbcTemplate.queryForObject(selectSql.toString(), Integer.class, matchParams.toArray());

        if (count != null && count > 0) {
            // Record exists - UPDATE
            if (updateFields == null || updateFields.isEmpty()) {
                log.info("Record exists in {}, no updateFields specified, skipping", tableName);
                return ListenerExecutionResult.success(null, Map.of(
                        "operation", "UPSERT_SKIP",
                        "rowsAffected", 0,
                        "table", tableName,
                        "message", "Record exists, no update needed"
                ));
            }

            StringBuilder updateSql = new StringBuilder("UPDATE ").append(sanitizeTableName(tableName)).append(" SET ");
            List<Object> updateParams = new ArrayList<>();

            first = true;
            for (Map.Entry<String, Object> entry : updateFields.entrySet()) {
                if (!first) updateSql.append(", ");
                updateSql.append(sanitizeColumnName(entry.getKey())).append(" = ?");
                updateParams.add(resolveExpression(entry.getValue(), context, responseData));
                first = false;
            }

            updateSql.append(" WHERE ");
            first = true;
            for (Map.Entry<String, Object> entry : matchCondition.entrySet()) {
                if (!first) updateSql.append(" AND ");
                updateSql.append(sanitizeColumnName(entry.getKey())).append(" = ?");
                updateParams.add(resolveExpression(entry.getValue(), context, responseData));
                first = false;
            }

            log.debug("Executing UPSERT UPDATE: {}", updateSql);
            int updated = jdbcTemplate.update(updateSql.toString(), updateParams.toArray());

            log.info("UPSERT updated {} rows in {}", updated, tableName);
            return ListenerExecutionResult.success(null, Map.of(
                    "operation", "UPSERT_UPDATE",
                    "rowsAffected", updated,
                    "table", tableName
            ));
        } else {
            // Record doesn't exist - INSERT
            StringBuilder insertSql = new StringBuilder("INSERT INTO ").append(sanitizeTableName(tableName)).append(" (");
            StringBuilder valuesSql = new StringBuilder(") VALUES (");
            List<Object> insertParams = new ArrayList<>();

            first = true;
            for (Map.Entry<String, Object> entry : insertFields.entrySet()) {
                if (!first) {
                    insertSql.append(", ");
                    valuesSql.append(", ");
                }
                insertSql.append(sanitizeColumnName(entry.getKey()));
                valuesSql.append("?");
                insertParams.add(resolveExpression(entry.getValue(), context, responseData));
                first = false;
            }
            insertSql.append(valuesSql).append(")");

            log.debug("Executing UPSERT INSERT: {}", insertSql);
            int inserted = jdbcTemplate.update(insertSql.toString(), insertParams.toArray());

            log.info("UPSERT inserted {} rows in {}", inserted, tableName);
            return ListenerExecutionResult.success(null, Map.of(
                    "operation", "UPSERT_INSERT",
                    "rowsAffected", inserted,
                    "table", tableName
            ));
        }
    }

    @SuppressWarnings("unchecked")
    private ListenerExecutionResult executeInsert(String tableName, Map<String, Object> config,
                                                   ExternalApiCallContext context, Map<String, Object> responseData) {
        Map<String, Object> insertFields = (Map<String, Object>) config.get("insertFields");

        if (insertFields == null || insertFields.isEmpty()) {
            return ListenerExecutionResult.failed(null, "insertFields is required for INSERT");
        }

        StringBuilder sql = new StringBuilder("INSERT INTO ").append(sanitizeTableName(tableName)).append(" (");
        StringBuilder values = new StringBuilder(") VALUES (");
        List<Object> params = new ArrayList<>();

        boolean first = true;
        for (Map.Entry<String, Object> entry : insertFields.entrySet()) {
            if (!first) {
                sql.append(", ");
                values.append(", ");
            }
            sql.append(sanitizeColumnName(entry.getKey()));
            values.append("?");
            params.add(resolveExpression(entry.getValue(), context, responseData));
            first = false;
        }
        sql.append(values).append(")");

        log.debug("Executing catalog INSERT: {}", sql);
        int inserted = jdbcTemplate.update(sql.toString(), params.toArray());

        log.info("Inserted {} rows in {}", inserted, tableName);
        return ListenerExecutionResult.success(null, Map.of(
                "operation", "INSERT",
                "rowsAffected", inserted,
                "table", tableName
        ));
    }

    private Object resolveExpression(Object expressionObj, ExternalApiCallContext context,
                                      Map<String, Object> responseData) {
        if (expressionObj == null) return null;

        // If not a string, return as-is (could be a number, boolean, etc.)
        if (!(expressionObj instanceof String)) {
            return expressionObj;
        }

        String expression = (String) expressionObj;

        // Special keywords
        if ("#now".equals(expression)) {
            return LocalDateTime.now();
        }

        if ("#today".equals(expression)) {
            return java.time.LocalDate.now();
        }

        if (expression.startsWith("#")) {
            try {
                log.debug("Resolving SpEL expression: {} with responseData: {}", expression, responseData);
                StandardEvaluationContext evalContext = new StandardEvaluationContext();
                evalContext.setVariable("response", responseData);
                evalContext.setVariable("context", context);
                if (context != null) {
                    evalContext.setVariable("operation", context.getOperation());
                }

                // Convert #response.field syntax to bracket notation for Map access
                // SpEL requires #response['field'] for Map keys, but we support #response.field as shorthand
                String adjustedExpression = expression;
                if (expression.startsWith("#response.") && responseData != null) {
                    String key = expression.substring("#response.".length());
                    // If key contains more dots, it's a nested path - keep original for now
                    if (!key.contains(".") && responseData.containsKey(key)) {
                        adjustedExpression = "#response['" + key + "']";
                        log.debug("Converted expression to bracket notation: {}", adjustedExpression);
                    }
                }

                Object result = spelParser.parseExpression(adjustedExpression).getValue(evalContext);
                log.debug("SpEL expression '{}' resolved to: {}", expression, result);
                return result;
            } catch (Exception e) {
                log.error("Error resolving SpEL expression '{}' with responseData {}: {}",
                        expression, responseData, e.getMessage(), e);
                return expression;
            }
        }

        return expression;
    }

    /**
     * Sanitizes table name to prevent SQL injection.
     */
    private String sanitizeTableName(String tableName) {
        // Only allow alphanumeric and underscore
        if (!tableName.matches("^[a-zA-Z_][a-zA-Z0-9_]*$")) {
            throw new IllegalArgumentException("Invalid table name: " + tableName);
        }
        return tableName;
    }

    /**
     * Sanitizes column name to prevent SQL injection.
     */
    private String sanitizeColumnName(String columnName) {
        // Only allow alphanumeric and underscore
        if (!columnName.matches("^[a-zA-Z_][a-zA-Z0-9_]*$")) {
            throw new IllegalArgumentException("Invalid column name: " + columnName);
        }
        return columnName;
    }
}
