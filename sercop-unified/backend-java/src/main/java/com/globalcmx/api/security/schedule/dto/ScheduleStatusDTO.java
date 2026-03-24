package com.globalcmx.api.security.schedule.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.globalcmx.api.security.schedule.entity.ScheduleLevelApplied;

import java.time.LocalTime;

/**
 * Estado actual del horario para el usuario autenticado.
 */
public class ScheduleStatusDTO {

    @JsonProperty("isAllowed")
    private boolean isAllowed;
    private String message;
    private ScheduleLevelApplied currentLevel;
    private String scheduleName;
    private LocalTime currentStartTime;
    private LocalTime currentEndTime;
    private int minutesRemaining;
    private String nextAccessTime;
    @JsonProperty("isHoliday")
    private boolean isHoliday;
    private String holidayName;
    private String userTimezone;
    private String systemTimezone;
    private String currentTimeFormatted;
    @JsonProperty("isExempt")
    private boolean isExempt;
    private String exemptReason;

    // Getters and Setters
    public boolean isAllowed() {
        return isAllowed;
    }

    public void setAllowed(boolean allowed) {
        isAllowed = allowed;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public ScheduleLevelApplied getCurrentLevel() {
        return currentLevel;
    }

    public void setCurrentLevel(ScheduleLevelApplied currentLevel) {
        this.currentLevel = currentLevel;
    }

    public String getScheduleName() {
        return scheduleName;
    }

    public void setScheduleName(String scheduleName) {
        this.scheduleName = scheduleName;
    }

    public LocalTime getCurrentStartTime() {
        return currentStartTime;
    }

    public void setCurrentStartTime(LocalTime currentStartTime) {
        this.currentStartTime = currentStartTime;
    }

    public LocalTime getCurrentEndTime() {
        return currentEndTime;
    }

    public void setCurrentEndTime(LocalTime currentEndTime) {
        this.currentEndTime = currentEndTime;
    }

    public int getMinutesRemaining() {
        return minutesRemaining;
    }

    public void setMinutesRemaining(int minutesRemaining) {
        this.minutesRemaining = minutesRemaining;
    }

    public String getNextAccessTime() {
        return nextAccessTime;
    }

    public void setNextAccessTime(String nextAccessTime) {
        this.nextAccessTime = nextAccessTime;
    }

    public boolean isHoliday() {
        return isHoliday;
    }

    public void setHoliday(boolean holiday) {
        isHoliday = holiday;
    }

    public String getHolidayName() {
        return holidayName;
    }

    public void setHolidayName(String holidayName) {
        this.holidayName = holidayName;
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

    public String getCurrentTimeFormatted() {
        return currentTimeFormatted;
    }

    public void setCurrentTimeFormatted(String currentTimeFormatted) {
        this.currentTimeFormatted = currentTimeFormatted;
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
