package com.globalcmx.api.compraspublicas.legal.repository;

import com.globalcmx.api.compraspublicas.legal.entity.CPKnownEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CPKnownEntityRepository extends JpaRepository<CPKnownEntity, Long> {

    List<CPKnownEntity> findByIsActiveTrueAndCountryCodeOrderByEntityNameAsc(String countryCode);

    Optional<CPKnownEntity> findByEntityRucAndIsActiveTrue(String entityRuc);

    List<CPKnownEntity> findBySectorCodeAndIsActiveTrueAndCountryCode(String sectorCode, String countryCode);
}
