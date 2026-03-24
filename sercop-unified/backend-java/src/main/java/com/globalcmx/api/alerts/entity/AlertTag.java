package com.globalcmx.api.alerts.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity for alert tags catalog.
 * Tags allow users to categorize and filter alerts.
 */
@Entity
@Table(name = "alert_tags",
    indexes = {
        @Index(name = "idx_alert_tags_active", columnList = "active"),
        @Index(name = "idx_alert_tags_name", columnList = "name")
    })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", length = 50, unique = true, nullable = false)
    private String name;

    @Column(name = "name_es", length = 100)
    private String nameEs;

    @Column(name = "name_en", length = 100)
    private String nameEn;

    @Column(name = "color", length = 7)
    @Builder.Default
    private String color = "#6B7280";

    @Column(name = "description_es", length = 200)
    private String descriptionEs;

    @Column(name = "description_en", length = 200)
    private String descriptionEn;

    @Column(name = "description", length = 200)
    private String description;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "active")
    @Builder.Default
    private Boolean active = true;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
