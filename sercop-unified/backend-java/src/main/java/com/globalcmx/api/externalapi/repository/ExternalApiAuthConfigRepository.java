package com.globalcmx.api.externalapi.repository;

import com.globalcmx.api.externalapi.entity.ExternalApiAuthConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExternalApiAuthConfigRepository extends JpaRepository<ExternalApiAuthConfig, Long> {

    Optional<ExternalApiAuthConfig> findByApiConfigId(Long apiConfigId);

    void deleteByApiConfigId(Long apiConfigId);
}
