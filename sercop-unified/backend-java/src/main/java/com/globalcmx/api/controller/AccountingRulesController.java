package com.globalcmx.api.controller;

import com.globalcmx.api.dto.AccountingRuleTestRequest;
import com.globalcmx.api.dto.AccountingRuleTestResult;
import com.globalcmx.api.dto.AccountingRuleValidationResult;
import com.globalcmx.api.readmodel.entity.DroolsRulesConfigReadModel;
import com.globalcmx.api.service.contabilidad.AccountingRulesManagementService;
import com.globalcmx.api.service.query.DroolsRulesConfigQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;

/**
 * REST Controller for managing accounting rules configuration
 */
@Slf4j
@RestController
@RequestMapping("/v1/catalogs/accounting-rules")
@RequiredArgsConstructor
public class AccountingRulesController {

    private final AccountingRulesManagementService rulesManagementService;
    private final DroolsRulesConfigQueryService droolsRulesConfigQueryService;

    /**
     * Upload and validate accounting rules Excel file
     *
     * @param file Excel file (.xls format)
     * @return Validation result with optional DRL content
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AccountingRuleValidationResult> uploadAndValidate(
            @RequestParam("file") MultipartFile file) {

        log.info("Received accounting rules file upload: {}", file.getOriginalFilename());

        try {
            // Validate file is not empty
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(AccountingRuleValidationResult.builder()
                                .valid(false)
                                .errors(java.util.List.of("File is empty"))
                                .build());
            }

            // Validate and convert
            AccountingRuleValidationResult result = rulesManagementService.validateAndConvert(file);

            if (result.isValid()) {
                log.info("File validated successfully. {} active rules found", result.getActiveRules());
                return ResponseEntity.ok(result);
            } else {
                log.warn("File validation failed. {} errors found", result.getErrors().size());
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(result);
            }

        } catch (IOException e) {
            log.error("Error processing file upload", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(AccountingRuleValidationResult.builder()
                            .valid(false)
                            .errors(java.util.List.of("Error processing file: " + e.getMessage()))
                            .build());
        }
    }

    /**
     * Download the generated DRL file
     *
     * @param file Excel file to convert
     * @return DRL file content
     */
    @PostMapping(value = "/generate-drl", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> generateDRL(@RequestParam("file") MultipartFile file) {
        log.info("Generating DRL for file: {}", file.getOriginalFilename());

        try {
            AccountingRuleValidationResult result = rulesManagementService.validateAndConvert(file);

            if (result.isValid() && result.getDrlContent() != null) {
                return ResponseEntity.ok()
                        .header("Content-Disposition", "attachment; filename=accounting-rules.drl")
                        .contentType(MediaType.TEXT_PLAIN)
                        .body(result.getDrlContent());
            } else {
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                        .body("// Validation failed:\n// " + String.join("\n// ", result.getErrors()));
            }

        } catch (IOException e) {
            log.error("Error generating DRL", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("// Error: " + e.getMessage());
        }
    }

    /**
     * Get accounting rules statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        // TODO: Implement statistics from current loaded rules
        return ResponseEntity.ok()
                .body(java.util.Map.of(
                        "message", "Statistics endpoint - to be implemented",
                        "currentRulesFile", "configuracionContable.xls"
                ));
    }

    /**
     * Test accounting rules with sample input
     *
     * @param request Test request with product, event, amount, and DRL content
     * @return Test results showing which rules fired and the accounting entries generated
     */
    @PostMapping("/test")
    public ResponseEntity<AccountingRuleTestResult> testRules(@RequestBody AccountingRuleTestRequest request) {
        log.info("Testing accounting rules for product: {}, event: {}", request.getProduct(), request.getEvent());

        try {
            AccountingRuleTestResult result = rulesManagementService.testRules(request);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Error testing accounting rules", e);
            return ResponseEntity.ok(AccountingRuleTestResult.builder()
                            .success(false)
                            .message("Error testing rules: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Download the original Excel file used to generate the active accounting rules
     */
    @GetMapping("/download-excel")
    public ResponseEntity<byte[]> downloadActiveExcel() {
        log.info("Downloading active ACCOUNTING Excel from database");

        Optional<DroolsRulesConfigReadModel> config = droolsRulesConfigQueryService.getActiveByRuleType("ACCOUNTING");

        if (config.isEmpty() || config.get().getSourceFileContent() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        DroolsRulesConfigReadModel drl = config.get();
        String fileName = drl.getSourceFileName() != null ? drl.getSourceFileName() : "configuracionContable.xls";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                .contentType(MediaType.parseMediaType("application/vnd.ms-excel"))
                .contentLength(drl.getSourceFileContent().length)
                .body(drl.getSourceFileContent());
    }

    /**
     * Download the current active DRL from database
     */
    @GetMapping("/download-drl")
    public ResponseEntity<byte[]> downloadActiveDrl() {
        log.info("Downloading active ACCOUNTING DRL from database");

        Optional<DroolsRulesConfigReadModel> config = droolsRulesConfigQueryService.getActiveByRuleType("ACCOUNTING");

        if (config.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        DroolsRulesConfigReadModel drl = config.get();
        byte[] content = drl.getDrlContent().getBytes(java.nio.charset.StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=accounting-rules.drl")
                .contentType(MediaType.TEXT_PLAIN)
                .contentLength(content.length)
                .body(content);
    }
}
