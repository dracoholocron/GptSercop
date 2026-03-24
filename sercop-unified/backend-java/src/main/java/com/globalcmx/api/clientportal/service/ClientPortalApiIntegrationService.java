package com.globalcmx.api.clientportal.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.clientportal.entity.ClientRequestReadModel;
import com.globalcmx.api.dto.actions.ActionExecutionResult;
import com.globalcmx.api.dto.drools.RuleContext;
import com.globalcmx.api.externalapi.entity.ExternalApiConfigReadModel;
import com.globalcmx.api.externalapi.repository.ExternalApiConfigRepository;
import com.globalcmx.api.externalapi.service.ExternalApiExecutorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for integrating external APIs with the Client Portal.
 * In development mode, uses mock responses from the database.
 * In production mode, calls actual external APIs.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClientPortalApiIntegrationService {

    private final ExternalApiExecutorService apiExecutor;
    private final ExternalApiConfigRepository apiConfigRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.external-api.use-mock:true}")
    private boolean useMockResponses;

    @Value("${app.external-api.mock-delay-ms:500}")
    private int mockDelayMs;

    // ==========================================
    // Credit Check
    // ==========================================

    /**
     * Check client credit for a new request.
     */
    public CreditCheckResult checkClientCredit(ClientRequestReadModel request) {
        log.info("Checking credit for client: {} amount: {} {}",
            request.getClientId(), request.getAmount(), request.getCurrency());

        Map<String, Object> params = new HashMap<>();
        params.put("clientId", request.getClientId());
        params.put("clientName", request.getClientName());
        params.put("taxId", ""); // Would come from client profile
        params.put("requestedAmount", request.getAmount());
        params.put("currency", request.getCurrency());
        params.put("productType", request.getProductType());

        try {
            Map<String, Object> response = callApi("CLIENT_CREDIT_CHECK", params);

            return CreditCheckResult.builder()
                .approved("APPROVED".equals(response.get("status")))
                .creditScore(getInt(response, "creditScore"))
                .availableLimit(getBigDecimal(response, "availableLimit"))
                .riskLevel(getString(response, "riskLevel"))
                .approvalCode(getString(response, "approvalCode"))
                .message(getString(response, "errorMessage"))
                .build();

        } catch (Exception e) {
            log.error("Credit check failed for client {}: {}", request.getClientId(), e.getMessage());
            return CreditCheckResult.builder()
                .approved(false)
                .message("Credit check service unavailable: " + e.getMessage())
                .build();
        }
    }

    // ==========================================
    // KYC/AML Screening
    // ==========================================

    /**
     * Screen client against compliance databases (general screening).
     */
    public ComplianceScreeningResult screenClient(String clientName, String country, String taxId) {
        log.info("Screening client: {} country: {}", clientName, country);

        Map<String, Object> params = new HashMap<>();
        params.put("entityType", "COMPANY");
        params.put("entityName", clientName);
        params.put("country", country);
        params.put("taxId", taxId);
        params.put("dateOfBirth", null);

        try {
            Map<String, Object> response = callApi("KYC_AML_SCREENING", params);

            return ComplianceScreeningResult.builder()
                .clear("CLEAR".equals(response.get("screeningResult")))
                .matchCount(getInt(response, "matchCount"))
                .riskScore(getInt(response, "riskScore"))
                .screeningId(getString(response, "screeningId"))
                .alerts(getList(response, "alerts"))
                .requiresManualReview(Boolean.TRUE.equals(response.get("requiresManualReview")))
                .build();

        } catch (Exception e) {
            log.error("Compliance screening failed for {}: {}", clientName, e.getMessage());
            return ComplianceScreeningResult.builder()
                .clear(false)
                .requiresManualReview(true)
                .message("Screening service unavailable: " + e.getMessage())
                .build();
        }
    }

    /**
     * Screen entity against a specific compliance list.
     * @param screeningCode The screening code (e.g., SCREENING_OFAC_SDN, SCREENING_UN_CONSOLIDATED)
     * @param entityName Name of entity to screen
     * @param identification Entity identification (tax ID, etc.)
     * @param countryCode ISO country code
     * @return Screening result with match details
     */
    public SpecificScreeningResult screenAgainstList(String screeningCode, String entityName,
            String identification, String countryCode) {
        log.info("Screening {} against list: {} country: {}", entityName, screeningCode, countryCode);

        Map<String, Object> params = new HashMap<>();
        params.put("clientName", entityName);
        params.put("clientIdentification", identification);
        params.put("identificationType", "TAX_ID");
        params.put("countryCode", countryCode);
        params.put("searchType", "FUZZY");
        params.put("threshold", 85);

        try {
            Map<String, Object> response = callApi(screeningCode, params);

            boolean matchFound = Boolean.TRUE.equals(response.get("matchFound"));
            String status = matchFound ? "MATCH" : "CLEAR";
            String riskLevel = matchFound ? "HIGH" : "LOW";

            return SpecificScreeningResult.builder()
                .screeningCode(screeningCode)
                .screeningName(getScreeningName(screeningCode))
                .status(status)
                .matchFound(matchFound)
                .matchScore(getInt(response, "matchScore"))
                .matchCount(getInt(response, "matchCount"))
                .riskLevel(riskLevel)
                .matchedRecords(getList(response, "matches"))
                .searchComplete(Boolean.TRUE.equals(response.get("searchComplete")))
                .executedAt(LocalDateTime.now())
                .build();

        } catch (Exception e) {
            log.error("Screening {} failed for {}: {}", screeningCode, entityName, e.getMessage());
            return SpecificScreeningResult.builder()
                .screeningCode(screeningCode)
                .screeningName(getScreeningName(screeningCode))
                .status("ERROR")
                .matchFound(false)
                .riskLevel("UNKNOWN")
                .errorMessage("Screening service unavailable: " + e.getMessage())
                .searchComplete(false)
                .executedAt(LocalDateTime.now())
                .build();
        }
    }

    /**
     * Execute multiple screenings for an entity.
     */
    public List<SpecificScreeningResult> screenAgainstMultipleLists(List<String> screeningCodes,
            String entityName, String identification, String countryCode) {
        return screeningCodes.stream()
            .map(code -> screenAgainstList(code, entityName, identification, countryCode))
            .toList();
    }

    private String getScreeningName(String code) {
        return switch (code) {
            case "SCREENING_OFAC_SDN" -> "OFAC - Lista SDN";
            case "SCREENING_UN_CONSOLIDATED" -> "ONU - Lista Consolidada";
            case "SCREENING_UAFE_NACIONAL" -> "UAFE - Lista Nacional";
            case "SCREENING_INTERNAL_LIST" -> "Lista Interna Banco";
            case "SCREENING_PEPS" -> "Personas Expuestas Políticamente (PEPs)";
            case "SCREENING_ADVERSE_MEDIA" -> "Medios Adversos";
            default -> code.replace("SCREENING_", "").replace("_", " ");
        };
    }

    // ==========================================
    // Country Risk Assessment
    // ==========================================

    /**
     * Assess risk level for a country.
     */
    public CountryRiskResult assessCountryRisk(String countryCode) {
        log.info("Assessing country risk for: {}", countryCode);

        Map<String, Object> params = new HashMap<>();
        params.put("countryCode", countryCode);
        params.put("assessmentType", "TRADE_FINANCE");

        try {
            Map<String, Object> response = callApi("COUNTRY_RISK_ASSESSMENT", params);

            return CountryRiskResult.builder()
                .countryCode(countryCode)
                .riskLevel(getString(response, "riskLevel"))
                .riskScore(getInt(response, "riskScore"))
                .sanctioned(Boolean.TRUE.equals(response.get("sanctioned")))
                .restrictions(getList(response, "restrictions"))
                .build();

        } catch (Exception e) {
            log.error("Country risk assessment failed for {}: {}", countryCode, e.getMessage());
            return CountryRiskResult.builder()
                .countryCode(countryCode)
                .riskLevel("UNKNOWN")
                .message("Risk assessment service unavailable: " + e.getMessage())
                .build();
        }
    }

    // ==========================================
    // SWIFT/BIC Validation
    // ==========================================

    /**
     * Validate a SWIFT/BIC code.
     */
    public SwiftValidationResult validateSwiftCode(String swiftCode) {
        log.info("Validating SWIFT code: {}", swiftCode);

        Map<String, Object> params = new HashMap<>();
        params.put("swiftCode", swiftCode);

        try {
            Map<String, Object> response = callApi("SWIFT_BIC_VALIDATION", params);

            return SwiftValidationResult.builder()
                .valid(Boolean.TRUE.equals(response.get("isValid")))
                .swiftCode(swiftCode)
                .bankName(getString(response, "bankName"))
                .bankAddress(getString(response, "bankAddress"))
                .city(getString(response, "city"))
                .country(getString(response, "country"))
                .errorMessage(getString(response, "errorMessage"))
                .build();

        } catch (Exception e) {
            log.error("SWIFT validation failed for {}: {}", swiftCode, e.getMessage());
            return SwiftValidationResult.builder()
                .valid(false)
                .swiftCode(swiftCode)
                .errorMessage("SWIFT validation service unavailable: " + e.getMessage())
                .build();
        }
    }

    // ==========================================
    // Currency Exchange Rate
    // ==========================================

    /**
     * Get exchange rate between currencies.
     */
    public ExchangeRateResult getExchangeRate(String baseCurrency, String targetCurrency, BigDecimal amount) {
        log.info("Getting exchange rate: {} to {} for amount {}", baseCurrency, targetCurrency, amount);

        Map<String, Object> params = new HashMap<>();
        params.put("baseCurrency", baseCurrency);
        params.put("targetCurrency", targetCurrency);
        params.put("amount", amount);

        try {
            Map<String, Object> response = callApi("CURRENCY_EXCHANGE_RATE", params);

            return ExchangeRateResult.builder()
                .baseCurrency(baseCurrency)
                .targetCurrency(targetCurrency)
                .rate(getBigDecimal(response, "rate"))
                .convertedAmount(getBigDecimal(response, "convertedAmount"))
                .timestamp(getString(response, "timestamp"))
                .build();

        } catch (Exception e) {
            log.error("Exchange rate lookup failed: {}", e.getMessage());
            return ExchangeRateResult.builder()
                .baseCurrency(baseCurrency)
                .targetCurrency(targetCurrency)
                .errorMessage("Exchange rate service unavailable: " + e.getMessage())
                .build();
        }
    }

    // ==========================================
    // Pricing Calculation
    // ==========================================

    /**
     * Calculate fees for a trade finance product.
     */
    public PricingResult calculatePricing(ClientRequestReadModel request, int tenorDays) {
        log.info("Calculating pricing for: {} {} {}", request.getProductType(), request.getAmount(), request.getCurrency());

        Map<String, Object> params = new HashMap<>();
        params.put("productType", mapProductType(request.getProductType()));
        params.put("subType", request.getProductSubtype());
        params.put("amount", request.getAmount());
        params.put("currency", request.getCurrency());
        params.put("tenor", tenorDays);
        params.put("tenorUnit", "DAYS");
        params.put("clientSegment", "CORPORATE"); // Would come from client profile
        params.put("clientRiskRating", "A"); // Would come from credit check
        params.put("countryRisk", "LOW"); // Would come from country risk assessment

        try {
            Map<String, Object> response = callApi("TRADE_FINANCE_PRICING", params);

            return PricingResult.builder()
                .issuanceFee(getBigDecimal(response, "issuanceFee"))
                .commissionRate(getBigDecimal(response, "commissionRate"))
                .commissionAmount(getBigDecimal(response, "commissionAmount"))
                .swiftFee(getBigDecimal(response, "swiftFee"))
                .totalFees(getBigDecimal(response, "totalFees"))
                .effectiveRate(getBigDecimal(response, "effectiveRate"))
                .build();

        } catch (Exception e) {
            log.error("Pricing calculation failed: {}", e.getMessage());
            return PricingResult.builder()
                .errorMessage("Pricing service unavailable: " + e.getMessage())
                .build();
        }
    }

    // ==========================================
    // Core Banking Integration
    // ==========================================

    /**
     * Validate a bank account.
     */
    public AccountValidationResult validateAccount(String accountNumber, String accountType, String clientId) {
        log.info("Validating account: {} for client: {}", accountNumber, clientId);

        Map<String, Object> params = new HashMap<>();
        params.put("operation", "VALIDATE_ACCOUNT");
        params.put("accountNumber", accountNumber);
        params.put("accountType", accountType);
        params.put("clientId", clientId);

        try {
            Map<String, Object> response = callApi("CORE_BANKING_INTEGRATION", params);

            return AccountValidationResult.builder()
                .valid(Boolean.TRUE.equals(response.get("accountValid")))
                .accountNumber(accountNumber)
                .accountHolderName(getString(response, "accountHolderName"))
                .availableBalance(getBigDecimal(response, "availableBalance"))
                .currency(getString(response, "currency"))
                .transactionId(getString(response, "transactionId"))
                .errorMessage(getString(response, "message"))
                .build();

        } catch (Exception e) {
            log.error("Account validation failed: {}", e.getMessage());
            return AccountValidationResult.builder()
                .valid(false)
                .accountNumber(accountNumber)
                .errorMessage("Core banking service unavailable: " + e.getMessage())
                .build();
        }
    }

    /**
     * Create a balance hold for a pending operation.
     */
    public HoldResult createBalanceHold(String accountNumber, BigDecimal amount, String currency,
                                        String referenceNumber, String expirationDate) {
        log.info("Creating hold: {} {} on account {}", amount, currency, accountNumber);

        Map<String, Object> params = new HashMap<>();
        params.put("operation", "CREATE_HOLD");
        params.put("accountNumber", accountNumber);
        params.put("amount", amount);
        params.put("currency", currency);
        params.put("referenceNumber", referenceNumber);
        params.put("expirationDate", expirationDate);

        try {
            Map<String, Object> response = callApi("CORE_BANKING_INTEGRATION", params);

            return HoldResult.builder()
                .success("SUCCESS".equals(response.get("status")))
                .holdId(getString(response, "holdId"))
                .transactionId(getString(response, "transactionId"))
                .message(getString(response, "message"))
                .build();

        } catch (Exception e) {
            log.error("Create hold failed: {}", e.getMessage());
            return HoldResult.builder()
                .success(false)
                .message("Core banking service unavailable: " + e.getMessage())
                .build();
        }
    }

    // ==========================================
    // Notification Services
    // ==========================================

    /**
     * Send email notification.
     */
    public NotificationResult sendEmail(String to, String subject, String templateId,
                                        Map<String, String> templateVariables) {
        log.info("Sending email to: {} subject: {}", to, subject);

        Map<String, Object> params = new HashMap<>();
        params.put("senderEmail", "noreply@globalcmx.com");
        params.put("recipientEmail", to);
        params.put("ccEmails", new ArrayList<>());
        params.put("subject", subject);
        params.put("templateId", templateId);
        params.put("clientName", templateVariables.getOrDefault("clientName", ""));
        params.put("requestNumber", templateVariables.getOrDefault("requestNumber", ""));
        params.put("productType", templateVariables.getOrDefault("productType", ""));
        params.put("status", templateVariables.getOrDefault("status", ""));
        params.put("amount", templateVariables.getOrDefault("amount", ""));
        params.put("actionUrl", templateVariables.getOrDefault("actionUrl", ""));

        try {
            Map<String, Object> response = callApi("EMAIL_NOTIFICATION_SERVICE", params);

            return NotificationResult.builder()
                .success("SENT".equals(response.get("status")))
                .messageId(getString(response, "messageId"))
                .channel("EMAIL")
                .recipient(to)
                .build();

        } catch (Exception e) {
            log.error("Send email failed: {}", e.getMessage());
            return NotificationResult.builder()
                .success(false)
                .channel("EMAIL")
                .recipient(to)
                .errorMessage("Email service unavailable: " + e.getMessage())
                .build();
        }
    }

    /**
     * Send SMS notification.
     */
    public NotificationResult sendSms(String phoneNumber, String message) {
        log.info("Sending SMS to: {}", phoneNumber);

        Map<String, Object> params = new HashMap<>();
        params.put("phoneNumber", phoneNumber);
        params.put("message", message);

        try {
            Map<String, Object> response = callApi("SMS_NOTIFICATION_SERVICE", params);

            return NotificationResult.builder()
                .success("SENT".equals(response.get("status")))
                .messageId(getString(response, "messageId"))
                .channel("SMS")
                .recipient(phoneNumber)
                .build();

        } catch (Exception e) {
            log.error("Send SMS failed: {}", e.getMessage());
            return NotificationResult.builder()
                .success(false)
                .channel("SMS")
                .recipient(phoneNumber)
                .errorMessage("SMS service unavailable: " + e.getMessage())
                .build();
        }
    }

    // ==========================================
    // Private Helper Methods
    // ==========================================

    private Map<String, Object> callApi(String apiCode, Map<String, Object> params) {
        if (useMockResponses) {
            return getMockResponse(apiCode, params);
        } else {
            return callRealApi(apiCode, params);
        }
    }

    private Map<String, Object> getMockResponse(String apiCode, Map<String, Object> params) {
        // Simulate network delay
        if (mockDelayMs > 0) {
            try {
                Thread.sleep(mockDelayMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        // Find matching mock response
        String sql = """
            SELECT response_body, response_status_code
            FROM mock_api_response_config
            WHERE api_code = ? AND active = TRUE
            ORDER BY
                CASE WHEN match_field IS NOT NULL AND match_value = ? THEN 0 ELSE 1 END,
                is_default DESC
            LIMIT 1
            """;

        // Try to find matching scenario based on first parameter value
        String matchValue = params.values().stream()
            .filter(Objects::nonNull)
            .map(Object::toString)
            .findFirst()
            .orElse("");

        try {
            Map<String, Object> result = jdbcTemplate.queryForMap(sql, apiCode, matchValue);
            String responseBody = (String) result.get("response_body");

            if (responseBody != null) {
                return objectMapper.readValue(responseBody, new TypeReference<>() {});
            }
        } catch (Exception e) {
            log.warn("No mock response found for API: {}, using default", apiCode);
        }

        // Return default mock response
        return getDefaultMockResponse(apiCode);
    }

    private Map<String, Object> getDefaultMockResponse(String apiCode) {
        Map<String, Object> defaultResponse = new HashMap<>();
        defaultResponse.put("status", "SUCCESS");
        defaultResponse.put("message", "Mock response for " + apiCode);
        defaultResponse.put("timestamp", LocalDateTime.now().toString());
        return defaultResponse;
    }

    private Map<String, Object> callRealApi(String apiCode, Map<String, Object> params) {
        RuleContext context = new RuleContext();
        context.setAdditionalData(params);
        context.setEventType("CLIENT_PORTAL_API_CALL");
        context.setEventDateTime(LocalDateTime.now());

        ActionExecutionResult result = apiExecutor.execute(apiCode, context);

        if (Boolean.TRUE.equals(result.getSuccess()) && result.getOutputData() != null) {
            Object responseBody = result.getOutputData().get("responseBody");
            if (responseBody instanceof String) {
                try {
                    return objectMapper.readValue((String) responseBody, new TypeReference<>() {});
                } catch (Exception e) {
                    log.error("Error parsing API response", e);
                }
            }
        }

        throw new RuntimeException(result.getErrorMessage());
    }

    private String mapProductType(String productType) {
        if (productType == null) return "UNKNOWN";
        return switch (productType) {
            case "GUARANTEE_REQUEST" -> "GUARANTEE";
            case "LC_IMPORT_REQUEST" -> "LC_IMPORT";
            case "LC_EXPORT_REQUEST" -> "LC_EXPORT";
            case "COLLECTION_REQUEST" -> "COLLECTION";
            default -> productType;
        };
    }

    private String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    private Integer getInt(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).intValue();
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private BigDecimal getBigDecimal(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof Number) return BigDecimal.valueOf(((Number) value).doubleValue());
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getList(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof List) {
            return (List<Map<String, Object>>) value;
        }
        return new ArrayList<>();
    }

    // ==========================================
    // Result DTOs
    // ==========================================

    @lombok.Data
    @lombok.Builder
    public static class CreditCheckResult {
        private boolean approved;
        private Integer creditScore;
        private BigDecimal availableLimit;
        private String riskLevel;
        private String approvalCode;
        private String message;
    }

    @lombok.Data
    @lombok.Builder
    public static class ComplianceScreeningResult {
        private boolean clear;
        private Integer matchCount;
        private Integer riskScore;
        private String screeningId;
        private List<Map<String, Object>> alerts;
        private boolean requiresManualReview;
        private String message;
    }

    @lombok.Data
    @lombok.Builder
    public static class CountryRiskResult {
        private String countryCode;
        private String riskLevel;
        private Integer riskScore;
        private boolean sanctioned;
        private List<Map<String, Object>> restrictions;
        private String message;
    }

    @lombok.Data
    @lombok.Builder
    public static class SwiftValidationResult {
        private boolean valid;
        private String swiftCode;
        private String bankName;
        private String bankAddress;
        private String city;
        private String country;
        private String errorMessage;
    }

    @lombok.Data
    @lombok.Builder
    public static class ExchangeRateResult {
        private String baseCurrency;
        private String targetCurrency;
        private BigDecimal rate;
        private BigDecimal convertedAmount;
        private String timestamp;
        private String errorMessage;
    }

    @lombok.Data
    @lombok.Builder
    public static class PricingResult {
        private BigDecimal issuanceFee;
        private BigDecimal commissionRate;
        private BigDecimal commissionAmount;
        private BigDecimal swiftFee;
        private BigDecimal totalFees;
        private BigDecimal effectiveRate;
        private String errorMessage;
    }

    @lombok.Data
    @lombok.Builder
    public static class AccountValidationResult {
        private boolean valid;
        private String accountNumber;
        private String accountHolderName;
        private BigDecimal availableBalance;
        private String currency;
        private String transactionId;
        private String errorMessage;
    }

    @lombok.Data
    @lombok.Builder
    public static class HoldResult {
        private boolean success;
        private String holdId;
        private String transactionId;
        private String message;
    }

    @lombok.Data
    @lombok.Builder
    public static class NotificationResult {
        private boolean success;
        private String messageId;
        private String channel;
        private String recipient;
        private String errorMessage;
    }

    @lombok.Data
    @lombok.Builder
    public static class SpecificScreeningResult {
        private String screeningCode;
        private String screeningName;
        private String status;  // CLEAR, MATCH, ERROR
        private boolean matchFound;
        private Integer matchScore;
        private Integer matchCount;
        private String riskLevel;  // LOW, MEDIUM, HIGH, UNKNOWN
        private List<Map<String, Object>> matchedRecords;
        private boolean searchComplete;
        private LocalDateTime executedAt;
        private String errorMessage;
    }
}
