package com.globalcmx.api.compraspublicas.risk.service;

import com.globalcmx.api.compraspublicas.risk.entity.CPRiskAssessment;
import com.globalcmx.api.compraspublicas.risk.entity.CPRiskItem;
import com.globalcmx.api.compraspublicas.risk.repository.CPRiskAssessmentRepository;
import com.globalcmx.api.compraspublicas.risk.repository.CPRiskItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CPRiskService {

    private final CPRiskAssessmentRepository riskAssessmentRepository;
    private final CPRiskItemRepository riskItemRepository;

    @Transactional("readModelTransactionManager")
    public CPRiskAssessment createAssessment(String processId, String assessor, String userId) {
        log.info("Creating risk assessment: process={}, assessor={}", processId, assessor);

        CPRiskAssessment assessment = CPRiskAssessment.builder()
                .id(UUID.randomUUID().toString())
                .processId(processId)
                .assessmentDate(LocalDate.now())
                .overallScore(0)
                .riskLevel("LOW")
                .assessor(assessor)
                .status("BORRADOR")
                .createdBy(userId)
                .createdAt(LocalDateTime.now())
                .build();

        return riskAssessmentRepository.save(assessment);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CPRiskAssessment getAssessment(String id) {
        return riskAssessmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Risk assessment not found: " + id));
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPRiskAssessment> getAssessmentsByProcess(String processId) {
        return riskAssessmentRepository.findByProcessIdOrderByAssessmentDateDesc(processId);
    }

    @Transactional("readModelTransactionManager")
    public CPRiskItem addRiskItem(String assessmentId, String indicatorCode, Integer probability,
                                   Integer impact, Boolean detected, String evidence,
                                   String mitigationPlan, String responsible, String allocation) {
        log.info("Adding risk item: assessment={}, indicator={}, probability={}, impact={}",
                assessmentId, indicatorCode, probability, impact);

        CPRiskAssessment assessment = riskAssessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new IllegalArgumentException("Risk assessment not found: " + assessmentId));

        CPRiskItem item = CPRiskItem.builder()
                .id(UUID.randomUUID().toString())
                .assessment(assessment)
                .indicatorCode(indicatorCode)
                .probability(probability)
                .impact(impact)
                .detected(detected)
                .evidence(evidence)
                .mitigationPlan(mitigationPlan)
                .responsible(responsible)
                .allocation(allocation)
                .status("IDENTIFICADO")
                .createdAt(LocalDateTime.now())
                .build();

        // riskScore is calculated by @PrePersist in the entity
        assessment.getItems().add(item);
        riskAssessmentRepository.save(assessment);

        return item;
    }

    @Transactional("readModelTransactionManager")
    public CPRiskItem updateRiskItem(String itemId, Map<String, Object> updates) {
        log.info("Updating risk item: id={}", itemId);

        CPRiskItem item = riskItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Risk item not found: " + itemId));

        if (updates.containsKey("probability")) {
            item.setProbability(Integer.valueOf(updates.get("probability").toString()));
        }
        if (updates.containsKey("impact")) {
            item.setImpact(Integer.valueOf(updates.get("impact").toString()));
        }
        if (updates.containsKey("detected")) {
            item.setDetected(Boolean.valueOf(updates.get("detected").toString()));
        }
        if (updates.containsKey("evidence")) {
            item.setEvidence((String) updates.get("evidence"));
        }
        if (updates.containsKey("mitigationPlan")) {
            item.setMitigationPlan((String) updates.get("mitigationPlan"));
        }
        if (updates.containsKey("responsible")) {
            item.setResponsible((String) updates.get("responsible"));
        }
        if (updates.containsKey("allocation")) {
            item.setAllocation((String) updates.get("allocation"));
        }
        if (updates.containsKey("status")) {
            item.setStatus((String) updates.get("status"));
        }

        // Recalculate risk score
        if (item.getProbability() != null && item.getImpact() != null) {
            item.setRiskScore(item.getProbability() * item.getImpact());
        }

        return riskItemRepository.save(item);
    }

    @Transactional("readModelTransactionManager")
    public CPRiskAssessment calculateOverallScore(String assessmentId) {
        log.info("Calculating overall risk score: assessment={}", assessmentId);

        CPRiskAssessment assessment = riskAssessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new IllegalArgumentException("Risk assessment not found: " + assessmentId));

        List<CPRiskItem> items = riskItemRepository.findByAssessmentIdOrderByRiskScoreDesc(assessmentId);

        if (items.isEmpty()) {
            assessment.setOverallScore(0);
            assessment.setRiskLevel("LOW");
            return riskAssessmentRepository.save(assessment);
        }

        // Calculate overall score as the average of all item risk scores
        int totalScore = items.stream()
                .filter(item -> item.getRiskScore() != null)
                .mapToInt(CPRiskItem::getRiskScore)
                .sum();
        int overallScore = totalScore / items.size();

        // Determine risk level based on 5x5 matrix scoring (max 25)
        String riskLevel;
        if (overallScore >= 20) {
            riskLevel = "CRITICAL";
        } else if (overallScore >= 15) {
            riskLevel = "HIGH";
        } else if (overallScore >= 10) {
            riskLevel = "MEDIUM";
        } else if (overallScore >= 5) {
            riskLevel = "LOW";
        } else {
            riskLevel = "VERY_LOW";
        }

        assessment.setOverallScore(overallScore);
        assessment.setRiskLevel(riskLevel);

        return riskAssessmentRepository.save(assessment);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<Map<String, Object>> getHeatMapData(String assessmentId) {
        log.info("Generating heat map data: assessment={}", assessmentId);

        List<CPRiskItem> items = riskItemRepository.findByAssessmentIdOrderByRiskScoreDesc(assessmentId);

        return items.stream()
                .map(item -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("id", item.getId());
                    data.put("indicatorCode", item.getIndicatorCode());
                    data.put("probability", item.getProbability());
                    data.put("impact", item.getImpact());
                    data.put("riskScore", item.getRiskScore());
                    data.put("detected", item.getDetected());
                    data.put("status", item.getStatus());
                    data.put("allocation", item.getAllocation());
                    return data;
                })
                .collect(Collectors.toList());
    }
}
