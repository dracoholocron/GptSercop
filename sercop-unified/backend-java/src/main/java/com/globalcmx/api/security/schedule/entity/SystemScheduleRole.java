package com.globalcmx.api.security.schedule.entity;

import com.globalcmx.api.security.entity.Role;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Horario específico para un rol.
 * Puede extender, restringir o reemplazar el horario global.
 */
@Entity
@Table(name = "system_schedule_role_read_model")
public class SystemScheduleRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_type", nullable = false)
    private ScheduleType scheduleType = ScheduleType.EXTEND;

    @Column(name = "description_key", length = 100)
    private String descriptionKey;

    @Column
    private Integer priority = 0;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @OneToMany(mappedBy = "roleSchedule", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<SystemScheduleRoleHours> hours = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

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
     * Verifica si el acceso está permitido según este horario de rol.
     */
    public boolean isAccessAllowed(ZonedDateTime time, String systemTimezone) {
        if (!isActive) {
            return false;
        }

        int dayOfWeek = time.getDayOfWeek().getValue();
        LocalTime localTime = time.toLocalTime();

        return hours.stream()
                .filter(h -> h.getDayOfWeek() == dayOfWeek && Boolean.TRUE.equals(h.getIsEnabled()))
                .anyMatch(h -> isTimeInRange(localTime, h.getStartTime(), h.getEndTime(), h.getAllowOvernight()));
    }

    private boolean isTimeInRange(LocalTime time, LocalTime start, LocalTime end, Boolean allowOvernight) {
        if (Boolean.TRUE.equals(allowOvernight) && end.isBefore(start)) {
            return !time.isBefore(start) || !time.isAfter(end);
        }
        return !time.isBefore(start) && !time.isAfter(end);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public ScheduleType getScheduleType() {
        return scheduleType;
    }

    public void setScheduleType(ScheduleType scheduleType) {
        this.scheduleType = scheduleType;
    }

    public String getDescriptionKey() {
        return descriptionKey;
    }

    public void setDescriptionKey(String descriptionKey) {
        this.descriptionKey = descriptionKey;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public List<SystemScheduleRoleHours> getHours() {
        return hours;
    }

    public void setHours(List<SystemScheduleRoleHours> hours) {
        this.hours = hours;
    }

    public void addHours(SystemScheduleRoleHours hour) {
        hours.add(hour);
        hour.setRoleSchedule(this);
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

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
