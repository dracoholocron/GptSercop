package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Configuration entity for which operation fields to capture in event snapshots.
 * This allows dynamic/configurable field tracking without hardcoding.
 */
@Entity
@Table(name = "event_snapshot_field_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventSnapshotFieldConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "field_name", length = 50, nullable = false)
    private String fieldName;

    @Column(name = "field_label", length = 100, nullable = false)
    private String fieldLabel;

    @Column(name = "field_type", length = 20, nullable = false)
    @Builder.Default
    private String fieldType = "STRING";

    @Column(name = "operation_type", length = 50)
    private String operationType;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "track_changes", nullable = false)
    @Builder.Default
    private Boolean trackChanges = true;

    @Column(name = "show_in_timeline", nullable = false)
    @Builder.Default
    private Boolean showInTimeline = true;

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
}
