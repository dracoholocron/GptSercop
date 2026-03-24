package com.globalcmx.api.security.config.repository;

import com.globalcmx.api.security.config.entity.SecurityConfigurationReadModel;
import com.globalcmx.api.security.config.entity.SecurityConfigurationReadModel.ConfigType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SecurityConfigurationRepository extends JpaRepository<SecurityConfigurationReadModel, Long> {

    List<SecurityConfigurationReadModel> findByIsActiveTrue();

    List<SecurityConfigurationReadModel> findByConfigTypeAndIsActiveTrue(ConfigType configType);

    Optional<SecurityConfigurationReadModel> findByConfigTypeAndConfigKeyAndEnvironment(
            ConfigType configType, String configKey, String environment);

    Optional<SecurityConfigurationReadModel> findByConfigTypeAndConfigKeyAndEnvironmentAndIsActiveTrue(
            ConfigType configType, String configKey, String environment);

    @Query("SELECT c FROM SecurityConfigurationReadModel c WHERE c.configType = :type AND c.isActive = true AND c.environment = :env")
    List<SecurityConfigurationReadModel> findActiveByTypeAndEnvironment(
            @Param("type") ConfigType type, @Param("env") String environment);

    @Query("SELECT c FROM SecurityConfigurationReadModel c WHERE c.isActive = true AND c.environment = :env")
    List<SecurityConfigurationReadModel> findAllActiveByEnvironment(@Param("env") String environment);
}
