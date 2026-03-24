package com.globalcmx.api.security.repository;

import com.globalcmx.api.security.entity.RiskRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para reglas de riesgo.
 */
@Repository
public interface RiskRuleRepository extends JpaRepository<RiskRule, Long> {

    /**
     * Buscar regla por código único.
     */
    Optional<RiskRule> findByCode(String code);

    /**
     * Obtener todas las reglas habilitadas.
     */
    List<RiskRule> findByIsEnabledTrue();

    /**
     * Obtener reglas por categoría.
     */
    List<RiskRule> findByCategory(RiskRule.RiskCategory category);

    /**
     * Obtener reglas habilitadas por categoría.
     */
    List<RiskRule> findByCategoryAndIsEnabledTrue(RiskRule.RiskCategory category);

    /**
     * Verificar si existe una regla con el código dado.
     */
    boolean existsByCode(String code);
}
