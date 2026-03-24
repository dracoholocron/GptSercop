package com.globalcmx.api.alerts.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Configuration entity for alert types.
 * Provides i18n labels, icons, colors, and default settings.
 */
@Entity
@Table(name = "alert_type_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertTypeConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "type_code", length = 50, unique = true, nullable = false)
    private String typeCode;

    // Display labels (i18n)
    @Column(name = "label_es", length = 100, nullable = false)
    private String labelEs;

    @Column(name = "label_en", length = 100, nullable = false)
    private String labelEn;

    @Column(name = "description_es", columnDefinition = "TEXT")
    private String descriptionEs;

    @Column(name = "description_en", columnDefinition = "TEXT")
    private String descriptionEn;

    // Visual settings
    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "color", length = 20)
    private String color;

    // Default settings
    @Column(name = "default_priority", length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UserAlertReadModel.AlertPriority defaultPriority = UserAlertReadModel.AlertPriority.NORMAL;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    // Audit
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Get label based on language code
     */
    public String getLabel(String language) {
        return "en".equalsIgnoreCase(language) ? labelEn : labelEs;
    }

    /**
     * Get description based on language code
     */
    public String getDescription(String language) {
        return "en".equalsIgnoreCase(language) ? descriptionEn : descriptionEs;
    }
}
