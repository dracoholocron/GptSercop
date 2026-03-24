package com.globalcmx.api.ai.extraction.service;

import com.globalcmx.api.ai.extraction.dto.ExtractionRequest;
import com.globalcmx.api.ai.extraction.dto.ExtractionResponse;
import com.globalcmx.api.ai.extraction.dto.ProviderHealthResponse;
import com.globalcmx.api.ai.extraction.entity.ExtractionHistory;
import com.globalcmx.api.ai.extraction.provider.AIExtractionProvider;
import com.globalcmx.api.ai.extraction.repository.ExtractionHistoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.globalcmx.api.ai.extraction.dto.UsageStatsResponse;
import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servicio principal de extracción de documentos con IA.
 * Gestiona múltiples proveedores y proporciona una API unificada.
 */
@Slf4j
@Service
@Transactional
public class AIExtractionService {

    private final Map<String, AIExtractionProvider> providers = new HashMap<>();
    private final ExtractionHistoryRepository historyRepository;

    @Value("${ai.extraction.default-provider:claude}")
    private String defaultProvider;

    @Value("${ai.extraction.save-history:true}")
    private boolean saveHistory;

    public AIExtractionService(
            List<AIExtractionProvider> providerList,
            ExtractionHistoryRepository historyRepository) {
        this.historyRepository = historyRepository;

        // Registrar todos los proveedores inyectados
        for (AIExtractionProvider provider : providerList) {
            providers.put(provider.getProviderCode(), provider);
            log.info("Proveedor de extracción registrado: {} ({})",
                    provider.getDisplayName(), provider.getProviderCode());
        }
    }

    @PostConstruct
    public void init() {
        log.info("AIExtractionService inicializado con {} proveedores. Default: {}",
                providers.size(), defaultProvider);
    }

    /**
     * Verifica la salud de un proveedor específico
     */
    public ProviderHealthResponse checkProviderHealth(String providerCode) {
        AIExtractionProvider provider = providers.get(providerCode);
        if (provider == null) {
            return ProviderHealthResponse.builder()
                    .available(false)
                    .provider(providerCode)
                    .errorMessage("Proveedor no encontrado: " + providerCode)
                    .build();
        }
        return provider.checkHealth();
    }

    /**
     * Lista todos los proveedores disponibles
     */
    public List<ProviderHealthResponse> listProviders() {
        return providers.values().stream()
                .map(AIExtractionProvider::checkHealth)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene el proveedor por defecto
     */
    public String getDefaultProvider() {
        return defaultProvider;
    }

    /**
     * Ejecuta la extracción de un documento
     */
    public ExtractionResponse extract(ExtractionRequest request, String userId) {
        String providerCode = request.getProvider() != null ?
                request.getProvider() : defaultProvider;

        AIExtractionProvider provider = providers.get(providerCode);
        if (provider == null) {
            throw new IllegalArgumentException("Proveedor no encontrado: " + providerCode);
        }

        // Validar tipo de archivo
        if (!provider.supportsFileType(request.getFile().getMimeType())) {
            throw new IllegalArgumentException(
                    "Tipo de archivo no soportado por " + provider.getDisplayName() +
                    ": " + request.getFile().getMimeType());
        }

        log.info("Iniciando extracción. Proveedor: {}, Archivo: {}, Usuario: {}",
                providerCode, request.getFile().getFileName(), userId);

        // Ejecutar extracción
        ExtractionResponse response = provider.extract(request);

        // Guardar en historial si está habilitado
        if (saveHistory) {
            saveToHistory(request, response, userId);
        }

        return response;
    }

    /**
     * Guarda la extracción en el historial
     */
    private void saveToHistory(ExtractionRequest request, ExtractionResponse response, String userId) {
        try {
            ExtractionHistory history = ExtractionHistory.builder()
                    .id(response.getId())
                    .fileName(request.getFile().getFileName())
                    .fileType(request.getFile().getMimeType())
                    .fileSize((long) request.getFile().getContent().length())
                    .messageType(request.getMessageType())
                    .provider(response.getProvider())
                    .model(response.getModel())
                    .fieldsExtracted(0) // Se actualizará desde el frontend
                    .fieldsApproved(0)
                    .processingTimeMs(response.getProcessingTimeMs())
                    .inputTokens(response.getInputTokens())
                    .outputTokens(response.getOutputTokens())
                    .estimatedCost(response.getEstimatedCost())
                    .status("PENDING_REVIEW")
                    .rawResponse(response.getContent())
                    .errors(response.getErrors() != null ?
                            String.join("; ", response.getErrors()) : null)
                    .createdBy(userId)
                    .build();

            historyRepository.save(history);
            log.debug("Extracción guardada en historial: {}", response.getId());

        } catch (Exception e) {
            log.error("Error guardando extracción en historial: {}", e.getMessage());
        }
    }

    /**
     * Obtiene el historial de extracciones
     */
    @Transactional(readOnly = true)
    public Page<ExtractionHistory> getHistory(
            String messageType,
            String provider,
            String status,
            LocalDateTime dateFrom,
            LocalDateTime dateTo,
            String createdBy,
            Pageable pageable) {

        return historyRepository.findByFilters(
                messageType, provider, status, dateFrom, dateTo, createdBy, pageable);
    }

    /**
     * Obtiene una extracción del historial por ID
     */
    @Transactional(readOnly = true)
    public Optional<ExtractionHistory> getHistoryById(String id) {
        return historyRepository.findById(id);
    }

    /**
     * Actualiza el estado de una extracción
     */
    public ExtractionHistory updateExtractionStatus(
            String id,
            String status,
            Integer fieldsApproved,
            Integer fieldsRejected,
            Integer fieldsEdited) {

        ExtractionHistory history = historyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Extracción no encontrada: " + id));

        history.setStatus(status);
        if (fieldsApproved != null) history.setFieldsApproved(fieldsApproved);
        if (fieldsRejected != null) history.setFieldsRejected(fieldsRejected);
        if (fieldsEdited != null) history.setFieldsEdited(fieldsEdited);
        history.setUpdatedAt(LocalDateTime.now());

        return historyRepository.save(history);
    }

    /**
     * Elimina una extracción del historial
     */
    public void deleteHistory(String id) {
        historyRepository.deleteById(id);
    }

    /**
     * Obtiene estadísticas de uso
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getUsageStats(LocalDateTime from, LocalDateTime to) {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalExtractions", historyRepository.countByCreatedAtBetween(from, to));
        stats.put("byProvider", historyRepository.countByProviderAndCreatedAtBetween(from, to));
        stats.put("byMessageType", historyRepository.countByMessageTypeAndCreatedAtBetween(from, to));
        stats.put("totalCost", historyRepository.sumEstimatedCostByCreatedAtBetween(from, to));
        stats.put("avgProcessingTime", historyRepository.avgProcessingTimeByCreatedAtBetween(from, to));

        return stats;
    }

    /**
     * Obtiene estadísticas de uso completas para un usuario
     */
    @Transactional(readOnly = true)
    public UsageStatsResponse getUserUsageStats(String userId) {
        // Calcular períodos
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime currentMonthStart = now.with(TemporalAdjusters.firstDayOfMonth()).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime currentMonthEnd = now;
        LocalDateTime previousMonthStart = currentMonthStart.minusMonths(1);
        LocalDateTime previousMonthEnd = currentMonthStart.minusSeconds(1);

        // Estadísticas del mes actual
        UsageStatsResponse.PeriodStats currentMonth = buildPeriodStats(userId, currentMonthStart, currentMonthEnd);

        // Estadísticas del mes anterior
        UsageStatsResponse.PeriodStats previousMonth = buildPeriodStats(userId, previousMonthStart, previousMonthEnd);

        // Historial reciente
        List<ExtractionHistory> recent = historyRepository.findTop10ByCreatedByOrderByCreatedAtDesc(userId);
        List<UsageStatsResponse.ExtractionSummary> recentExtractions = recent.stream()
                .map(h -> UsageStatsResponse.ExtractionSummary.builder()
                        .id(h.getId())
                        .fileName(h.getFileName())
                        .messageType(h.getMessageType())
                        .provider(h.getProvider())
                        .fieldsExtracted(h.getFieldsExtracted())
                        .processingTimeMs(h.getProcessingTimeMs())
                        .estimatedCost(h.getEstimatedCost())
                        .status(h.getStatus())
                        .createdAt(h.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        // Límites del plan (configurables por usuario/organización en el futuro)
        UsageStatsResponse.UsageLimits limits = UsageStatsResponse.UsageLimits.builder()
                .maxExtractionsPerMonth(100L)
                .maxFilesPerExtraction(5)
                .maxFileSizeBytes(10L * 1024 * 1024) // 10MB
                .monthlyBudgetUsd(new BigDecimal("50.00"))
                .availableProviders(new ArrayList<>(providers.keySet()))
                .build();

        // Calcular porcentaje de uso
        double usagePercentage = limits.getMaxExtractionsPerMonth() > 0
                ? (currentMonth.getTotalExtractions() * 100.0 / limits.getMaxExtractionsPerMonth())
                : 0.0;

        return UsageStatsResponse.builder()
                .currentMonth(currentMonth)
                .previousMonth(previousMonth)
                .recentExtractions(recentExtractions)
                .limits(limits)
                .usagePercentage(Math.min(usagePercentage, 100.0))
                .build();
    }

    /**
     * Construye estadísticas de un período
     */
    private UsageStatsResponse.PeriodStats buildPeriodStats(String userId, LocalDateTime from, LocalDateTime to) {
        Map<String, Object> stats = historyRepository.getUserUsageStats(userId, from, to);

        // Obtener desglose por proveedor
        List<Map<String, Object>> byProvider = historyRepository.countByProviderAndCreatedAtBetween(from, to);
        List<UsageStatsResponse.ProviderBreakdown> providerBreakdown = byProvider.stream()
                .map(p -> UsageStatsResponse.ProviderBreakdown.builder()
                        .provider((String) p.get("provider"))
                        .count(((Number) p.get("count")).longValue())
                        .build())
                .collect(Collectors.toList());

        return UsageStatsResponse.PeriodStats.builder()
                .periodStart(from)
                .periodEnd(to)
                .totalExtractions(stats.get("totalExtractions") != null ? ((Number) stats.get("totalExtractions")).longValue() : 0L)
                .totalBytes(stats.get("totalBytes") != null ? ((Number) stats.get("totalBytes")).longValue() : 0L)
                .totalInputTokens(stats.get("totalInputTokens") != null ? ((Number) stats.get("totalInputTokens")).longValue() : 0L)
                .totalOutputTokens(stats.get("totalOutputTokens") != null ? ((Number) stats.get("totalOutputTokens")).longValue() : 0L)
                .totalFieldsExtracted(stats.get("totalFieldsExtracted") != null ? ((Number) stats.get("totalFieldsExtracted")).longValue() : 0L)
                .avgProcessingTimeMs(stats.get("avgProcessingTime") != null ? ((Number) stats.get("avgProcessingTime")).doubleValue() : 0.0)
                .totalCostUsd(stats.get("totalCost") != null ? new BigDecimal(stats.get("totalCost").toString()) : BigDecimal.ZERO)
                .byProvider(providerBreakdown)
                .build();
    }
}
