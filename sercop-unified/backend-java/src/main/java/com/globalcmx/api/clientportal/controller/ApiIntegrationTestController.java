package com.globalcmx.api.clientportal.controller;

import com.globalcmx.api.clientportal.service.ClientPortalApiIntegrationService;
import com.globalcmx.api.clientportal.service.ClientPortalApiIntegrationService.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for testing external API integrations.
 * Provides endpoints to test mock APIs configured in V183 migration.
 */
@Slf4j
@RestController
@RequestMapping("/integration-test")
@RequiredArgsConstructor
public class ApiIntegrationTestController {

    private final ClientPortalApiIntegrationService integrationService;

    /**
     * Test credit check API.
     */
    @PostMapping("/credit-check")
    @PreAuthorize("hasPermission(null, 'CAN_TEST_API_CONFIG')")
    public ResponseEntity<CreditCheckResult> testCreditCheck(@RequestBody CreditCheckRequest request) {
        log.info("Testing credit check for client: {}", request.clientId());

        // Create a mock request for testing
        var clientRequest = new com.globalcmx.api.clientportal.entity.ClientRequestReadModel();
        clientRequest.setClientId(request.clientId());
        clientRequest.setClientName(request.clientName());
        clientRequest.setAmount(request.amount());
        clientRequest.setCurrency(request.currency());
        clientRequest.setProductType(request.productType());

        CreditCheckResult result = integrationService.checkClientCredit(clientRequest);
        return ResponseEntity.ok(result);
    }

    /**
     * Test KYC/AML screening API (general screening).
     */
    @PostMapping("/compliance-screening")
    @PreAuthorize("hasPermission(null, 'CAN_TEST_API_CONFIG')")
    public ResponseEntity<ComplianceScreeningResult> testComplianceScreening(@RequestBody ComplianceScreeningRequest request) {
        log.info("Testing compliance screening for: {}", request.entityName());

        ComplianceScreeningResult result = integrationService.screenClient(
            request.entityName(),
            request.country(),
            request.taxId()
        );
        return ResponseEntity.ok(result);
    }

    /**
     * Execute screening against a specific list (OFAC, UN, PEPs, etc.)
     */
    @PostMapping("/screening/{screeningCode}")
    @PreAuthorize("hasPermission(null, 'CAN_TEST_API_CONFIG')")
    public ResponseEntity<ClientPortalApiIntegrationService.SpecificScreeningResult> executeSpecificScreening(
            @PathVariable String screeningCode,
            @RequestBody SpecificScreeningRequest request) {
        log.info("Executing {} screening for: {}", screeningCode, request.entityName());

        var result = integrationService.screenAgainstList(
            screeningCode,
            request.entityName(),
            request.identification(),
            request.countryCode()
        );
        return ResponseEntity.ok(result);
    }

    /**
     * Execute multiple screenings for an entity.
     */
    @PostMapping("/screening/batch")
    @PreAuthorize("hasPermission(null, 'CAN_TEST_API_CONFIG')")
    public ResponseEntity<List<ClientPortalApiIntegrationService.SpecificScreeningResult>> executeBatchScreening(
            @RequestBody BatchScreeningRequest request) {
        log.info("Executing batch screening for: {} lists: {}", request.entityName(), request.screeningCodes());

        var results = integrationService.screenAgainstMultipleLists(
            request.screeningCodes(),
            request.entityName(),
            request.identification(),
            request.countryCode()
        );
        return ResponseEntity.ok(results);
    }

    /**
     * Test country risk assessment API.
     */
    @GetMapping("/country-risk/{countryCode}")
    @PreAuthorize("hasPermission(null, 'CAN_TEST_API_CONFIG')")
    public ResponseEntity<CountryRiskResult> testCountryRisk(@PathVariable String countryCode) {
        log.info("Testing country risk for: {}", countryCode);

        CountryRiskResult result = integrationService.assessCountryRisk(countryCode);
        return ResponseEntity.ok(result);
    }

    /**
     * Test SWIFT/BIC validation API.
     */
    @GetMapping("/swift-validate/{swiftCode}")
    @PreAuthorize("hasPermission(null, 'CAN_TEST_API_CONFIG')")
    public ResponseEntity<SwiftValidationResult> testSwiftValidation(@PathVariable String swiftCode) {
        log.info("Testing SWIFT validation for: {}", swiftCode);

        SwiftValidationResult result = integrationService.validateSwiftCode(swiftCode);
        return ResponseEntity.ok(result);
    }

    /**
     * Test exchange rate API.
     */
    @GetMapping("/exchange-rate")
    @PreAuthorize("hasPermission(null, 'CAN_TEST_API_CONFIG')")
    public ResponseEntity<ExchangeRateResult> testExchangeRate(
            @RequestParam String base,
            @RequestParam String target,
            @RequestParam(defaultValue = "1000") BigDecimal amount) {
        log.info("Testing exchange rate: {} to {}", base, target);

        ExchangeRateResult result = integrationService.getExchangeRate(base, target, amount);
        return ResponseEntity.ok(result);
    }

    /**
     * Test pricing calculation API.
     */
    @PostMapping("/pricing")
    @PreAuthorize("hasPermission(null, 'CAN_TEST_API_CONFIG')")
    public ResponseEntity<PricingResult> testPricing(@RequestBody PricingRequest request) {
        log.info("Testing pricing for: {} {}", request.productType(), request.amount());

        var clientRequest = new com.globalcmx.api.clientportal.entity.ClientRequestReadModel();
        clientRequest.setProductType(request.productType());
        clientRequest.setProductSubtype(request.subType());
        clientRequest.setAmount(request.amount());
        clientRequest.setCurrency(request.currency());

        PricingResult result = integrationService.calculatePricing(clientRequest, request.tenorDays());
        return ResponseEntity.ok(result);
    }

    /**
     * Test account validation API.
     */
    @PostMapping("/account-validate")
    @PreAuthorize("hasPermission(null, 'CAN_TEST_API_CONFIG')")
    public ResponseEntity<AccountValidationResult> testAccountValidation(@RequestBody AccountValidationRequest request) {
        log.info("Testing account validation for: {}", request.accountNumber());

        AccountValidationResult result = integrationService.validateAccount(
            request.accountNumber(),
            request.accountType(),
            request.clientId()
        );
        return ResponseEntity.ok(result);
    }

    /**
     * Test create balance hold API.
     */
    @PostMapping("/create-hold")
    @PreAuthorize("hasPermission(null, 'CAN_TEST_API_CONFIG')")
    public ResponseEntity<HoldResult> testCreateHold(@RequestBody CreateHoldRequest request) {
        log.info("Testing create hold for: {} {}", request.amount(), request.currency());

        HoldResult result = integrationService.createBalanceHold(
            request.accountNumber(),
            request.amount(),
            request.currency(),
            request.referenceNumber(),
            request.expirationDate()
        );
        return ResponseEntity.ok(result);
    }

    /**
     * Test email notification API.
     */
    @PostMapping("/send-email")
    @PreAuthorize("hasPermission(null, 'CAN_TEST_API_CONFIG')")
    public ResponseEntity<NotificationResult> testSendEmail(@RequestBody SendEmailRequest request) {
        log.info("Testing send email to: {}", request.to());

        Map<String, String> variables = new HashMap<>();
        variables.put("clientName", request.clientName());
        variables.put("requestNumber", request.requestNumber());
        variables.put("productType", request.productType());
        variables.put("status", request.status());
        variables.put("amount", request.amount());
        variables.put("actionUrl", request.actionUrl());

        NotificationResult result = integrationService.sendEmail(
            request.to(),
            request.subject(),
            request.templateId(),
            variables
        );
        return ResponseEntity.ok(result);
    }

    /**
     * Test SMS notification API.
     */
    @PostMapping("/send-sms")
    @PreAuthorize("hasPermission(null, 'CAN_TEST_API_CONFIG')")
    public ResponseEntity<NotificationResult> testSendSms(@RequestBody SendSmsRequest request) {
        log.info("Testing send SMS to: {}", request.phoneNumber());

        NotificationResult result = integrationService.sendSms(request.phoneNumber(), request.message());
        return ResponseEntity.ok(result);
    }

    /**
     * Get all available test scenarios.
     */
    @GetMapping("/scenarios")
    @PreAuthorize("hasPermission(null, 'CAN_VIEW_API_CONFIG')")
    public ResponseEntity<Map<String, Object>> getTestScenarios() {
        Map<String, Object> scenarios = new HashMap<>();

        scenarios.put("creditCheck", Map.of(
            "description", "Test credit check scenarios",
            "endpoints", Map.of(
                "approved", "POST /api/integration-test/credit-check with clientId: CLI-001",
                "rejected", "POST /api/integration-test/credit-check with clientId: CLI-RISKY",
                "pending", "POST /api/integration-test/credit-check with requestedAmount: 1000000"
            )
        ));

        scenarios.put("complianceScreening", Map.of(
            "description", "Test KYC/AML screening scenarios",
            "endpoints", Map.of(
                "clear", "POST /api/integration-test/compliance-screening with any normal name",
                "potentialMatch", "POST /api/integration-test/compliance-screening with name: Suspicious Company"
            )
        ));

        scenarios.put("countryRisk", Map.of(
            "description", "Test country risk assessment",
            "endpoints", Map.of(
                "lowRisk", "GET /api/integration-test/country-risk/US",
                "highRisk", "GET /api/integration-test/country-risk/IR"
            )
        ));

        scenarios.put("swiftValidation", Map.of(
            "description", "Test SWIFT/BIC code validation",
            "endpoints", Map.of(
                "valid", "GET /api/integration-test/swift-validate/CHASUS33XXX",
                "invalid", "GET /api/integration-test/swift-validate/INVALID123"
            )
        ));

        scenarios.put("exchangeRate", Map.of(
            "description", "Test exchange rate lookup",
            "endpoints", Map.of(
                "usdToEur", "GET /api/integration-test/exchange-rate?base=USD&target=EUR&amount=1000"
            )
        ));

        scenarios.put("notifications", Map.of(
            "description", "Test notification services",
            "endpoints", Map.of(
                "email", "POST /api/integration-test/send-email",
                "sms", "POST /api/integration-test/send-sms"
            )
        ));

        return ResponseEntity.ok(scenarios);
    }

    // Request DTOs
    public record CreditCheckRequest(
        String clientId,
        String clientName,
        BigDecimal amount,
        String currency,
        String productType
    ) {}

    public record ComplianceScreeningRequest(
        String entityName,
        String country,
        String taxId
    ) {}

    public record PricingRequest(
        String productType,
        String subType,
        BigDecimal amount,
        String currency,
        int tenorDays
    ) {}

    public record AccountValidationRequest(
        String accountNumber,
        String accountType,
        String clientId
    ) {}

    public record CreateHoldRequest(
        String accountNumber,
        BigDecimal amount,
        String currency,
        String referenceNumber,
        String expirationDate
    ) {}

    public record SendEmailRequest(
        String to,
        String subject,
        String templateId,
        String clientName,
        String requestNumber,
        String productType,
        String status,
        String amount,
        String actionUrl
    ) {}

    public record SendSmsRequest(
        String phoneNumber,
        String message
    ) {}

    public record SpecificScreeningRequest(
        String entityName,
        String identification,
        String countryCode
    ) {}

    public record BatchScreeningRequest(
        List<String> screeningCodes,
        String entityName,
        String identification,
        String countryCode
    ) {}
}
