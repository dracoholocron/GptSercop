package com.globalcmx.api.service;

import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.repository.GleReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service to enrich operations with additional calculated data.
 * Adds pendingBalance from GLE to operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OperationEnrichmentService {

    private final GleReadModelRepository gleRepository;

    /**
     * Enrich a list of operations with their pending balance from GLE.
     * The pendingBalance is the sum of debits - credits in contingent accounts.
     */
    public List<OperationReadModel> enrichWithPendingBalance(List<OperationReadModel> operations) {
        if (operations == null || operations.isEmpty()) {
            return operations;
        }

        // Get all references
        List<String> references = operations.stream()
                .map(OperationReadModel::getReference)
                .filter(ref -> ref != null && !ref.isEmpty())
                .distinct()
                .collect(Collectors.toList());

        if (references.isEmpty()) {
            return operations;
        }

        // Get pending balances from GLE
        Map<String, BigDecimal> balanceMap = getPendingBalanceMap(references);

        // Enrich operations with pending balance using fallback chain:
        // 1. GLE balance (official accounting source) if available
        // 2. Persisted pending_balance from SWIFT analysis
        // 3. null (no data available)
        operations.forEach(op -> {
            BigDecimal gleBalance = balanceMap.get(op.getReference());
            if (gleBalance != null && gleBalance.compareTo(BigDecimal.ZERO) != 0) {
                op.setPendingBalance(gleBalance);
            }
            // If GLE has no balance, keep the persisted SWIFT-based pending_balance (may be null)
        });

        return operations;
    }

    /**
     * Enrich a single operation with its pending balance.
     * Fallback chain: GLE → persisted SWIFT analysis → null
     */
    public OperationReadModel enrichWithPendingBalance(OperationReadModel operation) {
        if (operation == null || operation.getReference() == null) {
            return operation;
        }

        List<Object[]> results = gleRepository.getPendingBalanceByReferences(
                List.of(operation.getReference()));

        if (!results.isEmpty()) {
            Object[] row = results.get(0);
            BigDecimal gleBalance = row[1] != null ? new BigDecimal(row[1].toString()) : null;
            if (gleBalance != null && gleBalance.compareTo(BigDecimal.ZERO) != 0) {
                operation.setPendingBalance(gleBalance);
            }
            // If GLE has no balance, keep the persisted SWIFT-based pending_balance
        }

        return operation;
    }

    /**
     * Get a map of reference -> pending balance for a list of references.
     */
    private Map<String, BigDecimal> getPendingBalanceMap(List<String> references) {
        Map<String, BigDecimal> balanceMap = new HashMap<>();

        try {
            List<Object[]> results = gleRepository.getPendingBalanceByReferences(references);

            for (Object[] row : results) {
                String reference = (String) row[0];
                BigDecimal balance = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
                balanceMap.put(reference, balance);
            }
        } catch (Exception e) {
            log.error("Error fetching pending balances from GLE: {}", e.getMessage());
        }

        return balanceMap;
    }
}
