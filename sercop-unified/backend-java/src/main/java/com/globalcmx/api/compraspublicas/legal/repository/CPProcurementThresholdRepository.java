package com.globalcmx.api.compraspublicas.legal.repository;

import com.globalcmx.api.compraspublicas.legal.entity.CPProcurementThreshold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CPProcurementThresholdRepository extends JpaRepository<CPProcurementThreshold, Long> {

    List<CPProcurementThreshold> findByFiscalYearAndIsActiveTrueAndCountryCodeOrderByMinValueAsc(
            Integer fiscalYear, String countryCode);

    List<CPProcurementThreshold> findByIsActiveTrueAndCountryCodeOrderByFiscalYearDescMinValueAsc(String countryCode);
}
