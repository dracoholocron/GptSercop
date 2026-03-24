package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Read model for SWIFT response configuration.
 * Defines expected responses for sent messages and timeout rules.
 */
@Entity
@Table(name = "swift_response_config_readmodel")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwiftResponseConfigReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sent_message_type", length = 10, nullable = false)
    private String sentMessageType;

    @Column(name = "operation_type", length = 50, nullable = false)
    private String operationType;

    @Column(name = "expected_response_type", length = 10, nullable = false)
    private String expectedResponseType;

    @Column(name = "response_event_code", length = 50)
    private String responseEventCode;

    @Column(name = "expected_response_days")
    @Builder.Default
    private Integer expectedResponseDays = 5;

    @Column(name = "alert_after_days")
    @Builder.Default
    private Integer alertAfterDays = 3;

    @Column(name = "escalate_after_days")
    @Builder.Default
    private Integer escalateAfterDays = 7;

    // i18n
    @Column(name = "language", length = 5)
    @Builder.Default
    private String language = "en";

    @Column(name = "response_description", length = 200)
    private String responseDescription;

    @Column(name = "timeout_message", length = 200)
    private String timeoutMessage;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}
