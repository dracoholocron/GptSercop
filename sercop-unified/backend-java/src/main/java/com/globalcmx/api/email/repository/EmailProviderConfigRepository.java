package com.globalcmx.api.email.repository;

import com.globalcmx.api.email.entity.EmailProviderConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailProviderConfigRepository extends JpaRepository<EmailProviderConfig, Long> {
    List<EmailProviderConfig> findByTenantIdOrderByPriorityDesc(String tenantId);
    List<EmailProviderConfig> findByIsActiveTrueOrderByPriorityDesc();
    Optional<EmailProviderConfig> findByTenantIdAndIsDefaultTrue(String tenantId);
    @Query("SELECT e FROM EmailProviderConfig e WHERE e.isActive = true AND e.isDefault = true")
    Optional<EmailProviderConfig> findDefaultActiveProvider();
    List<EmailProviderConfig> findByProviderType(String providerType);
}
