package com.globalcmx.api.ai.service;

import com.globalcmx.api.readmodel.entity.GleReadModel;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.repository.GleReadModelRepository;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio para acceder a datos financieros y de operaciones para el contexto de IA.
 * Proporciona métodos para obtener datos que la IA puede usar en sus respuestas.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
public class AIDataService {

    private final OperationReadModelRepository operationRepository;
    private final GleReadModelRepository gleRepository;

    /**
     * Obtener resumen de operaciones activas
     * Incluye las últimas operaciones independientemente del estado
     */
    public Map<String, Object> getOperationsSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        // Obtener operaciones activas
        List<OperationReadModel> activeOps = operationRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
        summary.put("totalActive", activeOps.size());
        
        // Obtener todas las operaciones y ordenarlas por fecha de creación descendente
        List<OperationReadModel> allOps = operationRepository.findAll();
        // Ordenar por createdAt descendente y limitar a las últimas 10
        List<OperationReadModel> recentOps = allOps.stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .limit(10)
                .collect(java.util.stream.Collectors.toList());
        
        summary.put("operations", recentOps);
        summary.put("totalRecent", recentOps.size());
        
        return summary;
    }

    /**
     * Obtener operación por referencia
     */
    public OperationReadModel getOperationByReference(String reference) {
        return operationRepository.findByReference(reference)
                .orElse(null);
    }

    /**
     * Obtener asientos contables por referencia de operación
     */
    public List<GleReadModel> getAccountingEntriesByReference(String reference) {
        return gleRepository.findByReference(reference);
    }

    /**
     * Obtener resumen contable general
     */
    public Map<String, Object> getAccountingSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        long totalEntries = gleRepository.count();
        summary.put("totalEntries", totalEntries);
        
        // Obtener resumen por tipo
        List<Object[]> totals = gleRepository.getTotalsByType();
        Map<String, Object> byType = new HashMap<>();
        for (Object[] row : totals) {
            String type = (String) row[0];
            byType.put(type, Map.of(
                "total", row[1],
                "count", row[2]
            ));
        }
        summary.put("byType", byType);
        
        return summary;
    }

    /**
     * Obtener datos según el tipo de contexto
     */
    public Map<String, Object> getContextData(String contextType, Map<String, String> params) {
        Map<String, Object> data = new HashMap<>();
        
        switch (contextType.toUpperCase()) {
            case "OPERATIONS":
                data.putAll(getOperationsSummary());
                if (params.containsKey("reference")) {
                    OperationReadModel op = getOperationByReference(params.get("reference"));
                    if (op != null) {
                        data.put("operation", op);
                    }
                }
                break;
                
            case "ACCOUNTING":
                data.putAll(getAccountingSummary());
                System.err.println("=== AIDataService.getContextData - ACCOUNTING case ===");
                System.err.println("Params: " + params);
                System.err.println("hasIncludeAccounting: " + params.containsKey("includeAccounting"));
                log.error("ACCOUNTING context - params: {}, hasIncludeAccounting: {}", params, params.containsKey("includeAccounting"));
                // Si se solicita incluir datos contables, obtener las últimas entradas
                // También incluir si se pregunta sobre "operaciones contables" o "últimas operaciones contables"
                if (params.containsKey("includeAccounting") || params.containsKey("reference")) {
                    System.err.println("=== FETCHING ENTRIES ===");
                    log.error("includeAccounting param found, fetching entries");
                    if (params.containsKey("reference")) {
                        List<GleReadModel> entries = getAccountingEntriesByReference(params.get("reference"));
                        data.put("entries", entries);
                        log.error("Included {} accounting entries by reference", entries.size());
                    } else {
                        // Obtener las últimas entradas contables si no hay referencia específica
                        // Usar el método del repositorio que ya ordena por fecha descendente
                        List<GleReadModel> recentEntries = gleRepository.findTop100ByOrderByValdatDesc();
                        log.error("Fetched {} entries from repository", recentEntries.size());
                        // Limitar a las últimas 20 para el contexto
                        if (recentEntries.size() > 20) {
                            recentEntries = recentEntries.subList(0, 20);
                        }
                        data.put("entries", recentEntries);
                        log.error("Included {} recent accounting entries in context data", recentEntries.size());
                    }
                } else {
                    // Si el contexto es ACCOUNTING, siempre incluir al menos un resumen de las últimas entradas
                    // cuando se pregunta sobre operaciones contables
                    log.error("ACCOUNTING context but no includeAccounting param, will include summary only. Params: {}", params);
                }
                break;
                
            default:
                log.warn("Unknown context type: {}", contextType);
        }
        
        return data;
    }
}

