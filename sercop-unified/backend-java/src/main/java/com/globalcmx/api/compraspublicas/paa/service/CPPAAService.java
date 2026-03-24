package com.globalcmx.api.compraspublicas.paa.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.compraspublicas.paa.entity.CPPAA;
import com.globalcmx.api.compraspublicas.paa.entity.CPPAAItem;
import com.globalcmx.api.compraspublicas.paa.repository.CPPAAItemRepository;
import com.globalcmx.api.compraspublicas.paa.repository.CPPAARepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CPPAAService {

    private final CPPAARepository paaRepository;
    private final CPPAAItemRepository paaItemRepository;
    private final ObjectMapper objectMapper;

    @Transactional("readModelTransactionManager")
    public CPPAA createPAA(String entityRuc, String entityName, String countryCode,
                           Integer fiscalYear, String userId) {
        log.info("Creating PAA: entity={}, country={}, fiscalYear={}", entityRuc, countryCode, fiscalYear);

        CPPAA paa = CPPAA.builder()
                .id(UUID.randomUUID().toString())
                .entityRuc(entityRuc)
                .entityName(entityName)
                .countryCode(countryCode)
                .fiscalYear(fiscalYear)
                .status("BORRADOR")
                .version(1)
                .createdBy(userId)
                .createdAt(LocalDateTime.now())
                .build();

        return paaRepository.save(paa);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CPPAA getPAA(String id) {
        return paaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("PAA not found: " + id));
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPPAA> listPAAByCountryAndYear(String countryCode, Integer fiscalYear) {
        return paaRepository.findByCountryCodeAndFiscalYearOrderByEntityNameAsc(countryCode, fiscalYear);
    }

    @Transactional("readModelTransactionManager")
    public CPPAAItem addItem(String paaId, Integer lineNumber, String cpcCode, String cpcDescription,
                             String itemDescription, String processType, BigDecimal budgetAmount,
                             String budgetPartition, String fundingSource, String department,
                             LocalDate estimatedPublicationDate, LocalDate estimatedAdjudicationDate,
                             Integer estimatedContractDurationDays, String priority, String userId) {
        log.info("Adding item to PAA {}: cpc={}, department={}", paaId, cpcCode, department);

        CPPAA paa = paaRepository.findById(paaId)
                .orElseThrow(() -> new IllegalArgumentException("PAA not found: " + paaId));

        CPPAAItem item = CPPAAItem.builder()
                .id(UUID.randomUUID().toString())
                .paa(paa)
                .lineNumber(lineNumber)
                .cpcCode(cpcCode)
                .cpcDescription(cpcDescription)
                .itemDescription(itemDescription)
                .processType(processType)
                .budgetAmount(budgetAmount)
                .budgetPartition(budgetPartition)
                .fundingSource(fundingSource)
                .department(department)
                .estimatedPublicationDate(estimatedPublicationDate)
                .estimatedAdjudicationDate(estimatedAdjudicationDate)
                .estimatedContractDurationDays(estimatedContractDurationDays)
                .priority(priority != null ? priority : "MEDIUM")
                .status("PLANIFICADO")
                .createdAt(LocalDateTime.now())
                .build();

        CPPAAItem saved = paaItemRepository.save(item);

        paa.setUpdatedBy(userId);
        paaRepository.save(paa);

        return saved;
    }

    @Transactional("readModelTransactionManager")
    public CPPAAItem updateItem(String itemId, Map<String, Object> updates, String userId) {
        log.info("Updating PAA item {}", itemId);

        CPPAAItem item = paaItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("PAA Item not found: " + itemId));

        if (updates.containsKey("lineNumber")) {
            item.setLineNumber((Integer) updates.get("lineNumber"));
        }
        if (updates.containsKey("cpcCode")) {
            item.setCpcCode((String) updates.get("cpcCode"));
        }
        if (updates.containsKey("cpcDescription")) {
            item.setCpcDescription((String) updates.get("cpcDescription"));
        }
        if (updates.containsKey("itemDescription")) {
            item.setItemDescription((String) updates.get("itemDescription"));
        }
        if (updates.containsKey("processType")) {
            item.setProcessType((String) updates.get("processType"));
        }
        if (updates.containsKey("budgetAmount")) {
            item.setBudgetAmount(new BigDecimal(updates.get("budgetAmount").toString()));
        }
        if (updates.containsKey("budgetPartition")) {
            item.setBudgetPartition((String) updates.get("budgetPartition"));
        }
        if (updates.containsKey("fundingSource")) {
            item.setFundingSource((String) updates.get("fundingSource"));
        }
        if (updates.containsKey("department")) {
            item.setDepartment((String) updates.get("department"));
        }
        if (updates.containsKey("estimatedPublicationDate")) {
            item.setEstimatedPublicationDate(LocalDate.parse((String) updates.get("estimatedPublicationDate")));
        }
        if (updates.containsKey("estimatedAdjudicationDate")) {
            item.setEstimatedAdjudicationDate(LocalDate.parse((String) updates.get("estimatedAdjudicationDate")));
        }
        if (updates.containsKey("estimatedContractDurationDays")) {
            item.setEstimatedContractDurationDays((Integer) updates.get("estimatedContractDurationDays"));
        }
        if (updates.containsKey("priority")) {
            item.setPriority((String) updates.get("priority"));
        }
        if (updates.containsKey("status")) {
            item.setStatus((String) updates.get("status"));
        }

        return paaItemRepository.save(item);
    }

    @Transactional("readModelTransactionManager")
    public void removeItem(String itemId) {
        CPPAAItem item = paaItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("PAA Item not found: " + itemId));
        paaItemRepository.delete(item);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<Map<String, Object>> getDemandAggregation(String paaId) {
        return paaItemRepository.findDemandAggregation(paaId);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<Map<String, Object>> getBudgetByDepartment(String paaId) {
        return paaItemRepository.findBudgetByDepartment(paaId);
    }

    @Transactional("readModelTransactionManager")
    public CPPAA updatePAA(String id, Map<String, Object> updates, String userId) {
        log.info("Updating PAA {}", id);

        CPPAA paa = paaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("PAA not found: " + id));

        if (updates.containsKey("entityName")) {
            paa.setEntityName((String) updates.get("entityName"));
        }
        if (updates.containsKey("entityRuc")) {
            paa.setEntityRuc((String) updates.get("entityRuc"));
        }
        if (updates.containsKey("totalBudget")) {
            paa.setTotalBudget(new BigDecimal(updates.get("totalBudget").toString()));
        }
        paa.setUpdatedBy(userId);

        return paaRepository.save(paa);
    }

    @Transactional("readModelTransactionManager")
    public CPPAA updateStatus(String id, String newStatus, String userId) {
        log.info("Updating PAA {} status to {}", id, newStatus);

        CPPAA paa = paaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("PAA not found: " + id));

        paa.setStatus(newStatus);
        paa.setUpdatedBy(userId);

        return paaRepository.save(paa);
    }
}
