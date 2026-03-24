package com.globalcmx.api.certification.repository;

import com.globalcmx.api.certification.entity.FeatureCertification;
import com.globalcmx.api.certification.entity.FeatureCertification.CertificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository para gestionar la certificación de funcionalidades.
 */
@Repository
public interface FeatureCertificationRepository extends JpaRepository<FeatureCertification, Long> {

    /**
     * Buscar certificación por código de funcionalidad
     */
    Optional<FeatureCertification> findByFeatureCode(String featureCode);

    /**
     * Obtener todas las funcionalidades ordenadas por displayOrder
     */
    List<FeatureCertification> findAllByOrderByDisplayOrderAsc();

    /**
     * Obtener funcionalidades por estado
     */
    List<FeatureCertification> findByStatusOrderByDisplayOrderAsc(CertificationStatus status);

    /**
     * Obtener funcionalidades padre (sin parent_code)
     */
    List<FeatureCertification> findByParentCodeIsNullOrderByDisplayOrderAsc();

    /**
     * Obtener funcionalidades hijas de un padre
     */
    List<FeatureCertification> findByParentCodeOrderByDisplayOrderAsc(String parentCode);

    /**
     * Contar funcionalidades por estado
     */
    long countByStatus(CertificationStatus status);

    /**
     * Buscar por tag de alerta vinculado
     */
    Optional<FeatureCertification> findByLinkedAlertTag(String linkedAlertTag);

    /**
     * Verificar si existe un código
     */
    boolean existsByFeatureCode(String featureCode);

    /**
     * Obtener estadísticas de certificación
     */
    @Query("SELECT f.status, COUNT(f) FROM FeatureCertification f GROUP BY f.status")
    List<Object[]> getCertificationStats();

    /**
     * Buscar por nombre (parcial, case-insensitive)
     */
    @Query("SELECT f FROM FeatureCertification f WHERE " +
           "LOWER(f.featureName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(f.featureNameEn) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "ORDER BY f.displayOrder")
    List<FeatureCertification> searchByName(@Param("search") String search);
}
