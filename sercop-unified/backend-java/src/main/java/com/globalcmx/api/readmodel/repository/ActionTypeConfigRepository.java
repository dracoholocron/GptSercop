package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.ActionTypeConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ActionTypeConfigRepository extends JpaRepository<ActionTypeConfig, Long> {

    List<ActionTypeConfig> findByLanguageAndIsActiveTrueOrderByDisplayOrder(String language);

    Optional<ActionTypeConfig> findByActionTypeAndLanguage(String actionType, String language);

    List<ActionTypeConfig> findByIsActiveTrueOrderByDisplayOrder();

    boolean existsByActionTypeAndLanguage(String actionType, String language);

    @Query("SELECT DISTINCT a.actionType FROM ActionTypeConfig a ORDER BY a.actionType")
    List<String> findDistinctActionTypes();
}
