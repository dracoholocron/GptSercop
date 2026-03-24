package com.globalcmx.api.externalapi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "external_api_request_template")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "apiConfig")
@EqualsAndHashCode(exclude = "apiConfig")
public class ExternalApiRequestTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_config_id", nullable = false)
    private ExternalApiConfigReadModel apiConfig;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "static_headers_json", columnDefinition = "TEXT")
    private String staticHeadersJson;

    @Column(name = "query_params_template", columnDefinition = "TEXT")
    private String queryParamsTemplate;

    @Column(name = "body_template", columnDefinition = "TEXT")
    private String bodyTemplate;

    @Column(name = "test_payload_example", columnDefinition = "TEXT")
    private String testPayloadExample;

    @Column(name = "variable_mappings_json", columnDefinition = "TEXT")
    private String variableMappingsJson;

    @Column(name = "is_default")
    private Boolean isDefault;

    @Column
    private Boolean active;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (active == null) active = true;
        if (isDefault == null) isDefault = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
