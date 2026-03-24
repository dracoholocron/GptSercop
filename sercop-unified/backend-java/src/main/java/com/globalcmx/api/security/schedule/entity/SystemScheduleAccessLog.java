package com.globalcmx.api.security.schedule.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Log de accesos evaluados por el sistema de horarios.
 * Registra tanto accesos permitidos como denegados.
 */
@Entity
@Table(name = "system_schedule_access_log_read_model")
public class SystemScheduleAccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(name = "access_timestamp", nullable = false)
    private LocalDateTime accessTimestamp;

    @Column(name = "user_timezone", length = 50)
    private String userTimezone;

    @Column(name = "system_timezone", length = 50)
    private String systemTimezone;

    @Column(name = "user_local_time")
    private LocalTime userLocalTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_result", nullable = false)
    private AccessResult accessResult;

    @Column(name = "denial_reason_key", length = 100)
    private String denialReasonKey;

    @Column(name = "denial_reason_params", columnDefinition = "TEXT")
    private String denialReasonParams;

    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_level_applied", nullable = false)
    private ScheduleLevelApplied scheduleLevelApplied;

    @Column(name = "schedule_id")
    private Long scheduleId;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public LocalDateTime getAccessTimestamp() {
        return accessTimestamp;
    }

    public void setAccessTimestamp(LocalDateTime accessTimestamp) {
        this.accessTimestamp = accessTimestamp;
    }

    public String getUserTimezone() {
        return userTimezone;
    }

    public void setUserTimezone(String userTimezone) {
        this.userTimezone = userTimezone;
    }

    public String getSystemTimezone() {
        return systemTimezone;
    }

    public void setSystemTimezone(String systemTimezone) {
        this.systemTimezone = systemTimezone;
    }

    public LocalTime getUserLocalTime() {
        return userLocalTime;
    }

    public void setUserLocalTime(LocalTime userLocalTime) {
        this.userLocalTime = userLocalTime;
    }

    public AccessResult getAccessResult() {
        return accessResult;
    }

    public void setAccessResult(AccessResult accessResult) {
        this.accessResult = accessResult;
    }

    public String getDenialReasonKey() {
        return denialReasonKey;
    }

    public void setDenialReasonKey(String denialReasonKey) {
        this.denialReasonKey = denialReasonKey;
    }

    public String getDenialReasonParams() {
        return denialReasonParams;
    }

    public void setDenialReasonParams(String denialReasonParams) {
        this.denialReasonParams = denialReasonParams;
    }

    public ScheduleLevelApplied getScheduleLevelApplied() {
        return scheduleLevelApplied;
    }

    public void setScheduleLevelApplied(ScheduleLevelApplied scheduleLevelApplied) {
        this.scheduleLevelApplied = scheduleLevelApplied;
    }

    public Long getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(Long scheduleId) {
        this.scheduleId = scheduleId;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
