package com.globalcmx.api.service.query;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.globalcmx.api.dto.query.OperationSummaryDTO;
import com.globalcmx.api.dto.query.OperationSummaryDTO.*;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.entity.SwiftFieldConfig;
import com.globalcmx.api.readmodel.entity.SwiftMessageReadModel;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import com.globalcmx.api.readmodel.repository.SwiftFieldConfigRepository;
import com.globalcmx.api.readmodel.repository.SwiftMessageReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Servicio que analiza todos los mensajes SWIFT de una operación
 * y genera un resumen del estado actual.
 *
 * Funcionalidades:
 * - Parsea el mensaje original (MT700, MT760, etc.)
 * - Detecta enmiendas (MT707, MT767) y calcula valores actuales
 * - Rastrea utilizaciones y calcula saldo disponible
 * - Genera alertas automáticas
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
public class OperationAnalyzerService {

    private final OperationReadModelRepository operationRepository;
    private final SwiftMessageReadModelRepository swiftMessageRepository;
    private final SwiftFieldConfigRepository swiftFieldConfigRepository;

    // Cache de nombres de campos para evitar consultas repetidas
    private final Map<String, String> fieldNameCache = new HashMap<>();

    // Cache de field mappings por messageType para evitar queries repetidas
    // Key: messageType, Value: Map<draftFieldMapping, List<fieldCodeWithoutColons>>
    private final Map<String, Map<String, List<String>>> fieldMappingCache = new HashMap<>();

    // ObjectMapper para serializar/deserializar JSON
    private static final ObjectMapper objectMapper;
    static {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    // Tipos de mensaje original por producto
    private static final Set<String> ORIGINAL_MESSAGE_TYPES = Set.of(
            "MT700", "MT710", "MT720", // LC
            "MT760",                    // Garantías
            "MT400", "MT410"            // Cobranzas
    );

    // Tipos de mensaje de enmienda
    private static final Set<String> AMENDMENT_MESSAGE_TYPES = Set.of(
            "MT707", "MT747",           // LC amendments
            "MT767"                     // Guarantee amendments
    );

    // Tipos de mensaje de utilización/pago (reducen el saldo disponible)
    private static final Set<String> UTILIZATION_MESSAGE_TYPES = Set.of(
            "MT742",                    // LC reimbursement claim
            "MT750",                    // LC advice of discrepancy (with payment)
            "MT754",                    // LC advice of payment/acceptance/negotiation
            "MT756",                    // LC advice of reimbursement or payment
            "MT740",                    // Authorization to reimburse
            "MT202"                     // General financial institution transfer (payment)
    );

    // Pattern para extraer campos SWIFT
    // Nota: usa .*? (con DOTALL) en vez de [^:]+? para permitir colons en valores
    // (ej: "QUITO -ECUADOR/TELF: 3317300" en campo :50:)
    // Lookahead busca el próximo field code (\n:XX:) o fin de string
    // [A-Za-z] permite option letters minúsculas (:51a:, :52a:, :57a:, etc.)
    private static final Pattern FIELD_PATTERN = Pattern.compile(
            ":(\\d{2}[A-Za-z]?):\\s*(.*?)(?=\\r?\\n:\\d{2}[A-Za-z]?:|\\z)",
            Pattern.DOTALL
    );

    /**
     * Analiza una operación y genera un resumen completo del estado actual.
     *
     * @param operationId ID de la operación
     * @return Resumen de la operación
     */
    public OperationSummaryDTO analyzeOperation(String operationId) {
        OperationReadModel operation = operationRepository.findByOperationId(operationId)
                .orElseThrow(() -> new IllegalArgumentException("Operación no encontrada: " + operationId));
        return analyzeOperation(operation);
    }

    /**
     * Analiza una operación ya cargada (evita query adicional).
     */
    public OperationSummaryDTO analyzeOperation(OperationReadModel operation) {
        log.debug("Analyzing operation: {}", operation.getOperationId());

        // Cargar mensajes solo si es necesario (si hay mensaje SWIFT en la operación)
        List<SwiftMessageReadModel> messages = Collections.emptyList();
        if (operation.getSwiftMessage() != null && !operation.getSwiftMessage().isBlank()) {
            messages = swiftMessageRepository
                    .findByOperationIdOrderByCreatedAtAsc(operation.getOperationId());
        }

        return buildSummary(operation, messages);
    }

    /**
     * Obtiene alertas para una operación específica.
     */
    public List<AlertDTO> getOperationAlerts(String operationId) {
        OperationSummaryDTO summary = analyzeOperation(operationId);
        return summary.getAlerts();
    }

    /**
     * Obtiene alertas para todas las operaciones de un tipo de producto.
     */
    public Map<String, List<AlertDTO>> getAlertsByProductType(String productType) {
        List<OperationReadModel> operations = operationRepository
                .findByProductTypeAndStatusOrderByCreatedAtDesc(productType, "ACTIVE");

        Map<String, List<AlertDTO>> alertsMap = new HashMap<>();

        for (OperationReadModel op : operations) {
            try {
                List<AlertDTO> alerts = getOperationAlerts(op.getOperationId());
                if (!alerts.isEmpty()) {
                    alertsMap.put(op.getOperationId(), alerts);
                }
            } catch (Exception e) {
                log.warn("Error getting alerts for operation {}: {}", op.getOperationId(), e.getMessage());
            }
        }

        return alertsMap;
    }

    /**
     * Resincroniza los datos del readmodel de una operación desde el mensaje SWIFT.
     * Fuerza la re-extracción de parties (applicantName, beneficiaryName, issuingBankBic, advisingBankBic)
     * limpiando los campos existentes para que se vuelvan a extraer del SWIFT.
     * Mecanismo de contingencia para corregir datos faltantes o incorrectos.
     *
     * @param operationId ID de la operación a resincronizar
     */
    @Transactional(transactionManager = "readModelTransactionManager")
    public void resyncOperationFromSwift(String operationId) {
        log.info("Resyncing operation readmodel from SWIFT for: {}", operationId);

        OperationReadModel operation = operationRepository.findByOperationId(operationId)
                .orElse(null);
        if (operation == null) {
            log.warn("Operation not found for resync: {}", operationId);
            return;
        }

        // Guardar valores actuales como respaldo antes de limpiar
        String prevApplicant = operation.getApplicantName();
        String prevBeneficiary = operation.getBeneficiaryName();
        String prevIssuingBank = operation.getIssuingBankBic();
        String prevAdvisingBank = operation.getAdvisingBankBic();

        // Limpiar campos de parties para forzar re-extracción desde SWIFT
        operation.setApplicantName(null);
        operation.setBeneficiaryName(null);
        operation.setIssuingBankBic(null);
        operation.setAdvisingBankBic(null);

        // Recalcular summary (esto re-extraerá parties del SWIFT y actualizará el readmodel)
        updateAndPersistSummary(operation);

        // Si la re-extracción no pudo obtener algún campo, restaurar el valor anterior
        // Esto previene perder datos cuando el SWIFT no contiene el campo esperado
        boolean restored = false;
        if (operation.getApplicantName() == null && prevApplicant != null) {
            operation.setApplicantName(prevApplicant);
            restored = true;
        }
        if (operation.getBeneficiaryName() == null && prevBeneficiary != null) {
            operation.setBeneficiaryName(prevBeneficiary);
            restored = true;
        }
        if (operation.getIssuingBankBic() == null && prevIssuingBank != null) {
            operation.setIssuingBankBic(prevIssuingBank);
            restored = true;
        }
        if (operation.getAdvisingBankBic() == null && prevAdvisingBank != null) {
            operation.setAdvisingBankBic(prevAdvisingBank);
            restored = true;
        }
        if (restored) {
            log.warn("Some fields could not be re-extracted from SWIFT for {}, restored previous values", operationId);
            operationRepository.save(operation);
        }

        log.info("Operation readmodel resynced from SWIFT for: {}", operationId);
    }

    /**
     * Actualiza y persiste el summary de una operación.
     * Este método debe llamarse cada vez que ocurra un evento en la operación.
     *
     * @param operationId ID de la operación a actualizar
     * @return El summary actualizado
     */
    @Transactional(transactionManager = "readModelTransactionManager")
    public OperationSummaryDTO updateAndPersistSummary(String operationId) {
        // Cargar operación una sola vez
        OperationReadModel operation = operationRepository.findByOperationId(operationId)
                .orElseThrow(() -> new IllegalArgumentException("Operación no encontrada: " + operationId));
        return updateAndPersistSummary(operation);
    }

    /**
     * Actualiza y persiste el summary usando operación ya cargada (optimizado para batch).
     */
    @Transactional(transactionManager = "readModelTransactionManager")
    public OperationSummaryDTO updateAndPersistSummary(OperationReadModel operation) {
        log.debug("Updating summary for operation: {}", operation.getOperationId());

        // Analizar operación (usa la ya cargada)
        OperationSummaryDTO summary = analyzeOperation(operation);

        try {
            // Serializar summary a JSON
            String summaryJson = objectMapper.writeValueAsString(summary);
            operation.setSummary(summaryJson);

            // Actualizar flags de alertas
            List<AlertDTO> alerts = summary.getAlerts();
            operation.setHasAlerts(alerts != null && !alerts.isEmpty());
            operation.setAlertCount(alerts != null ? alerts.size() : 0);

            // Actualizar parties si están vacíos en el modelo principal
            PartySummary parties = summary.getParties();
            if (parties != null) {
                if ((operation.getApplicantName() == null || operation.getApplicantName().isBlank())
                    && parties.getApplicantName() != null) {
                    operation.setApplicantName(parties.getApplicantName());
                }
                if ((operation.getBeneficiaryName() == null || operation.getBeneficiaryName().isBlank())
                    && parties.getBeneficiaryName() != null) {
                    operation.setBeneficiaryName(parties.getBeneficiaryName());
                }
                if ((operation.getIssuingBankBic() == null || operation.getIssuingBankBic().isBlank())
                    && parties.getIssuingBankBic() != null) {
                    operation.setIssuingBankBic(parties.getIssuingBankBic());
                }
                if ((operation.getAdvisingBankBic() == null || operation.getAdvisingBankBic().isBlank())
                    && parties.getAdvisingBankBic() != null) {
                    operation.setAdvisingBankBic(parties.getAdvisingBankBic());
                }
            }

            // Actualizar fechas si están vacías en el modelo principal
            DateSummary dates = summary.getDates();
            if (dates != null) {
                if (operation.getIssueDate() == null && dates.getIssueDate() != null) {
                    operation.setIssueDate(dates.getIssueDate());
                }
                if (operation.getExpiryDate() == null && dates.getCurrentExpiryDate() != null) {
                    operation.setExpiryDate(dates.getCurrentExpiryDate());
                }
            }

            // Persistir pending balance desde el análisis SWIFT
            AmountSummary amounts = summary.getAmounts();
            if (amounts != null && amounts.getAvailableAmount() != null) {
                operation.setPendingBalance(amounts.getAvailableAmount());
            } else if (amounts != null && amounts.getCurrentAmount() != null) {
                operation.setPendingBalance(amounts.getCurrentAmount());
            }

            // Guardar operación
            operationRepository.save(operation);

            log.info("Summary updated for operation: {} with {} alerts, pendingBalance={}",
                    operation.getOperationId(), operation.getAlertCount(), operation.getPendingBalance());

        } catch (JsonProcessingException e) {
            log.error("Error serializing summary for operation {}: {}", operation.getOperationId(), e.getMessage());
            throw new RuntimeException("Error al serializar el summary", e);
        }

        return summary;
    }

    /**
     * Obtiene el summary almacenado de una operación.
     * Si no existe o está desactualizado, lo recalcula.
     *
     * @param operationId ID de la operación
     * @return El summary de la operación
     */
    public OperationSummaryDTO getStoredSummary(String operationId) {
        OperationReadModel operation = operationRepository.findByOperationId(operationId)
                .orElseThrow(() -> new IllegalArgumentException("Operación no encontrada: " + operationId));

        // Si hay summary almacenado, deserializarlo
        if (operation.getSummary() != null && !operation.getSummary().isBlank()) {
            try {
                return objectMapper.readValue(operation.getSummary(), OperationSummaryDTO.class);
            } catch (JsonProcessingException e) {
                log.warn("Error deserializing stored summary for {}, recalculating: {}",
                        operationId, e.getMessage());
            }
        }

        // Si no hay summary o hubo error, recalcular y persistir
        return updateAndPersistSummary(operationId);
    }

    /**
     * Actualiza los summaries de todas las operaciones activas de un tipo de producto.
     * Útil para recálculos masivos o jobs programados.
     * Optimizado: usa operación ya cargada para evitar queries dobles.
     *
     * @param productType Tipo de producto
     * @return Número de operaciones actualizadas
     */
    @Transactional(transactionManager = "readModelTransactionManager")
    public int refreshSummariesByProductType(String productType) {
        log.info("Refreshing summaries for product type: {}", productType);

        List<OperationReadModel> operations = operationRepository
                .findByProductTypeAndStatusOrderByCreatedAtDesc(productType, "ACTIVE");

        int updated = 0;
        int total = operations.size();
        for (OperationReadModel op : operations) {
            try {
                // Usa método optimizado que acepta operación ya cargada
                updateAndPersistSummary(op);
                updated++;
                if (updated % 100 == 0) {
                    log.info("Progress: {}/{} summaries updated for {}", updated, total, productType);
                }
            } catch (Exception e) {
                log.error("Error updating summary for operation {}: {}",
                        op.getOperationId(), e.getMessage());
            }
        }

        log.info("Refreshed {} summaries for product type: {}", updated, productType);
        return updated;
    }

    /**
     * Construye el resumen completo de la operación.
     */
    private OperationSummaryDTO buildSummary(OperationReadModel operation,
                                              List<SwiftMessageReadModel> messages) {
        // Separar mensaje original de enmiendas
        SwiftMessageReadModel originalMessage = findOriginalMessage(messages, operation);
        List<SwiftMessageReadModel> amendments = findAmendments(messages);

        // Parsear campos del mensaje original
        Map<String, String> originalFields = originalMessage != null
                ? extractSwiftFields(originalMessage.getSwiftContent())
                : extractSwiftFields(operation.getSwiftMessage());

        // Cargar field mappings desde configuración de BD (cacheado por messageType)
        Map<String, List<String>> fieldMappings = loadFieldMappings(operation.getMessageType());

        // Calcular valores actuales aplicando enmiendas y utilizaciones (usando config de BD)
        AmountSummary amounts = calculateAmounts(operation, originalFields, amendments, messages, fieldMappings);
        DateSummary dates = calculateDates(operation, originalFields, amendments, fieldMappings);
        PartySummary parties = extractParties(operation, originalFields, fieldMappings);

        // Construir historial de mensajes
        List<MessageSummary> messageHistory = buildMessageHistory(messages);
        // Usar tipo de mensaje original y idioma por defecto para etiquetas de campos
        String messageType = operation.getMessageType();
        String language = "es"; // TODO: Obtener del contexto de usuario
        List<AmendmentSummary> amendmentHistory = buildAmendmentHistory(amendments, originalFields, messageType, language);

        // Generar alertas
        List<AlertDTO> alerts = generateAlerts(operation, dates, amounts);

        return OperationSummaryDTO.builder()
                .operationId(operation.getOperationId())
                .reference(operation.getReference())
                .productType(operation.getProductType())
                .messageType(operation.getMessageType())
                .stage(operation.getStage())
                .status(operation.getStatus())
                .amounts(amounts)
                .dates(dates)
                .parties(parties)
                .messageHistory(messageHistory)
                .amendments(amendmentHistory)
                .alerts(alerts)
                .totalMessages(messages.size())
                .totalAmendments(amendments.size())
                .lastUpdated(operation.getModifiedAt())
                .build();
    }

    /**
     * Encuentra el mensaje SWIFT original de la operación.
     */
    private SwiftMessageReadModel findOriginalMessage(List<SwiftMessageReadModel> messages,
                                                       OperationReadModel operation) {
        // Buscar por tipo de mensaje original
        for (SwiftMessageReadModel msg : messages) {
            if (ORIGINAL_MESSAGE_TYPES.contains(msg.getMessageType())) {
                return msg;
            }
        }

        // Si no hay mensajes guardados, retornar null (usaremos el SWIFT de la operación)
        return null;
    }

    /**
     * Encuentra todos los mensajes de enmienda.
     */
    private List<SwiftMessageReadModel> findAmendments(List<SwiftMessageReadModel> messages) {
        return messages.stream()
                .filter(msg -> AMENDMENT_MESSAGE_TYPES.contains(msg.getMessageType()))
                .collect(Collectors.toList());
    }

    /**
     * Extrae todos los campos de un mensaje SWIFT.
     */
    private Map<String, String> extractSwiftFields(String swiftContent) {
        Map<String, String> fields = new HashMap<>();

        if (swiftContent == null || swiftContent.isBlank()) {
            return fields;
        }

        Matcher matcher = FIELD_PATTERN.matcher(swiftContent);
        while (matcher.find()) {
            String fieldCode = matcher.group(1);
            String fieldValue = matcher.group(2).trim();
            // Store with original case
            fields.put(fieldCode, fieldValue);
            // Also store with uppercase option letter for lookup compatibility
            // e.g., "52a" → also store as "52A" so extractParties finds it
            if (fieldCode.length() == 3 && Character.isLowerCase(fieldCode.charAt(2))) {
                fields.put(fieldCode.substring(0, 2) + Character.toUpperCase(fieldCode.charAt(2)), fieldValue);
            }
        }

        return fields;
    }

    /**
     * Calcula el resumen de montos incluyendo utilizaciones.
     * Usa configuración de BD para determinar qué campo contiene currency+amount.
     */
    private AmountSummary calculateAmounts(OperationReadModel operation,
                                           Map<String, String> originalFields,
                                           List<SwiftMessageReadModel> amendments,
                                           List<SwiftMessageReadModel> allMessages,
                                           Map<String, List<String>> fieldMappings) {
        // Obtener monto original del campo configurado como "currency,amount" (usualmente :32B:)
        BigDecimal originalAmount = operation.getAmount();
        String currency = operation.getCurrency();

        if (originalAmount == null) {
            String amountField = findFieldValue(originalFields, fieldMappings, "currency,amount");
            if (amountField != null) {
                currency = amountField.length() >= 3 ? amountField.substring(0, 3) : currency;
                originalAmount = parseSwiftAmount(amountField.length() > 3 ? amountField.substring(3) : "0");
            }
        }

        // Calcular monto actual aplicando enmiendas
        BigDecimal currentAmount = originalAmount != null ? originalAmount : BigDecimal.ZERO;

        for (SwiftMessageReadModel amendment : amendments) {
            Map<String, String> amendFields = extractSwiftFields(amendment.getSwiftContent());
            // Cargar mappings del tipo de enmienda (puede diferir del original)
            Map<String, List<String>> amendMappings = loadFieldMappings(amendment.getMessageType());
            String newAmountField = findFieldValue(amendFields, amendMappings, "currency,amount");
            if (newAmountField != null) {
                BigDecimal newAmount = parseSwiftAmount(
                        newAmountField.length() > 3 ? newAmountField.substring(3) : "0");
                if (newAmount != null) {
                    currentAmount = newAmount;
                }
            }
        }

        // Calcular utilizaciones desde mensajes de pago/utilización asociados
        BigDecimal utilizedAmount = calculateUtilizedAmount(allMessages, fieldMappings);

        AmountSummary summary = AmountSummary.builder()
                .currency(currency)
                .originalAmount(originalAmount)
                .currentAmount(currentAmount)
                .utilizedAmount(utilizedAmount)
                .build();

        summary.calculateUtilization();

        return summary;
    }

    /**
     * Calcula el resumen de fechas.
     * Usa configuración de BD para determinar qué campos contienen fechas.
     */
    private DateSummary calculateDates(OperationReadModel operation,
                                        Map<String, String> originalFields,
                                        List<SwiftMessageReadModel> amendments,
                                        Map<String, List<String>> fieldMappings) {
        LocalDate issueDate = operation.getIssueDate();
        LocalDate originalExpiryDate = operation.getExpiryDate();
        LocalDate currentExpiryDate = originalExpiryDate;
        LocalDate latestShipmentDate = null;

        // Extraer fecha de emisión desde campo configurado como "issueDate" (usualmente :31C:)
        if (issueDate == null) {
            String issueDateValue = findFieldValue(originalFields, fieldMappings, "issueDate");
            if (issueDateValue != null) {
                issueDate = parseSwiftDate(issueDateValue);
            }
        }

        // Extraer fecha de vencimiento desde campo configurado como "expiryDate" (usualmente :31D: o :31E:)
        if (originalExpiryDate == null) {
            String expiryDateValue = findFieldValue(originalFields, fieldMappings, "expiryDate");
            if (expiryDateValue != null) {
                originalExpiryDate = parseSwiftDate(expiryDateValue);
                currentExpiryDate = originalExpiryDate;
            }
        }

        // Extraer fecha límite de embarque desde campo configurado como "latestShipmentDate" (usualmente :44C:)
        String shipmentValue = findFieldValue(originalFields, fieldMappings, "latestShipmentDate");
        if (shipmentValue != null) {
            latestShipmentDate = parseSwiftDate(shipmentValue);
        }

        // Aplicar enmiendas a la fecha de vencimiento
        for (SwiftMessageReadModel amendment : amendments) {
            Map<String, String> amendFields = extractSwiftFields(amendment.getSwiftContent());
            Map<String, List<String>> amendMappings = loadFieldMappings(amendment.getMessageType());

            String newExpiryValue = findFieldValue(amendFields, amendMappings, "expiryDate");
            if (newExpiryValue != null) {
                LocalDate newExpiry = parseSwiftDate(newExpiryValue);
                if (newExpiry != null) {
                    currentExpiryDate = newExpiry;
                }
            }

            String newShipmentValue = findFieldValue(amendFields, amendMappings, "latestShipmentDate");
            if (newShipmentValue != null) {
                LocalDate newShipment = parseSwiftDate(newShipmentValue);
                if (newShipment != null) {
                    latestShipmentDate = newShipment;
                }
            }
        }

        DateSummary summary = DateSummary.builder()
                .issueDate(issueDate)
                .originalExpiryDate(originalExpiryDate)
                .currentExpiryDate(currentExpiryDate)
                .latestShipmentDate(latestShipmentDate)
                .build();

        summary.calculateDaysToExpiry();

        return summary;
    }

    /**
     * Extrae información de las partes usando configuración de BD.
     * Usa datos de OperationReadModel como prioridad, y SWIFT fields como fallback.
     * Los campos a buscar se determinan por draft_field_mapping en swift_field_config_readmodel.
     */
    private PartySummary extractParties(OperationReadModel operation,
                                         Map<String, String> originalFields,
                                         Map<String, List<String>> fieldMappings) {
        // Applicant: campos configurados como "applicantName" (usualmente :50: / :50K:)
        String applicantName = operation.getApplicantName();
        String applicantAddress = null;
        if (applicantName == null || applicantName.isBlank()) {
            String field50 = findFieldValue(originalFields, fieldMappings, "applicantName");
            if (field50 != null) {
                String[] lines = field50.split("\\r?\\n");
                applicantName = lines.length > 0 ? lines[0].trim() : null;
                if (lines.length > 1) {
                    applicantAddress = String.join(", ", Arrays.copyOfRange(lines, 1, lines.length)).trim();
                }
            }
        }

        // Beneficiary: campos configurados como "beneficiaryName" (usualmente :59: / :59A:)
        String beneficiaryName = operation.getBeneficiaryName();
        String beneficiaryAddress = null;
        if (beneficiaryName == null || beneficiaryName.isBlank()) {
            String field59 = findFieldValue(originalFields, fieldMappings, "beneficiaryName");
            if (field59 != null) {
                String[] lines = field59.split("\\r?\\n");
                beneficiaryName = lines.length > 0 ? lines[0].trim() : null;
                if (lines.length > 1) {
                    beneficiaryAddress = String.join(", ", Arrays.copyOfRange(lines, 1, lines.length)).trim();
                }
            }
        }

        // Issuing Bank: campos configurados como "issuingBankBic" (usualmente :52a: / :51a:)
        String issuingBankBic = operation.getIssuingBankBic();
        String issuingBankName = null;
        if (issuingBankBic == null || issuingBankBic.isBlank()) {
            String field52 = findFieldValue(originalFields, fieldMappings, "issuingBankBic");
            if (field52 != null) {
                String[] lines = field52.split("\\r?\\n");
                issuingBankBic = lines.length > 0 ? lines[0].trim() : null;
                if (lines.length > 1) {
                    issuingBankName = lines[1].trim();
                }
            }
        }

        // Advising Bank: campos configurados como "advisingBankBic" (usualmente :57A: / :57a:)
        String advisingBankBic = operation.getAdvisingBankBic();
        String advisingBankName = null;
        if (advisingBankBic == null || advisingBankBic.isBlank()) {
            String field57 = findFieldValue(originalFields, fieldMappings, "advisingBankBic");
            if (field57 != null) {
                String[] lines = field57.split("\\r?\\n");
                advisingBankBic = lines.length > 0 ? lines[0].trim() : null;
                if (lines.length > 1) {
                    advisingBankName = lines[1].trim();
                }
            }
        }

        return PartySummary.builder()
                .applicantName(applicantName)
                .applicantAddress(applicantAddress)
                .beneficiaryName(beneficiaryName)
                .beneficiaryAddress(beneficiaryAddress)
                .issuingBankBic(issuingBankBic)
                .issuingBankName(issuingBankName)
                .advisingBankBic(advisingBankBic)
                .advisingBankName(advisingBankName)
                .build();
    }

    /**
     * Construye el historial de mensajes.
     */
    private List<MessageSummary> buildMessageHistory(List<SwiftMessageReadModel> messages) {
        return messages.stream()
                .map(msg -> MessageSummary.builder()
                        .messageId(msg.getMessageId())
                        .messageType(msg.getMessageType())
                        .direction(msg.getDirection())
                        .status(msg.getStatus())
                        .reference(msg.getField20Reference())
                        .createdAt(msg.getCreatedAt())
                        .sentAt(msg.getSentAt())
                        .senderBic(msg.getSenderBic())
                        .receiverBic(msg.getReceiverBic())
                        .description(getMessageDescription(msg.getMessageType()))
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Construye el historial de enmiendas con detección de cambios.
     *
     * @param amendments Lista de mensajes de enmienda
     * @param originalFields Campos del mensaje original
     * @param originalMessageType Tipo de mensaje original (ej: "MT700")
     * @param language Idioma para etiquetas de campos
     * @return Lista de resúmenes de enmiendas
     */
    private List<AmendmentSummary> buildAmendmentHistory(List<SwiftMessageReadModel> amendments,
                                                          Map<String, String> originalFields,
                                                          String originalMessageType,
                                                          String language) {
        List<AmendmentSummary> history = new ArrayList<>();
        Map<String, String> previousFields = new HashMap<>(originalFields);
        int sequence = 1;

        for (SwiftMessageReadModel amendment : amendments) {
            Map<String, String> amendFields = extractSwiftFields(amendment.getSwiftContent());
            // Usar el tipo de mensaje original para buscar configuración de campos
            List<FieldChange> changes = detectChanges(previousFields, amendFields, originalMessageType, language);

            history.add(AmendmentSummary.builder()
                    .sequence(sequence++)
                    .date(amendment.getCreatedAt())
                    .messageType(amendment.getMessageType())
                    .messageId(amendment.getMessageId())
                    .changes(changes)
                    .description(extractAmendmentDescription(amendFields))
                    .build());

            // Actualizar campos para la siguiente comparación
            previousFields.putAll(amendFields);
        }

        return history;
    }

    /**
     * Detecta cambios entre dos versiones de campos.
     * Compara TODOS los campos presentes en la enmienda (no solo un set hardcodeado).
     *
     * @param previous Campos de la versión anterior
     * @param current Campos de la versión actual (enmienda)
     * @param messageType Tipo de mensaje SWIFT
     * @param language Idioma para obtener nombres de campos
     * @return Lista de cambios detectados
     */
    private List<FieldChange> detectChanges(Map<String, String> previous,
                                             Map<String, String> current,
                                             String messageType,
                                             String language) {
        List<FieldChange> changes = new ArrayList<>();

        // Comparar TODOS los campos que vienen en la enmienda contra los anteriores
        for (Map.Entry<String, String> entry : current.entrySet()) {
            String field = entry.getKey();
            String currValue = entry.getValue();
            String prevValue = previous.get(field);

            if (currValue != null && !currValue.equals(prevValue)) {
                changes.add(FieldChange.builder()
                        .fieldCode(":" + field + ":")
                        .fieldName(getFieldName(field, messageType, language))
                        .previousValue(prevValue)
                        .newValue(currValue)
                        .build());
            }
        }

        return changes;
    }

    /**
     * Genera alertas basadas en el estado de la operación.
     * Los mensajes se envían como parámetros para que el frontend los interpole con i18n.
     */
    private List<AlertDTO> generateAlerts(OperationReadModel operation,
                                           DateSummary dates,
                                           AmountSummary amounts) {
        List<AlertDTO> alerts = new ArrayList<>();

        // Alerta: Operación vencida
        if (dates.isExpired()) {
            alerts.add(AlertDTO.builder()
                    .type("DANGER")
                    .code("EXPIRED")
                    .icon("alert-triangle")
                    .params(Map.of(
                            "date", dates.getCurrentExpiryDate() != null ? dates.getCurrentExpiryDate().toString() : "",
                            "days", Math.abs(dates.getDaysToExpiry() != null ? dates.getDaysToExpiry() : 0)
                    ))
                    .build());
        }
        // Alerta: Próxima a vencer (≤30 días)
        else if (dates.getDaysToExpiry() != null && dates.getDaysToExpiry() <= 30 && dates.getDaysToExpiry() > 0) {
            alerts.add(AlertDTO.builder()
                    .type("WARNING")
                    .code("EXPIRING_SOON")
                    .icon("clock")
                    .params(Map.of(
                            "days", dates.getDaysToExpiry(),
                            "date", dates.getCurrentExpiryDate() != null ? dates.getCurrentExpiryDate().toString() : ""
                    ))
                    .build());
        }

        // Alerta: Alta utilización (≥80%)
        if (amounts.getUtilizationPercentage() != null &&
            amounts.getUtilizationPercentage().compareTo(new BigDecimal("80")) >= 0) {
            alerts.add(AlertDTO.builder()
                    .type("INFO")
                    .code("HIGH_UTILIZATION")
                    .icon("trending-up")
                    .params(Map.of(
                            "percentage", amounts.getUtilizationPercentage()
                    ))
                    .build());
        }

        // Alerta: Respuesta pendiente
        if (Boolean.TRUE.equals(operation.getAwaitingResponse())) {
            if (operation.getResponseDueDate() != null) {
                long daysOverdue = ChronoUnit.DAYS.between(operation.getResponseDueDate(), LocalDate.now());
                if (daysOverdue > 0) {
                    alerts.add(AlertDTO.builder()
                            .type("DANGER")
                            .code("RESPONSE_OVERDUE")
                            .icon("alert-circle")
                            .params(Map.of(
                                    "days", daysOverdue,
                                    "messageType", operation.getAwaitingMessageType() != null ? operation.getAwaitingMessageType() : ""
                            ))
                            .build());
                } else {
                    alerts.add(AlertDTO.builder()
                            .type("WARNING")
                            .code("AWAITING_RESPONSE")
                            .icon("mail")
                            .params(Map.of(
                                    "messageType", operation.getAwaitingMessageType() != null ? operation.getAwaitingMessageType() : "",
                                    "dueDate", operation.getResponseDueDate().toString()
                            ))
                            .build());
                }
            } else {
                alerts.add(AlertDTO.builder()
                        .type("WARNING")
                        .code("AWAITING_RESPONSE")
                        .icon("mail")
                        .params(Map.of(
                                "messageType", operation.getAwaitingMessageType() != null ? operation.getAwaitingMessageType() : ""
                        ))
                        .build());
            }
        }

        return alerts;
    }

    /**
     * Calcula el monto total utilizado sumando los montos de mensajes de utilización/pago.
     * Busca en el campo configurado como "currency,amount" de cada mensaje, con fallback
     * al campo amount directo del SwiftMessageReadModel.
     */
    private BigDecimal calculateUtilizedAmount(List<SwiftMessageReadModel> allMessages,
                                                Map<String, List<String>> fieldMappings) {
        BigDecimal total = BigDecimal.ZERO;

        List<SwiftMessageReadModel> utilizationMessages = allMessages.stream()
                .filter(msg -> UTILIZATION_MESSAGE_TYPES.contains(msg.getMessageType()))
                .collect(Collectors.toList());

        for (SwiftMessageReadModel msg : utilizationMessages) {
            BigDecimal msgAmount = null;

            // Try extracting from SWIFT content using DB-configured field mappings
            if (msg.getSwiftContent() != null && !msg.getSwiftContent().isBlank()) {
                Map<String, String> msgFields = extractSwiftFields(msg.getSwiftContent());
                Map<String, List<String>> msgMappings = loadFieldMappings(msg.getMessageType());
                String amountField = findFieldValue(msgFields, msgMappings, "currency,amount");
                if (amountField != null && amountField.length() > 3) {
                    msgAmount = parseSwiftAmount(amountField.substring(3));
                }
            }

            // Fallback: use the amount stored directly in the message readmodel
            if (msgAmount == null && msg.getAmount() != null) {
                msgAmount = msg.getAmount();
            }

            if (msgAmount != null) {
                total = total.add(msgAmount);
            }
        }

        return total;
    }

    // ==================== FIELD MAPPING FROM DB CONFIG ====================

    /**
     * Carga el mapeo de campos SWIFT desde la configuración de BD.
     * Usa cache para evitar queries repetidas por messageType.
     *
     * @param messageType Tipo de mensaje (ej: "MT700")
     * @return Mapa de draftFieldMapping → lista de field codes (sin colons)
     */
    private Map<String, List<String>> loadFieldMappings(String messageType) {
        if (messageType == null) return Collections.emptyMap();

        return fieldMappingCache.computeIfAbsent(messageType, mt -> {
            Map<String, List<String>> mappings = new HashMap<>();
            try {
                List<SwiftFieldConfig> configs = swiftFieldConfigRepository.findFieldsWithDraftMapping(mt);
                for (SwiftFieldConfig config : configs) {
                    String mapping = config.getDraftFieldMapping();
                    if (mapping != null && !mapping.isBlank() && !mapping.startsWith("compute:")) {
                        // Remove colons: ":31D:" -> "31D"
                        String fieldCode = config.getFieldCode().replaceAll(":", "");
                        mappings.computeIfAbsent(mapping, k -> new ArrayList<>()).add(fieldCode);
                    }
                }
                log.debug("Loaded {} field mappings for {}: {}", mappings.size(), mt, mappings.keySet());
            } catch (Exception e) {
                log.warn("Error loading field mappings for {}: {}", mt, e.getMessage());
            }
            return mappings;
        });
    }

    /**
     * Busca un valor en los campos SWIFT usando EXCLUSIVAMENTE los field codes
     * configurados en la BD (draft_field_mapping en swift_field_config_readmodel).
     * No usa fallbacks hardcodeados — si la BD no tiene config, retorna null.
     *
     * @param originalFields Campos extraídos del SWIFT
     * @param fieldMappings Mapeo cargado de BD
     * @param mappingName Nombre del mapping (ej: "applicantName")
     * @return El valor del primer campo encontrado, o null
     */
    private String findFieldValue(Map<String, String> originalFields,
                                   Map<String, List<String>> fieldMappings,
                                   String mappingName) {
        List<String> configuredCodes = fieldMappings.getOrDefault(mappingName, Collections.emptyList());

        if (configuredCodes.isEmpty()) {
            log.warn("No field mapping configured in DB for '{}'. Check swift_field_config_readmodel.draft_field_mapping", mappingName);
            return null;
        }

        for (String code : configuredCodes) {
            String value = originalFields.get(code);
            if (value != null) return value;
            // También intentar con case alternativo (52a ↔ 52A)
            if (code.length() >= 3 && Character.isLetter(code.charAt(code.length() - 1))) {
                char lastChar = code.charAt(code.length() - 1);
                String altCode = code.substring(0, code.length() - 1)
                        + (Character.isLowerCase(lastChar) ? Character.toUpperCase(lastChar) : Character.toLowerCase(lastChar));
                value = originalFields.get(altCode);
                if (value != null) return value;
            }
        }

        return null;
    }

    // ==================== MÉTODOS AUXILIARES ====================

    /**
     * Parsea una fecha SWIFT (YYYYMMDD o YYMMDD).
     */
    private LocalDate parseSwiftDate(String dateStr) {
        if (dateStr == null || dateStr.length() < 6) {
            return null;
        }

        try {
            // Extraer solo dígitos
            String digits = dateStr.replaceAll("[^0-9]", "");

            if (digits.length() >= 8) {
                // YYYYMMDD
                return LocalDate.of(
                        Integer.parseInt(digits.substring(0, 4)),
                        Integer.parseInt(digits.substring(4, 6)),
                        Integer.parseInt(digits.substring(6, 8))
                );
            } else if (digits.length() >= 6) {
                // YYMMDD
                int year = Integer.parseInt(digits.substring(0, 2));
                int fullYear = year <= 50 ? 2000 + year : 1900 + year;
                return LocalDate.of(
                        fullYear,
                        Integer.parseInt(digits.substring(2, 4)),
                        Integer.parseInt(digits.substring(4, 6))
                );
            }
        } catch (Exception e) {
            log.warn("Error parsing SWIFT date: {}", dateStr);
        }
        return null;
    }

    /**
     * Parsea un monto SWIFT (usa coma como separador decimal).
     */
    private BigDecimal parseSwiftAmount(String amountStr) {
        if (amountStr == null || amountStr.isBlank()) {
            return null;
        }
        try {
            String normalized = amountStr.replace(",", ".").replaceAll("[^0-9.]", "");
            return new BigDecimal(normalized);
        } catch (Exception e) {
            log.warn("Error parsing SWIFT amount: {}", amountStr);
            return null;
        }
    }

    /**
     * Retorna el tipo de mensaje como clave para traducción en frontend.
     * El frontend usará: t('swiftMessages.types.MT700')
     */
    private String getMessageDescription(String messageType) {
        // Retornamos el messageType directamente - el frontend lo traducirá
        return messageType;
    }

    /**
     * Obtiene el nombre del campo desde la configuración de BD.
     * Usa cache para evitar consultas repetidas.
     *
     * @param fieldCode Código del campo (ej: "32B", "31D")
     * @param messageType Tipo de mensaje (ej: "MT700")
     * @param language Idioma (ej: "es", "en")
     * @return Nombre del campo o el código si no se encuentra
     */
    private String getFieldName(String fieldCode, String messageType, String language) {
        String cacheKey = fieldCode + "_" + messageType + "_" + language;

        if (fieldNameCache.containsKey(cacheKey)) {
            return fieldNameCache.get(cacheKey);
        }

        // Formatear fieldCode al estilo almacenado en BD (ej: ":32B:" o "32B")
        String formattedCode = fieldCode.startsWith(":") ? fieldCode : ":" + fieldCode + ":";

        try {
            // Buscar campo sin idioma (i18n se maneja en frontend)
            Optional<SwiftFieldConfig> config = swiftFieldConfigRepository
                    .findByFieldCodeAndMessageType(formattedCode, messageType);

            if (config.isPresent()) {
                // Retornar la clave de traducción, el frontend la resolverá
                String fieldNameKey = config.get().getFieldNameKey();
                fieldNameCache.put(cacheKey, fieldNameKey);
                return fieldNameKey;
            }
        } catch (Exception e) {
            log.warn("Error buscando configuración de campo {} para {}: {}", fieldCode, messageType, e.getMessage());
        }

        // Fallback: retornar el código del campo
        fieldNameCache.put(cacheKey, fieldCode);
        return fieldCode;
    }

    /**
     * Versión simplificada que usa idioma por defecto
     */
    private String getFieldName(String fieldCode) {
        return fieldCode; // Retornamos el código, el frontend puede traducirlo
    }

    /**
     * Extrae descripción de una enmienda del campo :79:.
     * Retorna el contenido real del campo o null si no existe.
     */
    private String extractAmendmentDescription(Map<String, String> fields) {
        return fields.get("79"); // null si no existe, el frontend manejará el caso
    }
}
