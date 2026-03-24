package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Configuration for action types with i18n support.
 * Defines display names, icons, colors, and messages for each action type.
 */
@Entity
@Table(name = "action_type_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionTypeConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "action_type", nullable = false, length = 30)
    private String actionType;

    @Column(name = "language", nullable = false, length = 5)
    @Builder.Default
    private String language = "es";

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "help_text", columnDefinition = "TEXT")
    private String helpText;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "color", length = 20)
    private String color;

    @Column(name = "success_message", length = 200)
    private String successMessage;

    @Column(name = "error_message", length = 200)
    private String errorMessage;

    @Column(name = "retry_message", length = 200)
    private String retryMessage;

    @Column(name = "skip_message", length = 200)
    private String skipMessage;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
