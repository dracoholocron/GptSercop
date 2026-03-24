package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "reference_number_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReferenceNumberConfigReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_id", nullable = false, length = 50)
    private String clientId;

    @Column(name = "client_name", nullable = false)
    private String clientName;

    @Column(name = "product_code", nullable = false, length = 1)
    private String productCode;

    @Column(name = "country_code", nullable = false, length = 1)
    private String countryCode;

    @Column(name = "agency_digits", nullable = false)
    private Integer agencyDigits;

    @Column(name = "year_digits", nullable = false)
    private Integer yearDigits;

    @Column(name = "sequential_digits", nullable = false)
    private Integer sequentialDigits;

    @Column(name = "separator", length = 5)
    private String separator;

    @Column(name = "format_example", nullable = false, length = 50)
    private String formatExample;

    @Column(name = "active")
    private Boolean active;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (active == null) {
            active = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
