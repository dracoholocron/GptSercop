package com.globalcmx.api.compraspublicas.legal.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "cp_known_entities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPKnownEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_name", nullable = false, length = 300)
    private String entityName;

    @Column(name = "entity_ruc", length = 13)
    private String entityRuc;

    @Column(name = "entity_type", length = 50)
    private String entityType;

    @Column(name = "sector_code", length = 50)
    private String sectorCode;

    @Column(name = "sector_label", length = 100)
    private String sectorLabel;

    @Column(name = "parent_entity_id")
    private Long parentEntityId;

    @Column(name = "mission_summary", columnDefinition = "TEXT")
    private String missionSummary;

    @Column(name = "typical_departments", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String typicalDepartments;

    @Column(name = "country_code", length = 5)
    @Builder.Default
    private String countryCode = "EC";

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
