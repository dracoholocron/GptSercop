package com.globalcmx.api.security.schedule.repository;

import com.globalcmx.api.security.schedule.entity.SystemScheduleHoliday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SystemScheduleHolidayRepository extends JpaRepository<SystemScheduleHoliday, Long> {

    /**
     * Encuentra festivos para una fecha específica y país.
     */
    @Query("SELECT h FROM SystemScheduleHoliday h WHERE h.isActive = true " +
           "AND ((h.holidayDate = :date AND h.isRecurring = false) " +
           "OR (h.isRecurring = true AND h.recurrenceMonth = :month AND h.recurrenceDay = :day)) " +
           "AND (h.countryCode IS NULL OR h.countryCode = :countryCode)")
    List<SystemScheduleHoliday> findByDateAndCountry(
            @Param("date") LocalDate date,
            @Param("month") int month,
            @Param("day") int day,
            @Param("countryCode") String countryCode);

    /**
     * Encuentra festivos para una fecha (sin filtro de país).
     */
    @Query("SELECT h FROM SystemScheduleHoliday h WHERE h.isActive = true " +
           "AND ((h.holidayDate = :date AND h.isRecurring = false) " +
           "OR (h.isRecurring = true AND h.recurrenceMonth = :month AND h.recurrenceDay = :day))")
    List<SystemScheduleHoliday> findByDate(
            @Param("date") LocalDate date,
            @Param("month") int month,
            @Param("day") int day);

    /**
     * Encuentra próximos festivos.
     */
    @Query("SELECT h FROM SystemScheduleHoliday h WHERE h.isActive = true " +
           "AND h.holidayDate >= :startDate AND h.holidayDate <= :endDate " +
           "ORDER BY h.holidayDate")
    List<SystemScheduleHoliday> findUpcoming(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Encuentra festivos por país.
     */
    List<SystemScheduleHoliday> findByCountryCodeAndIsActiveTrue(String countryCode);

    /**
     * Encuentra todos los festivos activos.
     */
    List<SystemScheduleHoliday> findByIsActiveTrueOrderByHolidayDateAsc();

    /**
     * Encuentra festivos recurrentes.
     */
    List<SystemScheduleHoliday> findByIsRecurringTrueAndIsActiveTrue();

    /**
     * Verifica si una fecha es festivo.
     */
    @Query("SELECT CASE WHEN COUNT(h) > 0 THEN true ELSE false END FROM SystemScheduleHoliday h " +
           "WHERE h.isActive = true " +
           "AND ((h.holidayDate = :date AND h.isRecurring = false) " +
           "OR (h.isRecurring = true AND h.recurrenceMonth = :month AND h.recurrenceDay = :day))")
    boolean isHoliday(
            @Param("date") LocalDate date,
            @Param("month") int month,
            @Param("day") int day);
}
