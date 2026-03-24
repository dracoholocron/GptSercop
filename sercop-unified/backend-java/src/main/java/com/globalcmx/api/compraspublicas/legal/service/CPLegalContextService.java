package com.globalcmx.api.compraspublicas.legal.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.compraspublicas.legal.entity.CPKnownEntity;
import com.globalcmx.api.compraspublicas.legal.entity.CPLegalContext;
import com.globalcmx.api.compraspublicas.legal.entity.CPProcurementThreshold;
import com.globalcmx.api.compraspublicas.legal.repository.CPKnownEntityRepository;
import com.globalcmx.api.compraspublicas.legal.repository.CPLegalContextRepository;
import com.globalcmx.api.compraspublicas.legal.repository.CPProcurementThresholdRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CPLegalContextService {

    private final CPLegalContextRepository legalContextRepository;
    private final CPKnownEntityRepository knownEntityRepository;
    private final CPProcurementThresholdRepository thresholdRepository;
    private final ObjectMapper objectMapper;

    /**
     * Get legal context formatted as text for injection into AI prompts,
     * filtered by the current phase code.
     */
    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public String getLegalContextForPhase(String phaseCode) {
        List<CPLegalContext> allActive = legalContextRepository.findActiveAndCurrent("EC");

        List<CPLegalContext> relevant = allActive.stream()
                .filter(lc -> phaseAppliesToContext(lc, phaseCode))
                .collect(Collectors.toList());

        if (relevant.isEmpty()) {
            return "No hay contexto legal especifico para esta fase.";
        }

        StringBuilder sb = new StringBuilder("CONTEXTO LEGAL VIGENTE PARA ESTA FASE:\n");
        for (CPLegalContext lc : relevant) {
            sb.append("- ").append(lc.getTitle()).append(": ").append(lc.getSummary()).append("\n");
        }
        return sb.toString();
    }

    /**
     * Get all legal context entries (for API responses)
     */
    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPLegalContext> getAllActiveLegalContext() {
        return legalContextRepository.findActiveAndCurrent("EC");
    }

    /**
     * Get known entities formatted as text for injection into AI prompts
     */
    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public String getKnownEntitiesForPrompt() {
        List<CPKnownEntity> entities = knownEntityRepository.findByIsActiveTrueAndCountryCodeOrderByEntityNameAsc("EC");

        if (entities.isEmpty()) {
            return "No hay entidades conocidas en la base de datos.";
        }

        StringBuilder sb = new StringBuilder("ENTIDADES CONOCIDAS EN BASE DE DATOS:\n");
        for (CPKnownEntity e : entities) {
            sb.append("- ").append(e.getEntityName());
            if (e.getEntityRuc() != null) {
                sb.append(" (RUC: ").append(e.getEntityRuc()).append(")");
            }
            if (e.getSectorLabel() != null) {
                sb.append(" — Sector: ").append(e.getSectorLabel());
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    /**
     * Get all known entities (for API responses)
     */
    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPKnownEntity> getAllKnownEntities() {
        return knownEntityRepository.findByIsActiveTrueAndCountryCodeOrderByEntityNameAsc("EC");
    }

    /**
     * Find a known entity by RUC
     */
    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public Optional<CPKnownEntity> findEntityByRuc(String ruc) {
        return knownEntityRepository.findByEntityRucAndIsActiveTrue(ruc);
    }

    /**
     * Get procurement thresholds formatted as text for injection into AI prompts
     */
    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public String getProcurementThresholdsForPrompt() {
        int currentYear = LocalDate.now().getYear();
        List<CPProcurementThreshold> thresholds = thresholdRepository
                .findByFiscalYearAndIsActiveTrueAndCountryCodeOrderByMinValueAsc(currentYear, "EC");

        if (thresholds.isEmpty()) {
            return "No hay umbrales de contratacion configurados para el ano fiscal actual.";
        }

        CPProcurementThreshold first = thresholds.get(0);
        StringBuilder sb = new StringBuilder();
        sb.append("UMBRALES DE CONTRATACION VIGENTES (PIE ").append(currentYear)
                .append(": $").append(String.format("%,.2f", first.getPieValue())).append("):\n");

        for (CPProcurementThreshold t : thresholds) {
            sb.append("- ").append(t.getProcedureName()).append(": ");
            if (t.getMinValue() != null && t.getMaxValue() != null) {
                sb.append("$").append(String.format("%,.2f", t.getMinValue()))
                        .append(" a $").append(String.format("%,.2f", t.getMaxValue()));
            } else if (t.getMinValue() != null) {
                sb.append("Mayor a $").append(String.format("%,.2f", t.getMinValue()));
            } else if (t.getMaxValue() != null) {
                sb.append("Hasta $").append(String.format("%,.2f", t.getMaxValue()));
            }
            if (t.getLegalReference() != null) {
                sb.append(" (").append(t.getLegalReference()).append(")");
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    /**
     * Get all thresholds for current year (for API responses)
     */
    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPProcurementThreshold> getCurrentThresholds() {
        int currentYear = LocalDate.now().getYear();
        return thresholdRepository.findByFiscalYearAndIsActiveTrueAndCountryCodeOrderByMinValueAsc(currentYear, "EC");
    }

    /**
     * Check if a phase code is in the applicable_phases JSON array
     */
    private boolean phaseAppliesToContext(CPLegalContext lc, String phaseCode) {
        if (lc.getApplicablePhases() == null) {
            return true; // null means applies to all phases
        }
        try {
            List<String> phases = objectMapper.readValue(lc.getApplicablePhases(), new TypeReference<>() {});
            return phases.contains(phaseCode);
        } catch (Exception e) {
            log.warn("Error parsing applicable_phases for context {}: {}", lc.getContextCode(), e.getMessage());
            return false;
        }
    }
}
