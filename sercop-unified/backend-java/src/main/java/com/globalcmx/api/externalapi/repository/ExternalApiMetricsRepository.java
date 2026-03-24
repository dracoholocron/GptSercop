package com.globalcmx.api.externalapi.repository;

import com.globalcmx.api.externalapi.entity.ExternalApiMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExternalApiMetricsRepository extends JpaRepository<ExternalApiMetrics, Long> {

    List<ExternalApiMetrics> findByApiConfigId(Long apiConfigId);

    List<ExternalApiMetrics> findByApiConfigCode(String apiConfigCode);

    Optional<ExternalApiMetrics> findByApiConfigIdAndMetricDateAndMetricHour(
            Long apiConfigId, LocalDate metricDate, Integer metricHour);

    @Query("SELECT m FROM ExternalApiMetrics m " +
           "WHERE m.apiConfigId = :apiConfigId " +
           "AND m.metricDate >= :fromDate " +
           "AND m.metricDate <= :toDate " +
           "ORDER BY m.metricDate, m.metricHour")
    List<ExternalApiMetrics> findByApiConfigIdAndDateRange(
            @Param("apiConfigId") Long apiConfigId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("SELECT SUM(m.totalCalls), SUM(m.successfulCalls), SUM(m.failedCalls), " +
           "AVG(m.avgResponseTimeMs) " +
           "FROM ExternalApiMetrics m " +
           "WHERE m.apiConfigId = :apiConfigId " +
           "AND m.metricDate >= :fromDate")
    Object[] getAggregatedMetrics(@Param("apiConfigId") Long apiConfigId, @Param("fromDate") LocalDate fromDate);

    @Query("SELECT m.metricDate, SUM(m.totalCalls), SUM(m.successfulCalls), SUM(m.failedCalls) " +
           "FROM ExternalApiMetrics m " +
           "WHERE m.apiConfigId = :apiConfigId " +
           "AND m.metricDate >= :fromDate " +
           "GROUP BY m.metricDate " +
           "ORDER BY m.metricDate")
    List<Object[]> getDailyMetrics(@Param("apiConfigId") Long apiConfigId, @Param("fromDate") LocalDate fromDate);

    void deleteByApiConfigId(Long apiConfigId);
}
