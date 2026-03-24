package com.globalcmx.api.security.schedule.entity;

import jakarta.persistence.*;
import java.time.LocalTime;

/**
 * Horas de operación por día de la semana para un horario de rol.
 */
@Entity
@Table(name = "system_schedule_role_hours_read_model",
       uniqueConstraints = @UniqueConstraint(columnNames = {"role_schedule_id", "day_of_week"}))
public class SystemScheduleRoleHours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_schedule_id", nullable = false)
    private SystemScheduleRole roleSchedule;

    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

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

    public SystemScheduleRole getRoleSchedule() {
        return roleSchedule;
    }

    public void setRoleSchedule(SystemScheduleRole roleSchedule) {
        this.roleSchedule = roleSchedule;
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
}
