package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.SwiftDraftReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para borradores SWIFT genéricos.
 *
 * Soporta todos los tipos de productos:
 * - LC Import (MT700)
 * - LC Export (MT710, MT720)
 * - Garantías (MT760)
 * - Mensajes libres (MT799)
 */
@Repository
public interface SwiftDraftReadModelRepository extends JpaRepository<SwiftDraftReadModel, Long> {

    /**
     * Buscar por draft_id único
     */
    Optional<SwiftDraftReadModel> findByDraftId(String draftId);

    /**
     * Verificar si existe un draft_id
     */
    boolean existsByDraftId(String draftId);

    /**
     * Listar borradores por tipo de mensaje SWIFT
     */
    List<SwiftDraftReadModel> findByMessageTypeOrderByCreationDateDesc(String messageType);

    /**
     * Listar borradores por tipo de producto
     */
    List<SwiftDraftReadModel> findByProductTypeOrderByCreationDateDesc(String productType);

    /**
     * Listar borradores por estado
     */
    List<SwiftDraftReadModel> findByStatusOrderByCreationDateDesc(String status);

    /**
     * Listar borradores por usuario creador
     */
    List<SwiftDraftReadModel> findByCreatedByOrderByCreationDateDesc(String createdBy);

    /**
     * Listar borradores por tipo de producto y estado
     */
    List<SwiftDraftReadModel> findByProductTypeAndStatusOrderByCreationDateDesc(
            String productType, String status);

    /**
     * Listar borradores por tipo de mensaje y estado
     */
    List<SwiftDraftReadModel> findByMessageTypeAndStatusOrderByCreationDateDesc(
            String messageType, String status);

    /**
     * Buscar borradores por referencia (partial match)
     */
    @Query("SELECT d FROM SwiftDraftReadModel d WHERE d.reference LIKE %:reference% ORDER BY d.creationDate DESC")
    List<SwiftDraftReadModel> findByReferenceContaining(@Param("reference") String reference);

    /**
     * Buscar borradores por applicant_id
     */
    List<SwiftDraftReadModel> findByApplicantIdOrderByCreationDateDesc(Long applicantId);

    /**
     * Buscar borradores por beneficiary_id
     */
    List<SwiftDraftReadModel> findByBeneficiaryIdOrderByCreationDateDesc(Long beneficiaryId);

    /**
     * Listar todos los borradores ordenados por fecha de creación descendente
     */
    List<SwiftDraftReadModel> findAllByOrderByCreationDateDesc();

    /**
     * Buscar borradores con filtros múltiples
     */
    @Query("SELECT d FROM SwiftDraftReadModel d WHERE " +
            "(:productType IS NULL OR d.productType = :productType) AND " +
            "(:messageType IS NULL OR d.messageType = :messageType) AND " +
            "(:status IS NULL OR d.status = :status) AND " +
            "(:createdBy IS NULL OR d.createdBy = :createdBy) AND " +
            "(:reference IS NULL OR d.reference LIKE %:reference%) " +
            "ORDER BY d.creationDate DESC")
    List<SwiftDraftReadModel> findWithFilters(
            @Param("productType") String productType,
            @Param("messageType") String messageType,
            @Param("status") String status,
            @Param("createdBy") String createdBy,
            @Param("reference") String reference);

    /**
     * Buscar borradores por rango de fechas de creación
     */
    @Query("SELECT d FROM SwiftDraftReadModel d WHERE " +
            "DATE(d.creationDate) BETWEEN :startDate AND :endDate " +
            "ORDER BY d.creationDate DESC")
    List<SwiftDraftReadModel> findByCreationDateBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Contar borradores por tipo de producto
     */
    long countByProductType(String productType);

    /**
     * Contar borradores por estado
     */
    long countByStatus(String status);

    /**
     * Contar borradores por tipo de producto y estado
     */
    long countByProductTypeAndStatus(String productType, String status);

    /**
     * Eliminar por draft_id
     */
    void deleteByDraftId(String draftId);
}
