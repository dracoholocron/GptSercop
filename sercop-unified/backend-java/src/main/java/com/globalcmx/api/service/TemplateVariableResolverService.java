package com.globalcmx.api.service;

import com.globalcmx.api.readmodel.entity.FinancialInstitutionReadModel;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.entity.ParticipanteReadModel;
import com.globalcmx.api.readmodel.repository.FinancialInstitutionReadModelRepository;
import com.globalcmx.api.readmodel.repository.ParticipanteReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.DecimalFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for resolving template variables in action configurations.
 * Supports the #{variable} syntax used in event rule actions.
 * Variables are populated from operation_readmodel and related tables.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateVariableResolverService {

    // Pattern for #{variableName} syntax
    private static final Pattern VARIABLE_PATTERN = Pattern.compile("#\\{([a-zA-Z_][a-zA-Z0-9_]*)\\}");

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DecimalFormat AMOUNT_FORMAT = new DecimalFormat("#,##0.00");

    private final ParticipanteReadModelRepository participanteRepository;
    private final FinancialInstitutionReadModelRepository financialInstitutionRepository;

    /**
     * Resolves all #{variable} placeholders in the template with actual values.
     *
     * @param template The template string containing #{variable} placeholders
     * @param operation The operation containing data for variable resolution
     * @param executingUser The user executing the action (for user variables)
     * @param executingUserEmail Email of the executing user
     * @param executingUserFullName Full name of the executing user
     * @param executingUserRole Role of the executing user
     * @return The template with all variables resolved
     */
    public String resolveVariables(String template, OperationReadModel operation,
                                    String executingUser, String executingUserEmail,
                                    String executingUserFullName, String executingUserRole) {
        if (template == null || template.isEmpty()) {
            return template;
        }

        Map<String, String> variables = buildVariableMap(operation, executingUser,
                executingUserEmail, executingUserFullName, executingUserRole);

        return replaceVariables(template, variables);
    }

    /**
     * Resolves variables with default user context.
     */
    public String resolveVariables(String template, OperationReadModel operation, String executingUser) {
        return resolveVariables(template, operation, executingUser, null, null, null);
    }

    /**
     * Builds a map of all available variables and their values.
     */
    private Map<String, String> buildVariableMap(OperationReadModel operation,
                                                   String executingUser,
                                                   String executingUserEmail,
                                                   String executingUserFullName,
                                                   String executingUserRole) {
        Map<String, String> variables = new HashMap<>();

        // Operation variables
        if (operation != null) {
            addOperationVariables(variables, operation);
            addAmountVariables(variables, operation);
            addDateVariables(variables, operation);
            addApplicantVariables(variables, operation);
            addBeneficiaryVariables(variables, operation);
            addBankVariables(variables, operation);
        }

        // User variables
        addUserVariables(variables, operation, executingUser, executingUserEmail,
                        executingUserFullName, executingUserRole);

        // Event date (current timestamp)
        variables.put("eventDate", LocalDateTime.now().format(DATETIME_FORMAT));

        return variables;
    }

    private void addOperationVariables(Map<String, String> vars, OperationReadModel op) {
        vars.put("operationId", safe(op.getOperationId()));
        vars.put("reference", safe(op.getReference()));
        vars.put("productType", safe(op.getProductType()));
        vars.put("messageType", safe(op.getMessageType()));
        vars.put("stage", safe(op.getStage()));
        vars.put("status", safe(op.getStatus()));
        vars.put("creationMode", safe(op.getCreationMode()));
        vars.put("amendmentCount", op.getAmendmentCount() != null ? op.getAmendmentCount().toString() : "0");
        vars.put("messageCount", op.getMessageCount() != null ? op.getMessageCount().toString() : "0");
        vars.put("version", op.getVersion() != null ? op.getVersion().toString() : "0");
    }

    private void addAmountVariables(Map<String, String> vars, OperationReadModel op) {
        vars.put("currency", safe(op.getCurrency()));
        vars.put("amount", op.getAmount() != null ? op.getAmount().toPlainString() : "0");
        vars.put("formattedAmount", op.getAmount() != null ?
                safe(op.getCurrency()) + " " + AMOUNT_FORMAT.format(op.getAmount()) : "");
    }

    private void addDateVariables(Map<String, String> vars, OperationReadModel op) {
        vars.put("issueDate", formatDate(op.getIssueDate()));
        vars.put("expiryDate", formatDate(op.getExpiryDate()));
        vars.put("responseDueDate", formatDate(op.getResponseDueDate()));
        vars.put("createdAt", formatDateTime(op.getCreatedAt()));
        vars.put("approvedAt", formatDateTime(op.getApprovedAt()));
        vars.put("modifiedAt", formatDateTime(op.getModifiedAt()));
    }

    private void addApplicantVariables(Map<String, String> vars, OperationReadModel op) {
        // Basic applicant info from operation
        vars.put("applicantId", op.getApplicantId() != null ? op.getApplicantId().toString() : "");
        vars.put("applicantName", safe(op.getApplicantName()));

        // Get full applicant details from participant table
        if (op.getApplicantId() != null) {
            Optional<ParticipanteReadModel> applicant = participanteRepository.findById(op.getApplicantId());
            if (applicant.isPresent()) {
                ParticipanteReadModel p = applicant.get();
                vars.put("applicantIdentification", safe(p.getIdentificacion()));
                vars.put("applicantFirstNames", safe(p.getNombres()));
                vars.put("applicantLastNames", safe(p.getApellidos()));
                vars.put("applicantEmail", safe(p.getEmail()));
                vars.put("applicantPhone", safe(p.getTelefono()));
                vars.put("applicantAddress", safe(p.getDireccion()));
                vars.put("applicantAgency", safe(p.getAgencia()));
                vars.put("applicantExecutive", safe(p.getEjecutivoAsignado()));
                vars.put("applicantExecutiveEmail", safe(p.getCorreoEjecutivo()));
            } else {
                setEmptyApplicantVariables(vars);
            }
        } else {
            setEmptyApplicantVariables(vars);
        }
    }

    private void setEmptyApplicantVariables(Map<String, String> vars) {
        vars.put("applicantIdentification", "");
        vars.put("applicantFirstNames", "");
        vars.put("applicantLastNames", "");
        vars.put("applicantEmail", "");
        vars.put("applicantPhone", "");
        vars.put("applicantAddress", "");
        vars.put("applicantAgency", "");
        vars.put("applicantExecutive", "");
        vars.put("applicantExecutiveEmail", "");
    }

    private void addBeneficiaryVariables(Map<String, String> vars, OperationReadModel op) {
        // Basic beneficiary info from operation
        vars.put("beneficiaryId", op.getBeneficiaryId() != null ? op.getBeneficiaryId().toString() : "");
        vars.put("beneficiaryName", safe(op.getBeneficiaryName()));

        // Get full beneficiary details from participant table
        if (op.getBeneficiaryId() != null) {
            Optional<ParticipanteReadModel> beneficiary = participanteRepository.findById(op.getBeneficiaryId());
            if (beneficiary.isPresent()) {
                ParticipanteReadModel p = beneficiary.get();
                vars.put("beneficiaryIdentification", safe(p.getIdentificacion()));
                vars.put("beneficiaryFirstNames", safe(p.getNombres()));
                vars.put("beneficiaryLastNames", safe(p.getApellidos()));
                vars.put("beneficiaryEmail", safe(p.getEmail()));
                vars.put("beneficiaryPhone", safe(p.getTelefono()));
                vars.put("beneficiaryAddress", safe(p.getDireccion()));
                vars.put("beneficiaryAgency", safe(p.getAgencia()));
                vars.put("beneficiaryExecutive", safe(p.getEjecutivoAsignado()));
                vars.put("beneficiaryExecutiveEmail", safe(p.getCorreoEjecutivo()));
            } else {
                setEmptyBeneficiaryVariables(vars);
            }
        } else {
            setEmptyBeneficiaryVariables(vars);
        }
    }

    private void setEmptyBeneficiaryVariables(Map<String, String> vars) {
        vars.put("beneficiaryIdentification", "");
        vars.put("beneficiaryFirstNames", "");
        vars.put("beneficiaryLastNames", "");
        vars.put("beneficiaryEmail", "");
        vars.put("beneficiaryPhone", "");
        vars.put("beneficiaryAddress", "");
        vars.put("beneficiaryAgency", "");
        vars.put("beneficiaryExecutive", "");
        vars.put("beneficiaryExecutiveEmail", "");
    }

    private void addBankVariables(Map<String, String> vars, OperationReadModel op) {
        // Issuing Bank
        vars.put("issuingBankBic", safe(op.getIssuingBankBic()));
        if (op.getIssuingBankId() != null) {
            Optional<FinancialInstitutionReadModel> issuingBank =
                    financialInstitutionRepository.findById(op.getIssuingBankId());
            if (issuingBank.isPresent()) {
                FinancialInstitutionReadModel bank = issuingBank.get();
                vars.put("issuingBankId", bank.getId().toString());
                vars.put("issuingBankName", safe(bank.getNombre()));
                vars.put("issuingBankCode", safe(bank.getCodigo()));
                vars.put("issuingBankCountry", safe(bank.getPais()));
                vars.put("issuingBankCity", safe(bank.getCiudad()));
                vars.put("issuingBankAddress", safe(bank.getDireccion()));
            } else {
                setEmptyIssuingBankVariables(vars);
            }
        } else {
            setEmptyIssuingBankVariables(vars);
        }

        // Advising Bank
        vars.put("advisingBankBic", safe(op.getAdvisingBankBic()));
        if (op.getAdvisingBankId() != null) {
            Optional<FinancialInstitutionReadModel> advisingBank =
                    financialInstitutionRepository.findById(op.getAdvisingBankId());
            if (advisingBank.isPresent()) {
                FinancialInstitutionReadModel bank = advisingBank.get();
                vars.put("advisingBankId", bank.getId().toString());
                vars.put("advisingBankName", safe(bank.getNombre()));
                vars.put("advisingBankCode", safe(bank.getCodigo()));
                vars.put("advisingBankCountry", safe(bank.getPais()));
                vars.put("advisingBankCity", safe(bank.getCiudad()));
                vars.put("advisingBankAddress", safe(bank.getDireccion()));
            } else {
                setEmptyAdvisingBankVariables(vars);
            }
        } else {
            setEmptyAdvisingBankVariables(vars);
        }
    }

    private void setEmptyIssuingBankVariables(Map<String, String> vars) {
        vars.put("issuingBankId", "");
        vars.put("issuingBankName", "");
        vars.put("issuingBankCode", "");
        vars.put("issuingBankCountry", "");
        vars.put("issuingBankCity", "");
        vars.put("issuingBankAddress", "");
    }

    private void setEmptyAdvisingBankVariables(Map<String, String> vars) {
        vars.put("advisingBankId", "");
        vars.put("advisingBankName", "");
        vars.put("advisingBankCode", "");
        vars.put("advisingBankCountry", "");
        vars.put("advisingBankCity", "");
        vars.put("advisingBankAddress", "");
    }

    private void addUserVariables(Map<String, String> vars, OperationReadModel op,
                                   String executingUser, String executingUserEmail,
                                   String executingUserFullName, String executingUserRole) {
        // Operation audit users
        if (op != null) {
            vars.put("createdBy", safe(op.getCreatedBy()));
            vars.put("approvedBy", safe(op.getApprovedBy()));
            vars.put("modifiedBy", safe(op.getModifiedBy()));
        } else {
            vars.put("createdBy", "");
            vars.put("approvedBy", "");
            vars.put("modifiedBy", "");
        }

        // Executing user (current action executor)
        vars.put("executingUser", safe(executingUser));
        vars.put("executingUserEmail", safe(executingUserEmail));
        vars.put("executingUserFullName", safe(executingUserFullName));
        vars.put("executingUserRole", safe(executingUserRole));
    }

    /**
     * Replaces all #{variable} patterns with their corresponding values.
     */
    private String replaceVariables(String template, Map<String, String> variables) {
        Matcher matcher = VARIABLE_PATTERN.matcher(template);
        StringBuffer result = new StringBuffer();

        while (matcher.find()) {
            String variableName = matcher.group(1);
            String value = variables.getOrDefault(variableName, "");

            // Escape special characters for JSON strings
            String escapedValue = escapeForJson(value);
            matcher.appendReplacement(result, Matcher.quoteReplacement(escapedValue));

            if (!variables.containsKey(variableName)) {
                log.warn("Unknown template variable: #{{{}}}", variableName);
            }
        }

        matcher.appendTail(result);
        return result.toString();
    }

    private String escapeForJson(String value) {
        if (value == null) return "";
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private String safe(String value) {
        return value != null ? value : "";
    }

    private String formatDate(java.time.LocalDate date) {
        if (date == null) return "";
        return date.format(DATE_FORMAT);
    }

    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        return dateTime.format(DATETIME_FORMAT);
    }

    /**
     * Gets all available variable names with their current values for an operation.
     * Useful for debugging and displaying available variables.
     */
    public Map<String, String> getAllVariables(OperationReadModel operation, String executingUser) {
        return buildVariableMap(operation, executingUser, null, null, null);
    }
}
