package com.globalcmx.api.service.draft;

import com.globalcmx.api.readmodel.entity.SwiftDraftReadModel;
import com.globalcmx.api.readmodel.entity.SwiftFieldConfig;
import com.globalcmx.api.readmodel.enums.FieldType;
import com.globalcmx.api.readmodel.repository.SwiftFieldConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for parsing SWIFT messages and extracting field values
 * based on configurable mappings from swift_field_config_readmodel.
 *
 * Extracts values like:
 * - :20:REF-12345 → reference
 * - :31C:20241204 → issueDate
 * - :31D:20260315 → expiryDate
 * - :32B:USD100000,00 → currency + amount
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SwiftMessageParserService {

    private final SwiftFieldConfigRepository fieldConfigRepository;

    // SWIFT date format: YYYYMMDD
    private static final DateTimeFormatter SWIFT_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    // Pattern to match field code and extract its value
    // Matches :XX: or :XXa: format (where X is alphanumeric and a is optional letter)
    // The value continues until the next field tag or end of message
    // Supports both Unix (\n) and Windows (\r\n) line endings
    private static final Pattern FIELD_PATTERN = Pattern.compile(
            ":(\\d{2}[A-Z]?):\\s*([^:]+?)(?=\\r?\\n:|\\z)",
            Pattern.DOTALL
    );

    /**
     * Parses a SWIFT message and extracts metadata fields into a map.
     * Uses configured field mappings from swift_field_config_readmodel.
     *
     * @param swiftMessage The raw SWIFT message text
     * @param messageType The message type (e.g., "MT700")
     * @return Map of entity field names to extracted values
     */
    public Map<String, Object> parseSwiftMessage(String swiftMessage, String messageType) {
        Map<String, Object> extractedFields = new HashMap<>();

        if (swiftMessage == null || swiftMessage.isBlank()) {
            log.warn("SWIFT message is null or empty");
            return extractedFields;
        }

        // Get all field configurations with draft mappings for this message type
        List<SwiftFieldConfig> fieldConfigs = fieldConfigRepository.findFieldsWithDraftMapping(messageType);

        if (fieldConfigs.isEmpty()) {
            log.debug("No field mappings configured for message type: {}", messageType);
            return extractedFields;
        }

        // Parse all field values from the message
        Map<String, String> rawFieldValues = extractAllFieldValues(swiftMessage);

        // Apply each configured mapping
        for (SwiftFieldConfig config : fieldConfigs) {
            String fieldCode = normalizeFieldCode(config.getFieldCode());
            String rawValue = rawFieldValues.get(fieldCode);

            if (rawValue == null) {
                log.debug("Field {} not found in message", config.getFieldCode());
                continue;
            }

            try {
                applyFieldMapping(extractedFields, config, rawValue.trim());
            } catch (Exception e) {
                log.warn("Error extracting field {}: {}", config.getFieldCode(), e.getMessage());
            }
        }

        log.info("Extracted {} fields from {} message", extractedFields.size(), messageType);
        return extractedFields;
    }

    /**
     * Parses a SWIFT message and applies extracted values directly to a draft entity.
     *
     * @param draft The draft entity to update
     * @param swiftMessage The raw SWIFT message text
     * @param messageType The message type (e.g., "MT700")
     */
    public void parseAndApplyToDraft(SwiftDraftReadModel draft, String swiftMessage, String messageType) {
        Map<String, Object> extractedFields = parseSwiftMessage(swiftMessage, messageType);

        if (extractedFields.isEmpty()) {
            log.debug("No fields extracted from message");
            return;
        }

        BeanWrapper wrapper = new BeanWrapperImpl(draft);

        for (Map.Entry<String, Object> entry : extractedFields.entrySet()) {
            String fieldName = entry.getKey();
            Object value = entry.getValue();

            try {
                if (wrapper.isWritableProperty(fieldName)) {
                    wrapper.setPropertyValue(fieldName, value);
                    log.debug("Set {}={}", fieldName, value);
                } else {
                    log.warn("Field '{}' is not writable in SwiftDraftReadModel", fieldName);
                }
            } catch (Exception e) {
                log.warn("Error setting field '{}': {}", fieldName, e.getMessage());
            }
        }
    }

    /**
     * Extracts all field values from a SWIFT message into a map.
     * Key is the normalized field code (e.g., "20", "31C", "32B")
     */
    private Map<String, String> extractAllFieldValues(String swiftMessage) {
        Map<String, String> values = new HashMap<>();
        Matcher matcher = FIELD_PATTERN.matcher(swiftMessage);

        while (matcher.find()) {
            String fieldCode = matcher.group(1);
            String fieldValue = matcher.group(2).trim();
            values.put(fieldCode, fieldValue);
            log.trace("Found field :{}: = {}", fieldCode, fieldValue);
        }

        return values;
    }

    /**
     * Normalizes a field code by removing the surrounding colons.
     * e.g., ":32B:" → "32B", ":20:" → "20"
     */
    private String normalizeFieldCode(String fieldCode) {
        if (fieldCode == null) return "";
        return fieldCode.replaceAll("^:|:$", "");
    }

    /**
     * Applies a field mapping configuration to extract and convert the value.
     */
    private void applyFieldMapping(Map<String, Object> extractedFields,
                                   SwiftFieldConfig config, String rawValue) {
        String draftFieldMapping = config.getDraftFieldMapping();
        FieldType fieldType = config.getFieldType();

        // Handle composite fields (e.g., "currency,amount" for :32B:)
        if (draftFieldMapping.contains(",")) {
            applyCompositeMapping(extractedFields, draftFieldMapping, rawValue, fieldType);
        } else {
            // Single field mapping
            Object convertedValue = convertValue(rawValue, fieldType);
            if (convertedValue != null) {
                extractedFields.put(draftFieldMapping, convertedValue);
            }
        }
    }

    /**
     * Handles composite field mappings like "currency,amount" for :32B:USD100000,00
     */
    private void applyCompositeMapping(Map<String, Object> extractedFields,
                                       String mapping, String rawValue, FieldType fieldType) {
        String[] fieldNames = mapping.split(",");

        // Handle :32B: format: CUR + Amount (e.g., "USD100000,00")
        if (fieldNames.length == 2 &&
            (fieldNames[0].equalsIgnoreCase("currency") || fieldNames[1].equalsIgnoreCase("currency"))) {
            parseCurrencyAmount(extractedFields, fieldNames, rawValue);
            return;
        }

        // Handle :31D: format with location: YYYYMMDD + Place (e.g., "20260315QUITO")
        // or YYMMDD + Place (e.g., "260208QUITO")
        if (fieldNames.length == 2 && rawValue.length() >= 6) {
            // Determine if it's YYYYMMDD (8 digits) or YYMMDD (6 digits) format
            int dateLength;
            if (rawValue.length() >= 8 && rawValue.substring(0, 4).matches("\\d{4}") &&
                Integer.parseInt(rawValue.substring(0, 4)) >= 1900 &&
                Integer.parseInt(rawValue.substring(0, 4)) <= 2100) {
                // YYYYMMDD format (starts with valid 4-digit year)
                dateLength = 8;
            } else {
                // YYMMDD format (6 digits)
                dateLength = 6;
            }

            String dateStr = rawValue.substring(0, Math.min(dateLength, rawValue.length()));
            String remainingValue = rawValue.length() > dateLength ? rawValue.substring(dateLength).trim() : "";

            // First field is date, second is text
            for (String fieldName : fieldNames) {
                fieldName = fieldName.trim();
                if (fieldName.toLowerCase().contains("date")) {
                    LocalDate date = parseSwiftDate(dateStr);
                    if (date != null) {
                        extractedFields.put(fieldName, date);
                    }
                } else if (!remainingValue.isEmpty()) {
                    extractedFields.put(fieldName, remainingValue);
                }
            }
        }
    }

    /**
     * Parses :32B: field format: CUR + Amount
     * Example: "USD100000,00" → currency=USD, amount=100000.00
     */
    private void parseCurrencyAmount(Map<String, Object> extractedFields,
                                     String[] fieldNames, String rawValue) {
        // Currency is first 3 characters
        if (rawValue.length() < 4) {
            log.warn("Invalid currency/amount format: {}", rawValue);
            return;
        }

        String currency = rawValue.substring(0, 3);
        String amountStr = rawValue.substring(3).trim();

        for (String fieldName : fieldNames) {
            fieldName = fieldName.trim();
            if (fieldName.equalsIgnoreCase("currency")) {
                extractedFields.put(fieldName, currency);
            } else if (fieldName.equalsIgnoreCase("amount")) {
                BigDecimal amount = parseSwiftAmount(amountStr);
                if (amount != null) {
                    extractedFields.put(fieldName, amount);
                }
            }
        }
    }

    /**
     * Converts a raw string value to the appropriate Java type based on FieldType.
     */
    private Object convertValue(String rawValue, FieldType fieldType) {
        if (rawValue == null || rawValue.isBlank()) {
            return null;
        }

        try {
            switch (fieldType) {
                case DATE:
                    return parseSwiftDate(rawValue);
                case NUMBER:
                    return Long.parseLong(rawValue.replaceAll("[^0-9-]", ""));
                case DECIMAL:
                    return parseSwiftAmount(rawValue);
                case CURRENCY:
                    return rawValue.length() >= 3 ? rawValue.substring(0, 3) : rawValue;
                case BOOLEAN:
                    return parseBoolean(rawValue);
                case SWIFT_PARTY:
                    return parseSwiftPartyBic(rawValue);
                case INSTITUTION:
                    return parseSwiftPartyBic(rawValue);
                case TEXT:
                case TEXTAREA:
                case SELECT:
                default:
                    return rawValue;
            }
        } catch (Exception e) {
            log.warn("Error converting value '{}' to {}: {}", rawValue, fieldType, e.getMessage());
            return rawValue; // Return as string if conversion fails
        }
    }

    /**
     * Parses a SWIFT date in YYYYMMDD (8 digits) or YYMMDD (6 digits) format.
     * SWIFT standard supports both formats.
     */
    private LocalDate parseSwiftDate(String dateStr) {
        if (dateStr == null || dateStr.length() < 6) {
            return null;
        }

        try {
            // Check if it's YYYYMMDD format (8 digits) or has place suffix (8+ chars starting with 4-digit year)
            if (dateStr.length() >= 8 && dateStr.substring(0, 4).matches("\\d{4}")) {
                String dateOnly = dateStr.substring(0, 8);
                return LocalDate.parse(dateOnly, SWIFT_DATE_FORMAT);
            }

            // YYMMDD format (6 digits) - common in SWIFT messages
            if (dateStr.length() >= 6) {
                String dateOnly = dateStr.substring(0, 6);
                if (dateOnly.matches("\\d{6}")) {
                    int year = Integer.parseInt(dateOnly.substring(0, 2));
                    int month = Integer.parseInt(dateOnly.substring(2, 4));
                    int day = Integer.parseInt(dateOnly.substring(4, 6));
                    // Century detection: 00-50 = 2000s, 51-99 = 1900s
                    int fullYear = year <= 50 ? 2000 + year : 1900 + year;
                    return LocalDate.of(fullYear, month, day);
                }
            }

            log.warn("Invalid SWIFT date format: {}", dateStr);
            return null;
        } catch (DateTimeParseException | NumberFormatException e) {
            log.warn("Invalid SWIFT date format: {}", dateStr);
            return null;
        }
    }

    /**
     * Parses a SWIFT amount (uses comma as decimal separator).
     * Example: "100000,00" → 100000.00
     */
    private BigDecimal parseSwiftAmount(String amountStr) {
        if (amountStr == null || amountStr.isBlank()) {
            return null;
        }
        try {
            // Replace comma with dot for decimal
            String normalized = amountStr.replace(",", ".");
            return new BigDecimal(normalized);
        } catch (NumberFormatException e) {
            log.warn("Invalid amount format: {}", amountStr);
            return null;
        }
    }

    /**
     * Parses boolean values from SWIFT (YES/NO, Y/N, ALLOWED/PROHIBITED, etc.)
     */
    private Boolean parseBoolean(String value) {
        if (value == null) return null;
        String upper = value.toUpperCase().trim();
        if (upper.equals("YES") || upper.equals("Y") || upper.equals("ALLOWED") ||
            upper.equals("TRUE") || upper.equals("1")) {
            return true;
        }
        if (upper.equals("NO") || upper.equals("N") || upper.equals("PROHIBITED") ||
            upper.equals("FALSE") || upper.equals("0")) {
            return false;
        }
        return null;
    }

    /**
     * Extracts BIC code from SWIFT party field (fields with suffix 'a' like :52a:, :57a:).
     * SWIFT party fields in Option A format have BIC as first line (8 or 11 chars).
     * Example: "BANKUS33XXX\nBank of America\nNew York" → "BANKUS33XXX"
     */
    private String parseSwiftPartyBic(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return null;
        }

        // Get first line (BIC is always on first line in Option A format)
        String firstLine = rawValue.split("[\\r\\n]")[0].trim();

        // BIC format: 8 or 11 alphanumeric characters
        // Pattern: 4 letters (bank) + 2 letters (country) + 2 alphanum (location) + optional 3 alphanum (branch)
        if (firstLine.matches("^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$")) {
            log.debug("Extracted BIC: {}", firstLine);
            return firstLine;
        }

        // If first line is not a valid BIC, return null (field might be in Option B/D format)
        log.debug("Could not extract BIC from party field: {}", rawValue);
        return null;
    }
}
