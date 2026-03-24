package com.globalcmx.api.externalapi.handler;

import com.globalcmx.api.dto.command.CreateExchangeRateCommand;
import com.globalcmx.api.dto.command.UpdateExchangeRateCommand;
import com.globalcmx.api.entity.Cotizacion;
import com.globalcmx.api.eventsourcing.repository.EventStoreRepository;
import com.globalcmx.api.externalapi.dto.ExternalApiCallContext;
import com.globalcmx.api.externalapi.dto.ListenerExecutionResult;
import com.globalcmx.api.readmodel.entity.CotizacionReadModel;
import com.globalcmx.api.readmodel.repository.CotizacionReadModelRepository;
import com.globalcmx.api.service.command.CotizacionCommandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Handler for UPSERT_EXCHANGE_RATE listener action.
 * Creates or updates exchange rates using CQRS commands to ensure proper event sourcing
 * and history tracking.
 *
 * Config example:
 * {
 *     "currencyCode": "EUR",              // or "#response.baseCurrency" for SpEL
 *     "rateDate": "#response.rateDate",   // SpEL expression for the date
 *     "buyRate": "#response.eurRate",     // SpEL expression for buy rate
 *     "sellRate": "#response.eurRate",    // SpEL expression for sell rate (can be same as buy)
 *     "updatedBy": "EXCHANGE_RATE_JOB"    // Who is performing the update
 * }
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateUpsertHandler {

    private final CotizacionCommandService commandService;
    private final CotizacionReadModelRepository readModelRepository;
    private final EventStoreRepository eventStoreRepository;
    private final ExpressionParser spelParser = new SpelExpressionParser();

    public ListenerExecutionResult execute(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {

        log.info("ExchangeRateUpsertHandler.execute called with config: {}, responseData: {}", config, responseData);

        try {
            // Extract configuration values
            String currencyCode = resolveStringExpression(config.get("currencyCode"), context, responseData);
            LocalDate rateDate = resolveLocalDateExpression(config.get("rateDate"), context, responseData);
            BigDecimal buyRate = resolveBigDecimalExpression(config.get("buyRate"), context, responseData);
            BigDecimal sellRate = resolveBigDecimalExpression(config.get("sellRate"), context, responseData);
            String updatedBy = resolveStringExpression(config.getOrDefault("updatedBy", "SYSTEM_JOB"), context, responseData);

            // Validate required fields
            if (currencyCode == null || currencyCode.isBlank()) {
                return ListenerExecutionResult.failed(null, "currencyCode is required");
            }
            if (rateDate == null) {
                return ListenerExecutionResult.failed(null, "rateDate is required");
            }
            if (buyRate == null) {
                return ListenerExecutionResult.failed(null, "buyRate is required");
            }
            if (sellRate == null) {
                sellRate = buyRate; // Default sell rate to buy rate if not provided
            }

            log.info("Processing exchange rate: currency={}, date={}, buyRate={}, sellRate={}",
                    currencyCode, rateDate, buyRate, sellRate);

            // Check if exchange rate already exists for this currency and date
            Optional<CotizacionReadModel> existingRate = readModelRepository.findByCodigoMonedaAndFecha(currencyCode, rateDate);

            Cotizacion result;
            String operation;

            if (existingRate.isPresent()) {
                // Check if the existing rate has events in EventStore
                Long existingId = existingRate.get().getId();
                String aggregateId = "COTIZACION-" + existingId;
                Long maxVersion = eventStoreRepository.findMaxVersionByAggregateId(aggregateId);
                boolean hasEvents = maxVersion != null;

                log.info("Checking existing exchange rate: ID={}, hasEvents={}", existingId, hasEvents);

                if (hasEvents) {
                    // Update existing exchange rate using CQRS command
                    log.info("Updating existing exchange rate with ID: {}", existingId);

                    UpdateExchangeRateCommand updateCommand = UpdateExchangeRateCommand.builder()
                            .codigoMoneda(currencyCode)
                            .fecha(rateDate)
                            .valorCompra(buyRate)
                            .valorVenta(sellRate)
                            .updatedBy(updatedBy)
                            .build();

                    result = commandService.updateCotizacion(existingId, updateCommand);
                    operation = "UPDATE";

                    log.info("Exchange rate updated successfully: ID={}, currency={}, date={}",
                            existingId, currencyCode, rateDate);
                } else {
                    // Record exists in read model but no events in EventStore
                    // This happens when the record was created via direct SQL
                    // Create a new one via CQRS (will update read model via projection)
                    log.warn("No events found for existing rate ID={}. Creating new via CQRS.", existingId);

                    CreateExchangeRateCommand createCommand = CreateExchangeRateCommand.builder()
                            .codigoMoneda(currencyCode)
                            .fecha(rateDate)
                            .valorCompra(buyRate)
                            .valorVenta(sellRate)
                            .createdBy(updatedBy)
                            .build();

                    result = commandService.createCotizacion(createCommand);
                    operation = "CREATE_FROM_EXISTING";

                    log.info("Exchange rate created via CQRS (replacing non-eventsourced record): ID={}, currency={}, date={}",
                            result.getId(), currencyCode, rateDate);
                }
            } else {
                // Create new exchange rate using CQRS command
                log.info("Creating new exchange rate for currency={}, date={}", currencyCode, rateDate);

                CreateExchangeRateCommand createCommand = CreateExchangeRateCommand.builder()
                        .codigoMoneda(currencyCode)
                        .fecha(rateDate)
                        .valorCompra(buyRate)
                        .valorVenta(sellRate)
                        .createdBy(updatedBy)
                        .build();

                result = commandService.createCotizacion(createCommand);
                operation = "CREATE";

                log.info("Exchange rate created successfully: ID={}, currency={}, date={}",
                        result.getId(), currencyCode, rateDate);
            }

            return ListenerExecutionResult.success(null, Map.of(
                    "operation", operation,
                    "cotizacionId", result.getId(),
                    "currencyCode", currencyCode,
                    "rateDate", rateDate.toString(),
                    "buyRate", buyRate,
                    "sellRate", sellRate,
                    "message", operation.equals("UPDATE")
                            ? "Exchange rate updated via CQRS"
                            : "Exchange rate created via CQRS"
            ));

        } catch (Exception e) {
            log.error("Error executing UPSERT_EXCHANGE_RATE: {}", e.getMessage(), e);
            return ListenerExecutionResult.failed(null, "Error processing exchange rate: " + e.getMessage());
        }
    }

    /**
     * Executes UPSERT_ALL_EXCHANGE_RATES - processes multiple rates from a rates map.
     * Config: { "ratesField": "#response.rates", "rateDate": "#response.rateDate", "updatedBy": "..." }
     */
    @SuppressWarnings("unchecked")
    public ListenerExecutionResult executeAll(
            Map<String, Object> config,
            ExternalApiCallContext context,
            Map<String, Object> responseData) {

        log.info("ExchangeRateUpsertHandler.executeAll called with config: {}, responseData keys: {}",
                config, responseData.keySet());

        try {
            // Extract rates map from response
            Object ratesObj = responseData.get("rates");
            if (ratesObj == null) {
                return ListenerExecutionResult.failed(null, "No 'rates' field found in response data");
            }

            if (!(ratesObj instanceof Map)) {
                return ListenerExecutionResult.failed(null, "Expected 'rates' to be a Map, got: " + ratesObj.getClass().getSimpleName());
            }

            Map<String, Object> rates = (Map<String, Object>) ratesObj;
            LocalDate rateDate = resolveLocalDateExpression(config.get("rateDate"), context, responseData);
            String updatedBy = resolveStringExpression(config.getOrDefault("updatedBy", "EXCHANGE_RATE_JOB"), context, responseData);

            if (rateDate == null) {
                // Try to get from response directly
                rateDate = resolveLocalDateExpression(responseData.get("rateDate"), context, responseData);
            }
            if (rateDate == null) {
                rateDate = LocalDate.now();
                log.warn("No rateDate found, using today: {}", rateDate);
            }

            log.info("Processing {} exchange rates for date: {}", rates.size(), rateDate);

            int created = 0;
            int updated = 0;
            int failed = 0;
            List<String> errors = new ArrayList<>();

            for (Map.Entry<String, Object> entry : rates.entrySet()) {
                String currencyCode = entry.getKey();
                BigDecimal rate;

                try {
                    if (entry.getValue() instanceof Number) {
                        rate = BigDecimal.valueOf(((Number) entry.getValue()).doubleValue());
                    } else {
                        rate = new BigDecimal(entry.getValue().toString());
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse rate for {}: {}", currencyCode, entry.getValue());
                    failed++;
                    errors.add(currencyCode + ": invalid rate value");
                    continue;
                }

                try {
                    // Check if exchange rate already exists
                    Optional<CotizacionReadModel> existingRate = readModelRepository.findByCodigoMonedaAndFecha(currencyCode, rateDate);

                    if (existingRate.isPresent()) {
                        Long existingId = existingRate.get().getId();
                        String aggregateId = "COTIZACION-" + existingId;
                        Long maxVersion = eventStoreRepository.findMaxVersionByAggregateId(aggregateId);
                        boolean hasEvents = maxVersion != null;

                        if (hasEvents) {
                            // Update existing
                            UpdateExchangeRateCommand updateCommand = UpdateExchangeRateCommand.builder()
                                    .codigoMoneda(currencyCode)
                                    .fecha(rateDate)
                                    .valorCompra(rate)
                                    .valorVenta(rate)
                                    .updatedBy(updatedBy)
                                    .build();
                            commandService.updateCotizacion(existingId, updateCommand);
                            updated++;
                            log.debug("Updated exchange rate: {} = {} for {}", currencyCode, rate, rateDate);
                        } else {
                            // Create new (legacy record without events)
                            CreateExchangeRateCommand createCommand = CreateExchangeRateCommand.builder()
                                    .codigoMoneda(currencyCode)
                                    .fecha(rateDate)
                                    .valorCompra(rate)
                                    .valorVenta(rate)
                                    .createdBy(updatedBy)
                                    .build();
                            commandService.createCotizacion(createCommand);
                            created++;
                            log.debug("Created exchange rate (replacing legacy): {} = {} for {}", currencyCode, rate, rateDate);
                        }
                    } else {
                        // Create new
                        CreateExchangeRateCommand createCommand = CreateExchangeRateCommand.builder()
                                .codigoMoneda(currencyCode)
                                .fecha(rateDate)
                                .valorCompra(rate)
                                .valorVenta(rate)
                                .createdBy(updatedBy)
                                .build();
                        commandService.createCotizacion(createCommand);
                        created++;
                        log.debug("Created exchange rate: {} = {} for {}", currencyCode, rate, rateDate);
                    }
                } catch (Exception e) {
                    log.error("Failed to upsert rate for {}: {}", currencyCode, e.getMessage());
                    failed++;
                    errors.add(currencyCode + ": " + e.getMessage());
                }
            }

            log.info("Exchange rates processing complete: created={}, updated={}, failed={}", created, updated, failed);

            Map<String, Object> result = new HashMap<>();
            result.put("rateDate", rateDate.toString());
            result.put("totalProcessed", rates.size());
            result.put("created", created);
            result.put("updated", updated);
            result.put("failed", failed);
            if (!errors.isEmpty()) {
                result.put("errors", errors);
            }

            if (failed > 0 && created == 0 && updated == 0) {
                return ListenerExecutionResult.failed(null, "All exchange rates failed to process: " + errors);
            }

            return ListenerExecutionResult.success(null, result);

        } catch (Exception e) {
            log.error("Error executing UPSERT_ALL_EXCHANGE_RATES: {}", e.getMessage(), e);
            return ListenerExecutionResult.failed(null, "Error processing exchange rates: " + e.getMessage());
        }
    }

    private String resolveStringExpression(Object expressionObj, ExternalApiCallContext context,
                                            Map<String, Object> responseData) {
        if (expressionObj == null) return null;

        if (!(expressionObj instanceof String)) {
            return expressionObj.toString();
        }

        String expression = (String) expressionObj;

        if (expression.startsWith("#")) {
            Object result = resolveSpelExpression(expression, context, responseData);
            return result != null ? result.toString() : null;
        }

        return expression;
    }

    private LocalDate resolveLocalDateExpression(Object expressionObj, ExternalApiCallContext context,
                                                  Map<String, Object> responseData) {
        if (expressionObj == null) return null;

        if (expressionObj instanceof LocalDate) {
            return (LocalDate) expressionObj;
        }

        if (!(expressionObj instanceof String)) {
            return null;
        }

        String expression = (String) expressionObj;

        if ("#today".equals(expression)) {
            return LocalDate.now();
        }

        if (expression.startsWith("#")) {
            Object result = resolveSpelExpression(expression, context, responseData);
            if (result instanceof LocalDate) {
                return (LocalDate) result;
            }
            if (result instanceof String) {
                try {
                    return LocalDate.parse((String) result);
                } catch (Exception e) {
                    log.warn("Failed to parse date from string: {}", result);
                    return null;
                }
            }
            return null;
        }

        // Try to parse as direct date string
        try {
            return LocalDate.parse(expression);
        } catch (Exception e) {
            log.warn("Failed to parse date: {}", expression);
            return null;
        }
    }

    private BigDecimal resolveBigDecimalExpression(Object expressionObj, ExternalApiCallContext context,
                                                    Map<String, Object> responseData) {
        if (expressionObj == null) return null;

        if (expressionObj instanceof BigDecimal) {
            return (BigDecimal) expressionObj;
        }

        if (expressionObj instanceof Number) {
            return BigDecimal.valueOf(((Number) expressionObj).doubleValue());
        }

        if (!(expressionObj instanceof String)) {
            return null;
        }

        String expression = (String) expressionObj;

        if (expression.startsWith("#")) {
            Object result = resolveSpelExpression(expression, context, responseData);
            if (result instanceof BigDecimal) {
                return (BigDecimal) result;
            }
            if (result instanceof Number) {
                return BigDecimal.valueOf(((Number) result).doubleValue());
            }
            if (result instanceof String) {
                try {
                    return new BigDecimal((String) result);
                } catch (Exception e) {
                    log.warn("Failed to parse BigDecimal from string: {}", result);
                    return null;
                }
            }
            return null;
        }

        // Try to parse as direct number
        try {
            return new BigDecimal(expression);
        } catch (Exception e) {
            log.warn("Failed to parse BigDecimal: {}", expression);
            return null;
        }
    }

    private Object resolveSpelExpression(String expression, ExternalApiCallContext context,
                                          Map<String, Object> responseData) {
        try {
            log.debug("Resolving SpEL expression: {} with responseData: {}", expression, responseData);

            StandardEvaluationContext evalContext = new StandardEvaluationContext();
            evalContext.setVariable("response", responseData);
            evalContext.setVariable("context", context);
            if (context != null) {
                evalContext.setVariable("operation", context.getOperation());
            }

            // Convert #response.field syntax to bracket notation for Map access
            String adjustedExpression = expression;
            if (expression.startsWith("#response.") && responseData != null) {
                String key = expression.substring("#response.".length());
                if (!key.contains(".") && responseData.containsKey(key)) {
                    adjustedExpression = "#response['" + key + "']";
                    log.debug("Converted expression to bracket notation: {}", adjustedExpression);
                }
            }

            Object result = spelParser.parseExpression(adjustedExpression).getValue(evalContext);
            log.debug("SpEL expression '{}' resolved to: {}", expression, result);
            return result;
        } catch (Exception e) {
            log.error("Error resolving SpEL expression '{}': {}", expression, e.getMessage());
            return null;
        }
    }
}
