package com.globalcmx.api.compraspublicas.methodology.repository;

import com.globalcmx.api.compraspublicas.methodology.entity.CPPAAMethodology;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CPPAAMethodologyRepository extends JpaRepository<CPPAAMethodology, Long> {

    List<CPPAAMethodology> findByIsActiveTrueAndCountryCodeOrderByIsDefaultDescNameAsc(String countryCode);

    Optional<CPPAAMethodology> findByCode(String code);

    Optional<CPPAAMethodology> findByIsDefaultTrueAndIsActiveTrueAndCountryCode(String countryCode);
}
