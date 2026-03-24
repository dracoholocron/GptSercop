package com.globalcmx.api.security.schedule.dto;

import com.globalcmx.api.security.schedule.entity.AccessResult;
import com.globalcmx.api.security.schedule.entity.ScheduleLevelApplied;

import java.time.LocalTime;
import java.time.ZonedDateTime;

/**
 * Resultado de la evaluación de acceso por horario.
 */
public class ScheduleAccessResult {

    private AccessResult result;
    private String reason;
    private ScheduleLevelApplied levelApplied;
    private Long scheduleId;
    private ZonedDateTime evaluatedAt;
    private String systemTimezone;
    private LocalTime allowedStart;
    private LocalTime allowedEnd;
    private ZonedDateTime nextAccessWindow;
    private int minutesRemaining;
    private boolean isWarning;
    private String warningMessage;
    private boolean isExempt;
    private String exemptReason;

    public ScheduleAccessResult() {
    }

    public static ScheduleAccessResult allowed(ScheduleLevelApplied level, Long scheduleId) {
        ScheduleAccessResult result = new ScheduleAccessResult();
        result.result = AccessResult.ALLOWED;
        result.levelApplied = level;
        result.scheduleId = scheduleId;
        result.evaluatedAt = ZonedDateTime.now();
        return result;
    }

    public static ScheduleAccessResult denied(String reason, ScheduleLevelApplied level) {
        ScheduleAccessResult result = new ScheduleAccessResult();
        result.result = AccessResult.DENIED;
        result.reason = reason;
        result.levelApplied = level;
        result.evaluatedAt = ZonedDateTime.now();
        return result;
    }

    public static ScheduleAccessResult warned(String warning, ScheduleLevelApplied level, int minutesRemaining) {
        ScheduleAccessResult result = new ScheduleAccessResult();
        result.result = AccessResult.WARNED;
        result.levelApplied = level;
        result.isWarning = true;
        result.warningMessage = warning;
        result.minutesRemaining = minutesRemaining;
        result.evaluatedAt = ZonedDateTime.now();
        return result;
    }

    // Getters and Setters
    public AccessResult getResult() {
        return result;
    }

    public void setResult(AccessResult result) {
        this.result = result;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public ScheduleLevelApplied getLevelApplied() {
        return levelApplied;
    }

    public void setLevelApplied(ScheduleLevelApplied levelApplied) {
        this.levelApplied = levelApplied;
    }

    public Long getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(Long scheduleId) {
        this.scheduleId = scheduleId;
    }

    public ZonedDateTime getEvaluatedAt() {
        return evaluatedAt;
    }

    public void setEvaluatedAt(ZonedDateTime evaluatedAt) {
        this.evaluatedAt = evaluatedAt;
    }

    public String getSystemTimezone() {
        return systemTimezone;
    }

    public void setSystemTimezone(String systemTimezone) {
        this.systemTimezone = systemTimezone;
    }

    public LocalTime getAllowedStart() {
        return allowedStart;
    }

    public void setAllowedStart(LocalTime allowedStart) {
        this.allowedStart = allowedStart;
    }

    public LocalTime getAllowedEnd() {
        return allowedEnd;
    }

    public void setAllowedEnd(LocalTime allowedEnd) {
        this.allowedEnd = allowedEnd;
    }

    public ZonedDateTime getNextAccessWindow() {
        return nextAccessWindow;
    }

    public void setNextAccessWindow(ZonedDateTime nextAccessWindow) {
        this.nextAccessWindow = nextAccessWindow;
    }

    public int getMinutesRemaining() {
        return minutesRemaining;
    }

    public void setMinutesRemaining(int minutesRemaining) {
        this.minutesRemaining = minutesRemaining;
    }

    public boolean isWarning() {
        return isWarning;
    }

    public void setWarning(boolean warning) {
        isWarning = warning;
    }

    public String getWarningMessage() {
        return warningMessage;
    }

    public void setWarningMessage(String warningMessage) {
        this.warningMessage = warningMessage;
    }

    public boolean isExempt() {
        return isExempt;
    }

    public void setExempt(boolean exempt) {
        isExempt = exempt;
    }

    public String getExemptReason() {
        return exemptReason;
    }

    public void setExemptReason(String exemptReason) {
        this.exemptReason = exemptReason;
    }
}
