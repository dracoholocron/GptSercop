package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Read model for event type configuration.
 * Defines available events per operation type with i18n support.
 */
@Entity
@Table(name = "event_type_config_readmodel")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventTypeConfigReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_code", length = 50, nullable = false)
    private String eventCode;

    @Column(name = "operation_type", length = 50, nullable = false)
    private String operationType;

    // i18n
    @Column(name = "language", length = 5, nullable = false)
    @Builder.Default
    private String language = "en";

    @Column(name = "event_name", length = 100, nullable = false)
    private String eventName;

    @Column(name = "event_description", columnDefinition = "TEXT")
    private String eventDescription;

    @Column(name = "help_text", columnDefinition = "TEXT")
    private String helpText;

    // SWIFT messages / process type identifier
    @Column(name = "outbound_message_type", length = 50)
    private String outboundMessageType;

    @Column(name = "inbound_message_type", length = 50)
    private String inboundMessageType;

    // Flow rules (JSON arrays)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "valid_from_stages", columnDefinition = "JSON")
    private List<String> validFromStages;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "valid_from_statuses", columnDefinition = "JSON")
    private List<String> validFromStatuses;

    @Column(name = "resulting_stage", length = 50)
    private String resultingStage;

    @Column(name = "resulting_status", length = 50)
    private String resultingStatus;

    // UI
    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "color", length = 20)
    private String color;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    // Message direction fields - clarify who sends/receives
    @Column(name = "message_sender", length = 30)
    private String messageSender;

    @Column(name = "message_receiver", length = 30)
    private String messageReceiver;

    @Column(name = "our_role", length = 10)
    private String ourRole;

    @Column(name = "requires_swift_message")
    @Builder.Default
    private Boolean requiresSwiftMessage = false;

    @Column(name = "event_category", length = 30)
    private String eventCategory;

    // Initial event configuration - for flows with multiple entry points
    @Column(name = "is_initial_event")
    @Builder.Default
    private Boolean isInitialEvent = false;

    @Column(name = "initial_event_role", length = 30)
    private String initialEventRole;

    // Client portal configuration
    @Column(name = "is_client_requestable")
    @Builder.Default
    private Boolean isClientRequestable = false;

    @Column(name = "event_source", length = 30)
    @Builder.Default
    private String eventSource = "BACKOFFICE";

    // Flags
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "requires_approval")
    @Builder.Default
    private Boolean requiresApproval = false;

    @Column(name = "approval_levels")
    @Builder.Default
    private Integer approvalLevels = 1;

    @Column(name = "is_reversible")
    @Builder.Default
    private Boolean isReversible = false;

    @Column(name = "generates_notification")
    @Builder.Default
    private Boolean generatesNotification = true;

    // Permissions (JSON array)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "allowed_roles", columnDefinition = "JSON")
    private List<String> allowedRoles;

    // Form type: SWIFT_FORM, DOCUMENT_UPLOAD, NONE
    @Column(name = "form_type", length = 30)
    @Builder.Default
    private String formType = "NONE";

    // Form fields configuration for client portal (JSON array)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "form_fields_config", columnDefinition = "JSON")
    private List<java.util.Map<String, Object>> formFieldsConfig;

    // Audit
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "modified_at")
    private LocalDateTime modifiedAt;

    @Version
    @Column(name = "version")
    @Builder.Default
    private Integer version = 1;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        modifiedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        modifiedAt = LocalDateTime.now();
    }
}
