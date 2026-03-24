package com.globalcmx.api.externalapi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Evaluates calculated expressions/formulas for external API request mappings.
 * Supports various functions for dates, times, UUIDs, and more.
 *
 * Supported Functions:
 * - Date/Time:
 *   - NOW() - Current date and time in ISO format
 *   - NOW(pattern) - Current date and time in custom format
 *   - TODAY() - Current date in ISO format (yyyy-MM-dd)
 *   - TODAY(pattern) - Current date in custom format
 *   - TIME() - Current time in ISO format (HH:mm:ss)
 *   - TIME(pattern) - Current time in custom format
 *   - TIMESTAMP() - Unix timestamp in seconds
 *   - TIMESTAMP_MS() - Unix timestamp in milliseconds
 *   - DATE_ADD(days) - Today plus N days
 *   - DATE_ADD(days, pattern) - Today plus N days in custom format
 *   - DATE_SUB(days) - Today minus N days
 *   - DATE_SUB(days, pattern) - Today minus N days in custom format
 *   - YEAR() - Current year
 *   - MONTH() - Current month (1-12)
 *   - DAY() - Current day of month
 *   - FIRST_DAY_OF_MONTH() - First day of current month
 *   - LAST_DAY_OF_MONTH() - Last day of current month
 *   - START_OF_DAY() - Today at 00:00:00
 *   - END_OF_DAY() - Today at 23:59:59
 *
 * - Identifiers:
 *   - UUID() - Random UUID
 *   - UUID_SHORT() - Short UUID (first 8 characters)
 *   - SEQUENCE() - Auto-incrementing sequence (per session)
 *
 * - Strings:
 *   - RANDOM(length) - Random alphanumeric string
 *   - RANDOM_NUM(length) - Random numeric string
 *   - PAD_LEFT(value, length, char) - Pad string on left
 *   - PAD_RIGHT(value, length, char) - Pad string on right
 *
 * - Context (requires context map):
 *   - ENV(name) - Environment variable
 *   - CONTEXT(key) - Value from context map
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CalculatedExpressionEvaluator {

    private static final Pattern FUNCTION_PATTERN = Pattern.compile("^([A-Z_]+)\\((.*)\\)$");
    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final String NUMERIC = "0123456789";

    private long sequenceCounter = 0;

    /**
     * Evaluates a calculated expression and returns the result as a string.
     *
     * @param expression The expression to evaluate
     * @param context Optional context map with additional variables
     * @return The evaluated result as a string
     */
    public String evaluate(String expression, Map<String, Object> context) {
        if (expression == null || expression.isBlank()) {
            return null;
        }

        expression = expression.trim();

        // Check if it's a function call
        Matcher matcher = FUNCTION_PATTERN.matcher(expression);
        if (matcher.matches()) {
            String functionName = matcher.group(1);
            String args = matcher.group(2).trim();
            return evaluateFunction(functionName, args, context);
        }

        // If not a function, return as literal
        return expression;
    }

    private String evaluateFunction(String functionName, String args, Map<String, Object> context) {
        try {
            return switch (functionName) {
                // Date/Time functions
                case "NOW" -> evaluateNow(args);
                case "TODAY" -> evaluateToday(args);
                case "TIME" -> evaluateTime(args);
                case "TIMESTAMP" -> String.valueOf(Instant.now().getEpochSecond());
                case "TIMESTAMP_MS" -> String.valueOf(Instant.now().toEpochMilli());
                case "DATE_ADD" -> evaluateDateAdd(args, true);
                case "DATE_SUB" -> evaluateDateAdd(args, false);
                case "YEAR" -> String.valueOf(LocalDate.now().getYear());
                case "MONTH" -> String.valueOf(LocalDate.now().getMonthValue());
                case "DAY" -> String.valueOf(LocalDate.now().getDayOfMonth());
                case "FIRST_DAY_OF_MONTH" -> LocalDate.now().withDayOfMonth(1).toString();
                case "LAST_DAY_OF_MONTH" -> LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth()).toString();
                case "START_OF_DAY" -> LocalDate.now().atStartOfDay().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                case "END_OF_DAY" -> LocalDate.now().atTime(23, 59, 59).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

                // Identifier functions
                case "UUID" -> UUID.randomUUID().toString();
                case "UUID_SHORT" -> UUID.randomUUID().toString().substring(0, 8);
                case "SEQUENCE" -> String.valueOf(++sequenceCounter);

                // String functions
                case "RANDOM" -> evaluateRandom(args, ALPHANUMERIC);
                case "RANDOM_NUM" -> evaluateRandom(args, NUMERIC);
                case "PAD_LEFT" -> evaluatePad(args, true);
                case "PAD_RIGHT" -> evaluatePad(args, false);

                // Context functions
                case "ENV" -> System.getenv(args);
                case "CONTEXT" -> evaluateContext(args, context);

                default -> {
                    log.warn("Unknown function: {}", functionName);
                    yield null;
                }
            };
        } catch (Exception e) {
            log.error("Error evaluating function {}({}): {}", functionName, args, e.getMessage());
            return null;
        }
    }

    private String evaluateNow(String pattern) {
        LocalDateTime now = LocalDateTime.now();
        if (pattern == null || pattern.isBlank()) {
            return now.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        }
        return now.format(DateTimeFormatter.ofPattern(pattern));
    }

    private String evaluateToday(String pattern) {
        LocalDate today = LocalDate.now();
        if (pattern == null || pattern.isBlank()) {
            return today.toString();
        }
        return today.format(DateTimeFormatter.ofPattern(pattern));
    }

    private String evaluateTime(String pattern) {
        LocalTime time = LocalTime.now();
        if (pattern == null || pattern.isBlank()) {
            return time.format(DateTimeFormatter.ISO_LOCAL_TIME);
        }
        return time.format(DateTimeFormatter.ofPattern(pattern));
    }

    private String evaluateDateAdd(String args, boolean add) {
        String[] parts = parseArgs(args);
        int days = Integer.parseInt(parts[0].trim());
        LocalDate result = add ? LocalDate.now().plusDays(days) : LocalDate.now().minusDays(days);

        if (parts.length > 1 && !parts[1].isBlank()) {
            return result.format(DateTimeFormatter.ofPattern(parts[1].trim()));
        }
        return result.toString();
    }

    private String evaluateRandom(String args, String charset) {
        int length = 8; // default
        if (args != null && !args.isBlank()) {
            length = Integer.parseInt(args.trim());
        }
        StringBuilder sb = new StringBuilder(length);
        java.util.Random random = new java.util.Random();
        for (int i = 0; i < length; i++) {
            sb.append(charset.charAt(random.nextInt(charset.length())));
        }
        return sb.toString();
    }

    private String evaluatePad(String args, boolean left) {
        String[] parts = parseArgs(args);
        if (parts.length < 3) {
            return parts[0];
        }
        String value = parts[0].trim();
        int length = Integer.parseInt(parts[1].trim());
        char padChar = parts[2].trim().charAt(0);

        if (value.length() >= length) {
            return value;
        }

        StringBuilder sb = new StringBuilder();
        int padCount = length - value.length();
        String padding = String.valueOf(padChar).repeat(padCount);

        if (left) {
            sb.append(padding).append(value);
        } else {
            sb.append(value).append(padding);
        }
        return sb.toString();
    }

    private String evaluateContext(String key, Map<String, Object> context) {
        if (context == null || key == null || key.isBlank()) {
            return null;
        }
        Object value = context.get(key.trim());
        return value != null ? value.toString() : null;
    }

    private String[] parseArgs(String args) {
        if (args == null || args.isBlank()) {
            return new String[0];
        }
        return args.split(",");
    }

    /**
     * Returns documentation of all available functions.
     */
    public static Map<String, String> getAvailableFunctions() {
        return Map.ofEntries(
                // Date/Time
                Map.entry("NOW()", "Current date and time in ISO format"),
                Map.entry("NOW(pattern)", "Current date and time in custom format (e.g., 'yyyy-MM-dd HH:mm')"),
                Map.entry("TODAY()", "Current date in ISO format (yyyy-MM-dd)"),
                Map.entry("TODAY(pattern)", "Current date in custom format"),
                Map.entry("TIME()", "Current time in ISO format (HH:mm:ss)"),
                Map.entry("TIME(pattern)", "Current time in custom format"),
                Map.entry("TIMESTAMP()", "Unix timestamp in seconds"),
                Map.entry("TIMESTAMP_MS()", "Unix timestamp in milliseconds"),
                Map.entry("DATE_ADD(days)", "Today plus N days"),
                Map.entry("DATE_ADD(days, pattern)", "Today plus N days in custom format"),
                Map.entry("DATE_SUB(days)", "Today minus N days"),
                Map.entry("DATE_SUB(days, pattern)", "Today minus N days in custom format"),
                Map.entry("YEAR()", "Current year (4 digits)"),
                Map.entry("MONTH()", "Current month (1-12)"),
                Map.entry("DAY()", "Current day of month"),
                Map.entry("FIRST_DAY_OF_MONTH()", "First day of current month"),
                Map.entry("LAST_DAY_OF_MONTH()", "Last day of current month"),
                Map.entry("START_OF_DAY()", "Today at 00:00:00"),
                Map.entry("END_OF_DAY()", "Today at 23:59:59"),

                // Identifiers
                Map.entry("UUID()", "Random UUID (36 characters)"),
                Map.entry("UUID_SHORT()", "Short UUID (first 8 characters)"),
                Map.entry("SEQUENCE()", "Auto-incrementing sequence number"),

                // Strings
                Map.entry("RANDOM(length)", "Random alphanumeric string"),
                Map.entry("RANDOM_NUM(length)", "Random numeric string"),
                Map.entry("PAD_LEFT(value, length, char)", "Pad string on left"),
                Map.entry("PAD_RIGHT(value, length, char)", "Pad string on right"),

                // Context
                Map.entry("ENV(name)", "Environment variable value"),
                Map.entry("CONTEXT(key)", "Value from execution context")
        );
    }
}
