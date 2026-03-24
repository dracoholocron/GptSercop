package com.globalcmx.api.service.contabilidad;

import lombok.extern.slf4j.Slf4j;
import org.drools.decisiontable.DecisionTableProviderImpl;
import org.kie.api.KieServices;
import org.kie.api.builder.KieBuilder;
import org.kie.api.builder.KieFileSystem;
import org.kie.api.builder.KieModule;
import org.kie.api.io.Resource;
import org.kie.api.runtime.KieContainer;
import org.kie.api.runtime.KieSession;
import org.kie.internal.io.ResourceFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.InputStream;

/**
 * Service to process accounting configuration using Drools Decision Tables
 * Based on the configuracionContable.xls file
 */
@Slf4j
@Service
public class AccountingConfigurationService {

    private KieContainer kieContainer;

    @PostConstruct
    public void init() {
        try {
            log.info("Initializing accounting configuration service with Drools...");

            KieServices kieServices = KieServices.Factory.get();

            // Load Excel file from classpath
            ClassPathResource resource = new ClassPathResource("configuracionContable.xls");
            InputStream inputStream = resource.getInputStream();

            // Create Drools resource
            Resource dtable = ResourceFactory.newInputStreamResource(inputStream);
            dtable.setResourceType(org.kie.api.io.ResourceType.DTABLE);

            // Create KieFileSystem and add resource
            KieFileSystem kfs = kieServices.newKieFileSystem();
            kfs.write("src/main/resources/contabilidad/configuracionContable.xls", dtable);

            // Compile
            KieBuilder kieBuilder = kieServices.newKieBuilder(kfs);
            kieBuilder.buildAll();

            if (kieBuilder.getResults().hasMessages(org.kie.api.builder.Message.Level.ERROR)) {
                log.error("Error compiling rules: {}", kieBuilder.getResults().toString());
                throw new RuntimeException("Error compiling accounting rules");
            }

            KieModule kieModule = kieBuilder.getKieModule();
            kieContainer = kieServices.newKieContainer(kieModule.getReleaseId());

            log.info("✅ Accounting configuration service initialized successfully");

        } catch (Exception e) {
            log.error("Error initializing accounting configuration", e);
            throw new RuntimeException("Error initializing accounting configuration", e);
        }
    }

    /**
     * Gets accounting configuration for a product and event
     *
     * @param product Product/SWIFT message type (MT700, MT103, etc.)
     * @param event Event to process (EMISSION_LC_EXPORT, etc.)
     * @return AccountingConfiguration with accounts to use
     */
    public AccountingConfiguration getConfiguration(String product, String event) {
        log.debug("Getting accounting configuration for product: {}, event: {}", product, event);

        // Create Drools session
        KieSession kieSession = kieContainer.newKieSession();

        try {
            // Create object to receive configuration
            AccountingConfiguration config = new AccountingConfiguration();

            // Insert facts into session
            kieSession.insert(config);
            kieSession.insert(product);
            kieSession.insert(event);

            // Execute rules
            int rulesFired = kieSession.fireAllRules();

            log.debug("{} rules executed", rulesFired);

            if (config.getDebitAccount() == null || config.getCreditAccount() == null) {
                log.warn("Accounting configuration not found for product: {}, event: {}",
                        product, event);
                throw new AccountingConfigurationNotFoundException(
                    String.format("No configuration exists for product=%s, event=%s", product, event)
                );
            }

            log.info("Configuration found - Debit: {}, Credit: {}",
                    config.getDebitAccount(), config.getCreditAccount());

            return config;

        } finally {
            kieSession.dispose();
        }
    }

    /**
     * Gets ALL configurations for a specific event (for composite entries)
     * This returns multiple rules that share the same product and event
     *
     * @param product Product type
     * @param event Event type
     * @return List of all related configurations
     */
    public List<AccountingConfiguration> getAllConfigurationsForEvent(String product, String event) {
        log.debug("Getting ALL configurations for product: {}, event: {}", product, event);

        KieSession kieSession = kieContainer.newKieSession();

        try {
            List<AccountingConfiguration> configurations = new ArrayList<>();

            // Query for ALL rules matching this product and event
            // In a composite entry, there will be multiple rules (Line1, Line2, etc.)
            for (int i = 1; i <= 10; i++) { // Max 10 lines per composite entry
                AccountingConfiguration config = new AccountingConfiguration();

                kieSession.insert(config);
                kieSession.insert(product);
                kieSession.insert(event);

                kieSession.fireAllRules();

                if (config.getProduct() != null && config.getEvent() != null) {
                    configurations.add(config);
                }

                kieSession.delete(kieSession.getFactHandle(config));
                kieSession.delete(kieSession.getFactHandle(product));
                kieSession.delete(kieSession.getFactHandle(event));
            }

            log.debug("Found {} configuration(s) for product: {}, event: {}",
                configurations.size(), product, event);

            return configurations;

        } finally {
            kieSession.dispose();
        }
    }

    /**
     * Gets all configurations for a product type
     */
    public List<AccountingConfiguration> getConfigurationsByProduct(String product) {
        List<String> commonEvents = getEventsByProduct(product);

        return commonEvents.stream()
            .map(event -> {
                try {
                    return getConfiguration(product, event);
                } catch (AccountingConfigurationNotFoundException e) {
                    return null;
                }
            })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }

    /**
     * Returns typical events by product type
     */
    private List<String> getEventsByProduct(String product) {
        return switch (product) {
            case "MT700" -> List.of(
                // LC Export
                "EMISSION_LC_EXPORT",
                "ADVICE_LC_EXPORT",
                "CONFIRMATION_LC_EXPORT",
                "NEGOTIATION_LC_EXPORT",
                "PAYMENT_LC_EXPORT",
                "COMMISSION_LC_EXPORT",
                // LC Import
                "EMISSION_LC_IMPORT",
                "NEGOTIATION_LC_IMPORT",
                "AMENDMENT_LC_IMPORT",
                "DEFERRED_COMMISSION_LC_IMPORT",
                "COMMISSION_CHARGE_LC_IMPORT",
                "OPENING_LC_IMPORT",
                "PAYMENT_LC_IMPORT",
                "ACCEPTANCE_LC_IMPORT"
            );
            case "MT103" -> List.of(
                "TRANSFER_SENT",
                "TRANSFER_RECEIVED",
                "TRANSFER_COMMISSION"
            );
            case "MT400" -> List.of(
                "RECEIPT_COLLECTION",
                "PAYMENT_COLLECTION",
                "COMMISSION_COLLECTION"
            );
            case "MT760" -> List.of(
                "GUARANTEE_ISSUANCE",
                "GUARANTEE_EXECUTION",
                "GUARANTEE_RELEASE"
            );
            case "FINANCING" -> List.of(
                "FINANCING_DISBURSEMENT",
                "PRINCIPAL_PAYMENT",
                "INTEREST_PAYMENT",
                "INTEREST_PROVISION"
            );
            default -> List.of();
        };
    }

    /**
     * Generates accounting entry based on configuration
     */
    public AccountingEntry generateEntry(
            String product,
            String event,
            BigDecimal amount,
            String currency,
            String reference) {

        AccountingConfiguration config = getConfiguration(product, event);

        // Parse accounts (format: "CODE - NAME")
        String debitCode = config.getDebitAccount().split(" - ")[0];
        String creditCode = config.getCreditAccount().split(" - ")[0];

        return AccountingEntry.builder()
            .date(LocalDateTime.now())
            .type(product)
            .event(event)
            .reference(reference)
            .currency(currency)
            .details(List.of(
                EntryDetail.builder()
                    .account(debitCode)
                    .debit(amount)
                    .credit(BigDecimal.ZERO)
                    .build(),
                EntryDetail.builder()
                    .account(creditCode)
                    .debit(BigDecimal.ZERO)
                    .credit(amount)
                    .build()
            ))
            .build();
    }
}

/**
 * Object that stores accounting configuration
 * Modified by Drools rules
 * Extended to support composite entries with multiple related rules
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class AccountingConfiguration {
    private String product;
    private String event;
    private String debitAccount;
    private String creditAccount;
    private Boolean active;
    // Fields for composite entries
    private String lineNumber;    // Line1, Line2, Line3, etc.
    private String amountType;    // COMMISSION, SWIFT_FEE, POSTAGE, VAT, TOTAL
    private String movementType;  // DEBIT, CREDIT
    private String fixedAmount;   // Fixed amount (e.g., "25.00" for SWIFT fee) - Column L
    private String rate;          // Percentage rate (e.g., "0.15" for 15% VAT) - Column M
    private Boolean taxable;      // Whether this charge is subject to VAT - Column N
}

/**
 * Exception when configuration is not found
 */
class AccountingConfigurationNotFoundException extends RuntimeException {
    public AccountingConfigurationNotFoundException(String message) {
        super(message);
    }
}

/**
 * Example usage of the service
 */
@Component
@RequiredArgsConstructor
class AccountingUsageExample {

    private final AccountingConfigurationService configurationService;

    public void lcExportEmissionExample() {
        // Scenario: LC Export Emission for USD 100,000

        String product = "MT700";
        String event = "EMISSION_LC_EXPORT";
        BigDecimal amount = new BigDecimal("100000.00");

        // Get accounting configuration
        AccountingConfiguration config = configurationService.getConfiguration(product, event);

        System.out.println("=== Accounting Configuration ===");
        System.out.println("Product: " + config.getProduct());
        System.out.println("Event: " + config.getEvent());
        System.out.println("Debit Account: " + config.getDebitAccount());
        System.out.println("Credit Account: " + config.getCreditAccount());

        // Generate accounting entry
        AccountingEntry entry = configurationService.generateEntry(
            product,
            event,
            amount,
            "USD",
            "LC-2025-001"
        );

        System.out.println("\n=== Generated Accounting Entry ===");
        System.out.println("Date: " + entry.getDate());
        System.out.println("Reference: " + entry.getReference());
        System.out.println("\nDetails:");
        entry.getDetails().forEach(detail -> {
            System.out.printf("Account: %s | Debit: %.2f | Credit: %.2f%n",
                detail.getAccount(),
                detail.getDebit(),
                detail.getCredit()
            );
        });
    }

    public void lcImportExample() {
        // Scenario: LC Import Amendment for USD 25,000

        String product = "MT700";
        String event = "AMENDMENT_LC_IMPORT";
        BigDecimal amount = new BigDecimal("25000.00");

        // Get accounting configuration
        AccountingConfiguration config = configurationService.getConfiguration(product, event);

        // Generate accounting entry
        AccountingEntry entry = configurationService.generateEntry(
            product,
            event,
            amount,
            "USD",
            "LC-IMP-2025-003"
        );

        System.out.println("\n=== LC Import Amendment ===");
        System.out.println("Reference: " + entry.getReference());
        System.out.println("Amount: USD " + amount);
        entry.getDetails().forEach(detail -> {
            System.out.printf("Account: %s | Debit: %.2f | Credit: %.2f%n",
                detail.getAccount(),
                detail.getDebit(),
                detail.getCredit()
            );
        });
    }
}
