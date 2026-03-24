package com.globalcmx.api.externalapi.repository;

import com.globalcmx.api.externalapi.entity.ExternalApiTestResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExternalApiTestResultRepository extends JpaRepository<ExternalApiTestResult, Long> {

    List<ExternalApiTestResult> findByApiConfigId(Long apiConfigId);

    Page<ExternalApiTestResult> findByApiConfigIdOrderByTestedAtDesc(Long apiConfigId, Pageable pageable);

    @Query("SELECT t FROM ExternalApiTestResult t " +
           "WHERE (:apiConfigId IS NULL OR t.apiConfigId = :apiConfigId) " +
           "ORDER BY t.testedAt DESC")
    Page<ExternalApiTestResult> findAllByFilters(
            @Param("apiConfigId") Long apiConfigId,
            Pageable pageable);

    @Query("SELECT t FROM ExternalApiTestResult t " +
           "WHERE t.apiConfigId = :apiConfigId " +
           "ORDER BY t.testedAt DESC")
    List<ExternalApiTestResult> findLastByApiConfigId(@Param("apiConfigId") Long apiConfigId, Pageable pageable);

    default Optional<ExternalApiTestResult> findMostRecentByApiConfigId(Long apiConfigId) {
        List<ExternalApiTestResult> results = findLastByApiConfigId(apiConfigId, org.springframework.data.domain.PageRequest.of(0, 1));
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    void deleteByApiConfigId(Long apiConfigId);
}
