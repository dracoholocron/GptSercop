package com.globalcmx.api.compraspublicas.config.repository;

import com.globalcmx.api.compraspublicas.config.entity.CPCountryConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CPCountryConfigRepository extends JpaRepository<CPCountryConfig, Long> {

    Optional<CPCountryConfig> findByCountryCode(String countryCode);

    List<CPCountryConfig> findByIsActiveTrueOrderByCountryNameAsc();
}
