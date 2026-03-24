package com.globalcmx.api.security.schedule.entity;

import jakarta.persistence.*;
import java.time.LocalTime;

/**
 * Horas de operación por día de la semana para un horario global.
 */
@Entity
@Table(name = "system_schedule_global_hours_read_model",
       uniqueConstraints = @UniqueConstraint(columnNames = {"schedule_id", "day_of_week"}))
public class SystemScheduleGlobalHours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private SystemScheduleGlobal schedule;

    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek; // 1=Lunes, 7=Domingo

    @Column(name = "is_enabled")
    private Boolean isEnabled = true;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "allow_overnight")
    private Boolean allowOvernight = false;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public SystemScheduleGlobal getSchedule() {
        return schedule;
    }

    public void setSchedule(SystemScheduleGlobal schedule) {
        this.schedule = schedule;
    }

    public Integer getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(Integer dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
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

    /**
     * Nombre del día de la semana en español.
     */
    public String getDayName() {
        return switch (dayOfWeek) {
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
}
