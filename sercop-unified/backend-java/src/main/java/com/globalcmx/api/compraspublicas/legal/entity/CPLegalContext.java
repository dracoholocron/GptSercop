package com.globalcmx.api.compraspublicas.legal.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cp_legal_context")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPLegalContext {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "context_code", nullable = false, unique = true, length = 100)
    private String contextCode;

    @Column(name = "context_type", nullable = false, length = 50)
    private String contextType;

    @Column(name = "authority", length = 200)
    private String authority;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "summary", nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(name = "full_text", columnDefinition = "LONGTEXT")
    private String fullText;

    @Column(name = "article_number", length = 50)
    private String articleNumber;

    @Column(name = "applicable_phases", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String applicablePhases;

    @Column(name = "applicable_process_types", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String applicableProcessTypes;

    @Column(name = "country_code", length = 5)
    @Builder.Default
    private String countryCode = "EC";

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "priority")
    @Builder.Default
    private Integer priority = 0;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
