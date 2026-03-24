package com.globalcmx.api.service;

import com.globalcmx.api.readmodel.entity.EventConditionConfig;
import com.globalcmx.api.readmodel.entity.EventConditionConfig.*;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.repository.EventConditionConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for evaluating configurable event conditions.
 * Evaluates conditions based on SWIFT fields, operation fields, and composite logic.
 * All conditions are database-driven - no hardcoded business rules.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventConditionEvaluator {

    private final EventConditionConfigRepository conditionRepository;

    // SWIFT field pattern: :XX[A-Z]?: followed by content until next field or end
    private static final Pattern SWIFT_FIELD_PATTERN = Pattern.compile(
            ":([0-9]{2}[A-Z]?):(.*?)(?=:[0-9]{2}[A-Z]?:|$)", Pattern.DOTALL);

    // Cache for parsed SWIFT fields
    private final Map<String, Map<String, String>> swiftFieldCache = new WeakHashMap<>();

    /**
     * Evaluate if an event should be shown based on its conditions.
     *
     * @param eventCode The event code to evaluate
     * @param operationType The operation type
     * @param operation The operation with its data
     * @param language Language for condition lookup
     * @return true if the event should be shown (all conditions pass or no conditions)
     */
    public boolean shouldShowEvent(String eventCode, String operationType,
                                   OperationReadModel operation, String language) {
        log.debug("Evaluating conditions for event: {} in operation: {}", eventCode, operation.getOperationId());

        // Get conditions linked to this event from junction table
        List<String> conditionCodes = conditionRepository.findConditionCodesForFlow(
                operationType, eventCode);

        if (conditionCodes.isEmpty()) {
            log.debug("No conditions in junction table for event {}, showing by default", eventCode);
            return true;
        }

        // Evaluate all conditions (AND logic by default for flow conditions)
        for (String conditionCode : conditionCodes) {
            boolean result = evaluateCondition(conditionCode, operation, language);
            if (!result) {
                log.debug("Condition {} failed for event {}", conditionCode, eventCode);
                return false;
            }
        }

        log.debug("All conditions passed for event {}", eventCode);
        return true;
    }

    /**
     * Evaluate if an event should be shown based on flow conditions (from JSON column).
     * This reads the conditions directly from the event_flow_config_readmodel.conditions column.
     *
     * @param flowConditions The conditions Map from EventFlowConfigReadModel
     * @param operation The operation with its data
     * @param language Language for condition lookup
     * @return true if the event should be shown (conditions pass or no conditions)
     */
    public boolean shouldShowEventByFlowConditions(Map<String, Object> flowConditions,
                                                    OperationReadModel operation, String language) {
        if (flowConditions == null || flowConditions.isEmpty()) {
            return true;
        }

        // Extract condition code from the JSON
        Object conditionCodeObj = flowConditions.get("conditionCode");
        if (conditionCodeObj == null) {
            return true;
        }

        String conditionCode = conditionCodeObj.toString();
        String behavior = flowConditions.containsKey("behavior")
                ? flowConditions.get("behavior").toString()
                : "SHOW_IF";

        log.debug("Evaluating flow condition: {} with behavior: {}", conditionCode, behavior);

        boolean conditionResult = evaluateCondition(conditionCode, operation, language);

        // Apply behavior logic
        return switch (behavior.toUpperCase()) {
            case "SHOW_IF" -> conditionResult;
            case "HIDE_IF" -> !conditionResult;
            case "REQUIRE_IF", "OPTIONAL_IF" -> true; // These don't affect visibility
            default -> conditionResult;
        };
    }

    /**
     * Evaluate a single condition by its code.
     */
    public boolean evaluateCondition(String conditionCode, OperationReadModel operation, String language) {
        Optional<EventConditionConfig> conditionOpt = conditionRepository.findByConditionCodeAndLanguage(
                conditionCode, language);

        if (conditionOpt.isEmpty()) {
            // Try without language (fall back to 'en')
            conditionOpt = conditionRepository.findByConditionCodeAndLanguage(conditionCode, "en");
        }

        if (conditionOpt.isEmpty()) {
            log.warn("Condition not found: {}", conditionCode);
            return true; // If condition not found, don't block
        }

        return evaluateConditionConfig(conditionOpt.get(), operation, language);
    }

    /**
     * Evaluate a condition configuration.
     */
    private boolean evaluateConditionConfig(EventConditionConfig condition,
                                            OperationReadModel operation, String language) {
        if (!Boolean.TRUE.equals(condition.getIsActive())) {
            log.debug("Condition {} is inactive, returning true", condition.getConditionCode());
            return true;
        }

        log.debug("Evaluating condition: {} (type: {})",
                condition.getConditionCode(), condition.getConditionType());

        return switch (condition.getConditionType()) {
            case SWIFT_FIELD -> evaluateSwiftFieldCondition(condition, operation);
            case OPERATION_FIELD -> evaluateOperationFieldCondition(condition, operation);
            case MESSAGE_FIELD -> evaluateMessageFieldCondition(condition, operation);
            case COMPOSITE -> evaluateCompositeCondition(condition, operation, language);
            case EXPRESSION -> evaluateExpressionCondition(condition, operation);
        };
    }

    /**
     * Evaluate a SWIFT field condition.
     */
    private boolean evaluateSwiftFieldCondition(EventConditionConfig condition,
                                                OperationReadModel operation) {
        String swiftContent = operation.getSwiftMessage();
        if (swiftContent == null || swiftContent.isEmpty()) {
            log.debug("No SWIFT content in operation {}", operation.getOperationId());
            return handleMissingValue(condition.getComparisonOperator());
        }

        // Check if message type matches (if specified)
        if (condition.getMessageType() != null && !condition.getMessageType().isEmpty()) {
            String operationMessageType = operation.getMessageType();
            if (!condition.getMessageType().equals(operationMessageType)) {
                log.debug("Message type mismatch: expected {}, got {}",
                        condition.getMessageType(), operationMessageType);
                // If message type doesn't match, condition doesn't apply - return true
                return true;
            }
        }

        // Parse SWIFT fields
        Map<String, String> fields = parseSwiftFields(swiftContent);

        // Get field value
        String fieldCode = condition.getFieldCode();
        String fieldValue = fields.get(fieldCode);

        // Handle subfield extraction if specified
        if (condition.getFieldSubfield() != null && fieldValue != null) {
            fieldValue = extractSubfield(fieldValue, condition.getFieldSubfield());
        }

        log.debug("SWIFT field {} value: {}", fieldCode, fieldValue);

        return evaluateComparison(fieldValue, condition.getComparisonOperator(),
                condition.getComparisonValue(), condition.getComparisonValueType());
    }

    /**
     * Evaluate an operation field condition.
     */
    private boolean evaluateOperationFieldCondition(EventConditionConfig condition,
                                                    OperationReadModel operation) {
        String fieldPath = condition.getFieldPath();
        Object fieldValue = getOperationFieldValue(operation, fieldPath);

        String stringValue = fieldValue != null ? fieldValue.toString() : null;

        return evaluateComparison(stringValue, condition.getComparisonOperator(),
                condition.getComparisonValue(), condition.getComparisonValueType());
    }

    /**
     * Evaluate a message field condition (generic).
     */
    private boolean evaluateMessageFieldCondition(EventConditionConfig condition,
                                                  OperationReadModel operation) {
        // For now, treat same as SWIFT field
        return evaluateSwiftFieldCondition(condition, operation);
    }

    /**
     * Evaluate a composite condition (AND, OR, NOT, XOR).
     */
    private boolean evaluateCompositeCondition(EventConditionConfig condition,
                                               OperationReadModel operation, String language) {
        List<String> childCodes = condition.getChildConditionCodes();
        if (childCodes == null || childCodes.isEmpty()) {
            log.warn("Composite condition {} has no children", condition.getConditionCode());
            return true;
        }

        CompositeOperator operator = condition.getCompositeOperator();
        if (operator == null) {
            operator = CompositeOperator.AND;
        }

        List<Boolean> results = new ArrayList<>();
        for (String childCode : childCodes) {
            results.add(evaluateCondition(childCode, operation, language));
        }

        return switch (operator) {
            case AND -> results.stream().allMatch(Boolean::booleanValue);
            case OR -> results.stream().anyMatch(Boolean::booleanValue);
            case NOT -> results.size() == 1 && !results.get(0);
            case XOR -> results.stream().filter(Boolean::booleanValue).count() == 1;
        };
    }

    /**
     * Evaluate an expression condition (SpEL, etc.).
     * For future extension - currently logs a warning and returns true.
     */
    private boolean evaluateExpressionCondition(EventConditionConfig condition,
                                                OperationReadModel operation) {
        ExpressionLanguage language = condition.getExpressionLanguage();
        String expression = condition.getExpressionText();

        if (language == null || expression == null) {
            log.warn("Expression condition {} missing language or expression",
                    condition.getConditionCode());
            return true;
        }

        // TODO: Implement expression evaluation (SpEL, MVEL, etc.)
        log.warn("Expression evaluation not yet implemented for condition: {}",
                condition.getConditionCode());
        return true;
    }

    /**
     * Parse SWIFT fields from message content.
     */
    @Cacheable(value = "swiftFields", key = "#swiftContent.hashCode()", unless = "#result.isEmpty()")
    public Map<String, String> parseSwiftFields(String swiftContent) {
        Map<String, String> fields = new LinkedHashMap<>();

        if (swiftContent == null || swiftContent.isEmpty()) {
            return fields;
        }

        Matcher matcher = SWIFT_FIELD_PATTERN.matcher(swiftContent);
        while (matcher.find()) {
            String fieldCode = matcher.group(1);
            String fieldValue = matcher.group(2).trim();

            // Handle multiple occurrences of same field (append with separator)
            if (fields.containsKey(fieldCode)) {
                fields.put(fieldCode, fields.get(fieldCode) + "|" + fieldValue);
            } else {
                fields.put(fieldCode, fieldValue);
            }
        }

        log.debug("Parsed {} SWIFT fields", fields.size());
        return fields;
    }

    /**
     * Extract a subfield from a field value.
     * Supports line-based extraction (e.g., "line1", "line2") or delimiter-based (e.g., "/1", "/2").
     */
    private String extractSubfield(String fieldValue, String subfield) {
        if (fieldValue == null || subfield == null) {
            return fieldValue;
        }

        // Handle line-based subfields
        if (subfield.startsWith("line")) {
            try {
                int lineNum = Integer.parseInt(subfield.substring(4));
                String[] lines = fieldValue.split("\\r?\\n");
                if (lineNum > 0 && lineNum <= lines.length) {
                    return lines[lineNum - 1];
                }
            } catch (NumberFormatException e) {
                log.warn("Invalid line subfield format: {}", subfield);
            }
        }

        // Handle delimiter-based subfields (e.g., /A, /B for options)
        if (subfield.startsWith("/")) {
            String option = subfield.substring(1);
            // Look for pattern like /A/content or option A format
            Pattern optionPattern = Pattern.compile("/" + option + "/([^/\\n]+)");
            Matcher matcher = optionPattern.matcher(fieldValue);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }

        return fieldValue;
    }

    /**
     * Get an operation field value by path (supports simple property access).
     */
    private Object getOperationFieldValue(OperationReadModel operation, String fieldPath) {
        if (fieldPath == null || operation == null) {
            return null;
        }

        try {
            return switch (fieldPath.toLowerCase()) {
                case "operationid" -> operation.getOperationId();
                case "producttype" -> operation.getProductType();
                case "messagetype" -> operation.getMessageType();
                case "reference" -> operation.getReference();
                case "stage" -> operation.getStage();
                case "status" -> operation.getStatus();
                case "currency" -> operation.getCurrency();
                case "amount" -> operation.getAmount();
                case "issuedate" -> operation.getIssueDate();
                case "expirydate" -> operation.getExpiryDate();
                case "applicantid" -> operation.getApplicantId();
                case "applicantname" -> operation.getApplicantName();
                case "beneficiaryid" -> operation.getBeneficiaryId();
                case "beneficiaryname" -> operation.getBeneficiaryName();
                case "issuingbankid" -> operation.getIssuingBankId();
                case "issuingbankbic" -> operation.getIssuingBankBic();
                case "advisingbankid" -> operation.getAdvisingBankId();
                case "advisingbankbic" -> operation.getAdvisingBankBic();
                case "amendmentcount" -> operation.getAmendmentCount();
                case "messagecount" -> operation.getMessageCount();
                case "awaitingresponse" -> operation.getAwaitingResponse();
                case "creationmode" -> operation.getCreationMode();
                default -> {
                    log.warn("Unknown operation field path: {}", fieldPath);
                    yield null;
                }
            };
        } catch (Exception e) {
            log.error("Error getting operation field value: {}", fieldPath, e);
            return null;
        }
    }

    /**
     * Evaluate a comparison between a value and the condition criteria.
     */
    private boolean evaluateComparison(String actualValue, ComparisonOperator operator,
                                       String expectedValue, ValueType valueType) {
        if (operator == null) {
            return true;
        }

        log.debug("Comparing: '{}' {} '{}' (type: {})",
                actualValue, operator, expectedValue, valueType);

        return switch (operator) {
            case EXISTS -> actualValue != null && !actualValue.isEmpty();
            case NOT_EXISTS -> actualValue == null || actualValue.isEmpty();
            case IS_NULL -> actualValue == null;
            case IS_NOT_NULL -> actualValue != null;
            case IS_EMPTY -> actualValue == null || actualValue.isEmpty();
            case IS_NOT_EMPTY -> actualValue != null && !actualValue.isEmpty();
            case EQUALS -> compareEquals(actualValue, expectedValue, valueType);
            case NOT_EQUALS -> !compareEquals(actualValue, expectedValue, valueType);
            case CONTAINS -> actualValue != null && expectedValue != null &&
                    actualValue.contains(expectedValue);
            case NOT_CONTAINS -> actualValue == null || expectedValue == null ||
                    !actualValue.contains(expectedValue);
            case STARTS_WITH -> actualValue != null && expectedValue != null &&
                    actualValue.startsWith(expectedValue);
            case ENDS_WITH -> actualValue != null && expectedValue != null &&
                    actualValue.endsWith(expectedValue);
            case MATCHES_REGEX -> actualValue != null && expectedValue != null &&
                    actualValue.matches(expectedValue);
            case GREATER_THAN -> compareNumeric(actualValue, expectedValue, valueType) > 0;
            case GREATER_THAN_OR_EQUALS -> compareNumeric(actualValue, expectedValue, valueType) >= 0;
            case LESS_THAN -> compareNumeric(actualValue, expectedValue, valueType) < 0;
            case LESS_THAN_OR_EQUALS -> compareNumeric(actualValue, expectedValue, valueType) <= 0;
            case IN_LIST -> isInList(actualValue, expectedValue);
            case NOT_IN_LIST -> !isInList(actualValue, expectedValue);
        };
    }

    /**
     * Compare two values for equality based on value type.
     */
    private boolean compareEquals(String actual, String expected, ValueType valueType) {
        if (actual == null && expected == null) {
            return true;
        }
        if (actual == null || expected == null) {
            return false;
        }

        if (valueType == null) {
            valueType = ValueType.STRING;
        }

        return switch (valueType) {
            case STRING -> actual.equals(expected);
            case NUMBER -> {
                try {
                    yield new BigDecimal(actual).compareTo(new BigDecimal(expected)) == 0;
                } catch (NumberFormatException e) {
                    yield actual.equals(expected);
                }
            }
            case BOOLEAN -> Boolean.parseBoolean(actual) == Boolean.parseBoolean(expected);
            case DATE -> {
                try {
                    LocalDate actualDate = LocalDate.parse(actual);
                    LocalDate expectedDate = LocalDate.parse(expected);
                    yield actualDate.equals(expectedDate);
                } catch (Exception e) {
                    yield actual.equals(expected);
                }
            }
            case LIST, REGEX -> actual.equals(expected);
        };
    }

    /**
     * Compare two values numerically.
     */
    private int compareNumeric(String actual, String expected, ValueType valueType) {
        if (actual == null || expected == null) {
            return actual == null ? -1 : 1;
        }

        try {
            if (valueType == ValueType.DATE) {
                LocalDate actualDate = LocalDate.parse(actual);
                LocalDate expectedDate = LocalDate.parse(expected);
                return actualDate.compareTo(expectedDate);
            }

            BigDecimal actualNum = new BigDecimal(actual.replaceAll("[^0-9.-]", ""));
            BigDecimal expectedNum = new BigDecimal(expected.replaceAll("[^0-9.-]", ""));
            return actualNum.compareTo(expectedNum);
        } catch (Exception e) {
            log.warn("Could not compare numerically: {} vs {}", actual, expected);
            return actual.compareTo(expected);
        }
    }

    /**
     * Check if a value is in a comma-separated list.
     */
    private boolean isInList(String actual, String listValue) {
        if (actual == null || listValue == null) {
            return false;
        }

        String[] items = listValue.split(",");
        for (String item : items) {
            if (actual.equals(item.trim())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Handle evaluation when value is missing based on operator type.
     */
    private boolean handleMissingValue(ComparisonOperator operator) {
        if (operator == null) {
            return true;
        }

        return switch (operator) {
            case NOT_EXISTS, IS_NULL, IS_EMPTY -> true;
            default -> false;
        };
    }

    /**
     * Get all conditions applicable to an operation.
     */
    public List<EventConditionConfig> getApplicableConditions(String operationType, String language) {
        return conditionRepository.findByOperationType(operationType, language);
    }

    /**
     * Evaluate multiple events and return those that should be shown.
     */
    public List<String> filterEventsByConditions(List<String> eventCodes, String operationType,
                                                  OperationReadModel operation, String language) {
        List<String> visibleEvents = new ArrayList<>();

        for (String eventCode : eventCodes) {
            if (shouldShowEvent(eventCode, operationType, operation, language)) {
                visibleEvents.add(eventCode);
            }
        }

        return visibleEvents;
    }
}
