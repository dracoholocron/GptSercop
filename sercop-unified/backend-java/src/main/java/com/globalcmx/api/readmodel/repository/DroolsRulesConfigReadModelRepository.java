package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.DroolsRulesConfigReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DroolsRulesConfigReadModelRepository extends JpaRepository<DroolsRulesConfigReadModel, Long> {

    List<DroolsRulesConfigReadModel> findAllByRuleTypeAndIsActiveTrue(String ruleType);

    default Optional<DroolsRulesConfigReadModel> findByRuleTypeAndIsActiveTrue(String ruleType) {
        List<DroolsRulesConfigReadModel> actives = findAllByRuleTypeAndIsActiveTrue(ruleType);
        return actives.isEmpty() ? Optional.empty() : Optional.of(actives.get(0));
    }

    @Modifying
    @Query("UPDATE DroolsRulesConfigReadModel d SET d.isActive = false WHERE d.ruleType = :ruleType AND d.isActive = true")
    int deactivateAllByRuleType(@Param("ruleType") String ruleType);

    List<DroolsRulesConfigReadModel> findByRuleTypeOrderByVersionDesc(String ruleType);
}
