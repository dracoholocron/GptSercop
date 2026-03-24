package com.globalcmx.api.compraspublicas.paa.repository;

import com.globalcmx.api.compraspublicas.paa.entity.CPPAA;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CPPAARepository extends JpaRepository<CPPAA, String> {

    List<CPPAA> findByEntityRucAndFiscalYearOrderByVersionDesc(String entityRuc, Integer fiscalYear);

    Optional<CPPAA> findByEntityRucAndFiscalYearAndVersion(String entityRuc, Integer fiscalYear, Integer version);

    List<CPPAA> findByCountryCodeAndFiscalYearOrderByEntityNameAsc(String countryCode, Integer fiscalYear);

    List<CPPAA> findByStatusOrderByUpdatedAtDesc(String status);
}
