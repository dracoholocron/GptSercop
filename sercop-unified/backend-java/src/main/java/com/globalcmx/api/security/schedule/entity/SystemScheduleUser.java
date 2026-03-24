package com.globalcmx.api.security.schedule.entity;

import com.globalcmx.api.security.entity.User;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Horario específico para un usuario.
 * Requiere aprobación y puede tener vigencia limitada.
 */
@Entity
@Table(name = "system_schedule_user_read_model")
public class SystemScheduleUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_type", nullable = false)
    private ScheduleType scheduleType = ScheduleType.EXTEND;

    @Column(name = "timezone_override", length = 50)
    private String timezoneOverride;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @OneToMany(mappedBy = "userSchedule", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<SystemScheduleUserHours> hours = new ArrayList<>();

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
     * Verifica si el horario está vigente en la fecha dada.
     */
    public boolean isValidOn(LocalDate date) {
        if (!isActive) {
            return false;
        }
        if (validFrom != null && date.isBefore(validFrom)) {
            return false;
        }
        if (validUntil != null && date.isAfter(validUntil)) {
            return false;
        }
        return true;
    }

    /**
     * Verifica si el acceso está permitido según este horario de usuario.
     */
    public boolean isAccessAllowed(ZonedDateTime time) {
        if (!isValidOn(time.toLocalDate())) {
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public ScheduleType getScheduleType() {
        return scheduleType;
    }

    public void setScheduleType(ScheduleType scheduleType) {
        this.scheduleType = scheduleType;
    }

    public String getTimezoneOverride() {
        return timezoneOverride;
    }

    public void setTimezoneOverride(String timezoneOverride) {
        this.timezoneOverride = timezoneOverride;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public LocalDate getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(LocalDate validFrom) {
        this.validFrom = validFrom;
    }

    public LocalDate getValidUntil() {
        return validUntil;
    }

    public void setValidUntil(LocalDate validUntil) {
        this.validUntil = validUntil;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public List<SystemScheduleUserHours> getHours() {
        return hours;
    }

    public void setHours(List<SystemScheduleUserHours> hours) {
        this.hours = hours;
    }

    public void addHours(SystemScheduleUserHours hour) {
        hours.add(hour);
        hour.setUserSchedule(this);
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
