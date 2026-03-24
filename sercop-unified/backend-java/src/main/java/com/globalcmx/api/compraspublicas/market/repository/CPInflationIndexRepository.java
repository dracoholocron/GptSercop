package com.globalcmx.api.compraspublicas.market.repository;

import com.globalcmx.api.compraspublicas.market.entity.CPInflationIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CPInflationIndexRepository extends JpaRepository<CPInflationIndex, Long> {

    Optional<CPInflationIndex> findByCountryCodeAndYearMonth(String countryCode, String yearMonth);

    List<CPInflationIndex> findByCountryCodeOrderByYearMonthDesc(String countryCode);

    List<CPInflationIndex> findByCountryCodeAndYearMonthBetweenOrderByYearMonthAsc(String countryCode, String fromMonth, String toMonth);
}
