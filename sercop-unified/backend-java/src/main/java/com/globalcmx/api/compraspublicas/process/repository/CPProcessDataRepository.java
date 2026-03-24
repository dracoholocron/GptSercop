package com.globalcmx.api.compraspublicas.process.repository;

import com.globalcmx.api.compraspublicas.process.entity.CPProcessData;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CPProcessDataRepository extends JpaRepository<CPProcessData, String> {

    Optional<CPProcessData> findByProcessId(String processId);

    List<CPProcessData> findByCountryCodeAndProcessTypeOrderByCreatedAtDesc(String countryCode, String processType);

    List<CPProcessData> findByEntityRucOrderByCreatedAtDesc(String entityRuc);

    Page<CPProcessData> findByCountryCodeAndStatusOrderByUpdatedAtDesc(String countryCode, String status, Pageable pageable);

    @Query("SELECT p FROM CPProcessData p WHERE p.countryCode = :countryCode " +
           "AND (:processType IS NULL OR p.processType = :processType) " +
           "AND (:status IS NULL OR p.status = :status) " +
           "AND (:entityRuc IS NULL OR p.entityRuc = :entityRuc) " +
           "ORDER BY p.updatedAt DESC")
    Page<CPProcessData> findWithFilters(
            @Param("countryCode") String countryCode,
            @Param("processType") String processType,
            @Param("status") String status,
            @Param("entityRuc") String entityRuc,
            Pageable pageable);
}
