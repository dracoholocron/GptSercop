package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

/**
 * Read model for event flow configuration.
 * Defines the state machine transitions between events.
 */
@Entity
@Table(name = "event_flow_config_readmodel")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventFlowConfigReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "operation_type", length = 50, nullable = false)
    private String operationType;

    // From state
    @Column(name = "from_event_code", length = 50)
    private String fromEventCode;

    @Column(name = "from_stage", length = 50)
    private String fromStage;

    // To event
    @Column(name = "to_event_code", length = 50, nullable = false)
    private String toEventCode;

    // Conditions (JSON)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "conditions", columnDefinition = "JSON")
    private Map<String, Object> conditions;

    // Config
    @Column(name = "is_required")
    @Builder.Default
    private Boolean isRequired = false;

    @Column(name = "is_optional")
    @Builder.Default
    private Boolean isOptional = true;

    @Column(name = "sequence_order")
    @Builder.Default
    private Integer sequenceOrder = 0;

    // i18n
    @Column(name = "language", length = 5)
    @Builder.Default
    private String language = "en";

    @Column(name = "transition_label", length = 100)
    private String transitionLabel;

    @Column(name = "transition_help", columnDefinition = "TEXT")
    private String transitionHelp;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}
