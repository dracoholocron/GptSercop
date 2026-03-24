package com.globalcmx.api.security.schedule.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalTime;

/**
 * DTO para las horas de un día específico.
 */
public class ScheduleHoursDTO {

    private Long id;
    private Integer dayOfWeek;
    private String dayName;
    private Boolean isEnabled;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    private Boolean allowOvernight;

    public ScheduleHoursDTO() {
    }

    public ScheduleHoursDTO(Integer dayOfWeek, Boolean isEnabled, LocalTime startTime, LocalTime endTime) {
        this.dayOfWeek = dayOfWeek;
        this.isEnabled = isEnabled;
        this.startTime = startTime;
        this.endTime = endTime;
        this.dayName = getDayNameFromNumber(dayOfWeek);
    }

    private String getDayNameFromNumber(Integer day) {
        if (day == null) return null;
        return switch (day) {
            case 1 -> "Lunes";
            case 2 -> "Martes";
            case 3 -> "Miércoles";
            case 4 -> "Jueves";
            case 5 -> "Viernes";
            case 6 -> "Sábado";
            case 7 -> "Domingo";
            default -> "Desconocido";
        };
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(Integer dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
        this.dayName = getDayNameFromNumber(dayOfWeek);
    }

    public String getDayName() {
        return dayName;
    }

    public void setDayName(String dayName) {
        this.dayName = dayName;
    }

    public Boolean getIsEnabled() {
        return isEnabled;
    }

    public void setIsEnabled(Boolean isEnabled) {
        this.isEnabled = isEnabled;
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

    public Boolean getAllowOvernight() {
        return allowOvernight;
    }

    public void setAllowOvernight(Boolean allowOvernight) {
        this.allowOvernight = allowOvernight;
    }
}
