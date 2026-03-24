package com.globalcmx.api.service.contabilidad;

import com.globalcmx.api.domain.contabilidad.AccountingConfiguration;
import com.globalcmx.api.dto.AccountingRuleTestRequest;
import com.globalcmx.api.dto.AccountingRuleTestResult;
import com.globalcmx.api.dto.AccountingRuleValidationResult;
import com.globalcmx.api.dto.command.SaveDroolsRulesCommand;
import com.globalcmx.api.readmodel.entity.DroolsRulesConfigReadModel;
import com.globalcmx.api.service.command.DroolsRulesConfigCommandService;
import com.globalcmx.api.service.query.DroolsRulesConfigQueryService;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.kie.api.KieServices;
import org.kie.api.builder.KieBuilder;
import org.kie.api.builder.KieFileSystem;
import org.kie.api.builder.Message;
import org.kie.api.builder.ReleaseId;
import org.kie.api.runtime.KieContainer;
import org.kie.api.runtime.KieSession;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for managing accounting rules configuration
 * Validates and converts Excel files to DRL format
 */
@Slf4j
@Service
public class AccountingRulesManagementService {

    private final DroolsRulesConfigCommandService droolsRulesConfigCommandService;
    private final DroolsRulesConfigQueryService droolsRulesConfigQueryService;

    // Cache for KieContainers to avoid rebuilding on every test
    private final java.util.Map<String, KieContainer> kieContainerCache = new java.util.concurrent.ConcurrentHashMap<>();

    private static final String RULE_TYPE_ACCOUNTING = "ACCOUNTING";

    public AccountingRulesManagementService(DroolsRulesConfigCommandService droolsRulesConfigCommandService,
                                            DroolsRulesConfigQueryService droolsRulesConfigQueryService) {
        this.droolsRulesConfigCommandService = droolsRulesConfigCommandService;
        this.droolsRulesConfigQueryService = droolsRulesConfigQueryService;
    }

    /**
     * Validates and processes the uploaded Excel file
     */
    @Transactional
    public AccountingRuleValidationResult validateAndConvert(MultipartFile file) throws IOException {
        log.info("Validating accounting rules file: {}", file.getOriginalFilename());

        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        List<AccountingRuleValidationResult.RuleSummary> rules = new ArrayList<>();

        // Validate file extension
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".xls")) {
            errors.add("Invalid file format. Expected .xls file");
            return AccountingRuleValidationResult.builder()
                    .valid(false)
                    .errors(errors)
                    .fileName(filename)
                    .fileSizeBytes(file.getSize())
                    .build();
        }

        try (InputStream inputStream = file.getInputStream()) {
            Workbook workbook = WorkbookFactory.create(inputStream);
            Sheet sheet = workbook.getSheetAt(0);

            // Find header row
            int headerRow = findHeaderRow(sheet);
            if (headerRow == -1) {
                errors.add("Could not find header row (looking for 'RuleSet' or 'RULE')");
                return buildErrorResult(filename, file.getSize(), errors);
            }

            log.info("Header row found at index: {}", headerRow);

            // Validate and extract rules
            Set<String> ruleNames = new HashSet<>();
            int totalRules = 0;
            int activeRules = 0;
            int compositeEntries = 0;

            for (int i = headerRow + 1; i < sheet.getLastRowNum() + 1; i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    AccountingRuleValidationResult.RuleSummary rule = extractRule(row, i);
                    if (rule == null) continue;

                    // Validate rule name uniqueness
                    if (ruleNames.contains(rule.getRuleName())) {
                        errors.add(String.format("Duplicate rule name at row %d: %s", i + 1, rule.getRuleName()));
                    }
                    ruleNames.add(rule.getRuleName());

                    // Validate required fields
                    validateRule(rule, i + 1, errors, warnings);

                    rules.add(rule);
                    totalRules++;

                    if (Boolean.TRUE.equals(rule.getActive())) {
                        activeRules++;
                    }

                    if (rule.getLineNumber() != null && !rule.getLineNumber().isEmpty()) {
                        compositeEntries++;
                    }

                } catch (Exception e) {
                    errors.add(String.format("Error parsing row %d: %s", i + 1, e.getMessage()));
                }
            }

            workbook.close();

            // Generate DRL if valid
            String drlContent = null;
            if (errors.isEmpty()) {
                drlContent = generateDRL(rules);
                log.info("DRL generated successfully. Size: {} characters", drlContent.length());

                // Save DRL to database (including original Excel bytes)
                try {
                    saveDrlToDatabase(drlContent, filename, file.getBytes());
                    log.info("DRL saved successfully to database for rule type: {}", RULE_TYPE_ACCOUNTING);

                    // Pre-build KieContainer with the new DRL immediately so it's ready
                    // for testRules() without waiting for the transaction to commit.
                    String drlHash = Integer.toHexString(drlContent.hashCode());
                    kieContainerCache.clear();
                    getOrBuildKieContainer(drlHash, drlContent);
                    log.info("KieContainer pre-built with new accounting rules (hash: {})", drlHash);
                } catch (Exception e) {
                    log.error("Error saving DRL to database", e);
                    errors.add("Error saving DRL: " + e.getMessage());
                }
            }

            boolean valid = errors.isEmpty();
            log.info("Validation complete. Valid: {}, Total rules: {}, Active: {}, Errors: {}",
                    valid, totalRules, activeRules, errors.size());

            return AccountingRuleValidationResult.builder()
                    .valid(valid)
                    .totalRules(totalRules)
                    .activeRules(activeRules)
                    .inactiveRules(totalRules - activeRules)
                    .compositeEntries(compositeEntries)
                    .errors(errors)
                    .warnings(warnings)
                    .rules(rules)
                    .drlContent(drlContent)
                    .fileName(filename)
                    .fileSizeBytes(file.getSize())
                    .build();

        } catch (Exception e) {
            log.error("Error processing file", e);
            errors.add("Error processing file: " + e.getMessage());
            return buildErrorResult(filename, file.getSize(), errors);
        }
    }

    private int findHeaderRow(Sheet sheet) {
        // Look for the row with "Nombre Regla" or "RULE NAME" in first column
        // This is typically row 9 in Drools Decision Tables (after metadata and patterns)
        for (int i = 0; i < Math.min(20, sheet.getLastRowNum() + 1); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;

            Cell cell = row.getCell(0);
            if (cell != null) {
                String value = getCellValueAsString(cell);
                if (value != null) {
                    String upperValue = value.toUpperCase();
                    if (upperValue.contains("NOMBRE") && upperValue.contains("REGLA") ||
                        upperValue.contains("RULE") && upperValue.contains("NAME")) {
                        return i;
                    }
                }
            }
        }
        return -1;
    }

    private AccountingRuleValidationResult.RuleSummary extractRule(Row row, int rowIndex) {
        String ruleName = getCellValueAsString(row.getCell(0));
        if (ruleName == null || ruleName.trim().isEmpty()) {
            return null;
        }

        return AccountingRuleValidationResult.RuleSummary.builder()
                .ruleName(ruleName)
                .product(getCellValueAsString(row.getCell(1)))
                .event(getCellValueAsString(row.getCell(2)))
                .debitAccount(getCellValueAsString(row.getCell(5)))
                .creditAccount(getCellValueAsString(row.getCell(6)))
                .active(getCellValueAsBoolean(row.getCell(7)))
                .lineNumber(getCellValueAsString(row.getCell(8)))
                .amountType(getCellValueAsString(row.getCell(9)))
                .movementType(getCellValueAsString(row.getCell(10)))
                .fixedAmount(getCellValueAsString(row.getCell(11)))
                .rate(getCellValueAsString(row.getCell(12)))
                .taxable(getCellValueAsBoolean(row.getCell(13)))
                .build();
    }

    private void validateRule(AccountingRuleValidationResult.RuleSummary rule, int rowNum,
                              List<String> errors, List<String> warnings) {
        // Required fields - Product and Event should be present
        // Note: In Drools Decision Tables, these are the CONDITION columns
        boolean hasProduct = rule.getProduct() != null && !rule.getProduct().trim().isEmpty();
        boolean hasEvent = rule.getEvent() != null && !rule.getEvent().trim().isEmpty();

        if (!hasProduct && !hasEvent) {
            // If neither product nor event is specified, it's probably an empty or invalid row
            errors.add(String.format("Row %d: Both Product and Event are missing", rowNum));
            return; // Skip further validation for this row
        }

        // Warn if only one is missing (might be intentional)
        if (!hasProduct) {
            warnings.add(String.format("Row %d: Product is not specified", rowNum));
        }
        if (!hasEvent) {
            warnings.add(String.format("Row %d: Event is not specified", rowNum));
        }

        // At least one account should be specified (but not required for all rules)
        boolean hasDebit = rule.getDebitAccount() != null && !rule.getDebitAccount().trim().isEmpty();
        boolean hasCredit = rule.getCreditAccount() != null && !rule.getCreditAccount().trim().isEmpty();

        if (!hasDebit && !hasCredit) {
            warnings.add(String.format("Row %d (%s): No accounts specified", rowNum, rule.getRuleName()));
        }

        // Composite entry validation
        if (rule.getLineNumber() != null && !rule.getLineNumber().trim().isEmpty()) {
            if (rule.getAmountType() == null || rule.getAmountType().trim().isEmpty()) {
                warnings.add(String.format("Row %d: Composite entry has line number but no amount type", rowNum));
            }
        }

        // VAT rate validation
        if ("VAT".equals(rule.getAmountType()) && rule.getRate() != null && !rule.getRate().trim().isEmpty()) {
            try {
                double rate = Double.parseDouble(rule.getRate());
                if (rate < 0 || rate > 1) {
                    warnings.add(String.format("Row %d: VAT rate should be between 0 and 1 (e.g., 0.15 for 15%%)", rowNum));
                }
            } catch (NumberFormatException e) {
                warnings.add(String.format("Row %d: Invalid VAT rate format: %s", rowNum, rule.getRate()));
            }
        }
    }

    private String generateDRL(List<AccountingRuleValidationResult.RuleSummary> rules) {
        StringBuilder drl = new StringBuilder();

        // Package declaration
        drl.append("package com.globalcmx.contabilidad;\n\n");

        // Import statements
        drl.append("import com.globalcmx.api.domain.contabilidad.AccountingConfiguration;\n\n");

        // Generate rules
        for (AccountingRuleValidationResult.RuleSummary rule : rules) {
            if (!Boolean.TRUE.equals(rule.getActive())) {
                continue; // Skip inactive rules
            }

            drl.append("rule \"").append(rule.getRuleName()).append("\"\n");
            drl.append("when\n");
            drl.append("    $input : AccountingConfiguration(product == \"").append(rule.getProduct()).append("\", event == \"").append(rule.getEvent()).append("\", ruleName == null || ruleName == \"\")\n");
            drl.append("then\n");

            // Create a new AccountingConfiguration object for this rule's result
            drl.append("    AccountingConfiguration result = AccountingConfiguration.builder()\n");
            drl.append("        .ruleName(\"").append(rule.getRuleName()).append("\")\n");
            drl.append("        .product(\"").append(rule.getProduct()).append("\")\n");
            drl.append("        .event(\"").append(rule.getEvent()).append("\")\n");
            drl.append("        .amount($input.getAmount())\n");

            if (rule.getDebitAccount() != null && !rule.getDebitAccount().isEmpty()) {
                drl.append("        .cuentaDebito(\"").append(escapeString(rule.getDebitAccount())).append("\")\n");
            }

            if (rule.getCreditAccount() != null && !rule.getCreditAccount().isEmpty()) {
                drl.append("        .cuentaCredito(\"").append(escapeString(rule.getCreditAccount())).append("\")\n");
            }

            drl.append("        .active(true)\n");

            if (rule.getLineNumber() != null && !rule.getLineNumber().isEmpty()) {
                drl.append("        .lineNumber(\"").append(rule.getLineNumber()).append("\")\n");
            }

            if (rule.getAmountType() != null && !rule.getAmountType().isEmpty()) {
                drl.append("        .amountType(\"").append(rule.getAmountType()).append("\")\n");
            }

            if (rule.getMovementType() != null && !rule.getMovementType().isEmpty()) {
                drl.append("        .movementType(\"").append(rule.getMovementType()).append("\")\n");
            }

            if (rule.getFixedAmount() != null && !rule.getFixedAmount().isEmpty()) {
                drl.append("        .fixedAmount(\"").append(rule.getFixedAmount()).append("\")\n");
            }

            if (rule.getRate() != null && !rule.getRate().isEmpty()) {
                drl.append("        .rate(\"").append(rule.getRate()).append("\")\n");
            }

            if (rule.getTaxable() != null) {
                drl.append("        .taxable(").append(rule.getTaxable()).append(")\n");
            }

            drl.append("        .build();\n");
            drl.append("    insert(result);\n");
            drl.append("end\n\n");
        }

        return drl.toString();
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
                return String.valueOf(cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }

    private Boolean getCellValueAsBoolean(Cell cell) {
        if (cell == null) return false;

        switch (cell.getCellType()) {
            case BOOLEAN:
                return cell.getBooleanCellValue();
            case STRING:
                String value = cell.getStringCellValue().toLowerCase();
                return "true".equals(value) || "yes".equals(value) || "1".equals(value);
            case NUMERIC:
                return cell.getNumericCellValue() != 0;
            default:
                return false;
        }
    }

    private String escapeString(String str) {
        if (str == null) return "";
        return str.replace("\"", "\\\"").replace("\n", "\\n");
    }

    private AccountingRuleValidationResult buildErrorResult(String filename, long fileSize, List<String> errors) {
        return AccountingRuleValidationResult.builder()
                .valid(false)
                .errors(errors)
                .fileName(filename)
                .fileSizeBytes(fileSize)
                .build();
    }

    /**
     * Get or build KieContainer from cache based on DRL content hash
     */
    private KieContainer getOrBuildKieContainer(String drlHash, String drlContent) {
        return kieContainerCache.computeIfAbsent(drlHash, hash -> {
            log.info("Building new KieContainer for hash: {}", hash);

            try {
                KieServices kieServices = KieServices.Factory.get();
                KieFileSystem kfs = kieServices.newKieFileSystem();

                // Add DRL content to the file system
                String drlPath = "src/main/resources/rules/accounting-test-" + hash + ".drl";
                kfs.write(drlPath, drlContent);

                // Build the KieModule
                KieBuilder kieBuilder = kieServices.newKieBuilder(kfs);
                kieBuilder.buildAll();

                // Check for errors
                if (kieBuilder.getResults().hasMessages(Message.Level.ERROR)) {
                    String errors = kieBuilder.getResults().getMessages(Message.Level.ERROR)
                            .stream()
                            .map(Message::getText)
                            .collect(Collectors.joining("\n"));
                    log.error("Errors compiling DRL: {}", errors);
                    throw new RuntimeException("Error compiling rules: " + errors);
                }

                // Get the KieContainer
                ReleaseId releaseId = kieBuilder.getKieModule().getReleaseId();
                KieContainer container = kieServices.newKieContainer(releaseId);

                log.info("KieContainer built successfully for hash: {}", hash);
                return container;

            } catch (Exception e) {
                log.error("Failed to build KieContainer", e);
                throw new RuntimeException("Failed to build KieContainer: " + e.getMessage(), e);
            }
        });
    }

    /**
     * Test accounting rules with given input
     */
    public AccountingRuleTestResult testRules(AccountingRuleTestRequest request) {
        log.info("Testing accounting rules for product={}, event={}", request.getProduct(), request.getEvent());

        try {
            // Read DRL content from database
            String drlContent = readDrlFromDatabase();

            // Get or build KieContainer (cached based on DRL content hash)
            String drlHash = Integer.toHexString(drlContent.hashCode());
            log.debug("Using DRL hash: {}", drlHash);

            KieContainer kieContainer;
            try {
                kieContainer = getOrBuildKieContainer(drlHash, drlContent);
            } catch (RuntimeException e) {
                log.error("Failed to build KieContainer", e);
                return AccountingRuleTestResult.builder()
                        .success(false)
                        .message(e.getMessage())
                        .build();
            }

            // Create a KieSession
            long startSession = System.currentTimeMillis();
            KieSession kSession = kieContainer.newKieSession();
            log.debug("KieSession created in {}ms", System.currentTimeMillis() - startSession);

            // Create AccountingConfiguration fact (input)
            AccountingConfiguration inputConfig = AccountingConfiguration.builder()
                    .product(request.getProduct())
                    .event(request.getEvent())
                    .amount(request.getAmount())
                    .build();

            // Insert input fact and fire rules
            long startInsert = System.currentTimeMillis();
            kSession.insert(inputConfig);
            log.debug("Fact inserted in {}ms", System.currentTimeMillis() - startInsert);

            long startFire = System.currentTimeMillis();
            int rulesFired = kSession.fireAllRules();
            long fireTime = System.currentTimeMillis() - startFire;
            log.info("Fired {} rules in {}ms", rulesFired, fireTime);

            // Collect all AccountingConfiguration objects that were inserted by rules
            long startCollect = System.currentTimeMillis();
            List<AccountingRuleTestResult.AccountingEntry> entries = new ArrayList<>();

            for (Object obj : kSession.getObjects()) {
                if (obj instanceof AccountingConfiguration) {
                    AccountingConfiguration config = (AccountingConfiguration) obj;

                    // Skip the input object - we only want results from rules
                    if (config.getRuleName() == null || config.getRuleName().isEmpty()) {
                        continue;
                    }

                    // Create entry from this configuration
                    AccountingRuleTestResult.AccountingEntry entry = AccountingRuleTestResult.AccountingEntry.builder()
                            .ruleName(config.getRuleName())
                            .product(config.getProduct())
                            .event(config.getEvent())
                            .debitAccount(config.getCuentaDebito())
                            .creditAccount(config.getCuentaCredito())
                            .amount(config.getAmount())
                            .amountType(config.getAmountType())
                            .lineNumber(config.getLineNumber())
                            .movementType(config.getMovementType())
                            .fixedAmount(config.getFixedAmount())
                            .taxable(config.getTaxable())
                            .rate(config.getRate())
                            .calculatedAmount(config.getCalculatedAmount())
                            .build();

                    entries.add(entry);
                }
            }
            long collectTime = System.currentTimeMillis() - startCollect;
            log.debug("Collected {} entries in {}ms", entries.size(), collectTime);

            // Calculate amounts for each entry based on amountType
            calculateAmounts(entries, request.getAmount());

            // Build ledger table summary
            List<AccountingRuleTestResult.LedgerLine> ledgerTable = buildLedgerTable(entries);

            // Cleanup
            long startDispose = System.currentTimeMillis();
            kSession.dispose();
            log.debug("Session disposed in {}ms", System.currentTimeMillis() - startDispose);

            log.info("Rules test completed. {} rules fired, {} entries created", rulesFired, entries.size());

            return AccountingRuleTestResult.builder()
                    .success(true)
                    .message(rulesFired > 0 ?
                            "Successfully fired " + rulesFired + " rule(s)" :
                            "No rules matched the input criteria")
                    .entries(entries)
                    .totalRulesFired(rulesFired)
                    .ledgerTable(ledgerTable)
                    .build();

        } catch (Exception e) {
            log.error("Error testing rules", e);
            return AccountingRuleTestResult.builder()
                    .success(false)
                    .message("Error testing rules: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Calculate actual amounts for accounting entries based on their configuration.
     * Handles:
     * - Fixed amounts (e.g., SWIFT_FEE: $25, POSTAGE: $15)
     * - Variable amounts based on input parameter
     * - VAT calculation as percentage of taxable charges
     *
     * @param entries List of accounting entries to calculate amounts for
     * @param baseAmount Base amount from the transaction (e.g., commission amount)
     */
    private void calculateAmounts(List<AccountingRuleTestResult.AccountingEntry> entries, BigDecimal baseAmount) {
        log.debug("Calculating amounts for {} entries with base amount {}", entries.size(), baseAmount);

        BigDecimal taxableSum = BigDecimal.ZERO;
        BigDecimal totalCredits = BigDecimal.ZERO;

        // First pass: calculate fixed amounts, variable amounts, and sum taxable charges
        for (AccountingRuleTestResult.AccountingEntry entry : entries) {
            BigDecimal calculatedAmount = null;

            // Check if this is a fixed amount entry (e.g., SWIFT_FEE, POSTAGE)
            if (entry.getFixedAmount() != null && !entry.getFixedAmount().isEmpty()) {
                try {
                    calculatedAmount = new BigDecimal(entry.getFixedAmount());
                    log.debug("Entry {} ({}) - Fixed amount: {}", entry.getLineNumber(), entry.getAmountType(), calculatedAmount);
                } catch (NumberFormatException e) {
                    log.error("Invalid fixed amount '{}' for entry {}", entry.getFixedAmount(), entry.getLineNumber());
                }
            }
            // Check if this is a variable amount (COMMISSION, etc.) - use base amount
            else if ("COMMISSION".equals(entry.getAmountType()) && baseAmount != null) {
                calculatedAmount = baseAmount;
                log.debug("Entry {} ({}) - Variable amount: {}", entry.getLineNumber(), entry.getAmountType(), calculatedAmount);
            }
            // VAT will be calculated in second pass
            else if ("VAT".equals(entry.getAmountType())) {
                log.debug("Entry {} ({}) - VAT will be calculated in second pass", entry.getLineNumber(), entry.getAmountType());
            }

            // Set the calculated amount
            if (calculatedAmount != null) {
                entry.setCalculatedAmount(calculatedAmount);

                // If this entry is taxable and is a credit, add to taxable sum
                if (Boolean.TRUE.equals(entry.getTaxable()) && "CREDIT".equals(entry.getMovementType())) {
                    taxableSum = taxableSum.add(calculatedAmount);
                    log.debug("Adding {} to taxable sum (now {})", calculatedAmount, taxableSum);
                }

                // Track total credits for balance verification
                if ("CREDIT".equals(entry.getMovementType())) {
                    totalCredits = totalCredits.add(calculatedAmount);
                }
            }
        }

        log.info("Taxable sum calculated: {} (from {} entries)", taxableSum, entries.size());

        // Second pass: calculate VAT based on taxable sum
        for (AccountingRuleTestResult.AccountingEntry entry : entries) {
            if ("VAT".equals(entry.getAmountType()) && entry.getRate() != null && !entry.getRate().isEmpty()) {
                try {
                    BigDecimal rate = new BigDecimal(entry.getRate());
                    BigDecimal vatAmount = taxableSum.multiply(rate).setScale(2, RoundingMode.HALF_UP);
                    entry.setCalculatedAmount(vatAmount);
                    log.debug("Entry {} ({}) - VAT calculated: {} * {} = {}",
                             entry.getLineNumber(), entry.getAmountType(), taxableSum, rate, vatAmount);

                    if ("CREDIT".equals(entry.getMovementType())) {
                        totalCredits = totalCredits.add(vatAmount);
                    }
                } catch (NumberFormatException e) {
                    log.error("Invalid rate '{}' for VAT entry {}", entry.getRate(), entry.getLineNumber());
                }
            }
        }

        // Third pass: Set TOTAL amount (sum of all credits)
        for (AccountingRuleTestResult.AccountingEntry entry : entries) {
            if ("TOTAL".equals(entry.getAmountType()) && "DEBIT".equals(entry.getMovementType())) {
                entry.setCalculatedAmount(totalCredits);
                log.debug("Entry {} ({}) - TOTAL debit amount: {}", entry.getLineNumber(), entry.getAmountType(), totalCredits);
            }
        }

        log.info("Amount calculation completed. Total credits: {}", totalCredits);
    }

    /**
     * Build ledger table from accounting entries for easy visualization.
     * Creates a clear accounting ledger with debit and credit columns.
     *
     * @param entries List of accounting entries
     * @return List of ledger lines ready for display
     */
    private List<AccountingRuleTestResult.LedgerLine> buildLedgerTable(List<AccountingRuleTestResult.AccountingEntry> entries) {
        List<AccountingRuleTestResult.LedgerLine> ledgerLines = new ArrayList<>();

        for (AccountingRuleTestResult.AccountingEntry entry : entries) {
            // Check if entry has movement type (new format with separate debit/credit entries)
            if (entry.getMovementType() != null && !entry.getMovementType().isEmpty()) {
                // New format: single entry with movementType
                String accountNumber = null;
                BigDecimal debitAmount = null;
                BigDecimal creditAmount = null;

                if ("DEBIT".equals(entry.getMovementType())) {
                    accountNumber = entry.getDebitAccount();
                    debitAmount = entry.getCalculatedAmount();
                } else if ("CREDIT".equals(entry.getMovementType())) {
                    accountNumber = entry.getCreditAccount();
                    creditAmount = entry.getCalculatedAmount();
                }

                if (accountNumber != null && !accountNumber.isEmpty()) {
                    String fullDescription = buildAccountDescription(entry);
                    ledgerLines.add(AccountingRuleTestResult.LedgerLine.builder()
                            .accountNumber(accountNumber)
                            .accountDescription(fullDescription)
                            .debitAmount(debitAmount)
                            .creditAmount(creditAmount)
                            .build());
                }
            } else {
                // Old format: entry with both debitAccount and creditAccount
                // Create two ledger lines: one debit and one credit
                BigDecimal amount = entry.getAmount() != null ? entry.getAmount() :
                                  entry.getCalculatedAmount() != null ? entry.getCalculatedAmount() : BigDecimal.ZERO;

                // Add debit line if debitAccount exists
                if (entry.getDebitAccount() != null && !entry.getDebitAccount().isEmpty()) {
                    ledgerLines.add(AccountingRuleTestResult.LedgerLine.builder()
                            .accountNumber(extractAccountNumber(entry.getDebitAccount()))
                            .accountDescription(entry.getDebitAccount())
                            .debitAmount(amount)
                            .creditAmount(null)
                            .build());
                }

                // Add credit line if creditAccount exists
                if (entry.getCreditAccount() != null && !entry.getCreditAccount().isEmpty()) {
                    ledgerLines.add(AccountingRuleTestResult.LedgerLine.builder()
                            .accountNumber(extractAccountNumber(entry.getCreditAccount()))
                            .accountDescription(entry.getCreditAccount())
                            .debitAmount(null)
                            .creditAmount(amount)
                            .build());
                }
            }
        }

        log.debug("Built ledger table with {} lines", ledgerLines.size());
        return ledgerLines;
    }

    /**
     * Extract account number from account string (format: "123456 - Description" or just "123456")
     */
    private String extractAccountNumber(String accountString) {
        if (accountString == null || accountString.isEmpty()) {
            return "";
        }

        // Check if account string contains " - " separator
        int separatorIndex = accountString.indexOf(" - ");
        if (separatorIndex > 0) {
            return accountString.substring(0, separatorIndex).trim();
        }

        // Otherwise return the whole string (assuming it's just the account number)
        return accountString.trim();
    }

    /**
     * Build a descriptive text for the account based on entry information.
     *
     * @param entry The accounting entry
     * @return A human-readable description
     */
    private String buildAccountDescription(AccountingRuleTestResult.AccountingEntry entry) {
        StringBuilder description = new StringBuilder();

        // Add amount type as base description
        if (entry.getAmountType() != null) {
            description.append(entry.getAmountType());
        }

        // Add additional context for specific types
        if ("TOTAL".equals(entry.getAmountType())) {
            description.append(" - Customer Account");
        } else if ("COMMISSION".equals(entry.getAmountType())) {
            description.append(" - Income");
        } else if ("SWIFT_FEE".equals(entry.getAmountType())) {
            description.append(" - Message Service Fee");
        } else if ("POSTAGE".equals(entry.getAmountType())) {
            description.append(" - Postage Service Fee");
        } else if ("VAT".equals(entry.getAmountType())) {
            description.append(" - " + (entry.getRate() != null ?
                    (new BigDecimal(entry.getRate()).multiply(new BigDecimal("100")).intValue() + "%") : ""));
            description.append(" on Services");
        }

        return description.toString();
    }

    /**
     * Save DRL content via CQRS command service
     */
    private void saveDrlToDatabase(String drlContent, String sourceFileName, byte[] sourceFileContent) {
        SaveDroolsRulesCommand command = SaveDroolsRulesCommand.builder()
                .ruleType(RULE_TYPE_ACCOUNTING)
                .drlContent(drlContent)
                .sourceFileName(sourceFileName)
                .sourceFileContent(sourceFileContent)
                .performedBy("SYSTEM")
                .build();

        DroolsRulesConfigReadModel saved = droolsRulesConfigCommandService.saveDroolsRulesConfig(command);
        log.info("Saved new ACCOUNTING DRL config version={} via CQRS", saved.getVersion());

        // Invalidate KieContainer cache since rules changed
        kieContainerCache.clear();
        log.info("KieContainer cache invalidated");
    }

    /**
     * Read active DRL content from database via query service
     */
    private String readDrlFromDatabase() {
        return droolsRulesConfigQueryService.getActiveByRuleType(RULE_TYPE_ACCOUNTING)
                .map(config -> {
                    log.info("DRL read from database. Version: {}, Size: {} characters",
                            config.getVersion(), config.getDrlContent().length());
                    return config.getDrlContent();
                })
                .orElseThrow(() -> new RuntimeException(
                        "No active accounting rules found in database. Please upload the accounting rules configuration file first."));
    }
}
