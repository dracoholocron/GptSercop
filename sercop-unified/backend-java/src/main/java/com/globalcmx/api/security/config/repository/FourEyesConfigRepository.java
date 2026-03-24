package com.globalcmx.api.security.config.repository;

import com.globalcmx.api.security.config.entity.FourEyesConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface FourEyesConfigRepository extends JpaRepository<FourEyesConfig, Long> {

    Optional<FourEyesConfig> findByEntityTypeAndActionType(String entityType, String actionType);

    List<FourEyesConfig> findByEntityType(String entityType);

    List<FourEyesConfig> findByIsEnabledTrue();

    @Query("SELECT f FROM FourEyesConfig f WHERE f.entityType = :entityType AND f.actionType = :actionType AND f.isEnabled = true")
    Optional<FourEyesConfig> findActiveConfig(
            @Param("entityType") String entityType,
            @Param("actionType") String actionType);

    @Query("SELECT f FROM FourEyesConfig f WHERE f.entityType = :entityType AND f.actionType = :actionType " +
           "AND f.isEnabled = true AND (f.amountThreshold IS NULL OR f.amountThreshold <= :amount)")
    Optional<FourEyesConfig> findApplicableConfig(
            @Param("entityType") String entityType,
            @Param("actionType") String actionType,
            @Param("amount") BigDecimal amount);
}
