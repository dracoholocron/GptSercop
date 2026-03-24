package com.globalcmx.api.service;

import com.globalcmx.api.dto.swift.SwiftSectionConfigDTO;
import com.globalcmx.api.readmodel.entity.SwiftSectionConfig;
import com.globalcmx.api.readmodel.repository.SwiftSectionConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servicio para gestionar configuraciones de secciones SWIFT
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SwiftSectionConfigService {

    private final SwiftSectionConfigRepository repository;

    /**
     * Obtiene todas las secciones activas para un tipo de mensaje
     */
    @Transactional(readOnly = true)
    public List<SwiftSectionConfigDTO> getActiveSectionsByMessageType(String messageType) {
        log.debug("Fetching active sections for message type: {}", messageType);
        return repository.findActiveByMessageTypeOrdered(messageType)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todas las secciones para un tipo de mensaje (incluye inactivas)
     */
    @Transactional(readOnly = true)
    public List<SwiftSectionConfigDTO> getAllSectionsByMessageType(String messageType) {
        log.debug("Fetching all sections for message type: {}", messageType);
        return repository.findByMessageTypeOrderByDisplayOrder(messageType)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene una sección específica por código y tipo de mensaje
     */
    @Transactional(readOnly = true)
    public Optional<SwiftSectionConfigDTO> getSectionByCodeAndMessageType(String sectionCode, String messageType) {
        return repository.findBySectionCodeAndMessageType(sectionCode, messageType)
                .map(this::toDTO);
    }

    /**
     * Obtiene todos los tipos de mensaje que tienen secciones configuradas
     */
    @Transactional(readOnly = true)
    public List<String> getConfiguredMessageTypes() {
        return repository.findDistinctMessageTypes();
    }

    /**
     * Convierte entidad a DTO
     */
    private SwiftSectionConfigDTO toDTO(SwiftSectionConfig entity) {
        return SwiftSectionConfigDTO.builder()
                .id(entity.getId())
                .sectionCode(entity.getSectionCode())
                .labelKey(entity.getLabelKey())
                .descriptionKey(entity.getDescriptionKey())
                .messageType(entity.getMessageType())
                .displayOrder(entity.getDisplayOrder())
                .icon(entity.getIcon())
                .isActive(entity.getIsActive())
                .build();
    }
}
