package com.globalcmx.api.compraspublicas.legal.repository;

import com.globalcmx.api.compraspublicas.legal.entity.CPLegalContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CPLegalContextRepository extends JpaRepository<CPLegalContext, Long> {

    List<CPLegalContext> findByIsActiveTrueAndCountryCodeOrderByPriorityDesc(String countryCode);

    @Query("SELECT lc FROM CPLegalContext lc WHERE lc.isActive = true AND lc.countryCode = :countryCode " +
           "AND (lc.effectiveDate IS NULL OR lc.effectiveDate <= CURRENT_DATE) " +
           "AND (lc.expiryDate IS NULL OR lc.expiryDate > CURRENT_DATE) " +
           "ORDER BY lc.priority DESC")
    List<CPLegalContext> findActiveAndCurrent(@Param("countryCode") String countryCode);
}
