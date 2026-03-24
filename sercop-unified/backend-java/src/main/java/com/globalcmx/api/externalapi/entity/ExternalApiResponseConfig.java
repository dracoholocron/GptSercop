package com.globalcmx.api.externalapi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "external_api_response_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "apiConfig")
@EqualsAndHashCode(exclude = "apiConfig")
public class ExternalApiResponseConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_config_id", nullable = false)
    private ExternalApiConfigReadModel apiConfig;

    @Column(name = "success_codes", length = 100)
    private String successCodes;

    @Column(name = "response_type", length = 20)
    @Enumerated(EnumType.STRING)
    private ResponseType responseType;

    @Column(name = "success_field_path", length = 255)
    private String successFieldPath;

    @Column(name = "success_expected_value", length = 255)
    private String successExpectedValue;

    @Column(name = "error_message_path", length = 255)
    private String errorMessagePath;

    @Column(name = "transaction_id_path", length = 255)
    private String transactionIdPath;

    @Column(name = "extraction_mappings_json", columnDefinition = "TEXT")
    private String extractionMappingsJson;

    @Column(name = "validation_rules_json", columnDefinition = "TEXT")
    private String validationRulesJson;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (successCodes == null) successCodes = "200,201";
        if (responseType == null) responseType = ResponseType.JSON;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ResponseType {
        JSON, XML, TEXT
    }
}
