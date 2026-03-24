package com.globalcmx.api.service.contabilidad;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service to handle composite entries using multiple Drools rules
 * This maintains full configurability - all accounts are defined in the Excel file
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CompositeEntryService {

    private final AccountingConfigurationService configurationService;

    /**
     * Generates composite entry for LC Import commission and internal charges
     *
     * This method reads MULTIPLE related rules from Drools (all with same event)
     * and assembles them into a single composite accounting entry.
     *
     * All accounts are configured in the Excel file - NO HARDCODED VALUES!
     * - Fixed amounts (SWIFT_FEE, POSTAGE) can be configured in Excel Column L
     * - Percentage rates (VAT) can be configured in Excel Column M
     * - Parameters can be passed for flexibility if not fixed in Excel
     *
     * @param customerAccount Customer's account number
     * @param commissionAmount Calculated commission amount
     * @param postageAmount Postage service amount (optional if fixed in Excel)
     * @param reference Transaction reference
     * @return Complete composite accounting entry
     */
    public AccountingEntry generateLCImportCommissionCharge(
            String customerAccount,
            BigDecimal commissionAmount,
            BigDecimal postageAmount,
            String reference) {

        String product = "MT700";
        String event = "COMMISSION_CHARGE_LC_IMPORT";

        log.info("Generating composite entry for LC Import commission charge");

        // Get ALL rules for this event from Drools
        List<AccountingConfiguration> rules = configurationService.getAllConfigurationsForEvent(product, event);

        if (rules.isEmpty()) {
            throw new IllegalStateException(
                String.format("No composite rules found for product=%s, event=%s", product, event)
            );
        }

        log.debug("Found {} rules for composite entry", rules.size());

        // Sort by line number to ensure correct order
        rules.sort(Comparator.comparing(AccountingConfiguration::getLineNumber));

        // Get fixed amounts from rules (now configurable in Excel!)
        // Account 559004600000000000 - SWIFT MESSAGE SERVICE FEE (from Column L)
        BigDecimal swiftFee = getFixedAmountFromRules(rules, "SWIFT_FEE", new BigDecimal("25.00"));

        // Account 559005300000000000 - POSTAGE SERVICE FEE (from Column L)
        BigDecimal postageFee = getFixedAmountFromRules(rules, "POSTAGE", postageAmount);

        // Get VAT rate from rules (now configurable in Excel Column M!)
        BigDecimal vatRate = getVatRateFromRules(rules);

        // Calculate taxable base - sum ALL charges marked as taxable in Column N
        // This is FULLY FLEXIBLE - each country can configure which charges are taxable
        // Example: Some countries tax SWIFT + POSTAGE, others may include COMMISSION
        BigDecimal taxableBase = calculateTaxableBase(
            rules,
            commissionAmount,
            swiftFee,
            postageFee
        );

        // Calculate VAT amount
        BigDecimal vatAmount = taxableBase.multiply(vatRate)
            .setScale(2, RoundingMode.HALF_UP);

        log.debug("Taxable base: {}, VAT rate: {}, VAT amount: {}",
            taxableBase, vatRate, vatAmount);

        // Calculate total debit
        BigDecimal totalDebit = commissionAmount
            .add(swiftFee)
            .add(postageFee)
            .add(vatAmount);

        log.debug("Commission: {}, SWIFT: {}, Postage: {}, VAT: {}, Total: {}",
            commissionAmount, swiftFee, postageFee, vatAmount, totalDebit);

        // Build composite entry from rules
        List<EntryDetail> details = new ArrayList<>();

        for (AccountingConfiguration rule : rules) {
            BigDecimal amount = getAmountForType(
                rule,
                commissionAmount,
                swiftFee,
                postageFee,
                vatAmount,
                totalDebit
            );

            String account = getAccountFromRule(rule, customerAccount);
            String description = getDescriptionForType(rule.getAmountType(), rule.getMovementType());

            if ("DEBIT".equalsIgnoreCase(rule.getMovementType())) {
                details.add(EntryDetail.builder()
                    .account(account)
                    .description(description)
                    .debit(amount)
                    .credit(BigDecimal.ZERO)
                    .build()
                );
            } else if ("CREDIT".equalsIgnoreCase(rule.getMovementType())) {
                details.add(EntryDetail.builder()
                    .account(account)
                    .description(description)
                    .debit(BigDecimal.ZERO)
                    .credit(amount)
                    .build()
                );
            }
        }

        // Verify accounting equation
        BigDecimal totalDebitSum = details.stream()
            .map(EntryDetail::getDebit)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCreditSum = details.stream()
            .map(EntryDetail::getCredit)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalDebitSum.compareTo(totalCreditSum) != 0) {
            throw new IllegalStateException(
                String.format("Accounting equation not balanced: Debit=%s, Credit=%s",
                    totalDebitSum, totalCreditSum)
            );
        }

        return AccountingEntry.builder()
            .date(LocalDateTime.now())
            .type(product)
            .event(event)
            .reference(reference)
            .currency("USD")
            .totalDebit(totalDebitSum)
            .totalCredit(totalCreditSum)
            .details(details)
            .build();
    }

    /**
     * Gets the account from the rule, replacing customer account placeholder if needed
     */
    private String getAccountFromRule(AccountingConfiguration rule, String customerAccount) {
        // For Line1 (customer debit), use the parameter account
        if ("Line1".equals(rule.getLineNumber()) && "DEBIT".equalsIgnoreCase(rule.getMovementType())) {
            return customerAccount;
        }

        // For credit lines, extract account number from rule
        if (rule.getCreditAccount() != null && !rule.getCreditAccount().isEmpty()) {
            String account = rule.getCreditAccount();
            // Extract account number (before the " - " separator)
            int dashIndex = account.indexOf(" - ");
            return dashIndex > 0 ? account.substring(0, dashIndex) : account;
        }

        if (rule.getDebitAccount() != null && !rule.getDebitAccount().isEmpty()) {
            String account = rule.getDebitAccount();
            int dashIndex = account.indexOf(" - ");
            return dashIndex > 0 ? account.substring(0, dashIndex) : account;
        }

        throw new IllegalStateException("No account found in rule: " + rule.getLineNumber());
    }

    /**
     * Extracts fixed amount from rules (reads from Excel Column L)
     * If no fixed amount is configured, uses the provided default value
     *
     * @param rules List of accounting rules
     * @param amountType Type of amount to extract (SWIFT_FEE, POSTAGE, etc.)
     * @param defaultValue Default value if not configured in Excel
     * @return Fixed amount from Excel or default value
     */
    private BigDecimal getFixedAmountFromRules(List<AccountingConfiguration> rules,
                                                String amountType,
                                                BigDecimal defaultValue) {
        return rules.stream()
            .filter(rule -> amountType.equals(rule.getAmountType()))
            .findFirst()
            .map(rule -> {
                String fixedAmount = rule.getFixedAmount();
                if (fixedAmount != null && !fixedAmount.isEmpty()) {
                    try {
                        return new BigDecimal(fixedAmount);
                    } catch (NumberFormatException e) {
                        log.warn("Invalid fixed amount for {}: {}, using default {}",
                                amountType, fixedAmount, defaultValue);
                        return defaultValue;
                    }
                }
                return defaultValue; // Fallback if not configured
            })
            .orElse(defaultValue);
    }

    /**
     * Extracts VAT rate from rules (reads from Excel Column M)
     * If no rate is configured, uses default 15% (0.15)
     *
     * @param rules List of accounting rules
     * @return VAT rate from Excel or default 0.15
     */
    private BigDecimal getVatRateFromRules(List<AccountingConfiguration> rules) {
        return rules.stream()
            .filter(rule -> "VAT".equals(rule.getAmountType()))
            .findFirst()
            .map(rule -> {
                String rateStr = rule.getRate();
                if (rateStr != null && !rateStr.isEmpty()) {
                    try {
                        return new BigDecimal(rateStr);
                    } catch (NumberFormatException e) {
                        log.warn("Invalid VAT rate: {}, using default 0.15 (15%)", rateStr);
                        return new BigDecimal("0.15");
                    }
                }
                return new BigDecimal("0.15"); // Default 15% if not configured
            })
            .orElse(new BigDecimal("0.15"));
    }

    /**
     * Calculates taxable base by summing all charges marked as taxable in Excel Column N
     *
     * This provides COMPLETE FLEXIBILITY - each country/bank can configure which charges
     * are subject to tax by setting Column N = True in the Excel file.
     *
     * Examples:
     * - Country A: Only SWIFT + POSTAGE are taxable
     * - Country B: SWIFT + POSTAGE + COMMISSION are taxable
     * - Country C: Only COMMISSION is taxable
     *
     * NO HARDCODED ASSUMPTIONS - everything configured in Excel!
     *
     * @param rules List of accounting rules
     * @param commission Commission amount
     * @param swiftFee SWIFT fee amount
     * @param postage Postage fee amount
     * @return Sum of all amounts marked as taxable
     */
    private BigDecimal calculateTaxableBase(
            List<AccountingConfiguration> rules,
            BigDecimal commission,
            BigDecimal swiftFee,
            BigDecimal postage) {

        BigDecimal taxableBase = BigDecimal.ZERO;

        for (AccountingConfiguration rule : rules) {
            // Skip if not marked as taxable
            if (rule.getTaxable() == null || !rule.getTaxable()) {
                continue;
            }

            // Skip the VAT line itself
            if ("VAT".equals(rule.getAmountType())) {
                continue;
            }

            // Get the amount for this line
            BigDecimal amount = BigDecimal.ZERO;
            String amountType = rule.getAmountType();

            switch (amountType) {
                case "COMMISSION":
                    amount = commission;
                    log.debug("Adding COMMISSION to taxable base: {}", amount);
                    break;
                case "SWIFT_FEE":
                    amount = swiftFee;
                    log.debug("Adding SWIFT_FEE to taxable base: {}", amount);
                    break;
                case "POSTAGE":
                    amount = postage;
                    log.debug("Adding POSTAGE to taxable base: {}", amount);
                    break;
                default:
                    // Skip unknown types
                    continue;
            }

            taxableBase = taxableBase.add(amount);
        }

        log.info("Calculated taxable base from {} taxable charges: {}",
            (int) rules.stream().filter(r -> Boolean.TRUE.equals(r.getTaxable())).count(),
            taxableBase);

        return taxableBase;
    }

    /**
     * Gets the amount based on the amount type defined in the rule
     * Now supports fixed amounts from Excel!
     */
    private BigDecimal getAmountForType(
            AccountingConfiguration rule,
            BigDecimal commission,
            BigDecimal swiftFee,
            BigDecimal postage,
            BigDecimal vat,
            BigDecimal total) {

        // If rule has a fixed amount, use it (already retrieved for SWIFT_FEE)
        String amountType = rule.getAmountType();

        return switch (amountType) {
            case "TOTAL" -> total;
            case "COMMISSION" -> commission;
            case "SWIFT_FEE" -> swiftFee; // Already extracted from Excel
            case "POSTAGE" -> postage;
            case "VAT" -> vat;
            default -> BigDecimal.ZERO;
        };
    }

    /**
     * Gets description based on amount type
     */
    private String getDescriptionForType(String amountType, String movementType) {
        return switch (amountType) {
            case "TOTAL" -> "CUSTOMER ACCOUNT - LC IMPORT CHARGES";
            case "COMMISSION" -> "COMMISSION INCOME - LC IMPORT";
            case "SWIFT_FEE" -> "SWIFT MESSAGE SERVICE FEE";
            case "POSTAGE" -> "POSTAGE SERVICE FEE";
            case "VAT" -> "VAT 15% ON SERVICES";
            default -> "UNKNOWN";
        };
    }

    /**
     * Usage example
     */
    public void usageExample() {
        // Scenario: Customer 12345678 has a LC import with:
        // - Calculated commission: $500
        // - Postage: $50

        String customerAccount = "210201001012345678"; // Customer's account
        BigDecimal commission = new BigDecimal("500.00");
        BigDecimal postage = new BigDecimal("50.00");

        AccountingEntry entry = generateLCImportCommissionCharge(
            customerAccount,
            commission,
            postage,
            "LC-IMP-2025-005"
        );

        System.out.println("\n=== LC Import Commission Charge - Composite Entry ===");
        System.out.println("Reference: " + entry.getReference());
        System.out.println("Total: USD " + entry.getTotalDebit());
        System.out.println("\n✅ ALL ACCOUNTS READ FROM DROOLS RULES - FULLY CONFIGURABLE!\n");
        System.out.println("Breakdown:");

        entry.getDetails().forEach(detail -> {
            String type = detail.getDebit().compareTo(BigDecimal.ZERO) > 0 ? "DEBIT " : "CREDIT";
            BigDecimal amount = detail.getDebit().compareTo(BigDecimal.ZERO) > 0
                ? detail.getDebit()
                : detail.getCredit();

            System.out.printf("%s: %s - %s: $%.2f%n",
                type,
                detail.getAccount(),
                detail.getDescription(),
                amount
            );
        });

        /*
         * Expected output (all accounts from Excel):
         *
         * DEBIT:  210201001012345678 - CUSTOMER ACCOUNT: $586.25
         * CREDIT: 520500300000000000 - COMMISSION INCOME: $500.00
         * CREDIT: 559004600000000000 - SWIFT MESSAGE SERVICE: $25.00 (fixed in Excel Column L)
         * CREDIT: 559005300000000000 - POSTAGE SERVICE: $50.00 (parameter or fixed in Excel Column L)
         * CREDIT: 250405050010000000 - VAT 15%: $11.25 (rate in Excel Column M: 0.15)
         *
         * Total: $586.25
         *
         * 🔧 To change accounts, fixed amounts, or rates: Just edit the Excel file!
         *    - Set SWIFT_FEE in Column L (e.g., "25.00")
         *    - Set POSTAGE in Column L (e.g., "50.00") to make it fixed
         *    - Set VAT rate in Column M (e.g., "0.15" for 15%, "0.16" for 16%)
         *    No code changes needed!
         */
    }

    /**
     * Validates a composite entry
     */
    public void validateCompositeEntry(AccountingEntry entry) {
        BigDecimal totalDebit = entry.getDetails().stream()
            .map(EntryDetail::getDebit)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCredit = entry.getDetails().stream()
            .map(EntryDetail::getCredit)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new IllegalStateException(
                String.format("Composite entry not balanced: Debit=%s, Credit=%s",
                    totalDebit, totalCredit)
            );
        }

        log.info("Composite entry validated: Debit={}, Credit={}", totalDebit, totalCredit);
    }
}

/**
 * Extended accounting entry model to support composite entries
 */
@Data
@Builder
class AccountingEntry {
    private LocalDateTime date;
    private String type;
    private String event;
    private String reference;
    private String currency;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private List<EntryDetail> details;
}

/**
 * Detail line for accounting entry
 */
@Data
@Builder
class EntryDetail {
    private String account;
    private String description;
    private BigDecimal debit;
    private BigDecimal credit;
}
