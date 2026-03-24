package com.globalcmx.api.compraspublicas.process.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.compraspublicas.process.entity.CPProcessData;
import com.globalcmx.api.compraspublicas.process.repository.CPProcessDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CPProcessService {

    private final CPProcessDataRepository processDataRepository;
    private final ObjectMapper objectMapper;

    @Transactional("readModelTransactionManager")
    public CPProcessData createProcess(String countryCode, String processType, String entityRuc,
                                        String entityName, Map<String, Object> formData, String userId) {
        log.info("Creating CP process: country={}, type={}, entity={}", countryCode, processType, entityRuc);

        String processId = UUID.randomUUID().toString();
        String formDataJson;
        try {
            formDataJson = objectMapper.writeValueAsString(formData != null ? formData : Map.of());
        } catch (Exception e) {
            formDataJson = "{}";
        }

        CPProcessData process = CPProcessData.builder()
                .id(UUID.randomUUID().toString())
                .processId(processId)
                .countryCode(countryCode)
                .processType(processType)
                .entityRuc(entityRuc)
                .entityName(entityName)
                .status("BORRADOR")
                .formData(formDataJson)
                .version(1)
                .createdBy(userId)
                .createdAt(LocalDateTime.now())
                .build();

        return processDataRepository.save(process);
    }

    @Transactional("readModelTransactionManager")
    public CPProcessData updateProcess(String processId, Map<String, Object> formData, String status, String userId) {
        CPProcessData process = processDataRepository.findByProcessId(processId)
                .orElseThrow(() -> new IllegalArgumentException("Process not found: " + processId));

        if (formData != null) {
            try {
                process.setFormData(objectMapper.writeValueAsString(formData));
            } catch (Exception e) {
                log.error("Error serializing form data: {}", e.getMessage());
            }
        }

        if (status != null) {
            process.setStatus(status);
        }

        process.setUpdatedBy(userId);
        return processDataRepository.save(process);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CPProcessData getProcess(String processId) {
        return processDataRepository.findByProcessId(processId)
                .orElseThrow(() -> new IllegalArgumentException("Process not found: " + processId));
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public Page<CPProcessData> listProcesses(String countryCode, String processType, String status,
                                              String entityRuc, Pageable pageable) {
        return processDataRepository.findWithFilters(countryCode, processType, status, entityRuc, pageable);
    }

    @Transactional("readModelTransactionManager")
    public void deleteProcess(String processId) {
        CPProcessData process = processDataRepository.findByProcessId(processId)
                .orElseThrow(() -> new IllegalArgumentException("Process not found: " + processId));
        processDataRepository.delete(process);
    }
}
