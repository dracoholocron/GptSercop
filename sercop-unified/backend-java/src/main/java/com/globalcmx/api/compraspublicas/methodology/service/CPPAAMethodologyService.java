package com.globalcmx.api.compraspublicas.methodology.service;

import com.globalcmx.api.compraspublicas.legal.service.CPLegalContextService;
import com.globalcmx.api.compraspublicas.methodology.entity.CPPAAMethodology;
import com.globalcmx.api.compraspublicas.methodology.entity.CPPAAMethodologyPhase;
import com.globalcmx.api.compraspublicas.methodology.repository.CPPAAMethodologyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CPPAAMethodologyService {

    private final CPPAAMethodologyRepository methodologyRepository;
    private final CPLegalContextService legalContextService;

    /**
     * Get all active methodologies for a country (user can choose)
     */
    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPPAAMethodology> getActiveMethodologies(String countryCode) {
        log.info("Fetching active methodologies for country={}", countryCode);
        return methodologyRepository.findByIsActiveTrueAndCountryCodeOrderByIsDefaultDescNameAsc(countryCode);
    }

    /**
     * Get a specific methodology by ID with all phases
     */
    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CPPAAMethodology getMethodology(Long id) {
        return methodologyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Methodology not found: " + id));
    }

    /**
     * Get a specific methodology by code
     */
    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CPPAAMethodology getMethodologyByCode(String code) {
        return methodologyRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Methodology not found: " + code));
    }

    /**
     * Get the default methodology for a country
     */
    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CPPAAMethodology getDefaultMethodology(String countryCode) {
        return methodologyRepository.findByIsDefaultTrueAndIsActiveTrueAndCountryCode(countryCode)
                .orElseGet(() -> {
                    List<CPPAAMethodology> all = getActiveMethodologies(countryCode);
                    if (all.isEmpty()) {
                        throw new IllegalStateException("No active methodologies found for country: " + countryCode);
                    }
                    return all.get(0);
                });
    }

    /**
     * Resolve prompt variables for a specific phase, injecting legal context,
     * known entities, and procurement thresholds dynamically.
     */
    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public Map<String, String> resolvePhaseVariables(CPPAAMethodologyPhase phase, Map<String, String> userVariables) {
        Map<String, String> variables = new HashMap<>(userVariables);

        // Inject legal context for this phase
        String legalContext = legalContextService.getLegalContextForPhase(phase.getPhaseCode());
        variables.put("legal_context", legalContext);

        // Inject known entities if phase needs entity validation
        if ("CONTEXTO_INSTITUCIONAL".equals(phase.getPhaseCode()) || "DATOS_ENTIDAD".equals(phase.getPhaseCode())) {
            String knownEntities = legalContextService.getKnownEntitiesForPrompt();
            variables.put("known_entities", knownEntities);
        }

        // Inject procurement thresholds for strategy phases
        if ("ESTRATEGIA_CONTRATACION".equals(phase.getPhaseCode())
                || "CLASIFICACION_PROCEDIMIENTOS".equals(phase.getPhaseCode())
                || "LEVANTAMIENTO_NECESIDADES".equals(phase.getPhaseCode())
                || "NECESIDADES_PRESUPUESTO".equals(phase.getPhaseCode())) {
            String thresholds = legalContextService.getProcurementThresholdsForPrompt();
            variables.put("procurement_thresholds", thresholds);
        }

        return variables;
    }
}
