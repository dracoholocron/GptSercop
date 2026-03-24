package com.globalcmx.api.externalapi.repository;

import com.globalcmx.api.externalapi.entity.ExternalApiResponseConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExternalApiResponseConfigRepository extends JpaRepository<ExternalApiResponseConfig, Long> {

    Optional<ExternalApiResponseConfig> findByApiConfigId(Long apiConfigId);

    void deleteByApiConfigId(Long apiConfigId);
}
