package com.globalcmx.api.security.schedule.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZonedDateTime;

/**
 * Día festivo del sistema.
 * Puede cerrar el sistema, reducir horario o ser solo informativo.
 */
@Entity
@Table(name = "system_schedule_holiday_read_model",
       uniqueConstraints = @UniqueConstraint(columnNames = {"holiday_date", "country_code"}))
public class SystemScheduleHoliday {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(name = "holiday_date", nullable = false)
    private LocalDate holidayDate;

    @Column(name = "name_key", nullable = false, length = 100)
    private String nameKey;

    @Column(name = "country_code", length = 3)
    private String countryCode;

    @Column(name = "region_code", length = 10)
    private String regionCode;

    @Column(name = "is_bank_holiday")
    private Boolean isBankHoliday = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private HolidayAction actionType = HolidayAction.CLOSED;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "is_recurring")
    private Boolean isRecurring = false;

    @Column(name = "recurrence_month")
    private Integer recurrenceMonth;

    @Column(name = "recurrence_day")
    private Integer recurrenceDay;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Verifica si esta fecha corresponde a un día festivo para el país dado.
     */
    public boolean appliesTo(LocalDate date, String userCountryCode) {
        if (!isActive) {
            return false;
        }

        // Si tiene país específico, verificar que coincida
        if (countryCode != null && userCountryCode != null && !countryCode.equals(userCountryCode)) {
            return false;
        }

        // Verificar la fecha
        if (Boolean.TRUE.equals(isRecurring)) {
            // Festivo recurrente: comparar mes y día
            return date.getMonthValue() == recurrenceMonth && date.getDayOfMonth() == recurrenceDay;
        } else {
            // Festivo puntual: comparar fecha exacta
            return holidayDate.equals(date);
        }
    }

    /**
     * Evalúa si el acceso está permitido según este día festivo.
     */
    public boolean isAccessAllowed(ZonedDateTime time) {
        if (actionType == HolidayAction.CLOSED) {
            return false;
        }
        if (actionType == HolidayAction.NORMAL) {
            return true; // El festivo es solo informativo
        }
        // REDUCED_HOURS: verificar el horario especial
        if (startTime != null && endTime != null) {
            LocalTime localTime = time.toLocalTime();
            return !localTime.isBefore(startTime) && !localTime.isAfter(endTime);
        }
        return false;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public LocalDate getHolidayDate() {
        return holidayDate;
    }

    public void setHolidayDate(LocalDate holidayDate) {
        this.holidayDate = holidayDate;
    }

    public String getNameKey() {
        return nameKey;
    }

    public void setNameKey(String nameKey) {
        this.nameKey = nameKey;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getRegionCode() {
        return regionCode;
    }

    public void setRegionCode(String regionCode) {
        this.regionCode = regionCode;
    }

    public Boolean getIsBankHoliday() {
        return isBankHoliday;
    }

    public void setIsBankHoliday(Boolean isBankHoliday) {
        this.isBankHoliday = isBankHoliday;
    }

    public HolidayAction getActionType() {
        return actionType;
    }

    public void setActionType(HolidayAction actionType) {
        this.actionType = actionType;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public Boolean getIsRecurring() {
        return isRecurring;
    }

    public void setIsRecurring(Boolean isRecurring) {
        this.isRecurring = isRecurring;
    }

    public Integer getRecurrenceMonth() {
        return recurrenceMonth;
    }

    public void setRecurrenceMonth(Integer recurrenceMonth) {
        this.recurrenceMonth = recurrenceMonth;
    }

    public Integer getRecurrenceDay() {
        return recurrenceDay;
    }

    public void setRecurrenceDay(Integer recurrenceDay) {
        this.recurrenceDay = recurrenceDay;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
}
