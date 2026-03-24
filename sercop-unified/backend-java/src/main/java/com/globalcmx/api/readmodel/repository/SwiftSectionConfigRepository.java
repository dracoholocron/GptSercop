package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.SwiftSectionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para gestionar configuraciones de secciones SWIFT
 */
@Repository
public interface SwiftSectionConfigRepository extends JpaRepository<SwiftSectionConfig, String> {

    /**
     * Obtiene todas las secciones activas para un tipo de mensaje, ordenadas por display_order
     */
    @Query("SELECT s FROM SwiftSectionConfig s WHERE s.messageType = :messageType AND s.isActive = true ORDER BY s.displayOrder")
    List<SwiftSectionConfig> findActiveByMessageTypeOrdered(@Param("messageType") String messageType);

    /**
     * Obtiene todas las secciones para un tipo de mensaje (activas e inactivas)
     */
    List<SwiftSectionConfig> findByMessageTypeOrderByDisplayOrder(String messageType);

    /**
     * Busca una sección específica por código y tipo de mensaje
     */
    Optional<SwiftSectionConfig> findBySectionCodeAndMessageType(String sectionCode, String messageType);

    /**
     * Verifica si existe una sección con el código y tipo de mensaje dados
     */
    boolean existsBySectionCodeAndMessageType(String sectionCode, String messageType);

    /**
     * Obtiene los tipos de mensaje que tienen secciones configuradas
     */
    @Query("SELECT DISTINCT s.messageType FROM SwiftSectionConfig s WHERE s.isActive = true ORDER BY s.messageType")
    List<String> findDistinctMessageTypes();

    /**
     * Cuenta las secciones activas para un tipo de mensaje
     */
    long countByMessageTypeAndIsActive(String messageType, Boolean isActive);
}
