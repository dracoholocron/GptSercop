package com.globalcmx.api.externalapi.repository;

import com.globalcmx.api.externalapi.entity.ExternalApiRequestTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExternalApiRequestTemplateRepository extends JpaRepository<ExternalApiRequestTemplate, Long> {

    List<ExternalApiRequestTemplate> findByApiConfigId(Long apiConfigId);

    List<ExternalApiRequestTemplate> findByApiConfigIdAndActiveTrue(Long apiConfigId);

    Optional<ExternalApiRequestTemplate> findByApiConfigIdAndIsDefaultTrue(Long apiConfigId);

    void deleteByApiConfigId(Long apiConfigId);

    @Modifying
    @Query("UPDATE ExternalApiRequestTemplate t SET t.isDefault = false WHERE t.apiConfig.id = :apiConfigId")
    void clearDefaultForApiConfig(@Param("apiConfigId") Long apiConfigId);
}
