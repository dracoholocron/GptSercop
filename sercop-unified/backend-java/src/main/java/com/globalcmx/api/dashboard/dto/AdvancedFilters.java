package com.globalcmx.api.dashboard.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Query;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;

@Data
@Builder
@Slf4j
@NoArgsConstructor
@AllArgsConstructor
public class AdvancedFilters {
    private String createdBy;
    private String beneficiary;
    private String issuingBank;
    private String advisingBank;
    private String applicant;

    /**
     * SWIFT field search conditions as JSON array.
     * Format: [{"field":"20","op":"contains","value":"LC-IMP"},{"field":"32B","op":"contains","value":"USD"}]
     * Searches within the swift_message TEXT column using REGEXP.
     * REGEXP restricts matches to the same field (same line) preventing cross-field false positives.
     */
    private String swiftFieldSearch;

    /**
     * Free text search across the entire SWIFT message content.
     * Uses LIKE '%value%' on swift_message column.
     */
    private String swiftFreeText;

    /**
     * Search across all custom field values in operation_custom_data_readmodel.
     * Uses JSON_SEARCH on the custom_data JSON column.
     */
    private String customFieldValue;

    /**
     * Extended custom field filters as JSON object.
     * Format: {"FIELD_CODE": "value", "OTHER_FIELD": "other_value"}
     * Uses JSON_EXTRACT on the custom_data JSON column for each field.
     */
    private String customFieldFilters;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /**
     * Build SQL WHERE conditions without table alias.
     */
    public String toSqlConditions() {
        return toSqlConditions(null);
    }

    /**
     * Build SQL WHERE conditions with optional table alias.
     */
    public String toSqlConditions(String alias) {
        String prefix = (alias != null && !alias.isEmpty()) ? alias + "." : "";
        StringBuilder sb = new StringBuilder();
        if (createdBy != null && !createdBy.isBlank()) {
            sb.append(" AND ").append(prefix).append("created_by = :advCreatedBy");
        }
        if (beneficiary != null && !beneficiary.isBlank()) {
            sb.append(" AND ").append(prefix).append("beneficiary_name = :advBeneficiary");
        }
        if (issuingBank != null && !issuingBank.isBlank()) {
            sb.append(" AND ").append(prefix).append("issuing_bank_bic = :advIssuingBank");
        }
        if (advisingBank != null && !advisingBank.isBlank()) {
            sb.append(" AND ").append(prefix).append("advising_bank_bic = :advAdvisingBank");
        }
        if (applicant != null && !applicant.isBlank()) {
            sb.append(" AND ").append(prefix).append("applicant_name = :advApplicant");
        }

        // SWIFT field search conditions (REGEXP on swift_message)
        // REGEXP restricts match to same line, preventing cross-field false positives.
        // MySQL's '.' does NOT match \n by default, so :52A:.*mex only matches mex on the same line as :52A:
        if (swiftFieldSearch != null && !swiftFieldSearch.isBlank()) {
            try {
                List<Map<String, String>> conditions = MAPPER.readValue(swiftFieldSearch,
                    new TypeReference<>() {});
                for (int i = 0; i < conditions.size(); i++) {
                    sb.append(" AND ").append(prefix).append("swift_message REGEXP :_swp").append(i);
                }
            } catch (Exception ignored) {
                // Malformed JSON - skip SWIFT conditions
            }
        }

        // SWIFT free text search
        if (swiftFreeText != null && !swiftFreeText.isBlank()) {
            sb.append(" AND ").append(prefix).append("swift_message LIKE :_swft");
        }

        // Custom field search (subquery on operation_custom_data_readmodel)
        if (customFieldValue != null && !customFieldValue.isBlank()) {
            sb.append(" AND ").append(prefix).append("operation_id IN (")
              .append("SELECT cd.operation_id FROM operation_custom_data_readmodel cd ")
              .append("WHERE JSON_SEARCH(cd.custom_data, 'one', CONCAT('%', :_cfv, '%')) IS NOT NULL)");
        }

        // Extended custom field filters (JSON_EXTRACT per field)
        if (customFieldFilters != null && !customFieldFilters.isBlank()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, String> cfFilters = MAPPER.readValue(customFieldFilters, Map.class);
                int i = 0;
                for (Map.Entry<String, String> entry : cfFilters.entrySet()) {
                    if (entry.getValue() != null && !entry.getValue().isBlank()) {
                        String sanitizedKey = entry.getKey().replaceAll("[^a-zA-Z0-9_]", "");
                        sb.append(" AND ").append(prefix).append("operation_id IN (")
                          .append("SELECT cd.operation_id FROM operation_custom_data_readmodel cd ")
                          .append("WHERE JSON_EXTRACT(cd.custom_data, '$.").append(sanitizedKey)
                          .append("') = :_cf").append(i).append(")");
                        i++;
                    }
                }
            } catch (Exception ignored) {
                // Malformed JSON - skip
            }
        }

        sb.append("\n");
        String result = sb.toString();
        if (!result.isBlank()) {
            log.info("[SWIFT-FILTER] Generated SQL conditions: {}", result.trim());
        }
        return result;
    }

    /**
     * Set named parameters on query for the conditions built by toSqlConditions().
     */
    public void applyToQuery(Query query) {
        if (createdBy != null && !createdBy.isBlank()) {
            query.setParameter("advCreatedBy", createdBy);
        }
        if (beneficiary != null && !beneficiary.isBlank()) {
            query.setParameter("advBeneficiary", beneficiary);
        }
        if (issuingBank != null && !issuingBank.isBlank()) {
            query.setParameter("advIssuingBank", issuingBank);
        }
        if (advisingBank != null && !advisingBank.isBlank()) {
            query.setParameter("advAdvisingBank", advisingBank);
        }
        if (applicant != null && !applicant.isBlank()) {
            query.setParameter("advApplicant", applicant);
        }

        // SWIFT field search parameters (REGEXP patterns)
        // Uses (?i) for case-insensitive, \Q..\E to escape user value as literal.
        // '.' does NOT match \n in MySQL REGEXP, so ":52A:.*mex" restricts to same line.
        if (swiftFieldSearch != null && !swiftFieldSearch.isBlank()) {
            log.info("[SWIFT-FILTER] swiftFieldSearch JSON: {}", swiftFieldSearch);
            try {
                List<Map<String, String>> conditions = MAPPER.readValue(swiftFieldSearch,
                    new TypeReference<>() {});
                for (int i = 0; i < conditions.size(); i++) {
                    Map<String, String> cond = conditions.get(i);
                    String field = sanitizeFieldCode(cond.get("field"));
                    String value = cond.getOrDefault("value", "");
                    String op = cond.getOrDefault("op", "contains");
                    String escaped = "\\Q" + value + "\\E";

                    // (?is) = case-insensitive + DOTALL (. matches newlines)
                    // This allows searching multi-line SWIFT field values
                    // (e.g., :50: spans 4 lines with applicant name + address)
                    String pattern = switch (op) {
                        case "equals" -> "(?i):" + field + ":" + escaped + "(\\r?\\n|$|\\})";
                        case "startsWith" -> "(?i):" + field + ":" + escaped;
                        default -> "(?is):" + field + ":.*?" + escaped; // contains - searches across newlines
                    };
                    log.info("[SWIFT-FILTER] condition[{}]: field={}, op={}, value={}, REGEXP pattern={}", i, field, op, value, pattern);
                    query.setParameter("_swp" + i, pattern);
                }
            } catch (Exception e) {
                log.warn("[SWIFT-FILTER] Failed to parse swiftFieldSearch JSON: {}", e.getMessage());
            }
        }

        // SWIFT free text parameter
        if (swiftFreeText != null && !swiftFreeText.isBlank()) {
            query.setParameter("_swft", "%" + swiftFreeText.trim() + "%");
        }

        // Custom field value parameter
        if (customFieldValue != null && !customFieldValue.isBlank()) {
            query.setParameter("_cfv", customFieldValue.trim());
        }

        // Extended custom field filter parameters
        if (customFieldFilters != null && !customFieldFilters.isBlank()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, String> cfFilters = MAPPER.readValue(customFieldFilters, Map.class);
                int i = 0;
                for (Map.Entry<String, String> entry : cfFilters.entrySet()) {
                    if (entry.getValue() != null && !entry.getValue().isBlank()) {
                        query.setParameter("_cf" + i, entry.getValue());
                        i++;
                    }
                }
            } catch (Exception ignored) {
                // Malformed JSON - skip
            }
        }
    }

    /**
     * Returns true if any filter field is set.
     */
    public boolean hasAny() {
        return (createdBy != null && !createdBy.isBlank())
            || (beneficiary != null && !beneficiary.isBlank())
            || (issuingBank != null && !issuingBank.isBlank())
            || (advisingBank != null && !advisingBank.isBlank())
            || (applicant != null && !applicant.isBlank())
            || (swiftFieldSearch != null && !swiftFieldSearch.isBlank())
            || (swiftFreeText != null && !swiftFreeText.isBlank())
            || (customFieldValue != null && !customFieldValue.isBlank())
            || (customFieldFilters != null && !customFieldFilters.isBlank());
    }

    /**
     * Returns an empty (no-op) AdvancedFilters instance.
     */
    public static AdvancedFilters empty() {
        return new AdvancedFilters();
    }

    /**
     * Sanitize SWIFT field code to prevent injection. Only alphanumeric chars allowed.
     */
    private static String sanitizeFieldCode(String field) {
        if (field == null) return "";
        return field.replaceAll("[^a-zA-Z0-9]", "");
    }
}
