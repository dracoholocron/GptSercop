package com.globalcmx.api.readmodel.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "reference_number_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReferenceNumberHistoryReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "config_id", nullable = false)
    private Long configId;

    @Column(name = "reference_number", nullable = false, length = 50, unique = true)
    private String referenceNumber;

    @Column(name = "product_code", nullable = false, length = 1)
    private String productCode;

    @Column(name = "country_code", nullable = false, length = 1)
    private String countryCode;

    @Column(name = "agency_code", nullable = false, length = 10)
    private String agencyCode;

    @Column(name = "year_code", nullable = false, length = 4)
    private String yearCode;

    @Column(name = "sequence_number", nullable = false)
    private Long sequenceNumber;

    @Column(name = "entity_type", length = 50)
    private String entityType;

    @Column(name = "entity_id", length = 100)
    private String entityId;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @Column(name = "generated_by", length = 100)
    private String generatedBy;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "config_id", insertable = false, updatable = false)
    private ReferenceNumberConfigReadModel config;

    @PrePersist
    protected void onCreate() {
        if (generatedAt == null) {
            generatedAt = LocalDateTime.now();
        }
    }
}
