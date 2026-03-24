package com.globalcmx.api.security.schedule.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Horario global del sistema.
 * Define el horario base de operación que aplica a todos los usuarios.
 * Los campos name_key y description_key contienen claves i18n para multi-idioma.
 */
@Entity
@Table(name = "system_schedule_global_read_model")
public class SystemScheduleGlobal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name_key", nullable = false, length = 100)
    private String nameKey;

    @Column(name = "description_key", length = 100)
    private String descriptionKey;

    @Column(nullable = false, length = 50)
    private String timezone = "America/Mexico_City";

    @Column(name = "is_default")
    private Boolean isDefault = false;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<SystemScheduleGlobalHours> hours = new ArrayList<>();

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
     * Verifica si el acceso está permitido en el momento dado.
     *
     * @param userTime Hora del usuario en su zona horaria
     * @return true si el acceso está permitido
     */
    public boolean isAccessAllowed(ZonedDateTime userTime) {
        if (!isActive) {
            return false;
        }

        ZonedDateTime systemTime = userTime.withZoneSameInstant(ZoneId.of(timezone));
        int dayOfWeek = systemTime.getDayOfWeek().getValue();
        LocalTime time = systemTime.toLocalTime();

        return hours.stream()
                .filter(h -> h.getDayOfWeek() == dayOfWeek && Boolean.TRUE.equals(h.getIsEnabled()))
                .anyMatch(h -> isTimeInRange(time, h.getStartTime(), h.getEndTime(), h.getAllowOvernight()));
    }

    /**
     * Obtiene las horas de un día específico.
     */
    public SystemScheduleGlobalHours getHoursForDay(int dayOfWeek) {
        return hours.stream()
                .filter(h -> h.getDayOfWeek() == dayOfWeek)
                .findFirst()
                .orElse(null);
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

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getNameKey() {
        return nameKey;
    }

    public void setNameKey(String nameKey) {
        this.nameKey = nameKey;
    }

    public String getDescriptionKey() {
        return descriptionKey;
    }

    public void setDescriptionKey(String descriptionKey) {
        this.descriptionKey = descriptionKey;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public List<SystemScheduleGlobalHours> getHours() {
        return hours;
    }

    public void setHours(List<SystemScheduleGlobalHours> hours) {
        this.hours = hours;
    }

    public void addHours(SystemScheduleGlobalHours hour) {
        hours.add(hour);
        hour.setSchedule(this);
    }

    public void removeHours(SystemScheduleGlobalHours hour) {
        hours.remove(hour);
        hour.setSchedule(null);
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
